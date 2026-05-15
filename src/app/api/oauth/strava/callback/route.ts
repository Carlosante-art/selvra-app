import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { exchangeCodeForTokens } from '@/lib/adapters/strava/oauth'
import { saveTokens } from '@/lib/adapters/strava/storage'

/**
 * GET /api/oauth/strava/callback
 *
 * Strava redirectar hit efter användarens consent. Validera CSRF-state
 * mot cookie, byt code mot tokens, spara tokens, redirect till
 * source-toggling-sidan med saved-flash.
 */

const STATE_COOKIE = 'strava_oauth_state'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=${encodeURIComponent(errorParam)}`,
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=missing_code_or_state`,
    )
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE)?.value
  if (!storedState || storedState !== stateParam) {
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=invalid_state`,
    )
  }

  try {
    const tokens = await exchangeCodeForTokens({ code })
    // v0: stub-save loggar till console. Carl behöver kopiera till .env manuellt.
    // När DB är wired blir detta en riktig save.
    await saveTokens('carl', 'strava', tokens)

    const response = NextResponse.redirect(
      `${url.origin}/welcome/sources?saved=strava&athlete=${
        tokens.providerAccountId ?? ''
      }`,
    )
    // Rensa state-cookie
    response.cookies.delete(STATE_COOKIE)
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(
      `${url.origin}/welcome/sources?error=${encodeURIComponent(msg)}`,
    )
  }
}
