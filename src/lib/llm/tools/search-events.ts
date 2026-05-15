import 'server-only'

/**
 * search_events — Mistral function-tool för att låta LLM:n fetcha events
 * från Selvra-protokollet on-demand istället för vår naiva 7-dagars-pre-
 * fetch.
 *
 * LLM-beslut vi vill möjliggöra:
 *   - "Användaren frågar om sömn" → search_events({ source_filter: 'garmin_sleep' })
 *   - "Användaren frågar om förra månaden" → search_events({ days_back: 30 })
 *   - "Användaren frågar bara om idag" → search_events({ days_back: 1, limit: 50 })
 *
 * Conservative caps: max 90 dagar, max 50 events per anrop. Skydd mot
 * runaway LLM-budget när tool-call-loopen körs.
 */

import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'
import { logger } from '@/lib/logging'

import type { RelevantEvent } from '@/lib/observability/conversation-context'

const MAX_LOOKBACK_DAYS = 90
const MAX_LIMIT = 50
const DEFAULT_LOOKBACK_DAYS = 7
const DEFAULT_LIMIT = 20

/**
 * Mistral function-schema. Sänds som `tools: [searchEventsTool]` till
 * chat.complete. LLM:n returnerar tool_calls med matchande arguments.
 */
export const searchEventsTool = {
  type: 'function' as const,
  function: {
    name: 'search_events',
    description:
      'Fetcha events från användarens Selvra-protokoll (sömn, glykemi, träning, kost m.m.). ' +
      'Anropa när du behöver konkret data från användarens dygnsrytm för att svara käll-attribuerat. ' +
      'Anropa INTE för känslo-frågor, generella resonemang eller frågor du redan kan svara på.',
    parameters: {
      type: 'object',
      properties: {
        days_back: {
          type: 'integer',
          description: `Antal dagar tillbaka att leta i (1-${MAX_LOOKBACK_DAYS}). Default ${DEFAULT_LOOKBACK_DAYS}.`,
          minimum: 1,
          maximum: MAX_LOOKBACK_DAYS,
        },
        source_filter: {
          type: 'string',
          description:
            'Substring som matchar mot event source_ai_id eller event_type. ' +
            'Exempel: "garmin_sleep", "dexcom", "strava". Utelämna för alla källor.',
        },
        limit: {
          type: 'integer',
          description: `Max antal events (1-${MAX_LIMIT}). Default ${DEFAULT_LIMIT}.`,
          minimum: 1,
          maximum: MAX_LIMIT,
        },
      },
      required: [],
    },
  },
}

export type SearchEventsArgs = {
  days_back?: number
  source_filter?: string
  limit?: number
}

export type SearchEventsResult = {
  events: RelevantEvent[]
  query: SearchEventsArgs
}

/**
 * Exekvera search_events-anrop. Validerar args (clampar till tillåtna
 * ranges), anropar listEvents, mappar till RelevantEvent.
 *
 * Returnerar tom array vid protokoll-fail — LLM:n får "ingen data"-signal
 * istället för att tool-call-loopen exploderar.
 */
export async function executeSearchEvents(
  rawArgs: unknown,
): Promise<SearchEventsResult> {
  const log = logger.child({ module: 'llm/tools/search-events' })
  const args = normalizeArgs(rawArgs)

  const since = new Date(Date.now() - args.days_back! * 24 * 60 * 60 * 1000)

  try {
    const response = await listEvents({
      since,
      // Hämta lite extra om filter ska tillämpas — vi filtrerar i memory.
      limit: args.source_filter ? Math.min(args.limit! * 3, 100) : args.limit,
    })

    let items = response.items
    if (args.source_filter) {
      const needle = args.source_filter.toLowerCase()
      items = items.filter((e) => matchesSourceFilter(e, needle))
    }
    items = items.slice(0, args.limit)

    const events = items.map(toRelevantEvent)
    log.info('search_events_ok', {
      daysBack: args.days_back,
      sourceFilter: args.source_filter ?? null,
      requestedLimit: args.limit,
      received: events.length,
    })
    return { events, query: args }
  } catch (err) {
    log.warn('search_events_failed', {
      args,
      error: err instanceof Error ? err.message : String(err),
    })
    return { events: [], query: args }
  }
}

/**
 * Validera + clampa args från LLM-tool-call. LLM-output kan vara JSON-
 * string eller redan parsad object. Out-of-range-värden clampas tyst,
 * okända keys ignoreras.
 */
function normalizeArgs(raw: unknown): Required<SearchEventsArgs> {
  let parsed: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      parsed = {}
    }
  } else if (raw && typeof raw === 'object') {
    parsed = raw as Record<string, unknown>
  }

  const daysBack = clampInt(parsed.days_back, 1, MAX_LOOKBACK_DAYS, DEFAULT_LOOKBACK_DAYS)
  const limit = clampInt(parsed.limit, 1, MAX_LIMIT, DEFAULT_LIMIT)
  const sourceFilter =
    typeof parsed.source_filter === 'string' && parsed.source_filter.trim().length > 0
      ? parsed.source_filter.trim()
      : undefined

  return {
    days_back: daysBack,
    limit,
    source_filter: sourceFilter as string, // type-only; undefined OK i Required<>-utvärdering
  }
}

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  const i = Math.floor(v)
  if (i < min) return min
  if (i > max) return max
  return i
}

function matchesSourceFilter(event: EventListItem, needle: string): boolean {
  const payload = event.payload as Record<string, unknown>
  const candidates = [
    event.event_type,
    typeof payload.source_id === 'string' ? payload.source_id : '',
    typeof payload.source_ai_id === 'string' ? payload.source_ai_id : '',
  ]
  return candidates.some((c) => c.toLowerCase().includes(needle))
}

function toRelevantEvent(event: EventListItem): RelevantEvent {
  const payload = event.payload as Record<string, unknown>
  const sourceAiId =
    (typeof payload.source_id === 'string' ? payload.source_id : null) ??
    (typeof payload.source_ai_id === 'string' ? payload.source_ai_id : null) ??
    event.event_type

  return {
    sourceAiId,
    timestamp: new Date(event.created_at),
    summary: summarizePayload(event.event_type, payload),
  }
}

function summarizePayload(
  eventType: string,
  payload: Record<string, unknown>,
): string {
  const skipKeys = new Set([
    'source_id',
    'source_ai_id',
    'event_id',
    'tenant_id',
  ])
  const pairs: string[] = [eventType]
  for (const [k, v] of Object.entries(payload)) {
    if (skipKeys.has(k)) continue
    if (v == null) continue
    const stringValue =
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    pairs.push(`${k}=${stringValue}`)
  }
  const summary = pairs.join(' ')
  return summary.length > 200 ? summary.slice(0, 197) + '…' : summary
}
