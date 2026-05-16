// POST /api/sources/manual-import — integration via pg-mem.
//
// Verifierar:
//   - Auth-gate (401 utan session)
//   - Validation-errors (sourceName-format, antal facts, value-längd, factType)
//   - Lyckad import skapar thread + turn + facts
//   - Imported facts dyker upp i GET /api/memory/facts filtered by source
//   - Konstitutionellt: ingen LLM-validation behövs (input är user-provided)

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

vi.mock('@sentry/nextjs', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import { createTestDb, seedUser } from './helpers/db'
import { POST as PostImport } from '@/app/api/sources/manual-import/route'
import { GET as GetMemoryFacts } from '@/app/api/memory/facts/route'

beforeEach(() => {
  mockDb.current = createTestDb()
  mockSession.current = null
})

afterEach(() => {
  mockSession.current = null
})

function makeRequest(body: unknown): Request {
  return new Request('http://x/api/sources/manual-import', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function setupUserSession() {
  const userId = await seedUser(mockDb.current!)
  mockSession.current = { user: { id: userId, email: `${userId}@test` } }
  return userId
}

describe('POST /api/sources/manual-import — auth', () => {
  it('401 utan session', async () => {
    const res = await PostImport(
      makeRequest({ sourceName: 'manual:test', facts: [{ factType: 'user_stated', value: 'x' }] }),
    )
    expect(res.status).toBe(401)
  })
})

describe('POST /api/sources/manual-import — validation', () => {
  beforeEach(async () => {
    await setupUserSession()
  })

  it('400 om sourceName saknas', async () => {
    const res = await PostImport(makeRequest({ facts: [{ factType: 'user_stated', value: 'x' }] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toContain('sourceName')
  })

  it('400 om sourceName saknar manual:-prefix', async () => {
    const res = await PostImport(
      makeRequest({ sourceName: 'dexcom', facts: [{ factType: 'user_stated', value: 'x' }] }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toContain('manual:')
  })

  it('400 om sourceName har stor bokstav', async () => {
    const res = await PostImport(
      makeRequest({ sourceName: 'manual:Dexcom', facts: [{ factType: 'user_stated', value: 'x' }] }),
    )
    expect(res.status).toBe(400)
  })

  it('400 om sourceName har whitespace', async () => {
    const res = await PostImport(
      makeRequest({ sourceName: 'manual:my source', facts: [{ factType: 'user_stated', value: 'x' }] }),
    )
    expect(res.status).toBe(400)
  })

  it('accepterar bindestreck och underscore i sourceName', async () => {
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:garmin_sleep-baseline',
        facts: [{ factType: 'user_stated', value: 'x' }],
      }),
    )
    expect(res.status).toBe(201)
  })

  it('400 om facts saknas eller är tom', async () => {
    const res1 = await PostImport(makeRequest({ sourceName: 'manual:test' }))
    expect(res1.status).toBe(400)
    const res2 = await PostImport(makeRequest({ sourceName: 'manual:test', facts: [] }))
    expect(res2.status).toBe(400)
  })

  it('400 om över 100 facts', async () => {
    const facts = Array.from({ length: 101 }, (_, i) => ({
      factType: 'user_stated',
      value: `fact ${i}`,
    }))
    const res = await PostImport(makeRequest({ sourceName: 'manual:test', facts }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.message).toContain('100')
  })

  it('accepterar exakt 100 facts', async () => {
    const facts = Array.from({ length: 100 }, (_, i) => ({
      factType: 'user_stated',
      value: `fact ${i}`,
    }))
    const res = await PostImport(makeRequest({ sourceName: 'manual:test', facts }))
    expect(res.status).toBe(201)
  })

  it('400 om factType är okänd', async () => {
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:test',
        facts: [{ factType: 'bogus', value: 'x' }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('400 om value är tom string', async () => {
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:test',
        facts: [{ factType: 'user_stated', value: '' }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('400 om value över 2000 chars', async () => {
    const longValue = 'x'.repeat(2001)
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:test',
        facts: [{ factType: 'user_stated', value: longValue }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('400 om observedAt är invalid', async () => {
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:test',
        facts: [{ factType: 'user_stated', value: 'x', observedAt: 'not-a-date' }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('400 om metadata är array istället för objekt', async () => {
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:test',
        facts: [{ factType: 'user_stated', value: 'x', metadata: ['nope'] }],
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/sources/manual-import — lyckad import', () => {
  it('201 + returnerar imported + factIds', async () => {
    await setupUserSession()
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:dexcom',
        facts: [
          { factType: 'source_observed', value: 'glucose 5.4 mmol/L kl 08:00' },
          { factType: 'source_observed', value: 'glucose 7.2 mmol/L kl 12:00' },
        ],
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.imported).toBe(2)
    expect(body.factIds).toHaveLength(2)
    expect(body.threadId).toBeTruthy()
    expect(body.turnId).toBeTruthy()
  })

  it('observedAt + metadata flätas in i factText', async () => {
    const userId = await setupUserSession()
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:garmin',
        facts: [
          {
            factType: 'source_observed',
            value: 'sömn 5h 40min',
            observedAt: '2026-05-15T22:00:00Z',
            metadata: { quality: 'low' },
          },
        ],
      }),
    )
    expect(res.status).toBe(201)
    expect(userId).toBeTruthy() // bara så lint inte klagar
    // Verifiera factText via memory/facts-endpoint
    const factsRes = await GetMemoryFacts(
      new Request('http://x/api/memory/facts?sourceName=manual:garmin'),
    )
    const facts = (await factsRes.json()).facts
    expect(facts).toHaveLength(1)
    expect(facts[0].factText).toContain('2026-05-15T22:00:00Z')
    expect(facts[0].factText).toContain('sömn 5h 40min')
    expect(facts[0].factText).toContain('"quality":"low"')
  })

  it('imported facts dyker upp i GET /api/memory/facts filtered by source', async () => {
    await setupUserSession()
    await PostImport(
      makeRequest({
        sourceName: 'manual:journal',
        facts: [
          { factType: 'user_stated', value: 'idag känns det överväldigat' },
          { factType: 'user_stated', value: 'sömnen var dålig' },
        ],
      }),
    )
    await PostImport(
      makeRequest({
        sourceName: 'manual:dexcom',
        facts: [{ factType: 'source_observed', value: '5.4 mmol/L' }],
      }),
    )

    // Filter på manual:journal
    const journalRes = await GetMemoryFacts(
      new Request('http://x/api/memory/facts?sourceName=manual:journal'),
    )
    const journalFacts = (await journalRes.json()).facts
    expect(journalFacts).toHaveLength(2)
    expect(journalFacts.every((f: { sourceName: string }) => f.sourceName === 'manual:journal')).toBe(true)

    // Filter på manual:dexcom
    const dexcomRes = await GetMemoryFacts(
      new Request('http://x/api/memory/facts?sourceName=manual:dexcom'),
    )
    const dexcomFacts = (await dexcomRes.json()).facts
    expect(dexcomFacts).toHaveLength(1)
    expect(dexcomFacts[0].factType).toBe('source_observed')

    // Utan filter: alla 3
    const allRes = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    expect((await allRes.json()).facts).toHaveLength(3)
  })

  it('user_stated facts behåller sourceName för spårbarhet', async () => {
    await setupUserSession()
    await PostImport(
      makeRequest({
        sourceName: 'manual:journal',
        facts: [{ factType: 'user_stated', value: 'jag är T1-diabetiker' }],
      }),
    )
    const res = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    const facts = (await res.json()).facts
    expect(facts[0].factType).toBe('user_stated')
    expect(facts[0].sourceName).toBe('manual:journal')
  })

  it('per-user-isolation: annan user ser inte importerade facts', async () => {
    const userA = await setupUserSession()
    await PostImport(
      makeRequest({
        sourceName: 'manual:journal',
        facts: [{ factType: 'user_stated', value: 'A:s fakta' }],
      }),
    )

    // Byt session till userB
    const userB = await seedUser(mockDb.current!, { email: 'b@test' })
    mockSession.current = { user: { id: userB, email: 'b@test' } }

    const res = await GetMemoryFacts(new Request('http://x/api/memory/facts'))
    expect((await res.json()).facts).toHaveLength(0)
    expect(userA).not.toBe(userB)
  })
})

describe('POST /api/sources/manual-import — konstitutionellt', () => {
  it('imported user_stated-text går igenom utan LLM-validation (input ej output)', async () => {
    await setupUserSession()
    // Text som SKULLE bryta consumer-lock-validate om det var LLM-output
    // (t.ex. "du borde", "jag älskar dig"). Manual import bypassar inte
    // lock-validate eftersom den endast applies på LLM-output.
    const res = await PostImport(
      makeRequest({
        sourceName: 'manual:journal',
        facts: [
          { factType: 'user_stated', value: 'jag känner att jag borde sova mer' },
          { factType: 'user_stated', value: 'min mamma sa att hon älskar mig' },
        ],
      }),
    )
    expect(res.status).toBe(201)
    // Korrekt — användarens egna ord ska bevaras ord-för-ord, det är
    // poängen med user_stated. Lock-validate skyddar mot AI-manipulation,
    // inte mot vad användaren själv sagt/skrivit.
  })
})
