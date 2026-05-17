/**
 * Strava sync-jobb — fetchar recent activities och pushar till
 * Selvra-protokollet via event-injection.
 *
 * Flöde:
 *   1. Load tokens från storage (env-vars i v0)
 *   2. Refresh om expired (logga ny token för manuell .env-update)
 *   3. Fetch activities via listRecentActivities (lookback 7d default)
 *   4. Map varje aktivitet via activityToEvent → CreateEventRequest
 *   5. Pusha varje event via protocol/client.appendEvent
 *   6. Returnera summary för audit + cron-loggning
 *
 * Idempotens: Strava-experten i selvra-protocol deduplicerar på
 * `strava_activity_id`. Sync kan därför köras flera gånger utan att
 * skapa duplicates — om event redan finns, ignoreras det av experten
 * vid distillation.
 *
 * Token-refresh-not (v0 dogfood): refresh ger nya access + refresh-
 * tokens, men selvra-app kan inte uppdatera Vercel-env programmatiskt.
 * Nya tokens loggas så Carl kan kopiera till `.env` / Vercel-dashboard
 * manuellt. v1 (efter DB-token-storage): persist via saveTokens.
 */

import { logger } from '@/lib/logging'
import { appendEvent } from '@/lib/protocol/client'

import { listRecentActivities } from '@/lib/adapters/strava/client'
import { activityToEvent } from '@/lib/adapters/strava/mapping'
import { refreshAccessToken } from '@/lib/adapters/strava/oauth'
import { loadTokens } from '@/lib/adapters/strava/storage'

const log = logger.child({ module: 'sync/strava' })

const DEFAULT_LOOKBACK_DAYS = 7
const TOKEN_EXPIRY_BUFFER_SECONDS = 300 // refresh:a 5 min innan expiry

export type StravaSyncResult = {
  ok: boolean
  fetched: number
  pushed: number
  errors: Array<{ activityId?: number; reason: string }>
  tokenRefreshed: boolean
  durationMs: number
  /** Set när token refresh:ades. Carl kopierar manuellt tills DB-storage. */
  newTokens?: {
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
  }
}

export type StravaSyncOptions = {
  /** Bakåt-fönster i dagar. Default 7. */
  lookbackDays?: number
  /** User-ID för token-lookup. Default: Carl (env-baserad storage). */
  userId?: string
}

export async function syncStravaActivities(
  opts: StravaSyncOptions = {},
): Promise<StravaSyncResult> {
  const startedAt = Date.now()
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS
  const userId = opts.userId ?? 'carl-dogfood'

  const errors: StravaSyncResult['errors'] = []

  // Steg 1: ladda tokens
  let tokens = await loadTokens(userId, 'strava')
  if (!tokens) {
    log.info('strava_sync_skipped_no_tokens', { userId })
    return {
      ok: true,
      fetched: 0,
      pushed: 0,
      errors: [],
      tokenRefreshed: false,
      durationMs: Date.now() - startedAt,
    }
  }

  // Steg 2: refresh:a om expired (med buffer)
  let tokenRefreshed = false
  let newTokens: StravaSyncResult['newTokens']
  if (isTokenExpired(tokens.expiresAt)) {
    if (!tokens.refreshToken) {
      log.warn('strava_sync_token_expired_no_refresh', { userId })
      return {
        ok: false,
        fetched: 0,
        pushed: 0,
        errors: [{ reason: 'access_token_expired_no_refresh_token' }],
        tokenRefreshed: false,
        durationMs: Date.now() - startedAt,
      }
    }
    try {
      const refreshed = await refreshAccessToken({ refreshToken: tokens.refreshToken })
      tokens = refreshed
      tokenRefreshed = true
      newTokens = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt?.toISOString() ?? null,
      }
      log.info('strava_sync_token_refreshed', {
        userId,
        newExpiresAt: newTokens.expiresAt,
        note: 'Manuell .env-uppdatering krävs tills DB-storage är wirad.',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('strava_sync_token_refresh_failed', { userId, error: msg })
      return {
        ok: false,
        fetched: 0,
        pushed: 0,
        errors: [{ reason: `token_refresh_failed: ${msg}` }],
        tokenRefreshed: false,
        durationMs: Date.now() - startedAt,
      }
    }
  }

  // Steg 3: fetcha activities
  const after = new Date(Date.now() - lookbackDays * 24 * 3600 * 1000)
  let activities: Awaited<ReturnType<typeof listRecentActivities>>
  try {
    activities = await listRecentActivities(tokens, { after, perPage: 50 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error('strava_sync_fetch_failed', { userId, error: msg })
    return {
      ok: false,
      fetched: 0,
      pushed: 0,
      errors: [{ reason: `fetch_failed: ${msg}` }],
      tokenRefreshed,
      newTokens,
      durationMs: Date.now() - startedAt,
    }
  }

  log.info('strava_sync_fetched', { userId, count: activities.length })

  // Steg 4+5: mappa och pusha varje aktivitet
  let pushed = 0
  for (const activity of activities) {
    try {
      const eventRequest = activityToEvent(activity)
      await appendEvent(eventRequest)
      pushed += 1
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push({ activityId: activity.id, reason: msg })
      log.warn('strava_sync_push_failed', {
        activityId: activity.id,
        error: msg,
      })
    }
  }

  log.info('strava_sync_done', {
    userId,
    fetched: activities.length,
    pushed,
    errors: errors.length,
    tokenRefreshed,
    durationMs: Date.now() - startedAt,
  })

  return {
    ok: errors.length === 0,
    fetched: activities.length,
    pushed,
    errors,
    tokenRefreshed,
    newTokens,
    durationMs: Date.now() - startedAt,
  }
}

function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false  // okänt expiry → anta giltig
  const nowSec = Math.floor(Date.now() / 1000)
  const expSec = Math.floor(expiresAt.getTime() / 1000)
  return expSec - TOKEN_EXPIRY_BUFFER_SECONDS <= nowSec
}
