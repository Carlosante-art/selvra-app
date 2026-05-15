// processStreamingUserTurnWithTools — AsyncGenerator-tester med
// inject:ade non-stream tool-LLM + stream-LLM + tool-executor.

import { describe, expect, it } from 'vitest'

import {
  processStreamingUserTurnWithTools,
  type LlmStreamFinalFn,
  type LlmStreamToolFn,
  type SearchEventsExecutor,
  type StreamEvent,
} from '../src/lib/observability/process-streaming-user-turn-with-tools'
import type { ToolAwareResponse } from '../src/lib/llm/mistral'

const SYSTEM_PROMPT = 'You are Selvra.'
const FAKE_TOOL = {
  type: 'function' as const,
  function: { name: 'search_events', description: '', parameters: {} },
}

function makeStreamFn(chunks: readonly string[]): LlmStreamFinalFn {
  return async function* () {
    for (const chunk of chunks) yield chunk
  }
}

async function collect(
  gen: AsyncGenerator<StreamEvent, void, void>,
): Promise<StreamEvent[]> {
  const out: StreamEvent[] = []
  for await (const e of gen) out.push(e)
  return out
}

function makeInput(
  overrides: Partial<Parameters<typeof processStreamingUserTurnWithTools>[0]> = {},
) {
  const defaultToolCall: LlmStreamToolFn = async (): Promise<ToolAwareResponse> => ({
    kind: 'message',
    text: 'Det vet jag inte.',
  })
  return {
    systemPrompt: SYSTEM_PROMPT,
    currentUserText: 'Hur var i går?',
    recentTurns: [],
    activeMemoryFacts: [],
    llmCallWithTools: defaultToolCall,
    llmFinalStream: makeStreamFn(['fallback-stream']),
    searchEventsTool: FAKE_TOOL,
    executeSearchEvents: (async () => ({
      events: [],
      query: {},
    })) as unknown as SearchEventsExecutor,
    ...overrides,
  }
}

describe('processStreamingUserTurnWithTools', () => {
  it('memory-request kortsluter utan tool-call eller stream', async () => {
    let toolCallInvoked = false
    let streamInvoked = false
    const llmCallWithTools: LlmStreamToolFn = async () => {
      toolCallInvoked = true
      return { kind: 'message', text: 'should not run' }
    }
    const llmFinalStream: LlmStreamFinalFn = async function* () {
      streamInvoked = true
      yield 'should not stream'
    }

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({
          currentUserText: 'Kom ihåg att jag är T1-diabetiker sedan 13 år.',
          llmCallWithTools,
          llmFinalStream,
        }),
      ),
    )

    expect(events).toHaveLength(1)
    expect(events[0].kind).toBe('memory_request')
    expect(toolCallInvoked).toBe(false)
    expect(streamInvoked).toBe(false)
  })

  it('LLM svarar direkt (kind=message) → ett chunk istället för stream', async () => {
    const llmCallWithTools: LlmStreamToolFn = async () => ({
      kind: 'message',
      text: 'Jag har inga relevanta källor.',
    })
    let streamInvoked = false
    const llmFinalStream: LlmStreamFinalFn = async function* () {
      streamInvoked = true
      yield 'should not stream'
    }

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({ llmCallWithTools, llmFinalStream }),
      ),
    )

    expect(events.map((e) => e.kind)).toEqual([
      'stream_start',
      'chunk',
      'stream_end',
    ])
    expect(streamInvoked).toBe(false)
    if (events[1].kind === 'chunk') {
      expect(events[1].text).toBe('Jag har inga relevanta källor.')
    }
    if (events[2].kind === 'stream_end') {
      expect(events[2].selvraText).toBe('Jag har inga relevanta källor.')
    }
  })

  it('tool-call → exekvera → andra-anrop med message → ett chunk', async () => {
    let toolCall = 0
    const llmCallWithTools: LlmStreamToolFn = async () => {
      toolCall++
      if (toolCall === 1) {
        return {
          kind: 'tool_calls',
          assistantText: null,
          calls: [
            {
              id: 'call_1',
              name: 'search_events',
              arguments: JSON.stringify({ source_filter: 'dexcom' }),
            },
          ],
        }
      }
      return { kind: 'message', text: 'Dexcom visade 7,4 mmol/L i går.' }
    }
    const executeSearchEvents = (async () => ({
      events: [
        {
          sourceAiId: 'dexcom',
          timestamp: new Date('2026-05-14T08:00:00Z'),
          summary: 'glucose_reading value_mmol=7.4',
        },
      ],
      query: {},
    })) as unknown as SearchEventsExecutor

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({ llmCallWithTools, executeSearchEvents }),
      ),
    )

    const kinds = events.map((e) => e.kind)
    expect(kinds).toEqual(['stream_start', 'chunk', 'stream_end'])

    const startEvent = events[0]
    if (startEvent.kind === 'stream_start') {
      expect(startEvent.sourcesConsulted).toHaveLength(1)
      expect(startEvent.sourcesConsulted[0].sourceAiId).toBe('dexcom')
    }
    expect(toolCall).toBe(2)
  })

  it('max tool-iterations → streama via llmFinalStream', async () => {
    const llmCallWithTools: LlmStreamToolFn = async () => ({
      kind: 'tool_calls',
      assistantText: null,
      calls: [
        {
          id: `call_${crypto.randomUUID()}`,
          name: 'search_events',
          arguments: '{}',
        },
      ],
    })
    let streamInvoked = false
    const llmFinalStream: LlmStreamFinalFn = async function* () {
      streamInvoked = true
      yield 'Selvras '
      yield 'tvångs-'
      yield 'svar.'
    }

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({
          llmCallWithTools,
          llmFinalStream,
          maxToolIterations: 2,
        }),
      ),
    )

    expect(streamInvoked).toBe(true)
    const kinds = events.map((e) => e.kind)
    expect(kinds[0]).toBe('stream_start')
    expect(kinds.filter((k) => k === 'chunk')).toHaveLength(3)
    expect(kinds[kinds.length - 1]).toBe('stream_end')
  })

  it('validation-violation efter stream → fallback-event', async () => {
    const llmCallWithTools: LlmStreamToolFn = async () => ({
      kind: 'message',
      text: 'Du borde sova mer.', // coach-språk = brott
    })

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({ llmCallWithTools }),
      ),
    )

    const lastEvent = events[events.length - 1]
    expect(lastEvent.kind).toBe('fallback')
    if (lastEvent.kind === 'fallback') {
      expect(lastEvent.selvraText).toContain('följde inte mina egna regler')
      expect(lastEvent.rejectedText).toBe('Du borde sova mer.')
      expect(lastEvent.lastViolations.length).toBeGreaterThan(0)
    }
  })

  it('okänt verktyg → tool-message med error, loop fortsätter', async () => {
    let toolCall = 0
    const llmCallWithTools: LlmStreamToolFn = async () => {
      toolCall++
      if (toolCall === 1) {
        return {
          kind: 'tool_calls',
          assistantText: null,
          calls: [{ id: 'c1', name: 'unknown_tool', arguments: '{}' }],
        }
      }
      return { kind: 'message', text: 'Inget jag kan svara på.' }
    }
    const executeSearchEvents = (async () => ({
      events: [],
      query: {},
    })) as unknown as SearchEventsExecutor

    const events = await collect(
      processStreamingUserTurnWithTools(
        makeInput({ llmCallWithTools, executeSearchEvents }),
      ),
    )

    expect(events[events.length - 1].kind).toBe('stream_end')
    expect(toolCall).toBe(2)
  })
})
