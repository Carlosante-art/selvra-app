import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { exchangeCodeForTokens } from '@/lib/adapters/google/oauth'
import { saveTokens } from '@/lib/adapters/google/storage'

const STATE_COOKIE = 'google_oauth_state'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(
      `${url.origin}/onboarding/sources?error=${encodeURIComponent(errorParam)}`,
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${url.origin}/onboarding/sources?error=missing_code_or_state`,
    )
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE)?.value
  if (!storedState || storedState !== stateParam) {
    return NextResponse.redirect(
      `${url.origin}/onboarding/sources?error=invalid_state`,
    )
  }

  const redirectUri = `${url.origin}/api/oauth/google/callback`

  try {
    const tokens = await exchangeCodeForTokens({ code, redirectUri })
    await saveTokens('carl', 'google', tokens)

    const response = NextResponse.redirect(
      `${url.origin}/onboarding/sources?saved=google`,
    )
    response.cookies.delete(STATE_COOKIE)
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(
      `${url.origin}/onboarding/sources?error=${encodeURIComponent(msg)}`,
    )
  }
}
