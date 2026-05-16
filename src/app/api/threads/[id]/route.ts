/**
 * GET    /api/threads/[id]  — single tråd (ägar-validerat)
 * PATCH  /api/threads/[id]  — uppdatera title / archived
 * DELETE /api/threads/[id]  — hård radera (cascade till turns + facts)
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  badRequest,
  internalError,
  noContent,
  notFound,
  ok,
  parseJsonBody,
  unauthorized,
} from '@/lib/api/respond'
import { db } from '@/lib/db'
import { consumerConversations } from '@/lib/db/conversation-schema'
import {
  archiveConversation,
  getConversationOwned,
  unarchiveConversation,
  updateConversationTitle,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'
import { and, eq } from 'drizzle-orm'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  const thread = await getConversationOwned({
    conversationId: id,
    userId: session.user.id,
  })
  if (!thread) return notFound('Tråd finns ej eller tillhör annan användare.')

  return ok({
    id: thread.id,
    title: thread.title,
    startedAt: thread.startedAt.toISOString(),
    lastMessageAt: thread.lastMessageAt.toISOString(),
    archivedAt: thread.archivedAt?.toISOString() ?? null,
  })
}

type PatchBody = {
  title?: string
  archivedAt?: string | null
}

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  const log = logger.child({ module: 'api/threads/patch' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  const [body, parseErr] = await parseJsonBody<PatchBody>(req)
  if (parseErr) return parseErr

  // Verifiera ownership innan mutation
  const thread = await getConversationOwned({
    conversationId: id,
    userId: session.user.id,
  })
  if (!thread) return notFound()

  try {
    if (typeof body.title === 'string') {
      if (body.title.length === 0 || body.title.length > 200) {
        return badRequest('title måste vara 1-200 tecken')
      }
      await updateConversationTitle({
        conversationId: id,
        title: body.title,
        userId: session.user.id,
      })
    }
    if (body.archivedAt !== undefined) {
      if (body.archivedAt === null) {
        await unarchiveConversation({ conversationId: id, userId: session.user.id })
      } else {
        await archiveConversation({ conversationId: id, userId: session.user.id })
      }
    }
    log.info('thread_patched', { threadId: id })
    // Hämta uppdaterad rad
    const updated = await getConversationOwned({
      conversationId: id,
      userId: session.user.id,
    })
    if (!updated) return notFound()
    return ok({
      id: updated.id,
      title: updated.title,
      startedAt: updated.startedAt.toISOString(),
      lastMessageAt: updated.lastMessageAt.toISOString(),
      archivedAt: updated.archivedAt?.toISOString() ?? null,
    })
  } catch (err) {
    log.error('thread_patch_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  const log = logger.child({ module: 'api/threads/delete' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const { id } = await params
  const thread = await getConversationOwned({
    conversationId: id,
    userId: session.user.id,
  })
  if (!thread) return notFound()

  try {
    // Hård delete via Drizzle — FK CASCADE tar conversation_turn +
    // conversation_fact via 0002-migration.
    await db
      .delete(consumerConversations)
      .where(
        and(
          eq(consumerConversations.id, id),
          eq(consumerConversations.userId, session.user.id),
        ),
      )
    log.info('thread_deleted', { threadId: id })
    return noContent()
  } catch (err) {
    log.error('thread_delete_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
