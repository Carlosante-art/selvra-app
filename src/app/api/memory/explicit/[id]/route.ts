/**
 * DELETE /api/memory/explicit/[id] — soft-delete explicit fakta
 * (conversation_memory_facts.redactedAt = NOW())
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
import { redactMemoryFact } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  const log = logger.child({ module: 'api/memory/explicit/delete' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  try {
    // userId-validering sker i query
    await redactMemoryFact({ factId: id, userId: session.user.id })
    log.info('memory_explicit_deleted', { factId: id })
    return noContent()
  } catch (err) {
    log.error('memory_explicit_delete_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
