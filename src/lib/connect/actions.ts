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
  issueConsumerToken,
  listConnections,
  revokeConnection,
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
