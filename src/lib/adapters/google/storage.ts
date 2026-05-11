import 'server-only'

import type { AdapterTokenSet } from '../types'

/**
 * Token-storage för Google — STUB (samma mönster som strava/storage.ts).
 *
 * v0: env-vars (single-user dogfood). v1: Drizzle-tabell när Magic-link
 * DB är wired.
 */

const STORAGE_NOTE =
  'TODO: replace with DB-backed storage when Magic-link/Drizzle is wired.'

export async function loadTokens(
  _userId: string,
  provider: 'google',
): Promise<AdapterTokenSet | null> {
  if (provider !== 'google') return null

  const accessToken = process.env.GOOGLE_ACCESS_TOKEN
  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? null,
    expiresAt: process.env.GOOGLE_EXPIRES_AT
      ? new Date(parseInt(process.env.GOOGLE_EXPIRES_AT, 10))
      : null,
    scope: process.env.GOOGLE_SCOPE ?? null,
    providerAccountId: process.env.GOOGLE_USER_ID ?? null,
  }
}

export async function saveTokens(
  _userId: string,
  provider: 'google',
  tokens: AdapterTokenSet,
): Promise<void> {
  if (provider !== 'google') return
  console.warn(
    `[google/storage.saveTokens] ${STORAGE_NOTE}\n` +
      `Got tokens, expires=${tokens.expiresAt?.toISOString()}, ` +
      `scope=${tokens.scope}. ` +
      `Set GOOGLE_ACCESS_TOKEN + GOOGLE_REFRESH_TOKEN + GOOGLE_EXPIRES_AT ` +
      `i .env för att aktivera.`,
  )
}
