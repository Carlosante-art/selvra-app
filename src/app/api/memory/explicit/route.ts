/**
 * GET /api/memory/explicit — list user-skrivna explicita minnen
 * (conversation_memory_facts)
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
import { listMemoryFactsForUi } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const log = logger.child({ module: 'api/memory/explicit' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  try {
    const facts = await listMemoryFactsForUi(session.user.id)
    return ok({
      facts: facts.map((f) => ({
        id: f.id,
        factText: f.factText,
        sourceTurnId: f.sourceTurnId,
        validFrom: f.validFrom.toISOString(),
        validUntil: f.validUntil?.toISOString() ?? null,
      })),
    })
  } catch (err) {
    log.error('memory_explicit_list_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
