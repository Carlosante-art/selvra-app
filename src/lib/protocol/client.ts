import 'server-only'
import { SignJWT } from 'jose'

import type {
  EventsListResponse,
  LatestReflection,
  MCPScope,
  SrefExportResponse,
  SubjectSnapshot,
} from './types'

/**
 * Selvra-protokollets HTTP-klient. Server-only — JWT-secret får aldrig
 * exponeras till klient-bundeln.
 *
 * Arkitektur (2026-05-12 refactor — per-user-context):
 *
 *   ProtocolInfra (statisk, env-baserad, cachad):
 *     - baseUrl, secret, sourceId, subUuid
 *     - Shared per source-app (selvra-app). Aldrig per user.
 *
 *   UserCreds (dynamisk, per-request):
 *     - tenantId, subjectId, externalSubjectId
 *     - Resolveras i ordning:
 *       1. Auth.js-session → DB-lookup på users.selvra_tenant_id +
 *          users.selvra_subject_id (multi-user-mode)
 *       2. Env-vars SELVRA_TENANT_ID/SELVRA_SUBJECT_ID/
 *          SELVRA_SUBJECT_EXTERNAL_ID (Carl-dogfood-fallback)
 *
 *   Säkerhet: när session finns används ALDRIG Carl-env. Användarens egna
 *   tenant_id signas in i JWT-tid-claim, subject_id i subjects-claim.
 *   RLS i Selvra-protokollet isolerar via tid-claim → defense-in-depth.
 *
 * Cirkulär-import: protocol/client → auth/config → identity/ensure →
 * protocol/client. Vi bryter cyklen via dynamic import() av auth lazy-
 * laddat vid call-time, inte modul-load-time.
 */

type ProtocolInfra = {
  baseUrl: string
  secret: Uint8Array
  sourceId: string
  subUuid: string
}

type UserCreds = {
  tenantId: string
  subjectId: string
  externalSubjectId: string
}

type RequestContext = ProtocolInfra & UserCreds

let _infra: ProtocolInfra | null = null

function getProtocolInfra(): ProtocolInfra {
  if (_infra) return _infra

  const missing: string[] = []
  const get = (k: string): string => {
    const v = process.env[k]
    if (!v) missing.push(k)
    return v ?? ''
  }

  const baseUrl = get('SELVRA_PROTOCOL_URL')
  const secretStr = get('SELVRA_PROTOCOL_JWT_SECRET')
  const subUuid = get('SELVRA_APP_SUB_UUID')
  const sourceId = get('SELVRA_SOURCE_ID')

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for Selvra protocol infra: ${missing.join(', ')}`,
    )
  }

  _infra = {
    baseUrl: baseUrl.replace(/\/$/, ''),
    secret: new TextEncoder().encode(secretStr),
    sourceId,
    subUuid,
  }
  return _infra
}

function getCarlEnvCreds(): UserCreds | null {
  const tenantId = process.env.SELVRA_TENANT_ID
  const subjectId = process.env.SELVRA_SUBJECT_ID
  const externalSubjectId = process.env.SELVRA_SUBJECT_EXTERNAL_ID
  if (!tenantId || !subjectId || !externalSubjectId) return null
  return { tenantId, subjectId, externalSubjectId }
}

/**
 * Försöker lösa user-creds från Auth.js-session + DB. Returnerar null om:
 * - AUTH_SECRET saknas (Auth.js inte aktiverad — AB-deferred under dogfood)
 * - DATABASE_URL saknas (DB inte konfigurerad än)
 * - Ingen session
 * - Session existerar men user saknar selvra_tenant_id/selvra_subject_id
 *   (provisioning-flow inte körd än, eller failade)
 * - Auth.js/DB throw vid runtime
 *
 * Dynamic imports bryter cirkulär-import-kedjan
 * (protocol/client → auth/config → identity/ensure → protocol/client).
 *
 * Guard-check INNAN dynamic import: Auth.js `assertConfig` kastar
 * MissingSecret-error asynkront via processTicksAndRejections, vilket
 * inte fångas av try/catch på callsite i alla Next.js Server Component-
 * paths. Short-circuit innan auth() ens aktiveras = säkert fallback till
 * Carl-env även när Auth.js-stacken är ofullständigt konfigurerad.
 */
async function getUserCredsFromSession(): Promise<UserCreds | null> {
  // Hård guard: utan AUTH_SECRET kan Auth.js inte initieras. Skip helt
  // istället för att låta assertConfig kasta. Returnera null → caller
  // faller tillbaka till Carl-env-creds via getCarlEnvCreds.
  if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL) {
    return null
  }

  try {
    const { auth } = await import('@/lib/auth/config')
    const session = await auth()
    if (!session?.user?.id) return null

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
      tenantId: row.tenantId,
      subjectId: row.subjectId,
      externalSubjectId: session.user.id,
    }
  } catch {
    return null
  }
}

/**
 * Effektiv request-context: session-baserade creds om tillgängliga,
 * annars Carl-env-fallback. Kastar om varken session ELLER env finns.
 */
async function getRequestContext(): Promise<RequestContext> {
  const infra = getProtocolInfra()

  const sessionCreds = await getUserCredsFromSession()
  if (sessionCreds) return { ...infra, ...sessionCreds }

  const envCreds = getCarlEnvCreds()
  if (envCreds) return { ...infra, ...envCreds }

  throw new Error(
    'No Selvra user context: Auth.js session lookup failed AND no Carl-env fallback (SELVRA_TENANT_ID/SUBJECT_ID/SUBJECT_EXTERNAL_ID missing).',
  )
}

async function mintToken(
  ctx: RequestContext,
  scopes: MCPScope[],
): Promise<string> {
  return new SignJWT({
    sub: ctx.subUuid,
    tid: ctx.tenantId,
    subjects: [ctx.subjectId],
    scopes,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('selvra')
    .setExpirationTime('10m')
    .sign(ctx.secret)
}

async function call<T>(
  ctx: RequestContext,
  path: string,
  init: RequestInit & { scopes: MCPScope[] },
): Promise<T> {
  const token = await mintToken(ctx, init.scopes)

  const res = await fetch(`${ctx.baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Selvra ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`)
  }

  return (await res.json()) as T
}

/* ─── Admin-API (no user-context — system-source operations) ───────── */

/**
 * Skapa en ny tenant i Selvra-protokollet (admin-scoped).
 *
 * Används av Auth.js signIn-callback första gången en user signar in:
 * vi provisionerar deras egen tenant och persisterar tenant_id på
 * user-raden i selvra-app:s DB.
 *
 * Mintar admin-JWT under Carl-env-tid (selvra-app:s system-perspektiv).
 * Den nya tenanten skapas oberoende; det är dess tenant_id som returneras.
 */
export async function createTenant(params: {
  name: string
  type?: 'individual' | 'organization'
}): Promise<{
  tenant_id: string
  name: string
  type: string
  created_at: string
}> {
  const infra = getProtocolInfra()
  const carlCreds = getCarlEnvCreds()
  if (!carlCreds) {
    throw new Error('createTenant requires SELVRA_TENANT_ID env (admin-source-tid)')
  }
  const ctx: RequestContext = { ...infra, ...carlCreds }
  return call(ctx, '/v1/tenants', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      type: params.type ?? 'individual',
    }),
    scopes: ['admin'],
  })
}

/**
 * Derivera subject_id för (tenant, external_id)-parning via Selvra-
 * protokollets POST /v1/subjects. Idempotent — samma input ger alltid
 * samma subject_id (UUID5-derivation).
 *
 * Mintar JWT med override-tid så subject derivras under den NYA tenanten,
 * inte Carl-tid. Selvra-protokollet deriverar under claims.tid.
 */
export async function deriveSubjectIdUnderTenant(params: {
  tenantId: string
  externalSubjectId: string
}): Promise<{
  subject_id: string
  external_subject_id: string
  tenant_id: string
  derived_at: string
}> {
  const infra = getProtocolInfra()
  // Mint JWT directly (custom tid + empty subjects) since this anrop
  // bootstrappar subject_id — det finns inte än att lägga i subjects-claim.
  const token = await new SignJWT({
    sub: infra.subUuid,
    tid: params.tenantId,
    subjects: [],
    scopes: ['write'],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('selvra')
    .setExpirationTime('1m')
    .sign(infra.secret)

  const res = await fetch(`${infra.baseUrl}/v1/subjects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ external_subject_id: params.externalSubjectId }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Selvra POST /v1/subjects → ${res.status}: ${body}`)
  }

  return res.json()
}

/* ─── User-driven API (per-request-context) ────────────────────────── */

/**
 * declareIntention, recordThought, recordSignalPreference raderade
 * 2026-05-15 (v1-refaktor Steg 2-5: brev/Dreamer/thoughts/onboarding
 * rivs). Befintliga selvra.intention.declared, selvra.thought.recorded
 * och selvra.signal.preference-events lever kvar i Selvra-protokollet
 * och läses av /minne via listEvents. Ny path för user-stated facts:
 * extractFactsFromTurn → conversation_facts (Steg 8).
 */

export async function getSnapshot(): Promise<SubjectSnapshot> {
  const ctx = await getRequestContext()
  return call<SubjectSnapshot>(ctx, `/v1/subjects/${ctx.subjectId}/snapshot`, {
    method: 'GET',
    scopes: ['read'],
  })
}

/**
 * triggerReflectionRun + triggerDreamerRun raderade 2026-05-15 (v1-refaktor
 * Steg 2-3: brev- och Dreamer-paradigm rivs). Endpoints
 * `/v1/internal/carl/reflect` och `/v1/internal/carl/dream` lever kvar i
 * Selvra-protokollet (Carl-only internal-admin) men exponeras inte längre
 * från konsument-appen. Dreamer-output ligger fortfarande som
 * `insight.derived`-events och läses via listEvents i /minne.
 */

/**
 * Hämta lifecycle-status för current user:s subject. Returnerar INTE 410
 * om deleted — UI:n behöver kunna fråga "är jag deleted?" utan att gå
 * runt deletion-gate.
 */
export type SubjectLifecycle =
  | {
      subject_id: string
      status: 'active'
    }
  | {
      subject_id: string
      status: 'pending_deletion'
      deletion_event_id: string
      deletion_requested_at: string | null
      hard_delete_eligible_after_days: number
    }

export async function getSubjectLifecycle(): Promise<SubjectLifecycle> {
  const ctx = await getRequestContext()
  return call<SubjectLifecycle>(ctx, `/v1/subjects/${ctx.subjectId}/lifecycle`, {
    method: 'GET',
    scopes: ['read'],
  })
}

/**
 * Markera current user:s subject för soft-deletion (GDPR right-to-deletion).
 */
export async function deleteSubject(): Promise<{
  subject_id: string
  deletion_event_id: string
  status: 'deletion_requested' | 'already_deleted'
  hard_delete_eligible_after_days?: number
  message: string
}> {
  const ctx = await getRequestContext()
  return call(ctx, `/v1/subjects/${ctx.subjectId}`, {
    method: 'DELETE',
    scopes: ['write'],
  })
}

/**
 * Ångra pending soft-deletion. Måste anropas innan hard-delete-batchen
 * har körts (inom 30-dagars-fönstret).
 */
export async function restoreSubject(): Promise<{
  subject_id: string
  cancellation_event_id: string
  status: 'restored'
  message: string
}> {
  const ctx = await getRequestContext()
  return call(ctx, `/v1/subjects/${ctx.subjectId}/restore`, {
    method: 'POST',
    scopes: ['write'],
  })
}

/**
 * Hämta current user:s SREF v1-doc (portability-export).
 */
export async function getSREFExport(): Promise<SrefExportResponse> {
  const ctx = await getRequestContext()
  const params = new URLSearchParams({
    external_subject_id: ctx.externalSubjectId,
  })
  return call<SrefExportResponse>(
    ctx,
    `/v1/subjects/${ctx.subjectId}/sref-export?${params.toString()}`,
    {
      method: 'GET',
      scopes: ['read'],
    },
  )
}

/**
 * Lista events för current user:s subject med optional filter på
 * event_type och tidpunkt.
 */
export async function listEvents(opts: {
  eventType?: string
  since?: Date
  limit?: number
}): Promise<EventsListResponse> {
  const ctx = await getRequestContext()
  const params = new URLSearchParams()
  if (opts.eventType) params.set('event_type', opts.eventType)
  if (opts.since) params.set('since', opts.since.toISOString())
  if (opts.limit) params.set('limit', String(opts.limit))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return call<EventsListResponse>(
    ctx,
    `/v1/subjects/${ctx.subjectId}/events${qs}`,
    {
      method: 'GET',
      scopes: ['read'],
    },
  )
}

/**
 * Hämta senaste reflektion för current user (projicerad SynthesisSnapshot
 * från `selvra.reflection.generated`-events). Returns null om ingen finns
 * (404 från protokollet).
 */
export async function getLatestReflection(
  synthesisType?: string,
): Promise<LatestReflection | null> {
  const ctx = await getRequestContext()
  const token = await mintToken(ctx, ['read'])
  const qs = synthesisType
    ? `?synthesis_type=${encodeURIComponent(synthesisType)}`
    : ''
  const res = await fetch(
    `${ctx.baseUrl}/v1/subjects/${ctx.subjectId}/reflections/latest${qs}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(
      `Selvra GET reflections/latest → ${res.status}: ${body}`,
    )
  }
  return (await res.json()) as LatestReflection
}
