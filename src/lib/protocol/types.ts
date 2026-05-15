/**
 * TypeScript-typer som speglar Selvra-protokollets HTTP-fasad.
 *
 * Spegling, inte source-of-truth: kanonisk schema lever i
 * `~/selvra/src/selvra/http/schemas/`. Håll synkat manuellt eller via
 * OpenAPI-codegen i framtiden.
 */

export type EventCategory =
  | 'data_ingested'
  | 'feature_extracted'
  | 'insight_derived'
  | 'synthesis_generated'
  | 'feedback_received'
  | 'divergence_detected'
  | 'profile_updated'
  | 'source_registered'

export type MCPScope = 'read' | 'write' | 'admin'

// ─── Intention-specifika typer ─────────────────────────────────────

export type IntentType = 'self_directed' | 'delivery_rhythm'

export type DeliveryRhythm =
  | 'sunday_morning'
  | 'friday_afternoon'
  | 'before_events'
  | 'custom'

export type TemporalValidity = {
  valid_from: string // ISO-8601
  valid_until: string | null // null = fortfarande aktiv
}

export type IntentionSelfDirectedPayload = {
  intent_type: 'self_directed'
  text: string
  value: null
  temporal_validity: TemporalValidity
  declared_at: string
}

export type IntentionDeliveryRhythmPayload = {
  intent_type: 'delivery_rhythm'
  text: null
  value: {
    rhythm: DeliveryRhythm
    custom_description: string | null
  }
  temporal_validity: TemporalValidity
  declared_at: string
}

export type IntentionPayload =
  | IntentionSelfDirectedPayload
  | IntentionDeliveryRhythmPayload

// ─── Tanke-event (Lager 2 freeform) ────────────────────────────────
//
// ThoughtPayload-typen raderad 2026-05-15 (v1-refaktor Steg 4: standalone
// thoughts rivs). Befintliga selvra.thought.recorded-events i Selvra-
// protokollet lever kvar och deseraliseras vid behov av /minne via
// generic EventListItem-payload.

// ─── Signal-preference-event ────────────────────────────────────────

export type SignalPreferencePayload = {
  enabled: boolean
  delivered_at: string // ISO-8601 när preferensen sattes
}

// ─── Generisk event-request/response ───────────────────────────────

export type CreateEventRequest = {
  category: EventCategory
  event_type: string
  source_ai_id: string
  payload: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type ModeratorVerdict = 'accepted' | 'requires_user_review' | 'rejected'

export type ModeratorFinding = {
  detector: string
  severity: 'info' | 'warning' | 'critical'
  description: string
}

export type ModeratorDecision = {
  verdict: ModeratorVerdict
  findings: ModeratorFinding[]
  trust_score_before: number
  trust_score_after: number
}

export type EventResponse = {
  event_id: string | null // null vid 202 requires_user_review
  subject_id: string
  category: EventCategory
  event_type: string
  moderator: ModeratorDecision
  created_at: string | null
}

// ─── Snapshot (read-side) ──────────────────────────────────────────

export type ProfileFact = {
  key: string
  value: unknown
  // Andra fält finns på protokoll-sidan; selvra-app bryr sig om key+value
  // för v1. Utvidga vid behov.
  [extra: string]: unknown
}

export type SubjectSnapshot = {
  subject_id: string
  tenant_id: string
  items: ProfileFact[]
  next_cursor: string | null
  total_count: number
  limit: number
}

// ─── Reflection / synthesis-snapshot ──────────────────────────────────

export type ReflectionContent = {
  text: string
  format?: string // "letter"
  language?: string // "sv"
  [extra: string]: unknown
}

export type LatestReflection = {
  subject_id: string
  synthesis_type: string // "weekly_letter" | "morning_brief" | ...
  version: number
  content: ReflectionContent
  model_used: string
  layer_used: number
  source_event_id: string | null
  created_at: string // ISO-8601
}

// ─── SREF v1 portability export ───────────────────────────────────────

export type SrefExportResponse = {
  document: Record<string, unknown> // SREF v1 doc — content-addressed, ev. HMAC-signerad
  signed: boolean
  subject_count: number
  subject_pending_deletion?: boolean // True om subject är markerad för deletion (inom 30d)
}

// ─── Events list (för tankar-under-brev, audit, etc.) ─────────────────

export type EventListItem = {
  event_id: string
  subject_id: string
  category: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export type EventsListResponse = {
  subject_id: string
  items: EventListItem[]
  total: number
  has_more: boolean
}
