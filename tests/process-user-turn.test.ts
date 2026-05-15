// processUserTurn orchestrator — pure function-tester med inject:ad llmCall.

import { describe, expect, it, vi } from 'vitest'
import {
  processUserTurn,
  type LlmCallFn,
} from '../src/lib/observability/process-user-turn'

const SYSTEM_PROMPT = 'You are Selvra.'

function makeInput(overrides: Partial<Parameters<typeof processUserTurn>[0]> = {}) {
  return {
    systemPrompt: SYSTEM_PROMPT,
    currentUserText: 'Hur var i går?',
    recentTurns: [],
    activeMemoryFacts: [],
    relevantEvents: [],
    llmCall: vi.fn().mockResolvedValue('Selvras svar.') as LlmCallFn,
    ...overrides,
  }
}

describe('Memory-request kortsluts utan LLM-anrop', () => {
  it('detekterar "kom ihåg X" och returnerar acknowledgement', async () => {
    const llmCall = vi.fn() as LlmCallFn
    const result = await processUserTurn(
      makeInput({
        currentUserText: 'Kom ihåg att jag är T1-diabetiker sedan 13 år.',
        llmCall,
      }),
    )

    expect(result.kind).toBe('memory_request')
    if (result.kind === 'memory_request') {
      expect(result.factText).toBe('jag är T1-diabetiker sedan 13 år')
      expect(result.acknowledgement).toContain('sparat')
      expect(result.acknowledgement).toContain('/minne')
    }
    expect(llmCall).not.toHaveBeenCalled()
  })

  it('vanlig fråga går till LLM-anrop', async () => {
    const llmCall = vi.fn().mockResolvedValue('Dexcom visade 7,4 mmol/L.') as LlmCallFn
    const result = await processUserTurn(
      makeInput({
        currentUserText: 'Vad visade Dexcom?',
        relevantEvents: [
          {
            sourceAiId: 'dexcom',
            timestamp: new Date(),
            summary: 'value_mmol=7.4',
          },
        ],
        llmCall,
      }),
    )

    expect(result.kind).toBe('llm_response')
    expect(llmCall).toHaveBeenCalledOnce()
  })
})

describe('Lock-validation pass → llm_response', () => {
  it('valid LLM-svar returneras med attempts=1', async () => {
    const llmCall = vi
      .fn()
      .mockResolvedValue('Garmin visade 6h sömn i snitt.') as LlmCallFn
    const result = await processUserTurn(
      makeInput({
        relevantEvents: [
          { sourceAiId: 'garmin', timestamp: new Date(), summary: 'sleep=6h' },
        ],
        llmCall,
      }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.selvraText).toBe('Garmin visade 6h sömn i snitt.')
      expect(result.attempts).toBe(1)
    }
  })
})

describe('Retry på lock-violation', () => {
  it('första svar bryter mot regel, andra valid → llm_response med attempts=2', async () => {
    const llmCall = vi
      .fn()
      .mockResolvedValueOnce('Du borde sova mer.') // prescriptive_coaching
      .mockResolvedValueOnce('Garmin visade 6h sömn.') as LlmCallFn
    const result = await processUserTurn(
      makeInput({
        relevantEvents: [
          { sourceAiId: 'garmin', timestamp: new Date(), summary: 'sleep=6h' },
        ],
        llmCall,
      }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.attempts).toBe(2)
    }
    expect(llmCall).toHaveBeenCalledTimes(2)

    // Andra anropet ska ha fått retry-hint
    const secondCallArgs = (llmCall as ReturnType<typeof vi.fn>).mock.calls[1]
    expect(secondCallArgs[1]).toBeDefined()
    expect(secondCallArgs[1]).toContain('konstitution')
    expect(secondCallArgs[1]).toContain('prescriptive_coaching')
  })
})

describe('Fallback efter max retries', () => {
  it('alla 3 attempts bryter regler → fallback-text', async () => {
    const llmCall = vi
      .fn()
      .mockResolvedValue('Du borde sova mer.') as LlmCallFn // alltid violation

    const result = await processUserTurn(makeInput({ llmCall }))

    expect(result.kind).toBe('fallback')
    if (result.kind === 'fallback') {
      expect(result.selvraText).toContain('kan inte svara')
      expect(result.attempts).toBe(3) // 1 initial + 2 retries
      expect(result.lastViolations.length).toBeGreaterThan(0)
      expect(result.lastViolations[0].rule).toBe('prescriptive_coaching')
    }
    expect(llmCall).toHaveBeenCalledTimes(3)
  })

  it('custom maxRetries=0 → en attempt, sen fallback', async () => {
    const llmCall = vi.fn().mockResolvedValue('Du är så stark.') as LlmCallFn
    const result = await processUserTurn(makeInput({ llmCall, maxRetries: 0 }))

    expect(result.kind).toBe('fallback')
    if (result.kind === 'fallback') {
      expect(result.attempts).toBe(1)
    }
    expect(llmCall).toHaveBeenCalledOnce()
  })
})

describe('Källa-attribuering: events skickas till LLM-context', () => {
  it('LLM får data-meddelande när events finns', async () => {
    const llmCall = vi
      .fn()
      .mockResolvedValue('Garmin visade 6h.') as LlmCallFn
    await processUserTurn(
      makeInput({
        relevantEvents: [
          {
            sourceAiId: 'garmin',
            timestamp: new Date('2026-05-14T07:00:00Z'),
            summary: 'sleep=6h',
          },
        ],
        llmCall,
      }),
    )

    const messages = (llmCall as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemMessages = messages.filter(
      (m: { role: string }) => m.role === 'system',
    )
    // Två system-messages: system-prompt + data
    expect(systemMessages.length).toBe(2)
    expect(systemMessages[1].content).toContain('garmin')
  })

  it('utan events: LLM får bara system-prompten som system', async () => {
    const llmCall = vi.fn().mockResolvedValue('Jag har ingen data.') as LlmCallFn
    await processUserTurn(makeInput({ llmCall, relevantEvents: [] }))

    const messages = (llmCall as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemMessages = messages.filter(
      (m: { role: string }) => m.role === 'system',
    )
    expect(systemMessages.length).toBe(1)
  })
})

describe('sourcesConsulted returneras för persistens', () => {
  it('llm_response innehåller events som skickades', async () => {
    const events = [
      {
        sourceAiId: 'dexcom',
        timestamp: new Date(),
        summary: 'value_mmol=7.4',
      },
      {
        sourceAiId: 'garmin',
        timestamp: new Date(),
        summary: 'sleep=6h',
      },
    ]
    const llmCall = vi
      .fn()
      .mockResolvedValue('Dexcom och Garmin visade…') as LlmCallFn

    const result = await processUserTurn(
      makeInput({ relevantEvents: events, llmCall }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.sourcesConsulted).toEqual(events)
    }
  })
})
