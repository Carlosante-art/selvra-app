/**
 * POST /api/account/delete — markera konto för radering.
 *
 * Hård-delete sker via deleteUserAccount() i conversation-queries:
 * cascade tar bort consumer_conversations, conversation_turns,
 * conversation_facts, conversation_memory_facts.
 *
 * Selvra-protokoll-sidan har separat soft-delete via 30-dagars-fönster
 * (subject-lifecycle = 'pending_deletion'). Den initieras INTE här —
 * den kräver explicit Selvra-API-anrop som vi inte exponerar i v1
 * eftersom det är complex (cross-tenant-sync).
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
import { deleteUserAccount } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

export async function POST(): Promise<Response> {
  const log = logger.child({ module: 'api/account/delete' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const userId = session.user.id

  try {
    await deleteUserAccount(userId)
    log.warn('account_deleted', { userId })
    return ok({
      deletedAt: new Date().toISOString(),
      userId,
      message:
        'Kontot raderat. Selvra-protokoll-data raderas separat via subject-lifecycle om aktivt.',
    })
  } catch (err) {
    log.error('account_delete_failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
