import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import { ConsentScreen } from '@/components/oauth/consent-screen'
import {
  buildErrorRedirect,
  errorMessage,
  parseAuthorizeRequest,
} from '@/lib/oauth/authorize-validation'
import {
  OAuthProtocolError,
  lookupOAuthClient,
} from '@/lib/oauth/protocol-client'

export const metadata: Metadata = {
  title: 'Anslut MCP-klient',
  description:
    'Godkänn att en MCP-klient (Claude/Cursor/Goose/etc) får läsa din Selvra.',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      urlParams.set(key, value)
    } else if (Array.isArray(value) && value.length > 0) {
      urlParams.set(key, value[0])
    }
  }

  const parsed = parseAuthorizeRequest(urlParams)
  if ('kind' in parsed) {
    return <AuthorizeErrorPage message={errorMessage(parsed)} />
  }

  // Auth-gate: krävs inloggad user för att kunna godkänna
  const session = await auth()
  if (!session?.user?.id) {
    const nextUrl = `/oauth/authorize?${urlParams.toString()}`
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`)
  }

  // Slå upp client via selvra-protocol (validerar att DCR är gjord)
  let clientInfo
  try {
    clientInfo = await lookupOAuthClient(parsed.clientId)
  } catch (err) {
    if (err instanceof OAuthProtocolError) {
      // 404 → unknown client; 500 → protocol-fel
      return (
        <AuthorizeErrorPage
          message={
            err.status === 404
              ? `Okänt client_id "${parsed.clientId}". Klienten behöver DCR-registrera sig först.`
              : `Selvra-protokollet svarar inte: ${err.oauthDescription}`
          }
        />
      )
    }
    throw err
  }

  // Validera att klient-skickad redirect_uri är någon av de registered
  if (!clientInfo.redirect_uris.includes(parsed.redirectUri)) {
    // Per RFC 6749 §3.1.2.4 — visa felmeddelande i vår UI, redirecta INTE
    // till en redirect_uri som inte är pre-registrerad (open-redirect-skydd)
    return (
      <AuthorizeErrorPage
        message={
          `redirect_uri "${parsed.redirectUri}" matchar inte någon av ` +
          `${clientInfo.client_name}s registered redirect_uris. ` +
          `Klient-utvecklare: be klienten registrera URI:n via DCR först.`
        }
      />
    )
  }

  // Validera att begärd scope är subset av klientens registered scope
  const requestedScopes = new Set(parsed.scope.split(/\s+/).filter(Boolean))
  const registeredScopes = new Set(
    clientInfo.scope.split(/\s+/).filter(Boolean),
  )
  for (const s of requestedScopes) {
    if (!registeredScopes.has(s)) {
      const errorUrl = buildErrorRedirect(
        parsed.redirectUri,
        'invalid_scope',
        `Scope "${s}" är inte registrerat för denna klient`,
        parsed.state,
      )
      redirect(errorUrl)
    }
  }

  return (
    <ConsentScreen
      clientName={clientInfo.client_name}
      clientId={parsed.clientId}
      redirectUri={parsed.redirectUri}
      scope={parsed.scope}
      state={parsed.state}
      codeChallenge={parsed.codeChallenge}
      codeChallengeMethod={parsed.codeChallengeMethod}
    />
  )
}

function AuthorizeErrorPage({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header>
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(28px, 4vw + 0.5rem, 42px)',
              lineHeight: 1.15,
              color: 'var(--color-ink)',
            }}
          >
            Anslutning gick inte att förbereda
          </h1>
        </header>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          {message}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Detta är ett OAuth-flow för MCP-klienter. Om du klickade på en
          länk i en LLM-klient och hamnade här utan att förvänta dig det
          — kontakta klient-utvecklaren.
        </p>
      </article>
    </main>
  )
}
