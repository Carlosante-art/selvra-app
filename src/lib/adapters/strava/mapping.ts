import type { CreateEventRequest } from '@/lib/protocol/types'

import type { StravaActivitySummary } from './client'

/**
 * Mapping från Strava-aktivitet till Selvra-event-format.
 *
 * Konvention: `event_type: "strava.activity.recorded"`,
 * `category: "data_ingested"` (samma som intentions/thoughts — Strava är
 * en data-källa, inte derived insight).
 *
 * Payload bevarar Strava-fält i en strukturerad form. Synthesis-pipelinen
 * kan läsa payload.distance_m, payload.duration_s, payload.sport_type
 * etc. utan att veta att de kom från Strava — käll-attribuering sker via
 * `source_ai_id: "strava"` på event-meta-nivå.
 */

export function activityToEvent(
  activity: StravaActivitySummary,
): CreateEventRequest {
  return {
    category: 'data_ingested',
    event_type: 'strava.activity.recorded',
    source_ai_id: 'strava',
    payload: {
      strava_activity_id: activity.id,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      distance_m: activity.distance,
      duration_s: activity.moving_time,
      elapsed_time_s: activity.elapsed_time,
      elevation_gain_m: activity.total_elevation_gain,
      start_at: activity.start_date,
      start_at_local: activity.start_date_local,
      timezone: activity.timezone,
      average_speed_ms: activity.average_speed,
      max_speed_ms: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      has_heartrate: activity.has_heartrate,
      is_trainer: activity.trainer,
      is_commute: activity.commute,
      is_manual: activity.manual,
      is_private: activity.private,
    },
    metadata: {
      mapper_version: 'v0.1',
    },
  }
}
