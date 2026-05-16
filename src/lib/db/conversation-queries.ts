import 'server-only'

/**
 * Drizzle-queries för konsument-Fas-1 conversation-pipelinen.
 *
 * Anropas från Server Actions (sendMessage, newThread) efter att auth-
 * gate i `auth()` har gett userId. Alla queries antar att caller redan
 * verifierat session — funktionerna här validerar inte auth själva
 * (Drizzle's typsäkerhet är inte ett säkerhetslager).
 *
 * Tester: inte enhets-testade här (kräver pg-mem eller test-DB).
 * Verifieras integration när migration körs mot Carls DB.
 */

import { and, asc, desc, eq, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm'

import { db } from './index'
import {
  consumerConversations,
  conversationFacts,
  conversationMemoryFacts,
  conversationTurns,
  systemPromptVersions,
  type ExtractionStatus,
  type FactType,
} from './conversation-schema'
import { sessions, users } from './schema'

// ─── Fetchers ────────────────────────────────────────────────────────────

/**
 * Lista alla conversation-trådar för användaren, nyast först.
 * Arkiverade (archived_at != null) inkluderas inte by default.
 *
 * `query`-opt aktiverar ILIKE-filter på title (case-insensitive substring).
 * Inkluderar inte tråd-innehåll i sökning — bara titlar. Trådar utan
 * titel matchar aldrig query (skapa-första-tur-fas eller titel-gen-fel).
 */
export async function listConversationsForUser(
  userId: string,
  opts: { includeArchived?: boolean; limit?: number; query?: string } = {},
): Promise<
  Array<{
    id: string
    title: string | null
    startedAt: Date
    lastMessageAt: Date
  }>
> {
  const limit = opts.limit ?? 50
  const conditions = [eq(consumerConversations.userId, userId)]
  if (!opts.includeArchived) {
    conditions.push(isNull(consumerConversations.archivedAt))
  }
  if (opts.query && opts.query.trim().length > 0) {
    conditions.push(
      ilike(consumerConversations.title, `%${opts.query.trim()}%`),
    )
  }

  return db
    .select({
      id: consumerConversations.id,
      title: consumerConversations.title,
      startedAt: consumerConversations.startedAt,
      lastMessageAt: consumerConversations.lastMessageAt,
    })
    .from(consumerConversations)
    .where(and(...conditions))
    .orderBy(desc(consumerConversations.lastMessageAt))
    .limit(limit)
}

/**
 * Hämta en specifik tråd, men bara om den tillhör userId.
 * Returnerar null om tråden saknas ELLER tillhör annan user (vi
 * särskiljer inte i return-typen — defense-in-depth mot probing).
 */
export async function getConversationOwned(input: {
  conversationId: string
  userId: string
}): Promise<{
  id: string
  title: string | null
  startedAt: Date
  lastMessageAt: Date
  archivedAt: Date | null
} | null> {
  const [row] = await db
    .select({
      id: consumerConversations.id,
      title: consumerConversations.title,
      startedAt: consumerConversations.startedAt,
      lastMessageAt: consumerConversations.lastMessageAt,
      archivedAt: consumerConversations.archivedAt,
    })
    .from(consumerConversations)
    .where(
      and(
        eq(consumerConversations.id, input.conversationId),
        eq(consumerConversations.userId, input.userId),
      ),
    )
    .limit(1)
  return row ?? null
}

/**
 * Hämta alla turer i en tråd, ordnade kronologiskt. Används för
 * thread/[id]-vyn där hela historiken visas. För LLM-context räcker
 * fetchRecentTurns med limit.
 */
export async function fetchAllTurns(
  conversationId: string,
): Promise<
  Array<{
    id: string
    turnIndex: number
    userText: string
    selvraText: string | null
    sourcesConsulted: ReadonlyArray<{ source_ai_id: string }> | null
    createdAt: Date
  }>
> {
  const rows = await db
    .select({
      id: conversationTurns.id,
      turnIndex: conversationTurns.turnIndex,
      userText: conversationTurns.userText,
      selvraText: conversationTurns.selvraText,
      sourcesConsulted: conversationTurns.sourcesConsulted,
      createdAt: conversationTurns.createdAt,
    })
    .from(conversationTurns)
    .where(eq(conversationTurns.conversationId, conversationId))
    .orderBy(conversationTurns.turnIndex)

  return rows.map((r) => ({
    ...r,
    sourcesConsulted: r.sourcesConsulted as
      | ReadonlyArray<{ source_ai_id: string }>
      | null,
  }))
}

/**
 * Hämta senaste N turerna i en tråd, ordnade kronologiskt (äldst → nyast).
 * Drizzle returnerar nyaste först per ORDER BY DESC; vi reverserar i JS.
 */
export async function fetchRecentTurns(
  conversationId: string,
  limit: number = 5,
): Promise<
  Array<{
    turnIndex: number
    userText: string
    selvraText: string | null
    createdAt: Date
  }>
> {
  const rows = await db
    .select({
      turnIndex: conversationTurns.turnIndex,
      userText: conversationTurns.userText,
      selvraText: conversationTurns.selvraText,
      createdAt: conversationTurns.createdAt,
    })
    .from(conversationTurns)
    .where(eq(conversationTurns.conversationId, conversationId))
    .orderBy(desc(conversationTurns.turnIndex))
    .limit(limit)

  return rows.reverse() // kronologisk ordning
}

/**
 * Lista memory-facts för UI med id + sourceTurnId-koppling.
 * Inkluderar bara aktiva (icke-redacted, inom validity-fönster) — samma
 * filter som fetchActiveMemoryFacts. Skillnaden: extra fält för UI
 * (id för radera-knapp, sourceTurnId för audit-koppling).
 */
export async function listMemoryFactsForUi(
  userId: string,
): Promise<
  Array<{
    id: string
    factText: string
    sourceTurnId: string | null
    validFrom: Date
    validUntil: Date | null
  }>
> {
  return db
    .select({
      id: conversationMemoryFacts.id,
      factText: conversationMemoryFacts.factText,
      sourceTurnId: conversationMemoryFacts.sourceTurnId,
      validFrom: conversationMemoryFacts.validFrom,
      validUntil: conversationMemoryFacts.validUntil,
    })
    .from(conversationMemoryFacts)
    .where(
      and(
        eq(conversationMemoryFacts.userId, userId),
        isNull(conversationMemoryFacts.redactedAt),
        lte(conversationMemoryFacts.validFrom, sql`NOW()`),
        or(
          isNull(conversationMemoryFacts.validUntil),
          sql`${conversationMemoryFacts.validUntil} > NOW()`,
        ),
      ),
    )
    .orderBy(desc(conversationMemoryFacts.validFrom))
}

/**
 * Hämta aktiva memory-facts för användaren. "Aktiv" = inte redacted +
 * valid_from <= NOW() + (valid_until är NULL eller > NOW()).
 */
export async function fetchActiveMemoryFacts(
  userId: string,
): Promise<Array<{ factText: string; validFrom: Date }>> {
  return db
    .select({
      factText: conversationMemoryFacts.factText,
      validFrom: conversationMemoryFacts.validFrom,
    })
    .from(conversationMemoryFacts)
    .where(
      and(
        eq(conversationMemoryFacts.userId, userId),
        isNull(conversationMemoryFacts.redactedAt),
        lte(conversationMemoryFacts.validFrom, sql`NOW()`),
        or(
          isNull(conversationMemoryFacts.validUntil),
          sql`${conversationMemoryFacts.validUntil} > NOW()`,
        ),
      ),
    )
    .orderBy(desc(conversationMemoryFacts.validFrom))
}

// ─── Persistens ──────────────────────────────────────────────────────────

/**
 * Soft-arkivera en tråd (sätter archivedAt). Behåller data; bara döljs
 * från default-listan i /samtal. Användaren kan återställa via
 * unarchiveConversation eller se via "Visa arkiverade"-toggle.
 *
 * Validerar userId i WHERE — annan-users conversationId kan inte arkiveras
 * även om id gissas.
 */
export async function archiveConversation(input: {
  conversationId: string
  userId: string
}): Promise<void> {
  await db
    .update(consumerConversations)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(consumerConversations.id, input.conversationId),
        eq(consumerConversations.userId, input.userId),
      ),
    )
}

/**
 * Återställ en arkiverad tråd (nollar archivedAt).
 */
export async function unarchiveConversation(input: {
  conversationId: string
  userId: string
}): Promise<void> {
  await db
    .update(consumerConversations)
    .set({ archivedAt: null })
    .where(
      and(
        eq(consumerConversations.id, input.conversationId),
        eq(consumerConversations.userId, input.userId),
      ),
    )
}

/**
 * Sätt eller uppdatera titel på en conversation-tråd. Kallas typiskt
 * efter generateThreadTitle på första turn-paret.
 */
export async function updateConversationTitle(input: {
  conversationId: string
  title: string
  userId: string
}): Promise<void> {
  await db
    .update(consumerConversations)
    .set({ title: input.title })
    .where(
      and(
        eq(consumerConversations.id, input.conversationId),
        eq(consumerConversations.userId, input.userId),
      ),
    )
}

/**
 * Skapa ny conversation-tråd. Returnerar nya id:t så caller kan
 * redirect:a till /samtal/thread/[id].
 */
export async function createConversation(userId: string): Promise<string> {
  const [row] = await db
    .insert(consumerConversations)
    .values({ userId })
    .returning({ id: consumerConversations.id })
  return row.id
}

/**
 * Persist en tur. Skapar conversation först om conversationId är null.
 * turn_index räknas auto från senaste i tråden.
 *
 * Returnerar conversation_id (samma som input om angivet, annars nya).
 */
export async function persistTurn(input: {
  conversationId: string | null
  userId: string
  userText: string
  selvraText: string
  sourcesConsulted: ReadonlyArray<{ sourceAiId: string }> | null
  llmProvider: string | null
}): Promise<{ conversationId: string; turnId: string }> {
  // Skapa conversation om saknas
  const conversationId =
    input.conversationId ?? (await createConversation(input.userId))

  // Räkna nästa turn_index
  const [maxRow] = await db
    .select({ max: sql<number | null>`max(${conversationTurns.turnIndex})` })
    .from(conversationTurns)
    .where(eq(conversationTurns.conversationId, conversationId))

  const nextIndex = (maxRow?.max ?? -1) + 1

  const [turn] = await db
    .insert(conversationTurns)
    .values({
      conversationId,
      turnIndex: nextIndex,
      userText: input.userText,
      selvraText: input.selvraText,
      sourcesConsulted: input.sourcesConsulted ?? null,
      llmProvider: input.llmProvider,
    })
    .returning({ id: conversationTurns.id })

  // Uppdatera conversation last_message_at
  await db
    .update(consumerConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(consumerConversations.id, conversationId))

  return { conversationId, turnId: turn.id }
}

/**
 * Persist explicit memory-fact. Caller ska redan ha extraherat factText
 * via detectMemoryFact. Returnerar id för audit-koppling.
 */
export async function persistMemoryFact(input: {
  userId: string
  factText: string
  sourceTurnId?: string | null
}): Promise<string> {
  const [row] = await db
    .insert(conversationMemoryFacts)
    .values({
      userId: input.userId,
      factText: input.factText,
      sourceTurnId: input.sourceTurnId ?? null,
    })
    .returning({ id: conversationMemoryFacts.id })
  return row.id
}

/**
 * Soft-delete en memory-fact (sätter redactedAt). Hård delete sker via
 * GDPR-export-och-radera-flödet, inte här.
 */
export async function redactMemoryFact(input: {
  factId: string
  userId: string
}): Promise<void> {
  await db
    .update(conversationMemoryFacts)
    .set({ redactedAt: new Date() })
    .where(
      and(
        eq(conversationMemoryFacts.id, input.factId),
        eq(conversationMemoryFacts.userId, input.userId),
      ),
    )
}

// ─── V1 conversation_facts (Steg 8) ──────────────────────────────────────

/**
 * Batch-persist conversation_facts. Anropas av extractFactsFromTurn efter
 * varje user-turn med 0-N extraherade facts. Tom array → no-op.
 *
 * Validerar fact_type på applikations-nivå (DB-CHECK-constraint är
 * defense-in-depth). source_name är required för 'source_observed',
 * null för 'user_stated'.
 */
export async function persistConversationFacts(
  facts: ReadonlyArray<{
    userId: string
    threadId: string
    turnId: string
    factText: string
    factType: FactType
    sourceName?: string | null
  }>,
): Promise<{ insertedCount: number }> {
  if (facts.length === 0) return { insertedCount: 0 }

  await db.insert(conversationFacts).values(
    facts.map((f) => ({
      userId: f.userId,
      threadId: f.threadId,
      turnId: f.turnId,
      factText: f.factText,
      factType: f.factType,
      sourceName: f.sourceName ?? null,
    })),
  )

  return { insertedCount: facts.length }
}

/**
 * Lista conversation_facts för UI (filtered by fact_type), nyast först.
 * Soft-deleted facts (user_deleted_at != null) inkluderas inte.
 *
 * Används av /minne för "Vad du sagt" + "Vad dina källor visat"-kategorierna.
 */
export async function listConversationFactsForUi(
  userId: string,
  opts: { factType?: FactType; sourceName?: string; limit?: number } = {},
): Promise<
  Array<{
    id: string
    factText: string
    factType: FactType
    sourceName: string | null
    threadId: string
    turnId: string
    extractedAt: Date
  }>
> {
  const limit = opts.limit ?? 30
  const conditions = [
    eq(conversationFacts.userId, userId),
    isNull(conversationFacts.userDeletedAt),
  ]
  if (opts.factType) {
    conditions.push(eq(conversationFacts.factType, opts.factType))
  }
  if (opts.sourceName) {
    conditions.push(eq(conversationFacts.sourceName, opts.sourceName))
  }

  const rows = await db
    .select({
      id: conversationFacts.id,
      factText: conversationFacts.factText,
      factType: conversationFacts.factType,
      sourceName: conversationFacts.sourceName,
      threadId: conversationFacts.threadId,
      turnId: conversationFacts.turnId,
      extractedAt: conversationFacts.extractedAt,
    })
    .from(conversationFacts)
    .where(and(...conditions))
    .orderBy(desc(conversationFacts.extractedAt))
    .limit(limit)

  // factType är text i DB; cast till discriminated union på applikations-nivå.
  return rows.map((r) => ({
    ...r,
    factType: r.factType as FactType,
  }))
}

/**
 * Soft-delete en conversation_fact. Validerar userId så annan-users facts
 * inte kan raderas. UI:t kommer aldrig visa raderade facts igen, men de
 * bevaras för audit + ev. legal-hold (samma som conversation_memory_facts).
 */
export async function deleteConversationFact(input: {
  factId: string
  userId: string
}): Promise<void> {
  await db
    .update(conversationFacts)
    .set({ userDeletedAt: new Date() })
    .where(
      and(
        eq(conversationFacts.id, input.factId),
        eq(conversationFacts.userId, input.userId),
      ),
    )
}

// ─── Async fact-extraction (migration 0005, 2026-05-16) ──────────────────

/**
 * Hämta N äldsta pending eller failed turns för batch-extraction.
 * Sorteras på created_at ASC så äldsta processas först (FIFO).
 *
 * `failed`-turns inkluderas så cron retry:ar. För att undvika hot-retry
 * av en kontinuerligt-failande tur, exkluderar vi turns med
 * extraction_attempted_at < retryBackoffMinutes minuter sedan.
 *
 * Returnerar payload som behövs av extractFactsBatch — turnId, userId,
 * threadId, userText, selvraText, sourcesConsulted.
 */
export async function getPendingExtractionTurns(opts: {
  limit: number
  retryBackoffMinutes?: number
}): Promise<
  Array<{
    turnId: string
    userId: string
    threadId: string
    userText: string
    selvraText: string
    sourcesConsulted: ReadonlyArray<{ sourceAiId: string }>
  }>
> {
  const backoffMin = opts.retryBackoffMinutes ?? 5
  const backoffThreshold = new Date(Date.now() - backoffMin * 60_000)

  const rows = await db
    .select({
      turnId: conversationTurns.id,
      threadId: conversationTurns.conversationId,
      userText: conversationTurns.userText,
      selvraText: conversationTurns.selvraText,
      sourcesConsulted: conversationTurns.sourcesConsulted,
      userId: consumerConversations.userId,
      extractionAttemptedAt: conversationTurns.extractionAttemptedAt,
      extractionStatus: conversationTurns.extractionStatus,
    })
    .from(conversationTurns)
    .innerJoin(
      consumerConversations,
      eq(conversationTurns.conversationId, consumerConversations.id),
    )
    .where(
      and(
        inArray(conversationTurns.extractionStatus, ['pending', 'failed']),
        // selvraText måste finnas — annars är det memory-ack/fallback (skipped)
        sql`${conversationTurns.selvraText} IS NOT NULL`,
        // failed-turns: bara om backoff-period passerat
        or(
          eq(conversationTurns.extractionStatus, 'pending'),
          and(
            eq(conversationTurns.extractionStatus, 'failed'),
            lte(conversationTurns.extractionAttemptedAt, backoffThreshold),
          ),
        ),
      ),
    )
    .orderBy(asc(conversationTurns.createdAt))
    .limit(opts.limit)

  return rows.map((r) => {
    // selvraText är non-null per WHERE-clause men TS vet inte det.
    const selvraText = r.selvraText ?? ''
    // sourcesConsulted är jsonb, kan vara null eller array
    const raw = r.sourcesConsulted
    const sources: Array<{ sourceAiId: string }> = Array.isArray(raw)
      ? (raw as Array<{ sourceAiId?: string; source_ai_id?: string }>)
          .map((s) => ({ sourceAiId: s.sourceAiId ?? s.source_ai_id ?? '' }))
          .filter((s) => s.sourceAiId.length > 0)
      : []

    return {
      turnId: r.turnId,
      userId: r.userId,
      threadId: r.threadId,
      userText: r.userText,
      selvraText,
      sourcesConsulted: sources,
    }
  })
}

/**
 * Markera en turns extraction-status. Settar extraction_attempted_at till
 * NOW() oavsett status (för retry-backoff på 'failed').
 *
 * failureReason är bara relevant för 'failed' — annars null.
 */
export async function markTurnExtractionStatus(input: {
  turnId: string
  status: ExtractionStatus
  failureReason?: string | null
}): Promise<void> {
  await db
    .update(conversationTurns)
    .set({
      extractionStatus: input.status,
      extractionAttemptedAt: new Date(),
      extractionFailureReason: input.failureReason ?? null,
    })
    .where(eq(conversationTurns.id, input.turnId))
}

/**
 * Bulk-markera flera turns till samma status. Optimering för batch-cron
 * när alla succeeded eller alla skipped — sparar N round-trips.
 */
export async function bulkMarkTurnExtractionStatus(input: {
  turnIds: ReadonlyArray<string>
  status: ExtractionStatus
}): Promise<void> {
  if (input.turnIds.length === 0) return
  await db
    .update(conversationTurns)
    .set({
      extractionStatus: input.status,
      extractionAttemptedAt: new Date(),
      extractionFailureReason: null,
    })
    .where(inArray(conversationTurns.id, [...input.turnIds]))
}

/**
 * Räkna pending/failed turns för monitoring. Cron-endpoint rapporterar
 * detta så Sentry-alerting kan trigga om backlog växer obegränsat.
 */
export async function countPendingExtractionTurns(): Promise<{
  pending: number
  failed: number
}> {
  const rows = await db
    .select({
      status: conversationTurns.extractionStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(conversationTurns)
    .where(
      inArray(conversationTurns.extractionStatus, ['pending', 'failed']),
    )
    .groupBy(conversationTurns.extractionStatus)

  let pending = 0
  let failed = 0
  for (const r of rows) {
    if (r.status === 'pending') pending = r.count
    else if (r.status === 'failed') failed = r.count
  }
  return { pending, failed }
}

// ─── System-prompt-versionering ──────────────────────────────────────────

/**
 * Fetcha aktiv system-prompt från DB. Bara EN version har isActive=true
 * (unique partial index garanterar). Om ingen finns: returnera null (caller
 * fallback:ar till hardcoded default).
 *
 * För Carl-dogfood under Fas 1: kan ändras via SQL utan deploy. När en
 * ny version aktiveras, UPDATE den gamla till is_active=false i samma
 * transaktion (constraint kräver det).
 */
export async function fetchActiveSystemPrompt(): Promise<{
  version: string
  promptText: string
} | null> {
  const [row] = await db
    .select({
      version: systemPromptVersions.version,
      promptText: systemPromptVersions.promptText,
    })
    .from(systemPromptVersions)
    .where(eq(systemPromptVersions.isActive, true))
    .limit(1)
  return row ?? null
}

// ─── Rate-limiting ───────────────────────────────────────────────────────

/**
 * Räkna turer skapade av en user inom senaste N sekunder. Används för
 * rate-limit-check i sendMessage så en bot eller stuck-loop inte spammar
 * Selvra-protokoll-fetches + LLM-anrop.
 */
export async function countRecentTurnsForUser(input: {
  userId: string
  sinceSeconds: number
}): Promise<number> {
  const since = new Date(Date.now() - input.sinceSeconds * 1000)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationTurns)
    .innerJoin(
      consumerConversations,
      eq(conversationTurns.conversationId, consumerConversations.id),
    )
    .where(
      and(
        eq(consumerConversations.userId, input.userId),
        sql`${conversationTurns.createdAt} >= ${since}`,
      ),
    )
  return row?.count ?? 0
}

// ─── GDPR / patient-ägd portabilitet ─────────────────────────────────────

/**
 * Hård delete av alla conversations + memory-facts för en user.
 * conversation_turns cascade:s via consumer_conversation-FK.
 *
 * Behåller user-raden (auth-konto) intakt. För full avregistrering, se
 * deleteUserAccount() nedan.
 */
export async function purgeUserConversations(userId: string): Promise<{
  deletedConversations: number
  deletedFacts: number
}> {
  const deletedFacts = await db
    .delete(conversationMemoryFacts)
    .where(eq(conversationMemoryFacts.userId, userId))
    .returning({ id: conversationMemoryFacts.id })

  const deletedConversations = await db
    .delete(consumerConversations)
    .where(eq(consumerConversations.userId, userId))
    .returning({ id: consumerConversations.id })

  return {
    deletedConversations: deletedConversations.length,
    deletedFacts: deletedFacts.length,
  }
}

/**
 * Hard-delete hela user-kontot. Cascade:s:
 *   - auth: account, session, verificationToken (FK till users.id)
 *   - konsument: consumer_conversation, conversation_memory_fact,
 *     conversation_fact (FK till users.id) → conversation_turn
 *
 * Default-flödet för user-initierad radering är softDeleteUserAccount
 * nedan (30d restore-window). Denna funktion är för:
 *   - Cron-cleanup efter 30d (hardDeleteExpiredUsers anropar internt)
 *   - Admin-purge-flöde (icke-exponerat i v1)
 *   - Tester av cascade-beteende
 *
 * Användaren måste signOut:as efter denna call.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId))
}

/**
 * Soft-delete user-account med 30-dagars restore-window (audit #18).
 *
 * Steg:
 *   1. Sätt users.deleted_at = NOW() → blockerar all data-access
 *   2. Radera alla aktiva sessions → tvingar logout omedelbart
 *
 * Restore-paths:
 *   - Magic-link-login inom 30d → events.signIn auto-clear:ar deleted_at
 *   - Cron (cleanup-soft-deleted) hard-deletar efter 30d via CASCADE
 *
 * UI-meddelande till user måste tydligt säga: "Konto raderas slutgiltigt
 * om 30 dagar. Logga in igen för att ångra."
 */
export async function softDeleteUserAccount(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, userId))

  // Invalidera aktiva sessions så user inte kan fortsätta använda appen
  // efter delete-request. Sessions cascade på user-delete senare när
  // cron hard-deletar, men vi vill ha omedelbar effekt.
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

/**
 * Kolla om en user är soft-deleted. Används av middleware/auth-gate.
 * Returnerar { deletedAt: Date, daysAgo: number } eller null om aktiv.
 */
export async function getUserSoftDeleteStatus(userId: string): Promise<{
  deletedAt: Date
  daysAgo: number
} | null> {
  const [row] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row?.deletedAt) return null

  const daysAgo = Math.floor((Date.now() - row.deletedAt.getTime()) / 86_400_000)
  return { deletedAt: row.deletedAt, daysAgo }
}

/**
 * Restore soft-deleted user. Throw om utanför 30-dagars-fönster eller
 * om user inte är soft-deleted. Auto-anropas från events.signIn (Auth.js)
 * när user login:ar med magic-link inom fönstret.
 */
export async function restoreUserAccount(
  userId: string,
  opts: { windowDays?: number } = {},
): Promise<void> {
  const windowDays = opts.windowDays ?? 30
  const status = await getUserSoftDeleteStatus(userId)
  if (!status) {
    throw new Error('restoreUserAccount: user inte soft-deleted')
  }
  if (status.daysAgo > windowDays) {
    throw new Error(
      `restoreUserAccount: utanför ${windowDays}-dagars-fönster (${status.daysAgo}d sedan)`,
    )
  }

  await db.update(users).set({ deletedAt: null }).where(eq(users.id, userId))
}

// ─── Cleanup-cron (audit #10 + #18) ──────────────────────────────────────

/**
 * Hard-delete user-rader där deleted_at < cutoff. CASCADE plockar
 * account, session, conversation_*, memory_fact, conversation_fact.
 *
 * Returnerar antal hard-deletade. Caller (cron) loggar.
 */
export async function hardDeleteExpiredUsers(opts: {
  cutoff: Date
}): Promise<number> {
  const rows = await db
    .delete(users)
    .where(
      and(
        sql`${users.deletedAt} IS NOT NULL`,
        lte(users.deletedAt, opts.cutoff),
      ),
    )
    .returning({ id: users.id })

  return rows.length
}

/**
 * Hard-delete conversation_fact-rader där user_deleted_at < cutoff
 * (user själv markerade dem för delete via UI). Skiljer sig från
 * hardDeleteExpiredUsers ovan — där cascade:s allt; denna är för facts
 * som user raderat individuellt utan att radera kontot.
 */
export async function hardDeleteExpiredConversationFacts(opts: {
  cutoff: Date
}): Promise<number> {
  const rows = await db
    .delete(conversationFacts)
    .where(
      and(
        sql`${conversationFacts.userDeletedAt} IS NOT NULL`,
        lte(conversationFacts.userDeletedAt, opts.cutoff),
      ),
    )
    .returning({ id: conversationFacts.id })

  return rows.length
}

/**
 * Hard-delete conversation_memory_fact-rader där redacted_at < cutoff.
 * Motsvarande mönster — soft-deleted memory facts efter 30d hard-deleteras.
 */
export async function hardDeleteExpiredMemoryFacts(opts: {
  cutoff: Date
}): Promise<number> {
  const rows = await db
    .delete(conversationMemoryFacts)
    .where(
      and(
        sql`${conversationMemoryFacts.redactedAt} IS NOT NULL`,
        lte(conversationMemoryFacts.redactedAt, opts.cutoff),
      ),
    )
    .returning({ id: conversationMemoryFacts.id })

  return rows.length
}
