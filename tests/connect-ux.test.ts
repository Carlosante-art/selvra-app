// Tests för UX-utvidgningar av connect-flow:
// - pollConnectionAction filter-logik (since-baserad audit-hit-detection)
// - Konstitutionella checks på copy i ConnectionTest / AccessSummary /
//   AuditLogPreview (käll-attribuering, ingen coach-ton, ingen FOMO)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}))

const mockGetConnectionAudit = vi.fn()
const mockGetSnapshot = vi.fn()
const mockGetDivergenceCount = vi.fn()
vi.mock('@/lib/protocol/client', () => ({
  getConnectionAudit: (...args: unknown[]) => mockGetConnectionAudit(...args),
  getSnapshot: () => mockGetSnapshot(),
  getDivergenceCount: () => mockGetDivergenceCount(),
  issueConsumerToken: vi.fn(),
  listConnections: vi.fn(),
  revokeConnection: vi.fn(),
}))

vi.mock('@/lib/logging', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

import {
  getAccessSummaryAction,
  getConnectionAuditAction,
  pollConnectionAction,
} from '@/lib/connect/actions'

const VALID_SESSION = { user: { id: 'user-123' } }

beforeEach(() => {
  mockAuth.mockReset()
  mockGetConnectionAudit.mockReset()
  mockGetSnapshot.mockReset()
  mockGetDivergenceCount.mockReset()
  mockAuth.mockResolvedValue(VALID_SESSION)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pollConnectionAction', () => {
  const sourceAi = 'f208ffdb-5445-5d4e-93be-c9bac0030571'
  const sinceIso = '2026-05-16T12:00:00.000Z'

  it('returnerar hit: null när inga entries finns', async () => {
    mockGetConnectionAudit.mockResolvedValue({ items: [], total_count: 0 })
    const result = await pollConnectionAction(sourceAi, sinceIso)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.hit).toBeNull()
  })

  it('returnerar hit: null när alla entries är före sinceIso', async () => {
    mockGetConnectionAudit.mockResolvedValue({
      items: [
        {
          source_ai_id: sourceAi,
          resource_path: 'query_representation',
          response_status: 'ok',
          duration_ms: 45,
          timestamp: '2026-05-16T11:59:00.000Z',
        },
      ],
      total_count: 1,
    })
    const result = await pollConnectionAction(sourceAi, sinceIso)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.hit).toBeNull()
  })

  it('returnerar första entry efter sinceIso', async () => {
    mockGetConnectionAudit.mockResolvedValue({
      items: [
        // Senare först (audit-endpoint returnerar DESC)
        {
          source_ai_id: sourceAi,
          resource_path: 'query_representation',
          response_status: 'ok',
          duration_ms: 45,
          timestamp: '2026-05-16T12:00:30.000Z',
        },
        {
          source_ai_id: sourceAi,
          resource_path: 'initialize',
          response_status: 'ok',
          duration_ms: 12,
          timestamp: '2026-05-16T11:59:00.000Z',
        },
      ],
      total_count: 2,
    })
    const result = await pollConnectionAction(sourceAi, sinceIso)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.hit).not.toBeNull()
      expect(result.hit?.resource_path).toBe('query_representation')
    }
  })

  it('auth-gate: returnerar ok:false när session saknas', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await pollConnectionAction(sourceAi, sinceIso)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Inloggning/)
  })

  it('returnerar ok:false vid ogiltig timestamp', async () => {
    const result = await pollConnectionAction(sourceAi, 'inte-en-iso-string')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Ogiltig/)
  })

  it('returnerar ok:false vid protocol-fel', async () => {
    mockGetConnectionAudit.mockRejectedValue(new Error('500 Internal'))
    const result = await pollConnectionAction(sourceAi, sinceIso)
    expect(result.ok).toBe(false)
  })
})

describe('getConnectionAuditAction', () => {
  it('mappar items + total korrekt', async () => {
    mockGetConnectionAudit.mockResolvedValue({
      items: [
        {
          source_ai_id: 'x',
          resource_path: 'query_representation',
          response_status: 'ok',
          duration_ms: 45,
          timestamp: '2026-05-16T12:00:00.000Z',
        },
      ],
      total_count: 7,
      offset: 0,
      has_more: false,
    })
    const result = await getConnectionAuditAction('x', { limit: 10 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(7)
      expect(result.offset).toBe(0)
      expect(result.hasMore).toBe(false)
    }
  })

  it('respekterar limit + offset-arg', async () => {
    mockGetConnectionAudit.mockResolvedValue({
      items: [],
      total_count: 0,
      offset: 50,
      has_more: false,
    })
    await getConnectionAuditAction('x', { limit: 5, offset: 50 })
    expect(mockGetConnectionAudit).toHaveBeenCalledWith('x', {
      limit: 5,
      offset: 50,
    })
  })

  it('hasMore=true vid paginerings-fönster med fler entries', async () => {
    mockGetConnectionAudit.mockResolvedValue({
      items: new Array(50).fill({
        source_ai_id: 'x',
        resource_path: 'query_representation',
        response_status: 'ok',
        duration_ms: 10,
        timestamp: '2026-05-16T12:00:00.000Z',
      }),
      total_count: 200,
      offset: 0,
      has_more: true,
    })
    const result = await getConnectionAuditAction('x', { limit: 50 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.hasMore).toBe(true)
      expect(result.total).toBe(200)
    }
  })
})

describe('getAccessSummaryAction', () => {
  const snapshotStub = {
    subject_id: 's',
    tenant_id: 't',
    items: [],
    next_cursor: null,
    total_count: 42,
    limit: 100,
  }

  it('mappar snapshot.total_count + divergence-count', async () => {
    mockGetSnapshot.mockResolvedValue(snapshotStub)
    mockGetDivergenceCount.mockResolvedValue({ subject_id: 's', count: 3 })
    const result = await getAccessSummaryAction()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.summary.factCount).toBe(42)
      expect(result.summary.divergenceCount).toBe(3)
      expect(result.summary.provenanceAvailable).toBe(true)
    }
  })

  it('divergence-count null som best-effort fallback om endpoint ej deployad', async () => {
    mockGetSnapshot.mockResolvedValue(snapshotStub)
    mockGetDivergenceCount.mockRejectedValue(new Error('404 Not Found'))
    const result = await getAccessSummaryAction()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.summary.factCount).toBe(42)
      expect(result.summary.divergenceCount).toBeNull()
    }
  })

  it('failar om snapshot misslyckas (måste-fält)', async () => {
    mockGetSnapshot.mockRejectedValue(new Error('500 Internal'))
    mockGetDivergenceCount.mockResolvedValue({ subject_id: 's', count: 0 })
    const result = await getAccessSummaryAction()
    expect(result.ok).toBe(false)
  })
})

describe('konstitutionella checks på UX-copy', () => {
  // Läs komponent-källor som text och regex-matcha mot förbjudna mönster.
  // Inte ideal men räcker innan vi har full RTL-rendering-tester.
  const files = [
    'src/components/connect/connection-test.tsx',
    'src/components/connect/access-summary.tsx',
    'src/components/connect/audit-log-preview.tsx',
  ].map((p) => ({
    path: p,
    content: readFileSync(resolve(process.cwd(), p), 'utf-8'),
  }))

  const forbiddenInCopy = [
    { re: /\bAnslut nu\b/, why: 'FOMO-imperativ — använd "när du är redo"' },
    { re: /\bpowered by\b/i, why: 'inga varumärkes-promotion-strängar' },
    { re: /\bdin assistent\b/i, why: 'personality-claim om klient-AI:n' },
    { re: /\bkraftfull\b/i, why: 'adjektiv om upplevelse — beskriv mekanik' },
    { re: /\bmagisk[at]?\b/i, why: 'inga magic-words' },
    { re: /\bdu borde\b/i, why: 'coach-ton — inga prescriptions' },
    { re: /\bvi saknar dig\b/i, why: 'engagement-bait — bug per AGENTS.md' },
  ]

  for (const file of files) {
    for (const { re, why } of forbiddenInCopy) {
      it(`${file.path}: ${why}`, () => {
        expect(file.content).not.toMatch(re)
      })
    }
  }

  it('AccessSummary innehåller käll-attribuerad summary-text', () => {
    const text =
      files.find((f) => f.path.endsWith('access-summary.tsx'))?.content ?? ''
    // Beskriver SCOPE, inte upplevelse: "Vad anslutna system får läsa"
    expect(text).toMatch(/Vad anslutna system/)
  })

  it('AuditLogPreview är käll-attribuerad — "X anropade Y"', () => {
    const text =
      files.find((f) => f.path.endsWith('audit-log-preview.tsx'))?.content ?? ''
    expect(text).toMatch(/anropade/)
  })
})
