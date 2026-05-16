import 'server-only'

/**
 * REST-respons-helpers för iOS-konsumtion. Konsistent shape + error-codes
 * per .gsd/IOS_API_SPEC_2026-05-16.md.
 *
 * Användning:
 *   return ok({ threads: [...] })
 *   return error('UNAUTHORIZED', 'Logga in först')
 *   return notFound('Tråd finns ej')
 */

export type ApiError = {
  code: ApiErrorCode
  message: string
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'LLM_PROVIDER_FAILED'
  | 'CIRCUIT_OPEN'
  | 'INTERNAL_ERROR'

const STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  RATE_LIMITED: 429,
  LLM_PROVIDER_FAILED: 502,
  CIRCUIT_OPEN: 503,
  INTERNAL_ERROR: 500,
}

/**
 * Bygg X-Request-Id-header för debugging-traceability.
 */
function buildHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Request-Id': crypto.randomUUID(),
    ...(extra ?? {}),
  }
}

export function ok<T extends object>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: buildHeaders(),
  })
}

export function created<T extends object>(payload: T): Response {
  return ok(payload, 201)
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: buildHeaders() })
}

export function error(
  code: ApiErrorCode,
  message: string,
  extraHeaders?: Record<string, string>,
): Response {
  const status = STATUS_MAP[code]
  return new Response(
    JSON.stringify({ error: { code, message } }),
    { status, headers: buildHeaders(extraHeaders) },
  )
}

export function unauthorized(message = 'Inloggning krävs.'): Response {
  return error('UNAUTHORIZED', message)
}

export function forbidden(message = 'Saknar access.'): Response {
  return error('FORBIDDEN', message)
}

export function notFound(message = 'Hittades inte.'): Response {
  return error('NOT_FOUND', message)
}

export function badRequest(message: string): Response {
  return error('BAD_REQUEST', message)
}

export function rateLimited(message: string, retryAfterSeconds: number): Response {
  return error('RATE_LIMITED', message, {
    'Retry-After': String(retryAfterSeconds),
  })
}

export function internalError(message = 'Internt fel.'): Response {
  return error('INTERNAL_ERROR', message)
}

/**
 * Helper: validera och parsa JSON-body. Returnerar tuple
 * [body, errorResponse] där exakt en är null.
 */
export async function parseJsonBody<T>(
  req: Request,
): Promise<[T, null] | [null, Response]> {
  try {
    const body = await req.json()
    return [body as T, null]
  } catch {
    return [null, badRequest('Ogiltigt JSON-format.')]
  }
}
