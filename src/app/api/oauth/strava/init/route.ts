import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'

import { buildAuthorizeUrl } from '@/lib/adapters/strava/oauth'

/**
 * GET /api/oauth/strava/init
 *
 * Initierar Strava OAuth-flöde. Generera CSRF-state, bygg authorize-URL,
 * redirect till Strava. Strava redirectar tillbaka till /api/oauth/strava/callback
 * efter användarens consent.
 *
 * v0: state lagras i cookies för CSRF-validering vid callback. När
 * Magic-link DB är wired flyttas state till session-table.
 */

const STATE_COOKIE = 'strava_oauth_state'
const STATE_MAX_AGE_SEC = 600 // 10 min

export async function GET(request: Request) {
  const url = new URL(request.url)

  // Guard: utan creds är OAuth-flöde inte möjligt. Returnera graceful
  // redirect till sources-sidan med error-flash istället för att throw:a
  // (vilket skulle returnera 500). Strava-creds är AB-deferred per
  // .gsd/decisions/APPLICATIONS_PENDING_AB_2026-05-11.md.
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=strava_not_configured`,
    )
  }

  const redirectUri = `${url.origin}/api/oauth/strava/callback`
  const state = randomBytes(24).toString('hex')

  const { authUrl } = buildAuthorizeUrl({ redirectUri, state })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE_SEC,
    path: '/',
  })
  return response
}
