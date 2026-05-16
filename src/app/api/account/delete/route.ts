/**
 * POST /api/account/delete — soft-delete-konto med 30-dagars restore-window.
 *
 * Audit-fix 2026-05-16 #18: tidigare hard-deletade kontot omedelbart.
 * Nu sätts deletedAt → user kan inte längre använda appen, men data
 * bevaras i 30 dagar. Restore sker via magic-link-login inom fönstret
 * (events.signIn auto-clear:ar deletedAt).
 *
 * Cron-jobb /api/cron/cleanup-soft-deleted hard-deletar efter 30d via
 * CASCADE på user-FK.
 *
 * Selvra-protokoll-sidan har separat soft-delete via subject-lifecycle
 * = 'pending_deletion'. Initieras INTE här (cross-tenant-sync är komplex,
 * kräver explicit Selvra-API-anrop som inte exponeras i v1).
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md + audit-update 2026-05-16.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  internalError,
  ok,
  unauthorized,
} from '@/lib/api/respond'
import { softDeleteUserAccount } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

const RESTORE_WINDOW_DAYS = 30

export async function POST(): Promise<Response> {
  const log = logger.child({ module: 'api/account/delete' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const userId = session.user.id

  try {
    await softDeleteUserAccount(userId)
    const deletedAt = new Date()
    const restoreUntil = new Date(
      deletedAt.getTime() + RESTORE_WINDOW_DAYS * 86_400_000,
    )

    log.warn('account_soft_deleted', {
      userId,
      deletedAt: deletedAt.toISOString(),
      restoreUntil: restoreUntil.toISOString(),
    })

    return ok({
      deletedAt: deletedAt.toISOString(),
      restoreUntil: restoreUntil.toISOString(),
      restoreWindowDays: RESTORE_WINDOW_DAYS,
      userId,
      message:
        `Konto markerat för radering. Datan bevaras i ${RESTORE_WINDOW_DAYS} dagar — ` +
        `logga in igen med din email innan ${restoreUntil.toISOString().slice(0, 10)} ` +
        `för att ångra. Selvra-protokoll-data raderas separat om aktivt.`,
    })
  } catch (err) {
    log.error('account_soft_delete_failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
