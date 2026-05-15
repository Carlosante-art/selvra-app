// Conversation-context-builder — pure function-tester.

import { describe, expect, it } from 'vitest'
import {
  buildConversationContext,
  type ChatMessage,
  type ConversationTurn,
  type MemoryFact,
  type RelevantEvent,
} from '../src/lib/observability/conversation-context'

const SYSTEM_PROMPT = 'You are Selvra. Du är en spegel.'

describe('Minimal context — bara system + current turn', () => {
  it('utan turer, facts eller events → 2 messages', () => {
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'Jag är trött.',
    })
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ role: 'system', content: SYSTEM_PROMPT })
    expect(result[1]).toEqual({ role: 'user', content: 'Jag är trött.' })
  })
})

describe('Memory-facts', () => {
  it('läggs efter system-prompt som assistant-yttring', () => {
    const facts: MemoryFact[] = [
      { factText: 'jag är på antidepressiva', validFrom: new Date('2026-01-15') },
      { factText: 'jag bor i Uppsala', validFrom: new Date('2026-04-01') },
    ]
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: facts,
      relevantEvents: [],
      currentUserText: 'Berätta veckan.',
    })

    expect(result).toHaveLength(3)
    expect(result[1].role).toBe('assistant')
    expect(result[1].content).toContain('Sparade minnen om användaren')
    expect(result[1].content).toContain('jag är på antidepressiva (sedan 2026-01-15)')
    expect(result[1].content).toContain('jag bor i Uppsala (sedan 2026-04-01)')
  })

  it('tom facts-array → inget memory-meddelande', () => {
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'X',
    })
    const assistantMessages = result.filter((m) => m.role === 'assistant')
    expect(assistantMessages).toHaveLength(0)
  })
})

describe('Relevanta events', () => {
  it('läggs som system-message med tidsstämplar', () => {
    const events: RelevantEvent[] = [
      {
        sourceAiId: 'dexcom',
        timestamp: new Date('2026-05-14T08:00:00Z'),
        summary: 'value_mmol=7.4, trend=Flat',
      },
      {
        sourceAiId: 'garmin',
        timestamp: new Date('2026-05-14T07:00:00Z'),
        summary: 'sleep=6h 12min, hrv_baseline_delta=-18%',
      },
    ]
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: [],
      relevantEvents: events,
      currentUserText: 'Hur var i går?',
    })

    expect(result).toHaveLength(3)
    expect(result[1].role).toBe('system')
    expect(result[1].content).toContain('Aktuell data')
    expect(result[1].content).toContain('[2026-05-14 08:00] dexcom: value_mmol=7.4')
    expect(result[1].content).toContain('[2026-05-14 07:00] garmin: sleep=6h')
  })

  it('tom events-array → inget data-meddelande', () => {
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'X',
    })
    expect(result).toHaveLength(2)
  })
})

describe('Tråd-historik', () => {
  it('alternerande user/assistant per tur med selvraText', () => {
    const turns: ConversationTurn[] = [
      {
        turnIndex: 0,
        userText: 'Hej',
        selvraText: 'Vad vill du veta?',
        createdAt: new Date('2026-05-10T10:00:00Z'),
      },
      {
        turnIndex: 1,
        userText: 'Hur var min vecka?',
        selvraText: 'Veckan i sammanfattning…',
        createdAt: new Date('2026-05-10T10:01:00Z'),
      },
    ]
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: turns,
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'Och denna vecka?',
    })

    // system, user(turn0), assistant(turn0), user(turn1), assistant(turn1), user(current)
    expect(result).toHaveLength(6)
    expect(result[1]).toEqual({ role: 'user', content: 'Hej' })
    expect(result[2]).toEqual({ role: 'assistant', content: 'Vad vill du veta?' })
    expect(result[3]).toEqual({ role: 'user', content: 'Hur var min vecka?' })
    expect(result[4]).toEqual({
      role: 'assistant',
      content: 'Veckan i sammanfattning…',
    })
    expect(result[5]).toEqual({ role: 'user', content: 'Och denna vecka?' })
  })

  it('pending tur (selvraText=null) inkluderar bara user-text', () => {
    const turns: ConversationTurn[] = [
      {
        turnIndex: 0,
        userText: 'Pending fråga',
        selvraText: null,
        createdAt: new Date('2026-05-10T10:00:00Z'),
      },
    ]
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: turns,
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'Ny fråga',
    })

    // system, user(turn0 pending — ingen assistant), user(current)
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ role: 'user', content: 'Pending fråga' })
    expect(result[2]).toEqual({ role: 'user', content: 'Ny fråga' })
  })
})

describe('Kombinerade lager', () => {
  it('alla 5 lager närvarande → korrekt ordning', () => {
    const facts: MemoryFact[] = [
      { factText: 'jag är T1D', validFrom: new Date('2026-01-01') },
    ]
    const events: RelevantEvent[] = [
      {
        sourceAiId: 'dexcom',
        timestamp: new Date('2026-05-14T08:00:00Z'),
        summary: 'value_mmol=7.4',
      },
    ]
    const turns: ConversationTurn[] = [
      {
        turnIndex: 0,
        userText: 'Förra veckan?',
        selvraText: 'Den var stabil.',
        createdAt: new Date('2026-05-10T10:00:00Z'),
      },
    ]
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: turns,
      activeMemoryFacts: facts,
      relevantEvents: events,
      currentUserText: 'Och idag?',
    })

    // system, memory(assistant), data(system), user(turn0), assistant(turn0), user(current)
    expect(result).toHaveLength(6)
    expect(result[0].role).toBe('system')
    expect(result[0].content).toBe(SYSTEM_PROMPT)
    expect(result[1].role).toBe('assistant')
    expect(result[1].content).toContain('Sparade minnen')
    expect(result[2].role).toBe('system')
    expect(result[2].content).toContain('Aktuell data')
    expect(result[3]).toEqual({ role: 'user', content: 'Förra veckan?' })
    expect(result[4]).toEqual({ role: 'assistant', content: 'Den var stabil.' })
    expect(result[5]).toEqual({ role: 'user', content: 'Och idag?' })
  })
})

describe('Kontrakt — output-typer', () => {
  it('returnerar bara giltiga roller', () => {
    const validRoles: ChatMessage['role'][] = ['system', 'user', 'assistant']
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [
        {
          turnIndex: 0,
          userText: 'a',
          selvraText: 'b',
          createdAt: new Date(),
        },
      ],
      activeMemoryFacts: [{ factText: 'x', validFrom: new Date() }],
      relevantEvents: [
        { sourceAiId: 'y', timestamp: new Date(), summary: 'z' },
      ],
      currentUserText: 'now',
    })
    for (const msg of result) {
      expect(validRoles).toContain(msg.role)
      expect(typeof msg.content).toBe('string')
      expect(msg.content.length).toBeGreaterThan(0)
    }
  })

  it('sista message är alltid current user-turn', () => {
    const result = buildConversationContext({
      systemPrompt: SYSTEM_PROMPT,
      recentTurns: [],
      activeMemoryFacts: [],
      relevantEvents: [],
      currentUserText: 'unika sista turn',
    })
    const last = result[result.length - 1]
    expect(last.role).toBe('user')
    expect(last.content).toBe('unika sista turn')
  })
})
