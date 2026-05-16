/**
 * GET /api/cron/cleanup-soft-deleted — Vercel Cron-target för 30-dagars
 * hard-delete-cleanup av soft-deleted entities.
 *
 * Schemalagt daily kl 04:00 UTC via vercel.json `crons`. Tar:
 *   - user-rader där deleted_at < NOW() - 30d (CASCADE plockar resten)
 *   - conversation_fact där user_deleted_at < NOW() - 30d
 *   - conversation_memory_fact där redacted_at < NOW() - 30d
 *
 * Audit-fixes 2026-05-16 #10 (DB-bloat-skydd) + #18 (GDPR Art. 17 clarity).
 *
 * Auth: samma Bearer-token-pattern som extract-facts (CRON_SECRET).
 * Vercel skickar headern automatiskt när cron triggar.
 *
 * Idempotent: re-run gör inget om alla expired redan tagna. Dubbel-trigg
 * inom samma minut returnerar second-run = 0 deleted.
 */

import * as Sentry from '@sentry/nextjs'

import {
  hardDeleteExpiredConversationFacts,
  hardDeleteExpiredMemoryFacts,
  hardDeleteExpiredUsers,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'
export const maxDuration = 60

const RETENTION_DAYS = 30

export async function GET(req: Request): Promise<Response> {
  const log = logger.child({ module: 'cron/cleanup-soft-deleted' })

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

  const startedAt = Date.now()
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000)

  let usersDeleted = 0
  let factsDeleted = 0
  let memoryFactsDeleted = 0
  let failedStep: string | null = null

  try {
    // Ordning: facts först, sen users (users-CASCADE plockar ändå allt
    // för soft-deleted users, men kör vi facts först kan vi rapportera
    // exakta counts utan att user-CASCADE överlappar).
    factsDeleted = await hardDeleteExpiredConversationFacts({ cutoff })
    memoryFactsDeleted = await hardDeleteExpiredMemoryFacts({ cutoff })
    usersDeleted = await hardDeleteExpiredUsers({ cutoff })
  } catch (err) {
    failedStep =
      usersDeleted === 0 && factsDeleted === 0 && memoryFactsDeleted === 0
        ? 'first-step'
        : 'mid-step'
    log.error('cron_cleanup_failed', {
      step: failedStep,
      error: err instanceof Error ? err.message : String(err),
      partialCounts: { usersDeleted, factsDeleted, memoryFactsDeleted },
    })
    Sentry.captureException(err, {
      tags: { cron: 'cleanup-soft-deleted', step: failedStep },
      extra: { usersDeleted, factsDeleted, memoryFactsDeleted },
    })
    return Response.json(
      {
        error: 'DB-fel under cleanup',
        partialCounts: { usersDeleted, factsDeleted, memoryFactsDeleted },
      },
      { status: 500 },
    )
  }

  const durationMs = Date.now() - startedAt
  log.info('cron_cleanup_done', {
    cutoff: cutoff.toISOString(),
    usersDeleted,
    factsDeleted,
    memoryFactsDeleted,
    durationMs,
  })

  // Sentry-info vid faktisk cleanup (audit-trail). Tom körning loggas inte
  // för att undvika dagligt-noise i Sentry.
  if (usersDeleted + factsDeleted + memoryFactsDeleted > 0) {
    Sentry.captureMessage('soft-delete cleanup ran', {
      level: 'info',
      tags: { cron: 'cleanup-soft-deleted' },
      extra: {
        usersDeleted,
        factsDeleted,
        memoryFactsDeleted,
        cutoff: cutoff.toISOString(),
      },
    })
  }

  return Response.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    retentionDays: RETENTION_DAYS,
    usersDeleted,
    factsDeleted,
    memoryFactsDeleted,
    durationMs,
  })
}
