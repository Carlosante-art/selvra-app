/**
 * DELETE /api/memory/facts/[id] — soft-delete fact (userDeletedAt = NOW())
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  internalError,
  noContent,
  unauthorized,
} from '@/lib/api/respond'
import { deleteConversationFact } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  const log = logger.child({ module: 'api/memory/facts/delete' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  try {
    // userId-validering sker i query — annan-users facts kan inte raderas
    await deleteConversationFact({ factId: id, userId: session.user.id })
    log.info('memory_fact_deleted', { factId: id })
    return noContent()
  } catch (err) {
    log.error('memory_fact_delete_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
