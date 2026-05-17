/**
 * GET /api/cron/sync-strava — Vercel Cron-target för Strava-data-sync.
 *
 * Schemalagt dagligen via vercel.json `crons` (matchar Selvras vecko-
 * aggregat-modell: en sync per dag är tillräckligt; Strava-experten
 * destillerar veckor i synthesis-pipelinen).
 *
 * Auth: Vercel skickar `Authorization: Bearer $CRON_SECRET`. Manual-
 * trigger från utveckling stoppas av samma header-check.
 *
 * Idempotent: Strava-experten i selvra-protocol deduplicerar på
 * `strava_activity_id` — om sync triggar flera gånger samma dag, kommer
 * inte duplicate facts produceras.
 *
 * Failure-mode: om Strava-API:n är nere eller token expired utan
 * refresh-möjlighet, returneras 200 med ok: false + errors-list. Cron
 * triggar igen nästa dag.
 */

import * as Sentry from '@sentry/nextjs'

import { logger } from '@/lib/logging'
import { syncStravaActivities } from '@/lib/sync/strava-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: Request): Promise<Response> {
  const log = logger.child({ module: 'cron/sync-strava' })

  // Auth-gate identisk med extract-facts-pattern
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    log.error('cron_secret_not_configured')
    return Response.json(
      { error: 'CRON_SECRET ej satt i Vercel-config' },
      { status: 503 },
    )
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    log.warn('cron_unauthorized', { hasHeader: authHeader !== null })
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncStravaActivities({ lookbackDays: 7 })

    if (!result.ok) {
      Sentry.captureMessage('Strava sync had errors', {
        level: 'warning',
        tags: { module: 'cron/sync-strava' },
        extra: result,
      })
    }

    // newTokens loggas via syncStravaActivities (Carl ser i Vercel-logs).
    // Returnera dem INTE i HTTP-response — undvik läckage även via
    // authenticated cron-call (defense-in-depth mot logs som indexeras).
    return Response.json({
      ok: result.ok,
      fetched: result.fetched,
      pushed: result.pushed,
      errorCount: result.errors.length,
      errors: result.errors,
      tokenRefreshed: result.tokenRefreshed,
      durationMs: result.durationMs,
    })
  } catch (err) {
    log.error('cron_unexpected_error', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return Response.json(
      { error: 'Strava sync failed unexpectedly' },
      { status: 500 },
    )
  }
}
