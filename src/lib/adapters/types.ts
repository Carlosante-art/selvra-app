/**
 * Shared adapter-interface för source-integrations (Strava, Google,
 * Spotify, Open Wearables-receivers etc).
 *
 * Varje adapter implementerar OAuth-flöde, token-refresh och
 * domän-specifik fetch + mapping till Selvra-event-format. Per
 * source-adapter-arkitektur-doktrin (se DESIGN.md §2): protokollet är
 * källa-agnostiskt; adaptern översätter mellan extern API och
 * `selvra.<domain>.<action>`-events.
 */

export type AdapterSourceId =
  | 'strava'
  | 'google_calendar'
  | 'google_gmail'
  | 'spotify'
  | 'open_wearables'
  | 'ai_conversation'

export type AdapterOAuthInit = {
  authUrl: string
  state: string
}

export type AdapterTokenSet = {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  scope: string | null
  // Provider-specifik extra-info (athlete_id för Strava, sub för Google, etc.)
  providerAccountId: string | null
  raw?: Record<string, unknown>
}

export type AdapterUserContext = {
  // I v0: hardcoded Carl-subject. När Magic-link är wired hämtas från session.
  selvraSubjectId: string
  selvraTenantId: string
}
