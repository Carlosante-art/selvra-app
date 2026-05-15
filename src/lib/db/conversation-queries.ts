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

import { and, desc, eq, isNull, lte, or, sql } from 'drizzle-orm'

import { db } from './index'
import {
  consumerConversations,
  conversationMemoryFacts,
  conversationTurns,
} from './conversation-schema'
import { users } from './schema'

// ─── Fetchers ────────────────────────────────────────────────────────────

/**
 * Lista alla conversation-trådar för användaren, nyast först.
 * Arkiverade (archived_at != null) inkluderas inte by default.
 */
export async function listConversationsForUser(
  userId: string,
  opts: { includeArchived?: boolean; limit?: number } = {},
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
 * Hård delete av hela user-kontot. Cascade:s:
 *   - auth: account, session, verificationToken (FK till users.id)
 *   - konsument: consumer_conversation, conversation_memory_fact
 *     (FK till users.id) → conversation_turn (FK till consumer_conversation)
 *
 * Användaren måste signOut:as efter denna call (Server Action ansvarar).
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId))
}
