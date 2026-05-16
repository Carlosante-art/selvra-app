'use server'

/**
 * Server Actions för connect-flow. Auth-gated via session-check innan
 * anrop till selvra-protocol.
 *
 * Säkerhet:
 * - SELVRA_TOKEN_ISSUER_SECRET stannar server-side (Server Actions)
 * - Token returneras till klient EN gång via action-result
 * - Klient ansvarar för att inte persistera (UI rensar efter copy)
 */

import * as Sentry from '@sentry/nextjs'

import { auth } from '@/lib/auth/config'
import {
  getConnectionAudit,
  getDivergenceCount,
  getSnapshot,
  issueConsumerToken,
  listConnections,
  revokeConnection,
  type AuditEntry,
  type ConsumerClientName,
  type IssueTokenResult,
  type ConnectionItem,
} from '@/lib/protocol/client'
import { logger } from '@/lib/logging'

import { getClientById } from './clients'

export type IssueTokenActionResult =
  | { ok: true; token: IssueTokenResult }
  | { ok: false; error: string }

export async function issueTokenAction(
  clientName: ConsumerClientName,
): Promise<IssueTokenActionResult> {
  const log = logger.child({ module: 'connect/actions/issue' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }
  Sentry.setUser({ id: session.user.id })

  // Validera client-namn finns i whitelist
  if (!getClientById(clientName)) {
    return { ok: false, error: `Okänd klient: ${clientName}` }
  }

  try {
    const result = await issueConsumerToken({ clientName })
    log.info('consumer_token_issued', {
      userId: session.user.id,
      clientName,
      jti: result.jti,
      expires_at: result.expires_at,
    })
    return { ok: true, token: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('consumer_token_issue_failed', {
      userId: session.user.id,
      clientName,
      error: message,
    })
    Sentry.captureException(err)
    return { ok: false, error: message.slice(0, 200) }
  }
}

export type ListConnectionsResult =
  | { ok: true; items: ConnectionItem[] }
  | { ok: false; error: string }

export async function listConnectionsAction(): Promise<ListConnectionsResult> {
  const log = logger.child({ module: 'connect/actions/list' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }

  try {
    const result = await listConnections()
    return { ok: true, items: result.items }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('list_connections_failed', {
      userId: session.user.id,
      error: message,
    })
    return { ok: false, error: message.slice(0, 200) }
  }
}

export type RevokeConnectionResult =
  | { ok: true; revokedCount: number }
  | { ok: false; error: string }

/**
 * Polla audit-logg för att hitta första anrop från source_ai_id efter
 * en given timestamp. Används av ConnectionTest-komponenten för att
 * verifiera att klient verkligen anslutit efter token-gen.
 *
 * Returnerar { ok: true, hit: AuditEntry } om hit hittas, { ok: true, hit: null }
 * om inga nya entries finns ännu (caller pollar igen).
 *
 * Notera: sinceIso filtreras klient-sidan här (audit-endpoint stödjer
 * inte ?since=). För typisk anslutnings-test är 20 senaste entries mer
 * än tillräckligt — verklig multi-tusen-anrop-volym kommer inte hända
 * inom 60s test-fönster.
 */
export type PollConnectionResult =
  | { ok: true; hit: AuditEntry | null }
  | { ok: false; error: string }

export async function pollConnectionAction(
  sourceAiId: string,
  sinceIso: string,
): Promise<PollConnectionResult> {
  const log = logger.child({ module: 'connect/actions/poll' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }

  try {
    const since = new Date(sinceIso).getTime()
    if (Number.isNaN(since)) {
      return { ok: false, error: 'Ogiltig timestamp' }
    }
    const result = await getConnectionAudit(sourceAiId, 20)
    const hit =
      result.items.find((entry) => {
        const ts = new Date(entry.timestamp).getTime()
        return !Number.isNaN(ts) && ts >= since
      }) ?? null
    return { ok: true, hit }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('poll_connection_failed', {
      userId: session.user.id,
      sourceAiId,
      error: message,
    })
    return { ok: false, error: message.slice(0, 200) }
  }
}

/**
 * Hämta senaste N audit-entries för en source_ai_id. Används av
 * AuditLogPreview-komponenten på /connections.
 */
export type GetConnectionAuditResult =
  | { ok: true; items: AuditEntry[]; total: number }
  | { ok: false; error: string }

export async function getConnectionAuditAction(
  sourceAiId: string,
  limit = 10,
): Promise<GetConnectionAuditResult> {
  const log = logger.child({ module: 'connect/actions/audit' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }

  try {
    const result = await getConnectionAudit(sourceAiId, limit)
    return { ok: true, items: result.items, total: result.total_count }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('get_connection_audit_failed', {
      userId: session.user.id,
      sourceAiId,
      error: message,
    })
    return { ok: false, error: message.slice(0, 200) }
  }
}

/**
 * Hämta access-summary för anslutna systems "Vad får de se"-vy.
 *
 * v1 returnerar bara snapshot-count (från befintlig snapshot-endpoint).
 * Divergens-count + provenance-count kräver protocol-side endpoints
 * (eller events-aggregation) som inte finns än — markeras null i v1.
 */
export type AccessSummary = {
  factCount: number
  divergenceCount: number | null
  provenanceAvailable: boolean
}

export type GetAccessSummaryResult =
  | { ok: true; summary: AccessSummary }
  | { ok: false; error: string }

export async function getAccessSummaryAction(): Promise<GetAccessSummaryResult> {
  const log = logger.child({ module: 'connect/actions/summary' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }

  try {
    // Parallella fetches — count-endpoint är O(1) så ingen extra latency oro
    const [snapshot, divergence] = await Promise.allSettled([
      getSnapshot(),
      getDivergenceCount(),
    ])

    if (snapshot.status === 'rejected') {
      throw snapshot.reason instanceof Error
        ? snapshot.reason
        : new Error(String(snapshot.reason))
    }

    // Divergence-count är best-effort — om endpoint ej deployad än, fall
    // tillbaka till null (UI visar "tillgängliga" utan exakt antal).
    const divergenceCount =
      divergence.status === 'fulfilled' ? divergence.value.count : null

    return {
      ok: true,
      summary: {
        factCount: snapshot.value.total_count,
        divergenceCount,
        provenanceAvailable: true,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('get_access_summary_failed', {
      userId: session.user.id,
      error: message,
    })
    return { ok: false, error: message.slice(0, 200) }
  }
}

export async function revokeConnectionAction(
  sourceAiId: string,
): Promise<RevokeConnectionResult> {
  const log = logger.child({ module: 'connect/actions/revoke' })
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Inloggning krävs.' }
  }

  try {
    const result = await revokeConnection(sourceAiId)
    log.warn('connection_revoked', {
      userId: session.user.id,
      sourceAiId,
      revokedCount: result.revoked_count,
    })
    return { ok: true, revokedCount: result.revoked_count }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('revoke_connection_failed', {
      userId: session.user.id,
      sourceAiId,
      error: message,
    })
    Sentry.captureException(err)
    return { ok: false, error: message.slice(0, 200) }
  }
}
