/**
 * Strava sync-job-tester. Pure-logic-test med mockade adapter-funktioner
 * och appendEvent. Verifierar:
 *  - no-tokens → graceful no-op
 *  - expired utan refresh → fail med tydlig reason
 *  - expired med refresh → refresh + sync
 *  - fetch-fail → fail med reason
 *  - per-activity push-fail → partial success
 *  - all-push-success → ok
 *  - tokenRefreshed-flagga sätts korrekt
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// 'server-only' är Next.js build-time-package — ej tillgänglig i vitest.
vi.mock('server-only', () => ({}))

vi.mock('@/lib/protocol/client', () => ({
  appendEvent: vi.fn(),
}))
vi.mock('@/lib/adapters/strava/client', () => ({
  listRecentActivities: vi.fn(),
}))
vi.mock('@/lib/adapters/strava/oauth', () => ({
  refreshAccessToken: vi.fn(),
}))
vi.mock('@/lib/adapters/strava/storage', () => ({
  loadTokens: vi.fn(),
}))

import { listRecentActivities } from '@/lib/adapters/strava/client'
import { refreshAccessToken } from '@/lib/adapters/strava/oauth'
import { loadTokens } from '@/lib/adapters/strava/storage'
import { appendEvent } from '@/lib/protocol/client'

import { syncStravaActivities } from '../src/lib/sync/strava-sync'

const mockLoadTokens = vi.mocked(loadTokens)
const mockRefresh = vi.mocked(refreshAccessToken)
const mockListActivities = vi.mocked(listRecentActivities)
const mockAppendEvent = vi.mocked(appendEvent)

beforeEach(() => {
  vi.clearAllMocks()
})

function validTokens(opts: { expiresAt?: Date | null } = {}) {
  return {
    accessToken: 'access-abc',
    refreshToken: 'refresh-xyz',
    expiresAt: opts.expiresAt ?? new Date(Date.now() + 3600 * 1000), // +1h
    scope: 'read,activity:read',
    providerAccountId: '12345',
  }
}

function makeActivity(id: number, type = 'Run') {
  return {
    id,
    name: `Activity ${id}`,
    distance: 5000,
    moving_time: 1800,
    elapsed_time: 1900,
    total_elevation_gain: 25,
    type,
    sport_type: type,
    start_date: '2026-05-15T06:30:00Z',
    start_date_local: '2026-05-15T08:30:00',
    timezone: '(GMT+02:00) Europe/Stockholm',
    average_speed: 2.78,
    max_speed: 3.5,
    average_heartrate: 150,
    max_heartrate: 175,
    has_heartrate: true,
    trainer: false,
    commute: false,
    manual: false,
    private: false,
  }
}

describe('syncStravaActivities', () => {
  it('returnerar ok no-op när inga tokens finns', async () => {
    mockLoadTokens.mockResolvedValue(null)

    const result = await syncStravaActivities()

    expect(result.ok).toBe(true)
    expect(result.fetched).toBe(0)
    expect(result.pushed).toBe(0)
    expect(result.tokenRefreshed).toBe(false)
    expect(mockListActivities).not.toHaveBeenCalled()
    expect(mockAppendEvent).not.toHaveBeenCalled()
  })

  it('failar när token expirerad utan refresh-token', async () => {
    mockLoadTokens.mockResolvedValue({
      accessToken: 'expired',
      refreshToken: null,
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1h sedan
      scope: null,
      providerAccountId: null,
    })

    const result = await syncStravaActivities()

    expect(result.ok).toBe(false)
    expect(result.errors[0].reason).toContain('access_token_expired_no_refresh_token')
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('refresh:ar expired token + flaggar newTokens', async () => {
    mockLoadTokens.mockResolvedValue({
      accessToken: 'old',
      refreshToken: 'refresh-xyz',
      expiresAt: new Date(Date.now() - 60 * 1000),
      scope: null,
      providerAccountId: null,
    })
    const newExpiry = new Date(Date.now() + 6 * 3600 * 1000)
    mockRefresh.mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresAt: newExpiry,
      scope: 'read,activity:read',
      providerAccountId: '12345',
    })
    mockListActivities.mockResolvedValue([])

    const result = await syncStravaActivities()

    expect(result.ok).toBe(true)
    expect(result.tokenRefreshed).toBe(true)
    expect(result.newTokens?.accessToken).toBe('new-token')
    expect(result.newTokens?.refreshToken).toBe('new-refresh')
    expect(result.newTokens?.expiresAt).toBe(newExpiry.toISOString())
    expect(mockRefresh).toHaveBeenCalledOnce()
    expect(mockListActivities).toHaveBeenCalledOnce()
  })

  it('failar med tydlig reason när refresh failar', async () => {
    mockLoadTokens.mockResolvedValue({
      accessToken: 'old',
      refreshToken: 'invalid-refresh',
      expiresAt: new Date(Date.now() - 60 * 1000),
      scope: null,
      providerAccountId: null,
    })
    mockRefresh.mockRejectedValue(new Error('Strava refresh: 400 invalid_grant'))

    const result = await syncStravaActivities()

    expect(result.ok).toBe(false)
    expect(result.tokenRefreshed).toBe(false)
    expect(result.errors[0].reason).toContain('token_refresh_failed')
    expect(mockListActivities).not.toHaveBeenCalled()
  })

  it('failar med tydlig reason när fetch failar', async () => {
    mockLoadTokens.mockResolvedValue(validTokens())
    mockListActivities.mockRejectedValue(new Error('Strava 429 rate-limited'))

    const result = await syncStravaActivities()

    expect(result.ok).toBe(false)
    expect(result.fetched).toBe(0)
    expect(result.errors[0].reason).toContain('fetch_failed')
    expect(mockAppendEvent).not.toHaveBeenCalled()
  })

  it('pushar alla aktiviteter och returnerar pushed-count', async () => {
    mockLoadTokens.mockResolvedValue(validTokens())
    mockListActivities.mockResolvedValue([
      makeActivity(1001, 'Run'),
      makeActivity(1002, 'Ride'),
      makeActivity(1003, 'WeightTraining'),
    ])
    mockAppendEvent.mockResolvedValue({
      event_id: 'evt-1',
      sequence: 1,
      category: 'data_ingested',
      event_type: 'strava.activity.recorded',
    })

    const result = await syncStravaActivities()

    expect(result.ok).toBe(true)
    expect(result.fetched).toBe(3)
    expect(result.pushed).toBe(3)
    expect(result.errors).toEqual([])
    expect(mockAppendEvent).toHaveBeenCalledTimes(3)
  })

  it('partial success — en push failar, andra fortsätter', async () => {
    mockLoadTokens.mockResolvedValue(validTokens())
    mockListActivities.mockResolvedValue([
      makeActivity(1001),
      makeActivity(1002),
      makeActivity(1003),
    ])
    mockAppendEvent
      .mockResolvedValueOnce({
        event_id: 'evt-1',
        sequence: 1,
        category: 'data_ingested',
        event_type: 'strava.activity.recorded',
      })
      .mockRejectedValueOnce(new Error('Selvra protocol 503'))
      .mockResolvedValueOnce({
        event_id: 'evt-3',
        sequence: 3,
        category: 'data_ingested',
        event_type: 'strava.activity.recorded',
      })

    const result = await syncStravaActivities()

    expect(result.ok).toBe(false) // errors finns
    expect(result.fetched).toBe(3)
    expect(result.pushed).toBe(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].activityId).toBe(1002)
    expect(result.errors[0].reason).toContain('Selvra protocol 503')
  })

  it('lookbackDays passas till listRecentActivities som after-datum', async () => {
    mockLoadTokens.mockResolvedValue(validTokens())
    mockListActivities.mockResolvedValue([])

    await syncStravaActivities({ lookbackDays: 3 })

    expect(mockListActivities).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-abc' }),
      expect.objectContaining({
        after: expect.any(Date),
        perPage: 50,
      }),
    )
    const callArgs = mockListActivities.mock.calls[0][1]
    const afterDate = callArgs?.after as Date
    const expectedAfter = Date.now() - 3 * 24 * 3600 * 1000
    expect(Math.abs(afterDate.getTime() - expectedAfter)).toBeLessThan(5000)
  })

  it('token utan expiresAt antas giltig (ingen refresh)', async () => {
    mockLoadTokens.mockResolvedValue({
      accessToken: 'no-expiry',
      refreshToken: null,
      expiresAt: null,
      scope: null,
      providerAccountId: null,
    })
    mockListActivities.mockResolvedValue([])

    const result = await syncStravaActivities()

    expect(result.ok).toBe(true)
    expect(result.tokenRefreshed).toBe(false)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('token som expirerar inom 5-min-buffer triggar refresh', async () => {
    mockLoadTokens.mockResolvedValue({
      accessToken: 'about-to-expire',
      refreshToken: 'refresh-xyz',
      // Expires in 4 min (under 5-min buffer)
      expiresAt: new Date(Date.now() + 4 * 60 * 1000),
      scope: null,
      providerAccountId: null,
    })
    mockRefresh.mockResolvedValue(validTokens())
    mockListActivities.mockResolvedValue([])

    const result = await syncStravaActivities()

    expect(result.tokenRefreshed).toBe(true)
    expect(mockRefresh).toHaveBeenCalled()
  })
})
