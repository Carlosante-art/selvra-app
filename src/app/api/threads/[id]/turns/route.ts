/**
 * GET /api/threads/[id]/turns — alla turns kronologiskt
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  internalError,
  notFound,
  ok,
  unauthorized,
} from '@/lib/api/respond'
import {
  fetchAllTurns,
  getConversationOwned,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  const log = logger.child({ module: 'api/threads/turns' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  // Ownership-check innan vi exponerar turns
  const thread = await getConversationOwned({
    conversationId: id,
    userId: session.user.id,
  })
  if (!thread) return notFound()

  try {
    const turns = await fetchAllTurns(id)
    return ok({
      turns: turns.map((t) => ({
        id: t.id,
        turnIndex: t.turnIndex,
        userText: t.userText,
        selvraText: t.selvraText,
        sourcesConsulted: t.sourcesConsulted,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    log.error('threads_turns_failed', {
      threadId: id,
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
