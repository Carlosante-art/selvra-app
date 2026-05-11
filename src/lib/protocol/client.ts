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
