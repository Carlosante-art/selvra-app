import 'server-only'

import type { AdapterTokenSet } from '../types'

/**
 * Token-storage för Strava — STUB.
 *
 * v0: env-vars (single-user-dogfood). Inte multi-user-säkert.
 *
 * v1 (kommer när Magic-link DB är wired): Drizzle-tabell `oauth_tokens`
 * eller utvidgad Auth.js `accounts`-tabell. Per-user storage med
 * `(user_id, provider, account_id)` som key.
 *
 * Public API försöker matcha framtida DB-pattern så att switchen blir
 * en ren replacement av implementation, inte interface.
 */

const STORAGE_NOTE =
  'TODO: replace with DB-backed storage when Magic-link/Drizzle is wired.'

export async function loadTokens(
  _userId: string,
  provider: 'strava',
): Promise<AdapterTokenSet | null> {
  if (provider !== 'strava') return null

  const accessToken = process.env.STRAVA_ACCESS_TOKEN
  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: process.env.STRAVA_REFRESH_TOKEN ?? null,
    expiresAt: process.env.STRAVA_EXPIRES_AT
      ? new Date(parseInt(process.env.STRAVA_EXPIRES_AT, 10) * 1000)
      : null,
    scope: process.env.STRAVA_SCOPE ?? null,
    providerAccountId: process.env.STRAVA_ATHLETE_ID ?? null,
  }
}

export async function saveTokens(
  _userId: string,
  provider: 'strava',
  tokens: AdapterTokenSet,
): Promise<void> {
  if (provider !== 'strava') return
  // STUB: under v0 förlitar vi oss på att Carl manuellt kopierar
  // callback-output till sin .env. Programmatisk persist kommer med DB.
  console.warn(
    `[strava/storage.saveTokens] ${STORAGE_NOTE}\n` +
      `Got tokens for athlete=${tokens.providerAccountId}, ` +
      `expires=${tokens.expiresAt?.toISOString()}, ` +
      `scope=${tokens.scope}. ` +
      `Set STRAVA_ACCESS_TOKEN + STRAVA_REFRESH_TOKEN + STRAVA_EXPIRES_AT ` +
      `+ STRAVA_ATHLETE_ID i .env för att aktivera.`,
  )
}
