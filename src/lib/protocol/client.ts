import 'server-only'
import { SignJWT } from 'jose'

import type {
  CreateEventRequest,
  EventResponse,
  EventsListResponse,
  IntentionPayload,
  LatestReflection,
  MCPScope,
  SignalPreferencePayload,
  SrefExportResponse,
  SubjectSnapshot,
  ThoughtPayload,
} from './types'

/**
 * Selvra-protokollets HTTP-klient. Server-only — JWT-secret får aldrig
 * exponeras till klient-bundeln.
 *
 * Status 2026-05-11: hardcoded subject_id för Carl-dogfood. När
 * multi-user kommer: derivera per-request via uuid5(NAMESPACE, tenant:ext_id).
 */

type ProtocolConfig = {
  baseUrl: string
  secret: Uint8Array
  tenantId: string
  subUuid: string
  subjectId: string
  externalSubjectId: string
  sourceId: string
}

let _config: ProtocolConfig | null = null

function getConfig(): ProtocolConfig {
  if (_config) return _config

  const missing: string[] = []
  const get = (k: string): string => {
    const v = process.env[k]
    if (!v) missing.push(k)
    return v ?? ''
  }

  const baseUrl = get('SELVRA_PROTOCOL_URL')
  const secretStr = get('SELVRA_PROTOCOL_JWT_SECRET')
  const tenantId = get('SELVRA_TENANT_ID')
  const subUuid = get('SELVRA_APP_SUB_UUID')
  const subjectId = get('SELVRA_SUBJECT_ID')
  const externalSubjectId = get('SELVRA_SUBJECT_EXTERNAL_ID')
  const sourceId = get('SELVRA_SOURCE_ID')

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for Selvra protocol client: ${missing.join(', ')}`,
    )
  }

  _config = {
    baseUrl: baseUrl.replace(/\/$/, ''),
    secret: new TextEncoder().encode(secretStr),
    tenantId,
    subUuid,
    subjectId,
    externalSubjectId,
    sourceId,
  }
  return _config
}

async function mintToken(scopes: MCPScope[]): Promise<string> {
  const cfg = getConfig()
  return new SignJWT({
    sub: cfg.subUuid,
    tid: cfg.tenantId,
    subjects: [cfg.subjectId],
    scopes,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('selvra')
    .setExpirationTime('10m')
    .sign(cfg.secret)
}

async function call<T>(
  path: string,
  init: RequestInit & { scopes: MCPScope[] },
): Promise<T> {
  const cfg = getConfig()
  const token = await mintToken(init.scopes)

  const res = await fetch(`${cfg.baseUrl}${path}`, {
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

// ─── Public API ─────────────────────────────────────────────────────

export async function declareIntention(
  payload: IntentionPayload,
): Promise<EventResponse> {
  const cfg = getConfig()
  const body: CreateEventRequest = {
    category: 'data_ingested',
    event_type: 'selvra.intention.declared',
    source_ai_id: cfg.sourceId,
    payload: payload as unknown as Record<string, unknown>,
  }
  return call<EventResponse>(`/v1/subjects/${cfg.subjectId}/events`, {
    method: 'POST',
    body: JSON.stringify(body),
    scopes: ['write'],
  })
}

export async function recordThought(
  payload: ThoughtPayload,
): Promise<EventResponse> {
  const cfg = getConfig()
  const body: CreateEventRequest = {
    category: 'data_ingested',
    event_type: 'selvra.thought.recorded',
    source_ai_id: cfg.sourceId,
    payload: payload as unknown as Record<string, unknown>,
  }
  return call<EventResponse>(`/v1/subjects/${cfg.subjectId}/events`, {
    method: 'POST',
    body: JSON.stringify(body),
    scopes: ['write'],
  })
}

export async function recordSignalPreference(
  payload: SignalPreferencePayload,
): Promise<EventResponse> {
  const cfg = getConfig()
  const body: CreateEventRequest = {
    category: 'profile_updated',
    event_type: 'selvra.preference.signal_optin',
    source_ai_id: cfg.sourceId,
    payload: payload as unknown as Record<string, unknown>,
  }
  return call<EventResponse>(`/v1/subjects/${cfg.subjectId}/events`, {
    method: 'POST',
    body: JSON.stringify(body),
    scopes: ['write'],
  })
}

/**
 * Hämta nuvarande snapshot. NOTE 2026-05-11: ProjectionEngine projicerar
 * inte `selvra.intention.declared` eller `selvra.thought.recorded` till
 * ProfileFacts än, så detta returnerar tomt även när events finns. Se
 * STATE.md "Reading-back-problemet" för lösningar (a) projection-regel
 * eller (b) GET /events-endpoint.
 */
export async function getSnapshot(): Promise<SubjectSnapshot> {
  const cfg = getConfig()
  return call<SubjectSnapshot>(`/v1/subjects/${cfg.subjectId}/snapshot`, {
    method: 'GET',
    scopes: ['read'],
  })
}

/**
 * Trigga manuell synthesis (re-generera brev). Sync — tar 30-60s eftersom
 * Layer-3-LLM-call är synkron i protokollets internal-admin-route.
 */
export async function triggerReflectionRun(): Promise<{
  event_id: string
  model_used: string
  chars: number
  inputs: Record<string, unknown>
}> {
  return call('/v1/internal/carl/reflect', {
    method: 'POST',
    scopes: ['write'],
  })
}

/**
 * Trigga manuell Dreamer-pass (background reasoning) på Carls subject.
 * Sync — tar 20-30s.
 */
export async function triggerDreamerRun(): Promise<{
  run_id: string
  insights_produced: number
  redundancies_found: number
  total_tokens: number
  bail_reason: string
}> {
  return call('/v1/internal/carl/dream', {
    method: 'POST',
    scopes: ['write'],
  })
}

/**
 * Skapa en ny tenant i Selvra-protokollet (admin-scoped).
 *
 * Används av Auth.js signIn-callback första gången en user signar in:
 * vi provisionerar deras egen tenant och persisterar tenant_id på
 * user-raden i selvra-app:s DB.
 *
 * Mintar JWT med `admin`-scope. Subjects-claim är konfigurerad standard
 * (Carl:s) — admin-routes verifierar inte subject-match, så det är OK.
 * Tid-claim är Carl:s tenant — det är "system source" perspektivet, inte
 * "user" perspektivet. Den nya tenanten skapas separat.
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
  return call('/v1/tenants', {
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
 * Klienten skickar `external_subject_id` (Auth.js user.id) och får
 * tillbaka subject_id som derivats under den NYA tenanten.
 *
 * Kräver att JWT:n mintats med `tid: newTenantId` — inte default Carl-tid —
 * eftersom Selvra-protokollet deriverar under claims.tid.
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
  const cfg = getConfig()
  // Mint JWT med override-tid så subject derivras under den nya tenanten.
  const token = await new SignJWT({
    sub: cfg.subUuid,
    tid: params.tenantId,
    subjects: [],
    scopes: ['write'],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('selvra')
    .setExpirationTime('1m')
    .sign(cfg.secret)

  const res = await fetch(`${cfg.baseUrl}/v1/subjects`, {
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

/**
 * Hämta lifecycle-status för subject. Returnerar INTE 410 om deleted —
 * UI:n behöver kunna fråga "är jag deleted?" utan att gå runt deletion-
 * gate.
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
  const cfg = getConfig()
  return call<SubjectLifecycle>(`/v1/subjects/${cfg.subjectId}/lifecycle`, {
    method: 'GET',
    scopes: ['read'],
  })
}

/**
 * Markera subject för soft-deletion (GDPR right-to-deletion).
 *
 * Returnerar:
 * - status="deletion_requested" + 202 — ny deletion-event skapad
 * - status="already_deleted" + 200 — idempotent re-call
 *
 * Efter call:n returnerar alla read/write-paths 410 Gone. Användaren
 * kan ångra inom 30 dagar via `restoreSubject()`. Hard-delete sker
 * via manuellt batch-job efter 30-dagars-fönstret.
 */
export async function deleteSubject(): Promise<{
  subject_id: string
  deletion_event_id: string
  status: 'deletion_requested' | 'already_deleted'
  hard_delete_eligible_after_days?: number
  message: string
}> {
  const cfg = getConfig()
  return call(`/v1/subjects/${cfg.subjectId}`, {
    method: 'DELETE',
    scopes: ['write'],
  })
}

/**
 * Ångra pending soft-deletion. Måste anropas innan hard-delete-batchen
 * har körts (inom 30-dagars-fönstret).
 *
 * Returnerar 200 om subject var deleted (cancellation skapad), 409 om
 * subject inte var markerad för deletion.
 */
export async function restoreSubject(): Promise<{
  subject_id: string
  cancellation_event_id: string
  status: 'restored'
  message: string
}> {
  const cfg = getConfig()
  return call(`/v1/subjects/${cfg.subjectId}/restore`, {
    method: 'POST',
    scopes: ['write'],
  })
}

/**
 * Hämta användarens SREF v1-doc (portability-export). Content-addressed,
 * ev. HMAC-signerad per SREF_EXPORT_KEY på protokoll-sidan. Bygger hela
 * representationen — kan vara stor.
 */
export async function getSREFExport(): Promise<SrefExportResponse> {
  const cfg = getConfig()
  const params = new URLSearchParams({
    external_subject_id: cfg.externalSubjectId,
  })
  return call<SrefExportResponse>(
    `/v1/subjects/${cfg.subjectId}/sref-export?${params.toString()}`,
    {
      method: 'GET',
      scopes: ['read'],
    },
  )
}

/**
 * Lista events för subject med optional filter på event_type och tidpunkt.
 * Används för tankar-under-brev (designval 10) och liknande read-access
 * direkt mot event-loggen utan projection-detour.
 */
export async function listEvents(opts: {
  eventType?: string
  since?: Date
  limit?: number
}): Promise<EventsListResponse> {
  const cfg = getConfig()
  const params = new URLSearchParams()
  if (opts.eventType) params.set('event_type', opts.eventType)
  if (opts.since) params.set('since', opts.since.toISOString())
  if (opts.limit) params.set('limit', String(opts.limit))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return call<EventsListResponse>(
    `/v1/subjects/${cfg.subjectId}/events${qs}`,
    {
      method: 'GET',
      scopes: ['read'],
    },
  )
}

/**
 * Hämta senaste reflektion (projicerad SynthesisSnapshot från
 * `selvra.reflection.generated`-events). Returns null om ingen finns
 * (404 från protokollet).
 */
export async function getLatestReflection(
  synthesisType?: string,
): Promise<LatestReflection | null> {
  const cfg = getConfig()
  const token = await mintToken(['read'])
  const qs = synthesisType
    ? `?synthesis_type=${encodeURIComponent(synthesisType)}`
    : ''
  const res = await fetch(
    `${cfg.baseUrl}/v1/subjects/${cfg.subjectId}/reflections/latest${qs}`,
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
