import 'server-only'

/**
 * Hämta relevanta events från Selvra-protokollet för konsument-samtals-kontext.
 *
 * Initial heuristik (Fas 1 Carl-personal-tool baseline):
 *   - Senaste 7 dagar
 *   - Max 20 events (LLM-context-budget)
 *   - Inga eventType-filter — alla källor med
 *
 * Senare iteration kan addera:
 *   - LLM-tool-call: LLM frågar protokollet om specifika eventType:n
 *     baserat på user-tur ("om sömn" → fetcha Garmin sleep)
 *   - Heuristisk filtering: matcha nyckelord i user-tur mot eventType:n
 *   - Adaptive limit baserat på conversation-depth
 *
 * Returnerar [] om listEvents kastar — vi vill att samtalet ska kunna
 * fortsätta även om protokoll-anrop fail:ar (LLM:n får "ingen data"
 * signal istället för att Server Action exploderar).
 */

import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'
import { logger } from '@/lib/logging'
import type { RelevantEvent } from './conversation-context'

const DEFAULT_LOOKBACK_DAYS = 7
const DEFAULT_LIMIT = 20

export async function fetchRelevantEvents(
  _userText: string,
  opts: { lookbackDays?: number; limit?: number } = {},
): Promise<RelevantEvent[]> {
  const log = logger.child({ module: 'fetch-relevant-events' })
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS
  const limit = opts.limit ?? DEFAULT_LIMIT
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  try {
    const response = await listEvents({ since, limit })
    const events = response.items.map(toRelevantEvent)
    log.info('fetch_relevant_events_ok', {
      lookbackDays,
      requested: limit,
      received: events.length,
    })
    return events
  } catch (err) {
    log.warn('fetch_relevant_events_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

/**
 * Konvertera EventListItem → RelevantEvent. `sourceAiId` plockas från
 * payload om finns, annars event_type som fallback. `summary` är JSON-
 * stringified payload trimmed.
 */
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

/**
 * Bygg kort textsammanfattning av payload. Konservativ — bara key=value-
 * par utskrivna inline. LLM:n läser strukturerad data bättre än "Garmin
 * mätte 7.4 mmol/L"-prosa.
 *
 * Begränsar till 200 tecken så context-budgeten inte sprängs av en stor
 * payload.
 */
function summarizePayload(
  eventType: string,
  payload: Record<string, unknown>,
): string {
  // Filtrera ut interna fält som inte är intressanta för LLM-context
  const skipKeys = new Set(['source_id', 'source_ai_id', 'event_id', 'tenant_id'])
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
