// REST-endpoints för iOS-konsumtion — integration via pg-mem.
//
// Verifierar att route-handlers svarar med rätt status + shape per
// .gsd/IOS_API_SPEC_2026-05-16.md. Auth mockad — handlers använder
// `await auth()` som returnerar session-fixture.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockDb, mockSession } = vi.hoisted(() => {
  return {
    mockDb: { current: null as null | ReturnType<typeof import('./helpers/db').createTestDb> },
    mockSession: { current: null as { user: { id: string; email: string } } | null },
  }
})

vi.mock('@/lib/db/index', () => ({
  get db() {
    if (!mockDb.current) throw new Error('Test-DB inte initierad')
    return mockDb.current.db
  },
}))

vi.mock('@/lib/auth/config', () => ({
  auth: async () => mockSession.current,
}))

// Mocka Sentry så vi inte triggar net-calls
vi.mock('@sentry/nextjs', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

// Mocka Selvra-protokoll-client för account-route
vi.mock('@/lib/protocol/client', () => ({
  getSubjectLifecycle: vi.fn(async () => null),
}))

import { createTestDb, seedUser } from './helpers/db'
import {
  createConversation,
  persistConversationFacts,
  persistMemoryFact,
  persistTurn,
} from '@/lib/db/conversation-queries'

import { GET as GetThreads, POST as PostThreads } from '@/app/api/threads/route'
import {
  DELETE as DeleteThread,
  GET as GetThread,
  PATCH as PatchThread,
} from '@/app/api/threads/[id]/route'
import { GET as GetTurns } from '@/app/api/threads/[id]/turns/route'
import { GET as GetMemoryFacts } from '@/app/api/memory/facts/route'
import { DELETE as DeleteMemoryFact } from '@/app/api/memory/facts/[id]/route'
import { GET as GetExplicit } from '@/app/api/memory/explicit/route'
import { DELETE as DeleteExplicit } from '@/app/api/memory/explicit/[id]/route'
import { GET as GetAccount } from '@/app/api/account/route'

beforeEach(() => {
  mockDb.current = createTestDb()
  mockSession.current = null
})

afterEach(() => {
  mockSession.current = null
})

async function setupUserSession() {
  const userId = await seedUser(mockDb.current!)
  mockSession.current = { user: { id: userId, email: `${userId}@test` } }
  return userId
}

describe('GET /api/threads', () => {
  it('401 utan session', async () => {
    const res = await GetThreads(new Request('http://x/api/threads'))
    expect(res.status).toBe(401)
  })

  it('200 + tom lista för ny user', async () => {
    await setupUserSession()
    const res = await GetThreads(new Request('http://x/api/threads'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.threads).toEqual([])
  })

  it('listar bara user-egna trådar', async () => {
    const userA = await setupUserSession()
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })

    await createConversation(userA)
    await createConversation(userA)
    await createConversation(userB)

    const res = await GetThreads(new Request('http://x/api/threads'))
    const body = await res.json()
    expect(body.threads).toHaveLength(2)
  })

  it('400 på invalid limit', async () => {
    await setupUserSession()
    const res = await GetThreads(new Request('http://x/api/threads?limit=9999'))
    expect(res.status).toBe(400)
  })

  it('archived=true inkluderar arkiverade', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)
    // Arkivera direkt via raw för enkelhet
    await mockDb.current!.raw(
      `UPDATE consumer_conversation SET archived_at = NOW() WHERE id = '${cid}'`,
    )

    const resDefault = await GetThreads(new Request('http://x/api/threads'))
    expect((await resDefault.json()).threads).toHaveLength(0)

    const resArchived = await GetThreads(new Request('http://x/api/threads?archived=true'))
    expect((await resArchived.json()).threads).toHaveLength(1)
  })
})

describe('POST /api/threads', () => {
  it('201 + ny tråd-id', async () => {
    await setupUserSession()
    const res = await PostThreads()
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeTruthy()
    expect(body.createdAt).toBeTruthy()
  })

  it('401 utan session', async () => {
    const res = await PostThreads()
    expect(res.status).toBe(401)
  })
})

describe('GET /api/threads/[id]', () => {
  it('200 för ägd tråd', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)

    const res = await GetThread(new Request('http://x'), {
      params: Promise.resolve({ id: cid }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(cid)
  })

  it('404 för annan-users tråd', async () => {
    const userA = await setupUserSession()
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cidB = await createConversation(userB)
    // userA's session är aktiv
    expect(userA).not.toBe(userB)

    const res = await GetThread(new Request('http://x'), {
      params: Promise.resolve({ id: cidB }),
    })
    expect(res.status).toBe(404)
  })

  it('404 för icke-existerande', async () => {
    await setupUserSession()
    const res = await GetThread(new Request('http://x'), {
      params: Promise.resolve({ id: 'no-exist' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/threads/[id]', () => {
  it('uppdaterar title', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)

    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Ny titel' }),
    })
    const res = await PatchThread(req, { params: Promise.resolve({ id: cid }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Ny titel')
  })

  it('400 på empty title', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)

    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ title: '' }),
    })
    const res = await PatchThread(req, { params: Promise.resolve({ id: cid }) })
    expect(res.status).toBe(400)
  })

  it('arkivera + un-arkivera via archivedAt', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)

    // Arkivera
    const archiveRes = await PatchThread(
      new Request('http://x', {
        method: 'PATCH',
        body: JSON.stringify({ archivedAt: new Date().toISOString() }),
      }),
      { params: Promise.resolve({ id: cid }) },
    )
    expect(archiveRes.status).toBe(200)
    const archived = await archiveRes.json()
    expect(archived.archivedAt).toBeTruthy()

    // Un-arkivera
    const unarchiveRes = await PatchThread(
      new Request('http://x', {
        method: 'PATCH',
        body: JSON.stringify({ archivedAt: null }),
      }),
      { params: Promise.resolve({ id: cid }) },
    )
    expect(unarchiveRes.status).toBe(200)
    const unarchived = await unarchiveRes.json()
    expect(unarchived.archivedAt).toBeNull()
  })
})

describe('DELETE /api/threads/[id]', () => {
  it('204 + tråd borta', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)

    const res = await DeleteThread(new Request('http://x'), {
      params: Promise.resolve({ id: cid }),
    })
    expect(res.status).toBe(204)

    // Verifiera den faktiskt är borta
    const getRes = await GetThread(new Request('http://x'), {
      params: Promise.resolve({ id: cid }),
    })
    expect(getRes.status).toBe(404)
  })

  it('404 för annan-users tråd (inte stulen-delete)', async () => {
    await setupUserSession()
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cidB = await createConversation(userB)

    const res = await DeleteThread(new Request('http://x'), {
      params: Promise.resolve({ id: cidB }),
    })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/threads/[id]/turns', () => {
  it('listar turns kronologiskt', async () => {
    const userId = await setupUserSession()
    const cid = await createConversation(userId)
    for (const t of ['1', '2', '3']) {
      await persistTurn({
        conversationId: cid,
        userId,
        userText: t,
        selvraText: `s${t}`,
        sourcesConsulted: null,
        llmProvider: 'mistral',
      })
    }

    const res = await GetTurns(new Request('http://x'), {
      params: Promise.resolve({ id: cid }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.turns).toHaveLength(3)
    expect(body.turns.map((t: { userText: string }) => t.userText)).toEqual(['1', '2', '3'])
  })

  it('404 för annan-users tråd', async () => {
    await setupUserSession()
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    const cidB = await createConversation(userB)

    const res = await GetTurns(new Request('http://x'), {
      params: Promise.resolve({ id: cidB }),
    })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/memory/facts', () => {
  it('listar facts med filter', async () => {
    const userId = await setupUserSession()
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'A', factType: 'user_stated' },
      { userId, threadId: conversationId, turnId, factText: 'B', factType: 'source_observed', sourceName: 'garmin' },
    ])

    const allRes = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    expect((await allRes.json()).facts).toHaveLength(2)

    const userStatedRes = await GetMemoryFacts(
      new Request('http://x/api/memory/facts?factType=user_stated'),
    )
    expect((await userStatedRes.json()).facts).toHaveLength(1)

    const sourceRes = await GetMemoryFacts(
      new Request('http://x/api/memory/facts?sourceName=garmin'),
    )
    expect((await sourceRes.json()).facts).toHaveLength(1)
  })

  it('400 på invalid factType', async () => {
    await setupUserSession()
    const res = await GetMemoryFacts(new Request('http://x/api/memory/facts?factType=bogus'))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/memory/facts/[id]', () => {
  it('soft-deletar fact', async () => {
    const userId = await setupUserSession()
    const { conversationId, turnId } = await persistTurn({
      conversationId: null,
      userId,
      userText: 'x',
      selvraText: 'y',
      sourcesConsulted: null,
      llmProvider: 'mistral',
    })
    await persistConversationFacts([
      { userId, threadId: conversationId, turnId, factText: 'A', factType: 'user_stated' },
    ])

    const beforeRes = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    const beforeBody = await beforeRes.json()
    expect(beforeBody.facts).toHaveLength(1)
    const factId = beforeBody.facts[0].id

    const delRes = await DeleteMemoryFact(new Request('http://x'), {
      params: Promise.resolve({ id: factId }),
    })
    expect(delRes.status).toBe(204)

    const afterRes = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    expect((await afterRes.json()).facts).toHaveLength(0)
  })
})

describe('GET /api/memory/explicit', () => {
  it('listar explicita minnen', async () => {
    const userId = await setupUserSession()
    await persistMemoryFact({ userId, factText: 'jag är T1-diabetiker' })

    const res = await GetExplicit()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.facts).toHaveLength(1)
    expect(body.facts[0].factText).toBe('jag är T1-diabetiker')
  })
})

describe('DELETE /api/memory/explicit/[id]', () => {
  it('soft-deletar explicit fakta', async () => {
    const userId = await setupUserSession()
    await persistMemoryFact({ userId, factText: 'fakta' })
    const listRes = await GetExplicit()
    const factId = (await listRes.json()).facts[0].id

    const delRes = await DeleteExplicit(new Request('http://x'), {
      params: Promise.resolve({ id: factId }),
    })
    expect(delRes.status).toBe(204)

    const afterRes = await GetExplicit()
    expect((await afterRes.json()).facts).toHaveLength(0)
  })
})

describe('GET /api/account', () => {
  it('200 + user-info', async () => {
    const userId = await setupUserSession()
    const res = await GetAccount()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.id).toBe(userId)
    expect(body.lifecycle.status).toBe('unknown') // Mockad till null
  })

  it('401 utan session', async () => {
    const res = await GetAccount()
    expect(res.status).toBe(401)
  })
})
