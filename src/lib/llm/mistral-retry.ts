/**
 * Mistral retry-wrapper med exponential backoff + jitter.
 *
 * Skalbarhets-audit 2026-05-16 (item #15): Mistral-anrop saknade
 * rate-limit-detection och retry-logik. Vid 100k MAU eller traffic-spike
 * kan en enskild 429 cascada till user-facing fallback-storm.
 *
 * Strategi: catch:a MistralError från SDK:n. Vid retry-able statusCode
 * (429, 502, 503, 504) backoff:a och retry:a. Vid icke-retry-able status
 * (400, 401, 422) eller efter MAX_ATTEMPTS, propagera felet.
 *
 * Streaming-fall: kan inte retry mid-stream (Mistral har redan börjat
 * skicka tokens). Streaming-wrapper retry:ar bara om felet kommer FÖRE
 * första chunk har emitterats — denna helper är då användbar för
 * `getClient().chat.stream(...)`-anropet self.
 *
 * Jitter: ±25% av backoff-värdet, undviker thundering-herd om många
 * requests rate-limitas samtidigt.
 *
 * Sentry: emittar warning vid första retry (per request-id) så Carl ser
 * om vi börjar närma oss Mistral-limit utan att felen blir user-facing.
 */

import * as Sentry from '@sentry/nextjs'
import { MistralError } from '@mistralai/mistralai/models/errors'

import { logger } from '@/lib/logging'

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 1000
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])

export type RetryOptions = {
  /** Antal försök inklusive första. Default 3. */
  maxAttempts?: number
  /** Initial delay i ms. Default 1000. Backoff dubblas per attempt. */
  baseDelayMs?: number
  /** Logging-kontext för observabilitet. */
  module?: string
  /** Skip backoff i tester. */
  sleep?: (ms: number) => Promise<void>
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse Retry-After-header. Mistral kan skicka antingen sekunder eller
 * HTTP-date. Returnerar ms eller null om header saknas/oparsbar.
 */
export function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null
  const trimmed = headerValue.trim()

  // Numerisk sekund-värde
  const asNum = Number(trimmed)
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum < 86400) {
    return Math.round(asNum * 1000)
  }

  // HTTP-date format
  const asDate = Date.parse(trimmed)
  if (!Number.isNaN(asDate)) {
    const delta = asDate - Date.now()
    if (delta > 0 && delta < 86_400_000) return delta
  }

  return null
}

/**
 * Bestäm retry-delay för attempt-nummer N (0-indexerat = första retry).
 * Använder Retry-After om server gav den, annars exponential backoff
 * med ±25% jitter.
 */
export function computeRetryDelay(
  attemptIndex: number,
  baseDelayMs: number,
  retryAfterMs: number | null,
): number {
  if (retryAfterMs !== null) return retryAfterMs

  const exponential = baseDelayMs * Math.pow(2, attemptIndex)
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1) // ±25%
  return Math.max(0, Math.round(exponential + jitter))
}

/**
 * Wrapping-helper för Mistral-calls. Använd som:
 *
 *   const result = await withMistralRetry(
 *     () => getClient().chat.complete({...}),
 *     { module: 'llm/mistral' }
 *   )
 *
 * Returnerar fn():s värde direkt. Throw:ar:
 *   - MistralError vid icke-retry-able status (caller hanterar)
 *   - MistralError efter MAX_ATTEMPTS retry-able (caller fallback:ar)
 *   - Vilken som helst icke-MistralError (network, etc) — INTE retry:ad
 */
export async function withMistralRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const baseDelay = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const sleep = opts.sleep ?? defaultSleep
  const log = logger.child({ module: opts.module ?? 'llm/mistral-retry' })

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      // Bara MistralError är retry-able. Network-errors etc. propageras
      // direkt — de signalerar djupare problem som retry inte löser.
      if (!(err instanceof MistralError)) {
        throw err
      }

      if (!RETRYABLE_STATUS.has(err.statusCode)) {
        // 400/401/422 etc — caller bug eller auth-fail, ingen mening retry:a
        throw err
      }

      // Vi är vid sista attempt — ingen mer retry, propagera
      if (attempt === maxAttempts - 1) {
        log.warn('mistral_retry_exhausted', {
          statusCode: err.statusCode,
          attempts: maxAttempts,
        })
        Sentry.captureMessage('Mistral retry exhausted', {
          level: 'error',
          tags: { mistral_status: String(err.statusCode) },
          extra: { attempts: maxAttempts, body: err.body.slice(0, 500) },
        })
        throw err
      }

      const retryAfter = parseRetryAfter(err.headers.get('retry-after'))
      const delayMs = computeRetryDelay(attempt, baseDelay, retryAfter)

      log.info('mistral_retry_scheduled', {
        statusCode: err.statusCode,
        attempt: attempt + 1,
        maxAttempts,
        delayMs,
        retryAfterFromHeader: retryAfter !== null,
      })

      // Sentry-alert vid FIRST 429 så Carl ser om vi nära limit. Senare
      // retries i samma chain alertar inte (skulle spam:a om sustained).
      if (attempt === 0 && err.statusCode === 429) {
        Sentry.captureMessage('Mistral rate-limit (429) hit, retrying', {
          level: 'warning',
          tags: { mistral_status: '429' },
          extra: {
            retryAfterMs: retryAfter,
            scheduledDelayMs: delayMs,
          },
        })
      }

      await sleep(delayMs)
    }
  }

  // Borde aldrig nås — loop:en throw:ar vid sista attempt.
  throw lastError ?? new Error('withMistralRetry: oväntad exit')
}
