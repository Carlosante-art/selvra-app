/**
 * Validering av query-params för /oauth/authorize-route.
 *
 * Per RFC 6749 §4.1.1 + RFC 7636 PKCE.
 *
 * Skiljs från redirect_uri-validering på selvra-protocol-sidan (DCR-policy).
 * Här validerar vi att klient-request:n är välformad nog för att kunna
 * fortsätta till consent-render. Server-side validering av redirect_uri
 * mot DCR-registrerade URIs sker via lookupOAuthClient().
 */

export type AuthorizeRequest = {
  responseType: string
  clientId: string
  redirectUri: string
  scope: string
  state: string | undefined
  codeChallenge: string
  codeChallengeMethod: string
}

export type AuthorizeValidationError =
  | { kind: 'missing_param'; param: string }
  | { kind: 'invalid_response_type'; got: string }
  | { kind: 'invalid_client_id'; got: string }
  | { kind: 'invalid_code_challenge_method'; got: string }
  | { kind: 'invalid_code_challenge' }
  | { kind: 'invalid_scope'; got: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseAuthorizeRequest(
  searchParams: URLSearchParams,
): AuthorizeRequest | AuthorizeValidationError {
  const required = [
    'response_type',
    'client_id',
    'redirect_uri',
    'scope',
    'code_challenge',
    'code_challenge_method',
  ]
  for (const param of required) {
    if (!searchParams.get(param)) {
      return { kind: 'missing_param', param }
    }
  }

  const responseType = searchParams.get('response_type')!
  if (responseType !== 'code') {
    return { kind: 'invalid_response_type', got: responseType }
  }

  const clientId = searchParams.get('client_id')!
  if (!UUID_RE.test(clientId)) {
    return { kind: 'invalid_client_id', got: clientId }
  }

  const codeChallengeMethod = searchParams.get('code_challenge_method')!
  if (codeChallengeMethod !== 'S256') {
    return { kind: 'invalid_code_challenge_method', got: codeChallengeMethod }
  }

  const codeChallenge = searchParams.get('code_challenge')!
  if (codeChallenge.length < 43 || codeChallenge.length > 128) {
    return { kind: 'invalid_code_challenge' }
  }

  const scope = searchParams.get('scope')!
  const scopes = scope.split(/\s+/).filter(Boolean)
  for (const s of scopes) {
    if (s !== 'read' && s !== 'write') {
      return { kind: 'invalid_scope', got: s }
    }
  }

  return {
    responseType,
    clientId,
    redirectUri: searchParams.get('redirect_uri')!,
    scope,
    state: searchParams.get('state') ?? undefined,
    codeChallenge,
    codeChallengeMethod,
  }
}

export function errorMessage(err: AuthorizeValidationError): string {
  switch (err.kind) {
    case 'missing_param':
      return `Parameter "${err.param}" saknas`
    case 'invalid_response_type':
      return `response_type måste vara "code" (fick "${err.got}")`
    case 'invalid_client_id':
      return `client_id är inte ett giltigt UUID`
    case 'invalid_code_challenge_method':
      return `code_challenge_method måste vara "S256" (fick "${err.got}")`
    case 'invalid_code_challenge':
      return `code_challenge har felaktig längd (förväntat 43-128 chars för S256)`
    case 'invalid_scope':
      return `scope "${err.got}" stöds inte (read/write)`
  }
}

/**
 * Bygg redirect-URL tillbaka till klient med error i query.
 * Per RFC 6749 §4.1.2.1 (error response).
 */
export function buildErrorRedirect(
  redirectUri: string,
  error: string,
  errorDescription: string,
  state: string | undefined,
): string {
  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  url.searchParams.set('error_description', errorDescription)
  if (state) {
    url.searchParams.set('state', state)
  }
  return url.toString()
}

/**
 * Bygg redirect-URL tillbaka till klient med success-code.
 * Per RFC 6749 §4.1.2.
 */
export function buildSuccessRedirect(
  redirectUri: string,
  code: string,
  state: string | undefined,
): string {
  const url = new URL(redirectUri)
  url.searchParams.set('code', code)
  if (state) {
    url.searchParams.set('state', state)
  }
  return url.toString()
}
