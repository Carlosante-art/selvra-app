/**
 * GET  /api/threads  — lista trådar (paginering + filter)
 * POST /api/threads  — skapa ny tråd
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  badRequest,
  created,
  internalError,
  ok,
  unauthorized,
} from '@/lib/api/respond'
import {
  createConversation,
  listConversationsForUser,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

export async function GET(req: Request): Promise<Response> {
  const log = logger.child({ module: 'api/threads/list' })
  const session = await auth()
  if (!session?.user?.id) {
    return unauthorized()
  }
  Sentry.setUser({ id: session.user.id })

  const url = new URL(req.url)
  const archivedParam = url.searchParams.get('archived')
  const queryParam = url.searchParams.get('query')?.trim()
  const limitParam = url.searchParams.get('limit')

  let limit = 20
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
      return badRequest('limit måste vara 1-100')
    }
    limit = parsed
  }

  try {
    const threads = await listConversationsForUser(session.user.id, {
      limit,
      includeArchived: archivedParam === 'true',
      query: queryParam && queryParam.length > 0 ? queryParam : undefined,
    })
    log.info('threads_listed', { userId: session.user.id, count: threads.length })
    return ok({
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        startedAt: t.startedAt.toISOString(),
        lastMessageAt: t.lastMessageAt.toISOString(),
      })),
    })
  } catch (err) {
    log.error('threads_list_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}

export async function POST(): Promise<Response> {
  const log = logger.child({ module: 'api/threads/create' })
  const session = await auth()
  if (!session?.user?.id) {
    return unauthorized()
  }
  Sentry.setUser({ id: session.user.id })

  try {
    const id = await createConversation(session.user.id)
    log.info('thread_created', { userId: session.user.id, threadId: id })
    return created({ id, createdAt: new Date().toISOString() })
  } catch (err) {
    log.error('thread_create_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
