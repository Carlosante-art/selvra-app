// processStreamingUserTurn — AsyncGenerator-tester med inject:ad llmStream.

import { describe, expect, it } from 'vitest'

import {
  processStreamingUserTurn,
  type LlmStreamFn,
  type StreamEvent,
} from '../src/lib/observability/process-streaming-user-turn'

const SYSTEM_PROMPT = 'You are Selvra.'

function makeStreamFn(chunks: readonly string[]): LlmStreamFn {
  return async function* () {
    for (const chunk of chunks) {
      yield chunk
    }
  }
}

async function collectEvents(
  gen: AsyncGenerator<StreamEvent, void, void>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = []
  for await (const e of gen) events.push(e)
  return events
}

function makeInput(overrides: Partial<Parameters<typeof processStreamingUserTurn>[0]> = {}) {
  return {
    systemPrompt: SYSTEM_PROMPT,
    currentUserText: 'Hur var i går?',
    recentTurns: [],
    activeMemoryFacts: [],
    relevantEvents: [],
    llmStream: makeStreamFn(['ok.']),
    ...overrides,
  }
}

describe('processStreamingUserTurn', () => {
  it('kortsluter memory-request utan att starta stream', async () => {
    let streamCalled = false
    const llmStream: LlmStreamFn = async function* () {
      streamCalled = true
      yield 'should not be called'
    }
    const events = await collectEvents(
      processStreamingUserTurn(
        makeInput({
          currentUserText: 'Kom ihåg att jag är T1-diabetiker sedan 13 år.',
          llmStream,
        }),
      ),
    )

    expect(events).toHaveLength(1)
    expect(events[0].kind).toBe('memory_request')
    if (events[0].kind === 'memory_request') {
      expect(events[0].factText).toBe('jag är T1-diabetiker sedan 13 år')
      expect(events[0].acknowledgement).toContain('sparat')
    }
    expect(streamCalled).toBe(false)
  })

  it('yieldar stream_start → chunks → stream_end vid valid output', async () => {
    const events = await collectEvents(
      processStreamingUserTurn(
        makeInput({
          currentUserText: 'Vad visade Dexcom?',
          relevantEvents: [
            {
              sourceAiId: 'dexcom',
              timestamp: new Date(),
              summary: 'value_mmol=7.4',
            },
          ],
          llmStream: makeStreamFn([
            'Dexcom visade ',
            '7,4 mmol/L ',
            'kl 14:30.',
          ]),
        }),
      ),
    )

    const kinds = events.map((e) => e.kind)
    expect(kinds[0]).toBe('stream_start')
    expect(kinds.filter((k) => k === 'chunk')).toHaveLength(3)
    expect(kinds[kinds.length - 1]).toBe('stream_end')

    const lastEvent = events[events.length - 1]
    if (lastEvent.kind === 'stream_end') {
      expect(lastEvent.selvraText).toBe('Dexcom visade 7,4 mmol/L kl 14:30.')
      expect(lastEvent.sourcesConsulted).toHaveLength(1)
    }
  })

  it('yieldar fallback när stream-text bryter konstitutionen', async () => {
    const events = await collectEvents(
      processStreamingUserTurn(
        makeInput({
          // "Du borde…" är konstitutions-brott (coach-språk)
          llmStream: makeStreamFn(['Du borde ', 'sova ', 'tidigare.']),
        }),
      ),
    )

    const lastEvent = events[events.length - 1]
    expect(lastEvent.kind).toBe('fallback')
    if (lastEvent.kind === 'fallback') {
      expect(lastEvent.selvraText).toContain('följde inte mina egna regler')
      expect(lastEvent.rejectedText).toBe('Du borde sova tidigare.')
      expect(lastEvent.lastViolations.length).toBeGreaterThan(0)
    }
  })

  it('hanterar tom stream (LLM returnerar inga tokens)', async () => {
    const events = await collectEvents(
      processStreamingUserTurn(
        makeInput({
          llmStream: makeStreamFn([]),
        }),
      ),
    )

    expect(events[0].kind).toBe('stream_start')
    // Tom text → validation kollar mot whitelist + tom källa = valid
    // (inga violations). Sista event ska vara stream_end.
    expect(events[events.length - 1].kind).toBe('stream_end')
  })
})
