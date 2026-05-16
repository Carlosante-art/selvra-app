/**
 * GET /api/memory/facts — list conversation_facts (filter per type + source)
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  badRequest,
  internalError,
  ok,
  unauthorized,
} from '@/lib/api/respond'
import { listConversationFactsForUi } from '@/lib/db/conversation-queries'
import type { FactType } from '@/lib/db/conversation-schema'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

export async function GET(req: Request): Promise<Response> {
  const log = logger.child({ module: 'api/memory/facts' })
  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })

  const url = new URL(req.url)
  const factTypeParam = url.searchParams.get('factType')
  const sourceNameParam = url.searchParams.get('sourceName')?.trim().toLowerCase()
  const limitParam = url.searchParams.get('limit')

  let factType: FactType | undefined
  if (factTypeParam) {
    if (factTypeParam !== 'user_stated' && factTypeParam !== 'source_observed') {
      return badRequest('factType måste vara user_stated eller source_observed')
    }
    factType = factTypeParam
  }

  let limit = 30
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
      return badRequest('limit måste vara 1-100')
    }
    limit = parsed
  }

  try {
    const facts = await listConversationFactsForUi(session.user.id, {
      factType,
      sourceName: sourceNameParam && sourceNameParam.length > 0 ? sourceNameParam : undefined,
      limit,
    })
    return ok({
      facts: facts.map((f) => ({
        id: f.id,
        factText: f.factText,
        factType: f.factType,
        sourceName: f.sourceName,
        threadId: f.threadId,
        turnId: f.turnId,
        extractedAt: f.extractedAt.toISOString(),
      })),
    })
  } catch (err) {
    log.error('memory_facts_list_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}
