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
