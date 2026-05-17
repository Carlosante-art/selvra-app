'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { logger } from '@/lib/logging'
import {
  buildErrorRedirect,
  buildSuccessRedirect,
} from '@/lib/oauth/authorize-validation'
import {
  OAuthProtocolError,
  issueOAuthAuthorizationCode,
} from '@/lib/oauth/protocol-client'

const log = logger.child({ module: 'oauth/authorize/actions' })

/**
 * Server Action — utfärdar authorization-code och redirectar tillbaka till
 * klient-redirect_uri.
 *
 * Anropas av "Godkänn"-knappen i consent-screen via form action. Alla
 * params skickas som hidden inputs (validerade redan av page.tsx).
 */
export async function approveConsent(formData: FormData): Promise<never> {
  const clientId = String(formData.get('client_id') ?? '')
  const redirectUri = String(formData.get('redirect_uri') ?? '')
  const scope = String(formData.get('scope') ?? '')
  const codeChallenge = String(formData.get('code_challenge') ?? '')
  const codeChallengeMethod = String(formData.get('code_challenge_method') ?? '')
  const state = formData.get('state')
  const stateStr = state ? String(state) : undefined

  if (codeChallengeMethod !== 'S256') {
    redirect(
      buildErrorRedirect(
        redirectUri,
        'invalid_request',
        'code_challenge_method måste vara S256',
        stateStr,
      ),
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    // Detta ska inte hända — page.tsx redirectar till /login innan render
    redirect(
      buildErrorRedirect(
        redirectUri,
        'access_denied',
        'User-session saknas vid consent-approve',
        stateStr,
      ),
    )
  }

  const userRows = await db
    .select({
      id: users.id,
      selvraTenantId: users.selvraTenantId,
      selvraSubjectId: users.selvraSubjectId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const user = userRows[0]
  if (!user?.selvraTenantId || !user?.selvraSubjectId) {
    log.error('Selvra identity missing on consent-approve', {
      userId: session.user.id,
    })
    redirect(
      buildErrorRedirect(
        redirectUri,
        'server_error',
        'Selvra-identitet ej provisionerad — logga ut/in och försök igen',
        stateStr,
      ),
    )
  }

  try {
    const result = await issueOAuthAuthorizationCode({
      clientId,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod: 'S256',
      userId: user.id,
      tenantId: user.selvraTenantId,
      subjectIds: [user.selvraSubjectId],
    })

    log.info('Authorization code issued', {
      clientId,
      userId: session.user.id,
      scope,
    })

    redirect(buildSuccessRedirect(redirectUri, result.code, stateStr))
  } catch (err) {
    if (err instanceof OAuthProtocolError) {
      log.warn('selvra-protocol rejected authorize/issue', {
        clientId,
        status: err.status,
        oauthError: err.oauthError,
      })
      redirect(
        buildErrorRedirect(
          redirectUri,
          err.oauthError,
          err.oauthDescription,
          stateStr,
        ),
      )
    }
    throw err
  }
}

/**
 * Server Action — "Avbryt"-knapp. Redirectar med error=access_denied per
 * RFC 6749 §4.1.2.1.
 */
export async function denyConsent(formData: FormData): Promise<never> {
  const redirectUri = String(formData.get('redirect_uri') ?? '')
  const state = formData.get('state')
  const stateStr = state ? String(state) : undefined

  redirect(
    buildErrorRedirect(
      redirectUri,
      'access_denied',
      'Användaren godkände inte anslutningen',
      stateStr,
    ),
  )
}
