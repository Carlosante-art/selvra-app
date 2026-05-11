import 'server-only'

import type { AdapterOAuthInit, AdapterTokenSet } from '../types'

/**
 * Strava OAuth 2.0 flow.
 *
 * Authorize URL: https://www.strava.com/oauth/authorize
 * Token URL:     https://www.strava.com/api/v3/oauth/token
 *
 * Scope för dogfood: `read,activity:read` (lista + detalj på aktiviteter,
 * ingen privat lokation eller foto-data).
 *
 * Strava-tokens är kortlivade (~6h). Refresh-flow via refresh_token är
 * nödvändig för långsiktig sync.
 */

const STRAVA_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/api/v3/oauth/token'
const STRAVA_SCOPE = 'read,activity:read'

function getConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      'Strava OAuth not configured. Set STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET in .env.',
    )
  }
  return { clientId, clientSecret }
}

export function buildAuthorizeUrl(opts: {
  redirectUri: string
  state: string
}): AdapterOAuthInit {
  const { clientId } = getConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: opts.redirectUri,
    approval_prompt: 'auto',
    scope: STRAVA_SCOPE,
    state: opts.state,
  })
  return {
    authUrl: `${STRAVA_AUTHORIZE_URL}?${params.toString()}`,
    state: opts.state,
  }
}

export async function exchangeCodeForTokens(opts: {
  code: string
}): Promise<AdapterTokenSet> {
  const { clientId, clientSecret } = getConfig()
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: opts.code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Strava token-exchange failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return parseTokenResponse(data)
}

export async function refreshAccessToken(opts: {
  refreshToken: string
}): Promise<AdapterTokenSet> {
  const { clientId, clientSecret } = getConfig()
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: opts.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Strava token-refresh failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return parseTokenResponse(data)
}

function parseTokenResponse(data: Record<string, unknown>): AdapterTokenSet {
  const accessToken = String(data.access_token ?? '')
  const refreshToken = data.refresh_token ? String(data.refresh_token) : null
  const expiresAtSec =
    typeof data.expires_at === 'number' ? data.expires_at : null
  const expiresAt = expiresAtSec ? new Date(expiresAtSec * 1000) : null
  const scope = data.scope ? String(data.scope) : null
  const athlete = data.athlete as Record<string, unknown> | undefined
  const providerAccountId = athlete?.id ? String(athlete.id) : null

  if (!accessToken) {
    throw new Error(`Strava token response missing access_token: ${JSON.stringify(data)}`)
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    scope,
    providerAccountId,
    raw: data,
  }
}
