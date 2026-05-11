import 'server-only'

import type { AdapterOAuthInit, AdapterTokenSet } from '../types'

/**
 * Google OAuth 2.0 flow för Calendar + Gmail-metadata.
 *
 * Authorize URL: https://accounts.google.com/o/oauth2/v2/auth
 * Token URL:     https://oauth2.googleapis.com/token
 *
 * Scopes:
 * - calendar.readonly — läs kalender-events
 * - gmail.metadata — läs mail-headers/labels (INTE innehåll)
 *
 * Google returnerar refresh_token bara om access_type=offline + prompt=consent.
 * Krävs för långsiktig sync. PKCE skippas (confidential-client med
 * client_secret server-side).
 */

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
  'openid',
  'email',
].join(' ')

function getConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth not configured. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.',
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
    scope: GOOGLE_SCOPES,
    access_type: 'offline', // krävs för refresh_token
    prompt: 'consent', // garanterar refresh_token vid varje grant
    state: opts.state,
    include_granted_scopes: 'true',
  })
  return {
    authUrl: `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`,
    state: opts.state,
  }
}

export async function exchangeCodeForTokens(opts: {
  code: string
  redirectUri: string
}): Promise<AdapterTokenSet> {
  const { clientId, clientSecret } = getConfig()
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token-exchange failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return parseTokenResponse(data)
}

export async function refreshAccessToken(opts: {
  refreshToken: string
}): Promise<AdapterTokenSet> {
  const { clientId, clientSecret } = getConfig()
  const res = await fetch(GOOGLE_TOKEN_URL, {
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
    throw new Error(`Google token-refresh failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return parseTokenResponse(data)
}

function parseTokenResponse(data: Record<string, unknown>): AdapterTokenSet {
  const accessToken = String(data.access_token ?? '')
  const refreshToken = data.refresh_token ? String(data.refresh_token) : null
  const expiresInSec =
    typeof data.expires_in === 'number' ? data.expires_in : null
  const expiresAt = expiresInSec ? new Date(Date.now() + expiresInSec * 1000) : null
  const scope = data.scope ? String(data.scope) : null

  if (!accessToken) {
    throw new Error(`Google token response missing access_token: ${JSON.stringify(data)}`)
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    scope,
    // Google returnerar inte user-id direkt här — kan hämtas via id_token
    // (om openid scope) eller separat /userinfo-anrop. Stubbat för nu.
    providerAccountId: null,
    raw: data,
  }
}
