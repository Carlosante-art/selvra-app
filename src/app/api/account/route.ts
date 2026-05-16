/**
 * GET /api/account — konto-info + subject-lifecycle-status
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  internalError,
  ok,
  unauthorized,
} from '@/lib/api/respond'
import { getSubjectLifecycle } from '@/lib/protocol/client'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const log = logger.child({ module: 'api/account' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  try {
    // Lifecycle är defensiv — om Selvra-protokoll ner returneras 'unknown'
    const lifecycle = await getSubjectLifecycle().catch(() => null)
    return ok({
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
      },
      lifecycle: lifecycle
        ? {
            status: lifecycle.status,
            subjectId: lifecycle.subject_id,
            ...(lifecycle.status === 'pending_deletion'
              ? {
                  deletionEventId: lifecycle.deletion_event_id,
                  deletionRequestedAt: lifecycle.deletion_requested_at,
                  hardDeleteEligibleAfterDays: lifecycle.hard_delete_eligible_after_days,
                }
              : {}),
          }
        : { status: 'unknown', subjectId: null },
    })
  } catch (err) {
    log.error('account_get_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
