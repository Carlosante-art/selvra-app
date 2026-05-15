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

// ─── Fetchers ────────────────────────────────────────────────────────────

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
