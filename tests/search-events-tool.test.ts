// executeSearchEvents tester — mockar listEvents + server-only + logger.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockListEvents } = vi.hoisted(() => ({
  mockListEvents: vi.fn(),
}))

vi.mock('@/lib/protocol/client', () => ({
  listEvents: mockListEvents,
}))

vi.mock('@/lib/logging', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

import {
  executeSearchEvents,
  searchEventsTool,
} from '../src/lib/llm/tools/search-events'

beforeEach(() => {
  mockListEvents.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

function makeEvent(overrides: Partial<{ event_type: string; payload: Record<string, unknown>; created_at: string }> = {}) {
  return {
    event_type: overrides.event_type ?? 'glucose_reading',
    payload: overrides.payload ?? { source_ai_id: 'dexcom', value_mmol: 7.4 },
    created_at: overrides.created_at ?? '2026-05-14T08:00:00Z',
  }
}

describe('searchEventsTool schema', () => {
  it('är giltigt Mistral function-tool', () => {
    expect(searchEventsTool.type).toBe('function')
    expect(searchEventsTool.function.name).toBe('search_events')
    expect(searchEventsTool.function.parameters.type).toBe('object')
    expect(searchEventsTool.function.parameters.properties).toHaveProperty('days_back')
    expect(searchEventsTool.function.parameters.properties).toHaveProperty('source_filter')
    expect(searchEventsTool.function.parameters.properties).toHaveProperty('limit')
  })
})

describe('executeSearchEvents', () => {
  it('default-args: 7 dagar, limit 20, ingen filter', async () => {
    mockListEvents.mockResolvedValueOnce({
      items: [makeEvent(), makeEvent({ event_type: 'sleep_summary' })],
    })

    const result = await executeSearchEvents({})

    expect(result.events).toHaveLength(2)
    expect(result.query.days_back).toBe(7)
    expect(result.query.limit).toBe(20)
    expect(mockListEvents).toHaveBeenCalledOnce()
    const [args] = mockListEvents.mock.calls[0]
    expect(args.limit).toBe(20)
  })

  it('clampar out-of-range till tillåtna värden', async () => {
    mockListEvents.mockResolvedValueOnce({ items: [] })

    const result = await executeSearchEvents({
      days_back: 9999,
      limit: 9999,
    })

    expect(result.query.days_back).toBe(90) // MAX
    expect(result.query.limit).toBe(50) // MAX
  })

  it('source_filter filtrerar i memory', async () => {
    mockListEvents.mockResolvedValueOnce({
      items: [
        makeEvent({
          event_type: 'glucose_reading',
          payload: { source_ai_id: 'dexcom', value_mmol: 7.4 },
        }),
        makeEvent({
          event_type: 'sleep_summary',
          payload: { source_ai_id: 'garmin_sleep', duration_h: 7.2 },
        }),
        makeEvent({
          event_type: 'glucose_reading',
          payload: { source_ai_id: 'dexcom', value_mmol: 5.8 },
        }),
      ],
    })

    const result = await executeSearchEvents({ source_filter: 'dexcom' })

    expect(result.events).toHaveLength(2)
    expect(result.events.every((e) => e.sourceAiId === 'dexcom')).toBe(true)
  })

  it('JSON-string args parsas', async () => {
    mockListEvents.mockResolvedValueOnce({ items: [makeEvent()] })

    const result = await executeSearchEvents(
      JSON.stringify({ days_back: 3, limit: 5 }),
    )

    expect(result.query.days_back).toBe(3)
    expect(result.query.limit).toBe(5)
  })

  it('protokoll-fail → tom array, ingen throw', async () => {
    mockListEvents.mockRejectedValueOnce(new Error('upstream down'))

    const result = await executeSearchEvents({ days_back: 1 })

    expect(result.events).toHaveLength(0)
    expect(result.query.days_back).toBe(1)
  })

  it('garbage args → fallback till defaults', async () => {
    mockListEvents.mockResolvedValueOnce({ items: [] })

    const result = await executeSearchEvents('not-valid-json{{{')

    expect(result.query.days_back).toBe(7)
    expect(result.query.limit).toBe(20)
  })
})
