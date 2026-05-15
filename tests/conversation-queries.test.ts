// conversation-queries integration-tester via pg-mem.
//
// Vi mockar @/lib/db/index så `db`-export:en pekar mot test-DB istället
// för riktig Railway-pool. Schema sätts upp inline (CREATE TABLE) i
// tests/helpers/db.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: { current: null as null | ReturnType<typeof import('./helpers/db').createTestDb> },
  }
})

vi.mock('@/lib/db/index', () => ({
  get db() {
    if (!mockDb.current) throw new Error('Test-DB inte initierad')
    return mockDb.current.db
  },
}))

// Import EFTER vi.mock så modulen tar emot vår mock
import { createTestDb, seedUser } from './helpers/db'
import {
  archiveConversation,
  countRecentTurnsForUser,
  createConversation,
  deleteConversationFact,
  deleteUserAccount,
  fetchActiveMemoryFacts,
  fetchActiveSystemPrompt,
  fetchAllTurns,
  fetchRecentTurns,
  getConversationOwned,
  listConversationFactsForUi,
  listConversationsForUser,
  listMemoryFactsForUi,
  persistConversationFacts,
  persistMemoryFact,
  persistTurn,
  purgeUserConversations,
  redactMemoryFact,
  unarchiveConversation,
  updateConversationTitle,
} from '@/lib/db/conversation-queries'

beforeEach(() => {
  mockDb.current = createTestDb()
})

afterEach(async () => {
  if (mockDb.current) {
    await mockDb.current.pool.end()
    mockDb.current = null
  }
})

describe('createConversation + persistTurn — bas-flöde', () => {
  it('skapar tråd vid persistTurn med null conversationId', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'Hur var min vecka?',
      selvraText: 'Inga källor att rapportera.',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })

    expect(conversationId).toBeTruthy()
    expect(turnId).toBeTruthy()

    const owned = await getConversationOwned({ conversationId, userId })
    expect(owned).not.toBeNull()
    expect(owned?.id).toBe(conversationId)
  })

  it('turn_index ökar monotont inom samma tråd', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid = await createConversation(userId)

    await persistTurn({
      conversationId: cid,
      userId,
      userText: 'a',
      selvraText: 'A',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistTurn({
      conversationId: cid,
      userId,
      userText: 'b',
      selvraText: 'B',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistTurn({
      conversationId: cid,
      userId,
      userText: 'c',
      selvraText: 'C',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })

    const turns = await fetchAllTurns(cid)
    expect(turns.map((t) => t.turnIndex)).toEqual([0, 1, 2])
    expect(turns.map((t) => t.userText)).toEqual(['a', 'b', 'c'])
  })

  it('persistTurn sparar sourcesConsulted som JSON', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'Vad visade Dexcom?',
      selvraText: 'Dexcom visade 7.4',
      sourcesConsulted: [{ sourceAiId: 'dexcom' }, { sourceAiId: 'garmin_sleep' }],
      llmProvider: 'mistral',
    })

    const turns = await fetchAllTurns(conversationId)
    expect(turns[0].sourcesConsulted).toEqual([
      { sourceAiId: 'dexcom' },
      { sourceAiId: 'garmin_sleep' },
    ])
  })
})

describe('listConversationsForUser — filter + isolation', () => {
  it('returnerar bara trådar för rätt user', async () => {
    const userA = await seedUser(mockDb.current!, { email: 'a@test' })
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })

    await createConversation(userA)
    await createConversation(userA)
    await createConversation(userB)

    const aThreads = await listConversationsForUser(userA)
    const bThreads = await listConversationsForUser(userB)

    expect(aThreads).toHaveLength(2)
    expect(bThreads).toHaveLength(1)
  })

  it('exkluderar arkiverade by default, inkluderar med flag', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid1 = await createConversation(userId)
    const cid2 = await createConversation(userId)
    await archiveConversation({ conversationId: cid1, userId })

    const active = await listConversationsForUser(userId)
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe(cid2)

    const all = await listConversationsForUser(userId, { includeArchived: true })
    expect(all).toHaveLength(2)
  })

  it('query-opt filtrerar på title (ILIKE substring)', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid1 = await createConversation(userId)
    const cid2 = await createConversation(userId)
    await createConversation(userId) // utan titel — ska aldrig matcha query
    await updateConversationTitle({
      conversationId: cid1,
      userId,
      title: 'Sömnens nattliga rytm',
    })
    await updateConversationTitle({
      conversationId: cid2,
      userId,
      title: 'Glykemiska variationer',
    })
    // cid3 utan titel — ska inte matcha

    const sleep = await listConversationsForUser(userId, { query: 'sömn' })
    expect(sleep).toHaveLength(1)
    expect(sleep[0].id).toBe(cid1)

    const variation = await listConversationsForUser(userId, {
      query: 'variation',
    })
    expect(variation).toHaveLength(1)
    expect(variation[0].id).toBe(cid2)
  })
})

describe('getConversationOwned — ownership-isolation', () => {
  it('returnerar null när tråden tillhör annan user', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cid = await createConversation(userA)

    const ownedByB = await getConversationOwned({
      conversationId: cid,
      userId: userB,
    })
    expect(ownedByB).toBeNull()

    const ownedByA = await getConversationOwned({
      conversationId: cid,
      userId: userA,
    })
    expect(ownedByA?.id).toBe(cid)
  })

  it('returnerar null för icke-existerande tråd', async () => {
    const userId = await seedUser(mockDb.current!)
    const result = await getConversationOwned({
      conversationId: 'nonexistent',
      userId,
    })
    expect(result).toBeNull()
  })
})

describe('archiveConversation / unarchiveConversation', () => {
  it('archive sätter archivedAt; unarchive nollar', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid = await createConversation(userId)

    await archiveConversation({ conversationId: cid, userId })
    let owned = await getConversationOwned({ conversationId: cid, userId })
    expect(owned?.archivedAt).toBeInstanceOf(Date)

    await unarchiveConversation({ conversationId: cid, userId })
    owned = await getConversationOwned({ conversationId: cid, userId })
    expect(owned?.archivedAt).toBeNull()
  })

  it('archive ignorerar annan-users tråd (no-op)', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cid = await createConversation(userA)

    await archiveConversation({ conversationId: cid, userId: userB })

    const owned = await getConversationOwned({
      conversationId: cid,
      userId: userA,
    })
    expect(owned?.archivedAt).toBeNull()
  })
})

describe('fetchRecentTurns — chronological order + limit', () => {
  it('returnerar senaste N turer i kronologisk ordning', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid = await createConversation(userId)

    for (const t of ['1', '2', '3', '4', '5']) {
      await persistTurn({
        conversationId: cid,
        userId,
        userText: t,
        selvraText: `svar ${t}`,
        sourcesConsulted: null,
        llmProvider: 'mistral',
      })
    }

    const recent = await fetchRecentTurns(cid, 3)
    expect(recent).toHaveLength(3)
    // Kronologisk: tur 3, 4, 5 — INTE 5, 4, 3
    expect(recent.map((t) => t.userText)).toEqual(['3', '4', '5'])
  })
})

describe('Memory-facts — persist, list, redact', () => {
  it('persistMemoryFact + listMemoryFactsForUi', async () => {
    const userId = await seedUser(mockDb.current!)
    const factId = await persistMemoryFact({
      userId,
      factText: 'jag är T1-diabetiker',
    })

    const facts = await listMemoryFactsForUi(userId)
    expect(facts).toHaveLength(1)
    expect(facts[0].id).toBe(factId)
    expect(facts[0].factText).toBe('jag är T1-diabetiker')
  })

  it('redactMemoryFact döljer från listMemoryFactsForUi', async () => {
    const userId = await seedUser(mockDb.current!)
    const factId = await persistMemoryFact({
      userId,
      factText: 'något jag vill glömma',
    })

    await redactMemoryFact({ factId, userId })

    const facts = await listMemoryFactsForUi(userId)
    expect(facts).toHaveLength(0)
  })

  it('redactMemoryFact validerar userId (annan user kan inte radera)', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const factId = await persistMemoryFact({
      userId: userA,
      factText: 'A:s fakta',
    })

    await redactMemoryFact({ factId, userId: userB })

    // Faktan ska fortfarande synas för A
    const facts = await listMemoryFactsForUi(userA)
    expect(facts).toHaveLength(1)
  })

  it('fetchActiveMemoryFacts respekterar validity-fönster', async () => {
    const userId = await seedUser(mockDb.current!)
    await persistMemoryFact({
      userId,
      factText: 'nuvarande fakta',
    })

    const active = await fetchActiveMemoryFacts(userId)
    expect(active).toHaveLength(1)
    expect(active[0].factText).toBe('nuvarande fakta')
  })

  it('fetchActiveMemoryFacts isolerar per user', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    await persistMemoryFact({ userId: userA, factText: 'A' })
    await persistMemoryFact({ userId: userB, factText: 'B' })

    const aFacts = await fetchActiveMemoryFacts(userA)
    expect(aFacts).toHaveLength(1)
    expect(aFacts[0].factText).toBe('A')
  })
})

describe('System-prompt-versionering', () => {
  it('fetchActiveSystemPrompt returnerar null när inget aktivt', async () => {
    const result = await fetchActiveSystemPrompt()
    expect(result).toBeNull()
  })

  it('fetchActiveSystemPrompt returnerar aktiv version', async () => {
    await mockDb.current!.raw(`
      INSERT INTO "system_prompt_version" ("id", "version", "prompt_text", "is_active")
      VALUES ('p1', 'v0', 'Du är Selvra.', true)
    `)
    await mockDb.current!.raw(`
      INSERT INTO "system_prompt_version" ("id", "version", "prompt_text", "is_active")
      VALUES ('p2', 'v1', 'Du är Selvra v1.', false)
    `)

    const result = await fetchActiveSystemPrompt()
    expect(result?.version).toBe('v0')
    expect(result?.promptText).toBe('Du är Selvra.')
  })
})

describe('Rate-limit count', () => {
  it('countRecentTurnsForUser räknar bara turer inom fönster', async () => {
    const userId = await seedUser(mockDb.current!)
    const cid = await createConversation(userId)

    // 3 nyligen-skapade turer
    for (let i = 0; i < 3; i++) {
      await persistTurn({
        conversationId: cid,
        userId,
        userText: `t${i}`,
        selvraText: `svar`,
        sourcesConsulted: null,
        llmProvider: 'mistral',
      })
    }

    const count = await countRecentTurnsForUser({
      userId,
      sinceSeconds: 60,
    })
    expect(count).toBe(3)
  })

  it('countRecentTurnsForUser isolerar per user', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cidA = await createConversation(userA)
    const cidB = await createConversation(userB)

    await persistTurn({
      conversationId: cidA,
      userId: userA,
      userText: 'a',
      selvraText: 'A',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistTurn({
      conversationId: cidB,
      userId: userB,
      userText: 'b',
      selvraText: 'B',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })

    expect(
      await countRecentTurnsForUser({ userId: userA, sinceSeconds: 60 }),
    ).toBe(1)
    expect(
      await countRecentTurnsForUser({ userId: userB, sinceSeconds: 60 }),
    ).toBe(1)
  })
})

describe('Patient-ägd portabilitet — purge + delete', () => {
  it('purgeUserConversations raderar trådar + facts, lämnar user-rad intakt', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cidA = await createConversation(userA)
    await persistTurn({
      conversationId: cidA,
      userId: userA,
      userText: 'a',
      selvraText: 'A',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistMemoryFact({ userId: userA, factText: 'A-fakta' })

    // B har egen data som INTE ska påverkas
    const cidB = await createConversation(userB)
    await persistMemoryFact({ userId: userB, factText: 'B-fakta' })

    const result = await purgeUserConversations(userA)

    expect(result.deletedConversations).toBe(1)
    expect(result.deletedFacts).toBe(1)

    // A: tomt
    expect(await listConversationsForUser(userA)).toHaveLength(0)
    expect(await fetchActiveMemoryFacts(userA)).toHaveLength(0)

    // B: intakt
    expect(await listConversationsForUser(userB)).toHaveLength(1)
    expect(await fetchActiveMemoryFacts(userB)).toHaveLength(1)
    expect((await listConversationsForUser(userB))[0].id).toBe(cidB)
  })

  it('deleteUserAccount cascadar bort alla user-data', async () => {
    const userA = await seedUser(mockDb.current!)
    const cidA = await createConversation(userA)
    await persistTurn({
      conversationId: cidA,
      userId: userA,
      userText: 'a',
      selvraText: 'A',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistMemoryFact({ userId: userA, factText: 'A-fakta' })

    await deleteUserAccount(userA)

    // Allt borta via FK CASCADE
    expect(await listConversationsForUser(userA)).toHaveLength(0)
    expect(await fetchActiveMemoryFacts(userA)).toHaveLength(0)
  })
})

describe('V1 Steg 8: conversation_facts', () => {
  it('persistConversationFacts batch-insert + listConversationFactsForUi', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'jag är T1D',
      selvraText: 'sparat',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })

    const result = await persistConversationFacts([
      {
        userId,
        threadId: conversationId,
        turnId,
        factText: 'jag är T1-diabetiker',
        factType: 'user_stated',
      },
      {
        userId,
        threadId: conversationId,
        turnId,
        factText: '5.4h sömn i natt',
        factType: 'source_observed',
        sourceName: 'garmin',
      },
    ])

    expect(result.insertedCount).toBe(2)

    const all = await listConversationFactsForUi(userId)
    expect(all).toHaveLength(2)
  })

  it('listConversationFactsForUi filtrerar per fact_type', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'a', factType: 'user_stated' },
      { userId, threadId: conversationId, turnId, factText: 'b', factType: 'user_stated' },
      { userId, threadId: conversationId, turnId, factText: 'c', factType: 'source_observed', sourceName: 'garmin' },
    ])

    const userStated = await listConversationFactsForUi(userId, { factType: 'user_stated' })
    const sourceObserved = await listConversationFactsForUi(userId, { factType: 'source_observed' })

    expect(userStated).toHaveLength(2)
    expect(sourceObserved).toHaveLength(1)
    expect(sourceObserved[0].sourceName).toBe('garmin')
  })

  it('tom array → no-op (insertedCount=0)', async () => {
    const result = await persistConversationFacts([])
    expect(result.insertedCount).toBe(0)
  })

  it('deleteConversationFact soft-delete döljer från list', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'a', factType: 'user_stated' },
    ])

    const before = await listConversationFactsForUi(userId)
    expect(before).toHaveLength(1)
    const factId = before[0].id

    await deleteConversationFact({ factId, userId })

    const after = await listConversationFactsForUi(userId)
    expect(after).toHaveLength(0)
  })

  it('deleteConversationFact validerar userId (annan-user kan inte radera)', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId: userA,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId: userA, threadId: conversationId, turnId, factText: 'A:s fakta', factType: 'user_stated' },
    ])

    const factsA = await listConversationFactsForUi(userA)
    expect(factsA).toHaveLength(1)
    const factId = factsA[0].id

    // Försök radera som B
    await deleteConversationFact({ factId, userId: userB })

    // A:s fakta är fortfarande kvar
    const stillThere = await listConversationFactsForUi(userA)
    expect(stillThere).toHaveLength(1)
  })

  it('FK CASCADE: deleteUserAccount raderar conversation_facts', async () => {
    const userId = await seedUser(mockDb.current!)
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'a', factType: 'user_stated' },
    ])

    await deleteUserAccount(userId)

    // mem.public.query direct — listConversationFactsForUi kräver userId
    // som inte längre finns. Använd raw för audit.
    const rows = mockDb.current!.mem.public.query(
      `SELECT count(*)::int as n FROM "conversation_fact" WHERE "user_id" = '${userId}'`,
    )
    expect((rows.rows[0] as { n: number }).n).toBe(0)
  })

  it('per-user isolation i listConversationFactsForUi', async () => {
    const userA = await seedUser(mockDb.current!)
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const { conversationId: cA, turnId: tA } = await persistTurn({
      conversationId: null,
      userId: userA,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    const { conversationId: cB, turnId: tB } = await persistTurn({
      conversationId: null,
      userId: userB,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId: userA, threadId: cA, turnId: tA, factText: 'A', factType: 'user_stated' },
      { userId: userB, threadId: cB, turnId: tB, factText: 'B', factType: 'user_stated' },
    ])

    const aFacts = await listConversationFactsForUi(userA)
    expect(aFacts).toHaveLength(1)
    expect(aFacts[0].factText).toBe('A')
  })
})
