import 'server-only'

import type { AdapterTokenSet } from '../types'

/**
 * Strava API-client (minimum). Tar färdig token-set, gör fetch:ar mot
 * Strava-API:n. Returnerar raw response — domain-mapping sker i mapping.ts.
 *
 * Refresh-logik hör inte hit (görs en nivå upp av caller med
 * `refreshAccessToken` från oauth.ts).
 */

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'

export type StravaActivitySummary = {
  id: number
  name: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number
  total_elevation_gain: number
  type: string
  sport_type: string
  start_date: string // ISO
  start_date_local: string
  timezone: string
  average_speed: number | null
  max_speed: number | null
  average_heartrate: number | null
  max_heartrate: number | null
  has_heartrate: boolean
  trainer: boolean
  commute: boolean
  manual: boolean
  private: boolean
  [k: string]: unknown
}

export async function listRecentActivities(
  tokens: AdapterTokenSet,
  opts: { perPage?: number; after?: Date } = {},
): Promise<StravaActivitySummary[]> {
  const params = new URLSearchParams()
  params.set('per_page', String(opts.perPage ?? 30))
  if (opts.after) {
    params.set('after', String(Math.floor(opts.after.getTime() / 1000)))
  }
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    throw new Error(`Strava listRecentActivities → ${res.status}: ${await res.text()}`)
  }
  return (await res.json()) as StravaActivitySummary[]
}
