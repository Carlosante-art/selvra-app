import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'

import { buildAuthorizeUrl } from '@/lib/adapters/google/oauth'

const STATE_COOKIE = 'google_oauth_state'
const STATE_MAX_AGE_SEC = 600

export async function GET(request: Request) {
  const url = new URL(request.url)

  // Guard: AB-deferred. Returnera graceful redirect istället för 500.
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=google_not_configured`,
    )
  }

  const redirectUri = `${url.origin}/api/oauth/google/callback`
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
