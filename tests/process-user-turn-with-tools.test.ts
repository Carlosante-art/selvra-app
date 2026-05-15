// processUserTurnWithTools — pure function-tester med inject:ade LLM-call
// och tool-executor. Verifierar tool-loopen, validation-retry, fallback.

import { describe, expect, it, vi } from 'vitest'

import {
  processUserTurnWithTools,
  type LlmFinalCallFn,
  type LlmToolCallFn,
  type SearchEventsExecutor,
  type ToolAwareResponse,
} from '../src/lib/observability/process-user-turn-with-tools'

const SYSTEM_PROMPT = 'You are Selvra.'
const FAKE_TOOL = {
  type: 'function' as const,
  function: { name: 'search_events', description: '', parameters: {} },
}

function makeInput(
  overrides: Partial<Parameters<typeof processUserTurnWithTools>[0]> = {},
) {
  return {
    systemPrompt: SYSTEM_PROMPT,
    currentUserText: 'Hur var i går?',
    recentTurns: [],
    activeMemoryFacts: [],
    llmCallWithTools: vi.fn(async (): Promise<ToolAwareResponse> => ({
      kind: 'message',
      text: 'Inga källor att rapportera.',
    })) as unknown as LlmToolCallFn,
    llmFinalCall: vi.fn(async () => 'Selvras svar.') as LlmFinalCallFn,
    searchEventsTool: FAKE_TOOL,
    executeSearchEvents: vi.fn(async () => ({
      events: [],
      query: {},
    })) as unknown as SearchEventsExecutor,
    ...overrides,
  }
}

describe('processUserTurnWithTools', () => {
  it('memory-request kortsluter utan LLM-call', async () => {
    const llmCallWithTools = vi.fn() as unknown as LlmToolCallFn
    const llmFinalCall = vi.fn() as LlmFinalCallFn
    const result = await processUserTurnWithTools(
      makeInput({
        currentUserText: 'Kom ihåg att jag är T1-diabetiker sedan 13 år.',
        llmCallWithTools,
        llmFinalCall,
      }),
    )

    expect(result.kind).toBe('memory_request')
    if (result.kind === 'memory_request') {
      expect(result.factText).toBe('jag är T1-diabetiker sedan 13 år')
    }
    expect(llmCallWithTools).not.toHaveBeenCalled()
    expect(llmFinalCall).not.toHaveBeenCalled()
  })

  it('LLM svarar direkt (utan tool-call) → llm_response', async () => {
    const llmCallWithTools = vi.fn(async (): Promise<ToolAwareResponse> => ({
      kind: 'message',
      text: 'Det vet jag inte.',
    })) as unknown as LlmToolCallFn

    const result = await processUserTurnWithTools(
      makeInput({ llmCallWithTools }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.selvraText).toBe('Det vet jag inte.')
      expect(result.sourcesConsulted).toHaveLength(0)
      expect(result.toolCallCount).toBe(0)
    }
    expect(llmCallWithTools).toHaveBeenCalledOnce()
  })

  it('tool-call → exekvera → andra-anrop ger final response', async () => {
    let call = 0
    const llmCallWithTools = vi.fn(async (): Promise<ToolAwareResponse> => {
      call++
      if (call === 1) {
        return {
          kind: 'tool_calls',
          assistantText: null,
          calls: [
            {
              id: 'call_1',
              name: 'search_events',
              arguments: JSON.stringify({ source_filter: 'dexcom', days_back: 2 }),
            },
          ],
        }
      }
      return { kind: 'message', text: 'Dexcom visade 7,4 mmol/L i går.' }
    }) as unknown as LlmToolCallFn

    const executeSearchEvents = vi.fn(async () => ({
      events: [
        {
          sourceAiId: 'dexcom',
          timestamp: new Date('2026-05-14T08:00:00Z'),
          summary: 'glucose_reading value_mmol=7.4',
        },
      ],
      query: { source_filter: 'dexcom', days_back: 2 },
    })) as unknown as SearchEventsExecutor

    const result = await processUserTurnWithTools(
      makeInput({
        llmCallWithTools,
        executeSearchEvents,
      }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.selvraText).toBe('Dexcom visade 7,4 mmol/L i går.')
      expect(result.sourcesConsulted).toHaveLength(1)
      expect(result.sourcesConsulted[0].sourceAiId).toBe('dexcom')
      expect(result.toolCallCount).toBe(1)
    }
    expect(llmCallWithTools).toHaveBeenCalledTimes(2)
    expect(executeSearchEvents).toHaveBeenCalledOnce()
  })

  it('okänt verktyg → tool-message med error, loop fortsätter', async () => {
    let call = 0
    const llmCallWithTools = vi.fn(async (): Promise<ToolAwareResponse> => {
      call++
      if (call === 1) {
        return {
          kind: 'tool_calls',
          assistantText: null,
          calls: [
            {
              id: 'call_1',
              name: 'unknown_tool',
              arguments: '{}',
            },
          ],
        }
      }
      return { kind: 'message', text: 'Inget jag kan svara på.' }
    }) as unknown as LlmToolCallFn
    const executeSearchEvents = vi.fn() as unknown as SearchEventsExecutor

    const result = await processUserTurnWithTools(
      makeInput({ llmCallWithTools, executeSearchEvents }),
    )

    expect(result.kind).toBe('llm_response')
    expect(executeSearchEvents).not.toHaveBeenCalled()
    expect(llmCallWithTools).toHaveBeenCalledTimes(2)
  })

  it('lock-violation → retry → fallback om båda fail:ar', async () => {
    const llmCallWithTools = vi.fn(async (): Promise<ToolAwareResponse> => ({
      kind: 'message',
      text: 'Du borde sova mer.',
    })) as unknown as LlmToolCallFn

    const llmFinalCall = vi.fn(async () => 'Du borde fortsätta.') as LlmFinalCallFn

    const result = await processUserTurnWithTools(
      makeInput({
        llmCallWithTools,
        llmFinalCall,
        maxValidationRetries: 1,
      }),
    )

    expect(result.kind).toBe('fallback')
    if (result.kind === 'fallback') {
      expect(result.selvraText).toContain('följde inte mina egna regler')
      expect(result.lastViolations.length).toBeGreaterThan(0)
    }
    // 1 first-call (kind:'message') + 1 retry via llmFinalCall
    expect(llmFinalCall).toHaveBeenCalledOnce()
  })

  it('max tool-iterations → tvinga final response utan tools', async () => {
    const llmCallWithTools = vi.fn(async (): Promise<ToolAwareResponse> => ({
      kind: 'tool_calls',
      assistantText: null,
      calls: [
        {
          id: `call_${Math.random()}`,
          name: 'search_events',
          arguments: '{}',
        },
      ],
    })) as unknown as LlmToolCallFn

    const llmFinalCall = vi.fn(async () => 'Selvras tvångs-svar.') as LlmFinalCallFn

    const executeSearchEvents = vi.fn(async () => ({
      events: [],
      query: {},
    })) as unknown as SearchEventsExecutor

    const result = await processUserTurnWithTools(
      makeInput({
        llmCallWithTools,
        llmFinalCall,
        executeSearchEvents,
        maxToolIterations: 2,
      }),
    )

    expect(result.kind).toBe('llm_response')
    if (result.kind === 'llm_response') {
      expect(result.selvraText).toBe('Selvras tvångs-svar.')
      expect(result.toolCallCount).toBe(2)
    }
    expect(llmCallWithTools).toHaveBeenCalledTimes(2)
    expect(llmFinalCall).toHaveBeenCalledOnce()
  })
})
