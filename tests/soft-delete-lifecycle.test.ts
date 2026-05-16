// Soft-delete-lifecycle-tester. Verifierar att:
// - softDeleteUserAccount sätter deletedAt + invaliderar sessions
// - getUserSoftDeleteStatus returnerar korrekt status
// - restoreUserAccount fungerar inom fönster och throw:ar utanför
// - hardDeleteExpiredUsers tar bara users över cutoff
// - hardDeleteExpiredConversationFacts + memoryFacts plockar rätt rader

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

import { createTestDb, seedUser } from './helpers/db'
import {
  createConversation,
  getUserSoftDeleteStatus,
  hardDeleteExpiredConversationFacts,
  hardDeleteExpiredMemoryFacts,
  hardDeleteExpiredUsers,
  persistConversationFacts,
  persistMemoryFact,
  persistTurn,
  restoreUserAccount,
  softDeleteUserAccount,
} from '@/lib/db/conversation-queries'

beforeEach(() => {
  mockDb.current = createTestDb()
})

afterEach(() => {
  mockDb.current = null
})

describe('softDeleteUserAccount', () => {
  it('sätter deletedAt på user-raden', async () => {
    const userId = await seedUser(mockDb.current!)
    await softDeleteUserAccount(userId)

    const status = await getUserSoftDeleteStatus(userId)
    expect(status).not.toBeNull()
    expect(status!.deletedAt).toBeInstanceOf(Date)
    expect(status!.daysAgo).toBe(0)
  })

  it('invaliderar aktiva sessions', async () => {
    const userId = await seedUser(mockDb.current!)
    // Skapa fake session via raw SQL
    await mockDb.current!.raw(`
      INSERT INTO "session" ("sessionToken", "userId", "expires")
      VALUES ('test-token-1', '${userId}', NOW() + INTERVAL '7 days');
    `)

    await softDeleteUserAccount(userId)

    const remaining = mockDb.current!.mem.public.query(
      `SELECT * FROM "session" WHERE "userId" = '${userId}'`,
    )
    expect(remaining.rows).toHaveLength(0)
  })

  it('returnerar null för icke-soft-deleted user', async () => {
    const userId = await seedUser(mockDb.current!)
    const status = await getUserSoftDeleteStatus(userId)
    expect(status).toBeNull()
  })
})

describe('restoreUserAccount', () => {
  it('clear:ar deletedAt vid restore inom fönster', async () => {
    const userId = await seedUser(mockDb.current!)
    await softDeleteUserAccount(userId)

    await restoreUserAccount(userId)
    const status = await getUserSoftDeleteStatus(userId)
    expect(status).toBeNull()
  })

  it('throw vid restore av icke-soft-deleted user', async () => {
    const userId = await seedUser(mockDb.current!)
    await expect(restoreUserAccount(userId)).rejects.toThrow(/inte soft-deleted/)
  })

  it('throw vid restore utanför 30-dagars-fönster', async () => {
    const userId = await seedUser(mockDb.current!)
    // Sätt deletedAt = 31 dagar sedan via raw SQL
    await mockDb.current!.raw(`
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '31 days' WHERE "id" = '${userId}'
    `)

    await expect(restoreUserAccount(userId)).rejects.toThrow(/utanför.*fönster/)
  })

  it('respekterar custom windowDays', async () => {
    const userId = await seedUser(mockDb.current!)
    await mockDb.current!.raw(`
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '5 days' WHERE "id" = '${userId}'
    `)

    // Default 30d → OK
    await restoreUserAccount(userId)

    // Re-soft-delete + 5d kvar i fönster, men explicit 3d-window → throw
    await softDeleteUserAccount(userId)
    await mockDb.current!.raw(`
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '5 days' WHERE "id" = '${userId}'
    `)
    await expect(restoreUserAccount(userId, { windowDays: 3 })).rejects.toThrow(
      /utanför.*fönster/,
    )
  })
})

describe('hardDeleteExpiredUsers', () => {
  it('tar bara users där deletedAt < cutoff', async () => {
    const fresh = await seedUser(mockDb.current!)
    const old = await seedUser(mockDb.current!)
    const active = await seedUser(mockDb.current!)

    await mockDb.current!.raw(`
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '5 days' WHERE "id" = '${fresh}';
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '40 days' WHERE "id" = '${old}';
    `)

    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    const count = await hardDeleteExpiredUsers({ cutoff })
    expect(count).toBe(1)

    // Fresh + active finns kvar, old är borta
    const remaining = mockDb.current!.mem.public.query(
      `SELECT "id" FROM "user" ORDER BY "id"`,
    )
    const remainingIds = remaining.rows.map((r) => (r as { id: string }).id)
    expect(remainingIds).toContain(fresh)
    expect(remainingIds).toContain(active)
    expect(remainingIds).not.toContain(old)
  })

  it('CASCADE plockar conversation + facts vid user-delete', async () => {
    const userId = await seedUser(mockDb.current!)
    const conversationId = await createConversation(userId)
    const { turnId } = await persistTurn({
      conversationId,
      userId,
      userText: 'hej',
      selvraText: 'hej',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      {
        userId,
        threadId: conversationId,
        turnId,
        factText: 'test fact',
        factType: 'user_stated',
        sourceName: null,
      },
    ])

    await mockDb.current!.raw(`
      UPDATE "user" SET "deleted_at" = NOW() - INTERVAL '40 days' WHERE "id" = '${userId}'
    `)
    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    await hardDeleteExpiredUsers({ cutoff })

    const conversations = mockDb.current!.mem.public.query(
      `SELECT * FROM "consumer_conversation" WHERE "user_id" = '${userId}'`,
    )
    const facts = mockDb.current!.mem.public.query(
      `SELECT * FROM "conversation_fact" WHERE "user_id" = '${userId}'`,
    )
    expect(conversations.rows).toHaveLength(0)
    expect(facts.rows).toHaveLength(0)
  })

  it('rör inte aktiva (icke-soft-deleted) users', async () => {
    // Seed:ar en aktiv user för att verifiera att hardDelete inte rör hen.
    // userId behövs inte för assertion — bara att raden existerar.
    await seedUser(mockDb.current!)
    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    const count = await hardDeleteExpiredUsers({ cutoff })
    expect(count).toBe(0)
  })
})

describe('hardDeleteExpiredConversationFacts', () => {
  it('tar bara facts där userDeletedAt < cutoff', async () => {
    const userId = await seedUser(mockDb.current!)
    const conversationId = await createConversation(userId)
    const { turnId } = await persistTurn({
      conversationId,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })

    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'a', factType: 'user_stated', sourceName: null },
      { userId, threadId: conversationId, turnId, factText: 'b', factType: 'user_stated', sourceName: null },
      { userId, threadId: conversationId, turnId, factText: 'c', factType: 'user_stated', sourceName: null },
    ])

    // Mark två som soft-deleted med olika ålder
    await mockDb.current!.raw(`
      UPDATE "conversation_fact" SET "user_deleted_at" = NOW() - INTERVAL '5 days' WHERE "fact_text" = 'a';
      UPDATE "conversation_fact" SET "user_deleted_at" = NOW() - INTERVAL '40 days' WHERE "fact_text" = 'b';
    `)

    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    const count = await hardDeleteExpiredConversationFacts({ cutoff })
    expect(count).toBe(1)

    const remaining = mockDb.current!.mem.public.query(
      `SELECT "fact_text" FROM "conversation_fact" ORDER BY "fact_text"`,
    )
    const texts = remaining.rows.map((r) => (r as { fact_text: string }).fact_text)
    expect(texts).toEqual(['a', 'c'])
  })
})

describe('hardDeleteExpiredMemoryFacts', () => {
  it('tar bara facts där redactedAt < cutoff', async () => {
    const userId = await seedUser(mockDb.current!)

    const id1 = await persistMemoryFact({ userId, factText: 'mem-a' })
    const id2 = await persistMemoryFact({ userId, factText: 'mem-b' })
    await persistMemoryFact({ userId, factText: 'mem-c' })

    await mockDb.current!.raw(`
      UPDATE "conversation_memory_fact" SET "redacted_at" = NOW() - INTERVAL '5 days' WHERE "id" = '${id1}';
      UPDATE "conversation_memory_fact" SET "redacted_at" = NOW() - INTERVAL '40 days' WHERE "id" = '${id2}';
    `)

    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    const count = await hardDeleteExpiredMemoryFacts({ cutoff })
    expect(count).toBe(1)

    const remaining = mockDb.current!.mem.public.query(
      `SELECT "fact_text" FROM "conversation_memory_fact" ORDER BY "fact_text"`,
    )
    const texts = remaining.rows.map((r) => (r as { fact_text: string }).fact_text)
    expect(texts).toEqual(['mem-a', 'mem-c'])
  })
})
