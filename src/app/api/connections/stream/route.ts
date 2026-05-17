/**
 * GET /api/connections/stream?source_ai_id=X — SSE proxy mot selvra-protocols
 * /v1/connections/events.
 *
 * Browser/EventSource → denna route → selvra-protocol SSE
 *
 * Designval:
 * - **Node runtime.** Edge runtime har strikta timeouts som bryter SSE.
 *   På Vercel Pro/Fluid har Node-functions streaming-stöd som klarar 5+ min.
 * - **Auth-gate via session.** Vi mint:ar en kort-lived JWT i Server-action-
 *   stil mot selvra-protocol så browsern aldrig ser shared-secret eller
 *   user-tenant-JWT direkt.
 * - **Passthrough body.** ReadableStream från fetch:n proxas direkt — vi
 *   ändrar inte event-payloads, bara auth.
 * - **Disconnect-städning.** Klient stänger → AbortSignal från Request går
 *   till upstream fetch → upstream städar Redis-subscription.
 */

import 'server-only'
import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth/config'

export const runtime = 'nodejs'

type ProtocolCtx = {
  baseUrl: string
  secret: Uint8Array
  sourceId: string
  subUuid: string
  tenantId: string
  subjectId: string
}

async function resolveContext(): Promise<ProtocolCtx | null> {
  // Sluten kontexbygge — speglar protocol/client.ts:s getRequestContext men
  // utan att importera ddetalj-funktioner (de är server-only och kräver att
  // hela context-resolverkedjan kör; här räcker minimal-tid + subject_id).
  const baseUrl = (process.env.SELVRA_PROTOCOL_URL ?? '').replace(/\/$/, '')
  const secretStr = process.env.SELVRA_PROTOCOL_JWT_SECRET ?? ''
  const subUuid = process.env.SELVRA_APP_SUB_UUID ?? ''
  const sourceId = process.env.SELVRA_SOURCE_ID ?? ''

  if (!baseUrl || !secretStr || !subUuid || !sourceId) return null

  const session = await auth()
  if (!session?.user?.id) return null

  // För session-baserad creds-lookup: vi använder samma path som
  // protocol/client.ts. Importera lazy för att undvika cykel.
  try {
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const rows = await db
      .select({
        tenantId: users.selvraTenantId,
        subjectId: users.selvraSubjectId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const row = rows[0]
    if (!row?.tenantId || !row?.subjectId) return null

    return {
      baseUrl,
      secret: new TextEncoder().encode(secretStr),
      sourceId,
      subUuid,
      tenantId: row.tenantId,
      subjectId: row.subjectId,
    }
  } catch {
    return null
  }
}

async function mintReadToken(ctx: ProtocolCtx): Promise<string> {
  return new SignJWT({
    sub: ctx.subUuid,
    tid: ctx.tenantId,
    subjects: [ctx.subjectId],
    scopes: ['read'],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('selvra')
    .setExpirationTime('10m')
    .sign(ctx.secret)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sourceAiId = url.searchParams.get('source_ai_id')

  if (!sourceAiId) {
    return new Response('Missing source_ai_id query param', { status: 400 })
  }

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(sourceAiId)) {
    return new Response('Invalid source_ai_id format', { status: 400 })
  }

  const ctx = await resolveContext()
  if (!ctx) {
    return new Response('Unauthorized or context resolution failed', {
      status: 401,
    })
  }

  const token = await mintReadToken(ctx)
  const upstreamUrl = `${ctx.baseUrl}/v1/connections/events?source_ai_id=${encodeURIComponent(sourceAiId)}`

  // AbortSignal kopplas till client-disconnect så upstream städar Redis-sub
  const controller = new AbortController()
  req.signal.addEventListener('abort', () => controller.abort())

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(`Upstream connect failed: ${msg.slice(0, 200)}`, {
      status: 502,
    })
  }

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '')
    return new Response(`Upstream returned ${upstream.status}: ${body.slice(0, 200)}`, {
      status: 502,
    })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
