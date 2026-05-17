import 'server-only'

/**
 * Server-side helpers för OAuth 2.1 + DCR-flow mot selvra-protocol.
 *
 * Per SELVRA_AUTH_STANDARD_2026-05-17.md steg 6-7. Anropas av
 * /oauth/authorize-route och dess Server Action vid consent-godkännande.
 *
 * Säkerhet: använder SELVRA_TOKEN_ISSUER_SECRET (samma internal-auth-
 * pattern som /v1/tokens/issue). Server-only — får aldrig nå klient-
 * bundle.
 */

export type OAuthClientInfo = {
  client_id: string
  client_name: string
  redirect_uris: string[]
  scope: string
  registered_at: string
}

export type IssueAuthorizationCodeParams = {
  clientId: string
  redirectUri: string
  scope: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
  userId: string
  tenantId: string
  subjectIds: string[]
}

export type IssueAuthorizationCodeResult = {
  code: string
  expires_in: number
}

export class OAuthProtocolError extends Error {
  constructor(
    public status: number,
    public oauthError: string,
    public oauthDescription: string,
  ) {
    super(`${oauthError}: ${oauthDescription}`)
    this.name = 'OAuthProtocolError'
  }
}

function getBaseUrl(): string {
  const url = process.env.SELVRA_PROTOCOL_URL
  if (!url) {
    throw new Error(
      'SELVRA_PROTOCOL_URL env-var saknas. Sätt i Vercel env för production.',
    )
  }
  return url.replace(/\/$/, '')
}

function getInternalSecret(): string {
  const secret = process.env.SELVRA_TOKEN_ISSUER_SECRET
  if (!secret) {
    throw new Error(
      'SELVRA_TOKEN_ISSUER_SECRET env-var saknas. Sätt i Vercel env för production.',
    )
  }
  return secret
}

/**
 * Slå upp publik client-metadata via GET /oauth/clients/{client_id}.
 *
 * Används av /oauth/authorize för att:
 * 1. Validera att client_id existerar (DCR-registrerad)
 * 2. Få client_name + redirect_uris för consent-screen-render
 * 3. Validera att klient-skickad redirect_uri är registered
 *
 * @throws OAuthProtocolError vid 404 (okänd client) eller annan HTTP-felning
 */
export async function lookupOAuthClient(
  clientId: string,
): Promise<OAuthClientInfo> {
  const baseUrl = getBaseUrl()
  const secret = getInternalSecret()

  const res = await fetch(`${baseUrl}/oauth/clients/${clientId}`, {
    method: 'GET',
    headers: {
      'X-Selvra-Internal-Secret': secret,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await safeJson(res)
    throw new OAuthProtocolError(
      res.status,
      body?.error ?? body?.detail?.error ?? 'unknown_error',
      body?.error_description ??
        body?.detail?.error_description ??
        `selvra-protocol returned ${res.status}`,
    )
  }

  return (await res.json()) as OAuthClientInfo
}

/**
 * Utfärda authorization-code via POST /oauth/authorize/issue.
 *
 * Anropas av Server Action efter att user godkänt consent. Returnerar
 * den genererade code:n som vi sedan redirectar tillbaka till klientens
 * redirect_uri.
 *
 * @throws OAuthProtocolError vid validation-fel eller server-fel
 */
export async function issueOAuthAuthorizationCode(
  params: IssueAuthorizationCodeParams,
): Promise<IssueAuthorizationCodeResult> {
  const baseUrl = getBaseUrl()
  const secret = getInternalSecret()

  const res = await fetch(`${baseUrl}/oauth/authorize/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Selvra-Internal-Secret': secret,
    },
    body: JSON.stringify({
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope,
      code_challenge: params.codeChallenge,
      code_challenge_method: params.codeChallengeMethod,
      user_id: params.userId,
      tenant_id: params.tenantId,
      subject_ids: params.subjectIds,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await safeJson(res)
    throw new OAuthProtocolError(
      res.status,
      body?.error ?? body?.detail?.error ?? 'unknown_error',
      body?.error_description ??
        body?.detail?.error_description ??
        `selvra-protocol returned ${res.status}`,
    )
  }

  return (await res.json()) as IssueAuthorizationCodeResult
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json()
  } catch {
    return null
  }
}
