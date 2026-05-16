/**
 * POST /api/sources/manual-import
 *
 * Manuell injektion av käll-attribuerade facts till users representation.
 * Bygger förbi AB/Apple/iOS-blockers så Carl kan dogfooda representations-
 * loopen innan native HealthKit / OAuth-providers är live.
 *
 * Body:
 *   {
 *     sourceName: "manual:dexcom" | "manual:garmin" | "manual:journal" | ...,
 *     facts: [
 *       {
 *         factType: "user_stated" | "source_observed",
 *         value: string,        // sparas som factText
 *         observedAt?: ISO8601, // valfritt, går in i factText om angivet
 *         metadata?: object     // valfritt, serializeras till factText om angivet
 *       }
 *     ]
 *   }
 *
 * Skapar en "import-batch"-tråd per request (eller hittar dagens batch om
 * samma sourceName) + en turn för batchen. Facts länkas via FK till
 * thread + turn enligt conversation_fact-schemat.
 *
 * Validering:
 *   - sourceName måste matcha /^manual:[a-z0-9_-]+$/
 *   - max 100 facts per request
 *   - value max 2000 chars
 *   - factType måste vara user_stated eller source_observed
 *
 * Konstitutionellt: lock-validate och anti-hallucination bypass:as INTE.
 * Detta är user-input (inte LLM-output) så lock-validate är inte applicable.
 * Anti-hallucination i extractFactsFromTurn validerar att LLM-genererad
 * sourceName matchar tillgängliga events — här är sourceName explicit
 * skapad av användaren själv, vilket per definition inte är hallucination.
 *
 * Per .gsd/IOS_API_SPEC_2026-05-16.md + manuell-import-add-on 2026-05-16.
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  badRequest,
  created,
  internalError,
  parseJsonBody,
  unauthorized,
} from '@/lib/api/respond'
import {
  createConversation,
  persistConversationFacts,
  persistTurn,
} from '@/lib/db/conversation-queries'
import type { FactType } from '@/lib/db/conversation-schema'
import { logger } from '@/lib/logging'

export const runtime = 'nodejs'

const SOURCE_NAME_PATTERN = /^manual:[a-z0-9_-]+$/
const MAX_FACTS_PER_REQUEST = 100
const MAX_VALUE_CHARS = 2000

type ManualImportFactInput = {
  factType: string
  value: string
  observedAt?: string
  metadata?: Record<string, unknown>
}

type ManualImportBody = {
  sourceName: string
  facts: ManualImportFactInput[]
}

export async function POST(req: Request): Promise<Response> {
  const log = logger.child({ module: 'api/sources/manual-import' })

  const session = await auth()
  if (!session?.user?.id) return unauthorized()
  Sentry.setUser({ id: session.user.id })
  const userId = session.user.id

  const [body, parseErr] = await parseJsonBody<ManualImportBody>(req)
  if (parseErr) return parseErr

  // ─── Validering ────────────────────────────────────────────────
  if (typeof body.sourceName !== 'string') {
    return badRequest('sourceName krävs (string)')
  }
  if (!SOURCE_NAME_PATTERN.test(body.sourceName)) {
    return badRequest(
      'sourceName måste matcha /^manual:[a-z0-9_-]+$/ (t.ex. "manual:dexcom")',
    )
  }
  if (!Array.isArray(body.facts)) {
    return badRequest('facts måste vara en array')
  }
  if (body.facts.length === 0) {
    return badRequest('facts måste innehålla minst 1 element')
  }
  if (body.facts.length > MAX_FACTS_PER_REQUEST) {
    return badRequest(
      `max ${MAX_FACTS_PER_REQUEST} facts per request (fick ${body.facts.length})`,
    )
  }

  // Validera varje fact + bygg factText
  type ValidatedFact = {
    factType: FactType
    factText: string
  }
  const validated: ValidatedFact[] = []
  for (let i = 0; i < body.facts.length; i++) {
    const f = body.facts[i]
    if (!f || typeof f !== 'object') {
      return badRequest(`facts[${i}] måste vara objekt`)
    }
    if (f.factType !== 'user_stated' && f.factType !== 'source_observed') {
      return badRequest(
        `facts[${i}].factType måste vara user_stated eller source_observed (fick "${f.factType}")`,
      )
    }
    if (typeof f.value !== 'string' || f.value.trim().length === 0) {
      return badRequest(`facts[${i}].value måste vara icke-tom string`)
    }
    if (f.value.length > MAX_VALUE_CHARS) {
      return badRequest(
        `facts[${i}].value max ${MAX_VALUE_CHARS} chars (fick ${f.value.length})`,
      )
    }
    if (f.observedAt !== undefined) {
      if (typeof f.observedAt !== 'string') {
        return badRequest(`facts[${i}].observedAt måste vara ISO8601-string`)
      }
      const parsed = Date.parse(f.observedAt)
      if (Number.isNaN(parsed)) {
        return badRequest(
          `facts[${i}].observedAt måste vara giltig ISO8601 (fick "${f.observedAt}")`,
        )
      }
    }
    if (f.metadata !== undefined && (typeof f.metadata !== 'object' || f.metadata === null || Array.isArray(f.metadata))) {
      return badRequest(`facts[${i}].metadata måste vara objekt om angivet`)
    }

    // Bygg factText: value + valfri observedAt-prefix + valfri metadata-suffix
    const parts: string[] = []
    if (f.observedAt) parts.push(`[${f.observedAt}]`)
    parts.push(f.value.trim())
    if (f.metadata && Object.keys(f.metadata).length > 0) {
      parts.push(`(${JSON.stringify(f.metadata)})`)
    }
    let factText = parts.join(' ')
    if (factText.length > MAX_VALUE_CHARS) {
      // Trimma om concat överskrider cap pga metadata
      factText = factText.slice(0, MAX_VALUE_CHARS - 1) + '…'
    }

    validated.push({ factType: f.factType, factText })
  }

  // ─── Persist: thread + turn + facts ────────────────────────────
  try {
    // Skapa en import-batch-tråd (en per request — bevarar audit-trail).
    // Title blir spårbar i /api/threads-listan så Carl ser import-historik.
    const threadId = await createConversation(userId)

    // Skapa en turn för batchen. Användartext beskriver vad som importerades.
    // Selvra-text är null — ingen LLM-output här.
    const { turnId } = await persistTurn({
      conversationId: threadId,
      userId,
      userText: `Manual import: ${body.facts.length} facts från ${body.sourceName}`,
      selvraText: `Importerade ${body.facts.length} facts från ${body.sourceName}.`,
      sourcesConsulted: [{ sourceAiId: body.sourceName }],
      llmProvider: null,
    })

    // Persist facts. sourceName sätts på alla rader (även user_stated) så
    // import-källan är spårbar oavsett factType.
    await persistConversationFacts(
      validated.map((f) => ({
        userId,
        threadId,
        turnId,
        factText: f.factText,
        factType: f.factType,
        sourceName: body.sourceName,
      })),
    )

    // Hämta nyligen insättade fact-ids så caller får dem tillbaka. Vi
    // använder en query här istället för att modifiera persistConversationFacts
    // (som idag inte returnerar IDs). Defensiv: limit på batch-size förhindrar
    // att vi tar fel facts från äldre import.
    const factIds = await fetchRecentFactIdsForTurn(turnId, validated.length)

    log.info('manual_import_success', {
      userId,
      sourceName: body.sourceName,
      threadId,
      turnId,
      imported: validated.length,
    })

    return created({
      imported: validated.length,
      factIds,
      threadId,
      turnId,
    })
  } catch (err) {
    log.error('manual_import_failed', {
      userId,
      sourceName: body.sourceName,
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return internalError()
  }
}

/**
 * Hämta IDs för facts som tillhör denna turn (sorterade newest first så
 * order matchar insertion).
 */
async function fetchRecentFactIdsForTurn(
  turnId: string,
  limit: number,
): Promise<string[]> {
  // Lazy-import för att hålla module-init lätt
  const { db } = await import('@/lib/db')
  const { conversationFacts } = await import('@/lib/db/conversation-schema')
  const { eq, desc } = await import('drizzle-orm')

  const rows = await db
    .select({ id: conversationFacts.id })
    .from(conversationFacts)
    .where(eq(conversationFacts.turnId, turnId))
    .orderBy(desc(conversationFacts.extractedAt))
    .limit(limit)

  // Returnera i insertion-order (DB kan inte garantera utan timestamp-resolution)
  return rows.map((r) => r.id).reverse()
}
