// fetch-relevant-events tester — mockar listEvents + server-only + logger.

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

import { fetchRelevantEvents } from '../src/lib/observability/fetch-relevant-events'

beforeEach(() => {
  mockListEvents.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('fetch-relevant-events — happy path', () => {
  it('returnerar lista omformaterad till RelevantEvent', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's1',
          category: 'cgm',
          event_type: 'selvra.observation.recorded',
          payload: { source_id: 'dexcom', value_mmol: 7.4, trend: 'Flat' },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('Hur var jag?')

    expect(events).toHaveLength(1)
    expect(events[0].sourceAiId).toBe('dexcom')
    expect(events[0].timestamp).toEqual(new Date('2026-05-14T08:00:00.000Z'))
    expect(events[0].summary).toContain('selvra.observation.recorded')
    expect(events[0].summary).toContain('value_mmol=7.4')
    expect(events[0].summary).toContain('trend=Flat')
  })

  it('default lookback 7 dagar', async () => {
    mockListEvents.mockResolvedValue({ items: [] })
    await fetchRelevantEvents('x')
    const call = mockListEvents.mock.calls[0][0]
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const diff = Math.abs(call.since.getTime() - sevenDaysAgo)
    expect(diff).toBeLessThan(1000) // inom 1 sekund tolerance
  })

  it('default limit 20', async () => {
    mockListEvents.mockResolvedValue({ items: [] })
    await fetchRelevantEvents('x')
    expect(mockListEvents.mock.calls[0][0].limit).toBe(20)
  })

  it('opts.lookbackDays + opts.limit override:ar default', async () => {
    mockListEvents.mockResolvedValue({ items: [] })
    await fetchRelevantEvents('x', { lookbackDays: 30, limit: 50 })
    const call = mockListEvents.mock.calls[0][0]
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    expect(Math.abs(call.since.getTime() - thirtyDaysAgo)).toBeLessThan(1000)
    expect(call.limit).toBe(50)
  })
})

describe('Source-attribution', () => {
  it('source_id i payload används', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'foo',
          payload: { source_id: 'garmin', value: 1 },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].sourceAiId).toBe('garmin')
  })

  it('source_ai_id fallback om source_id saknas', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'foo',
          payload: { source_ai_id: 'spotify', value: 1 },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].sourceAiId).toBe('spotify')
  })

  it('event_type fallback om båda source-fält saknas', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'selvra.thought.recorded',
          payload: { text: 'jag är trött' },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].sourceAiId).toBe('selvra.thought.recorded')
  })
})

describe('Payload-summarisering', () => {
  it('filtrerar ut interna fält (source_id, event_id, tenant_id)', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'evt',
          payload: {
            source_id: 'g',
            event_id: 'e1',
            tenant_id: 't1',
            value: 42,
          },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].summary).not.toContain('source_id')
    expect(events[0].summary).not.toContain('tenant_id')
    expect(events[0].summary).toContain('value=42')
  })

  it('null/undefined-värden filtreras', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'evt',
          payload: { foo: 'bar', empty: null, missing: undefined },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].summary).toContain('foo=bar')
    expect(events[0].summary).not.toContain('empty')
    expect(events[0].summary).not.toContain('missing')
  })

  it('långa summaries trunkeras till 200 tecken + ellipsis', async () => {
    const longText = 'x'.repeat(500)
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'evt',
          payload: { text: longText },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].summary).toHaveLength(198) // 197 + ellipsis (1 char)
    expect(events[0].summary.endsWith('…')).toBe(true)
  })

  it('objekt-värden JSON-stringifieras', async () => {
    mockListEvents.mockResolvedValue({
      items: [
        {
          event_id: 'e1',
          subject_id: 's',
          category: 'x',
          event_type: 'evt',
          payload: { nested: { a: 1, b: 2 } },
          created_at: '2026-05-14T08:00:00.000Z',
        },
      ],
    })

    const events = await fetchRelevantEvents('x')
    expect(events[0].summary).toContain('"a":1')
    expect(events[0].summary).toContain('"b":2')
  })
})

describe('Fel-väg', () => {
  it('listEvents kastar → returnerar [] (samtalet fortsätter)', async () => {
    mockListEvents.mockRejectedValue(new Error('Protocol unreachable'))

    const events = await fetchRelevantEvents('x')
    expect(events).toEqual([])
  })

  it('listEvents returnerar tom items → tom array', async () => {
    mockListEvents.mockResolvedValue({ items: [] })

    const events = await fetchRelevantEvents('x')
    expect(events).toEqual([])
  })
})
