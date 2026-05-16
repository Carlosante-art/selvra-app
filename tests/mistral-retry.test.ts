// withMistralRetry-tester. Verifierar retry-logik vid 429/5xx, korrekt
// pass-through vid 4xx (icke-retry-able), parseRetryAfter och
// computeRetryDelay deterministiskt.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}))

import { MistralError } from '@mistralai/mistralai/models/errors'

import {
  computeRetryDelay,
  parseRetryAfter,
  withMistralRetry,
} from '@/lib/llm/mistral-retry'

// Mistral SDK's MistralError-constructor kräver Response + Request +
// body-string. Skapa minimal fixture-funktion.
function makeMistralError(statusCode: number, headers: Record<string, string> = {}): MistralError {
  const response = new Response('mock body', {
    status: statusCode,
    headers,
  })
  const request = new Request('https://api.mistral.ai/v1/chat')
  return new MistralError(`HTTP ${statusCode}`, {
    response,
    request,
    body: 'mock body',
  })
}

const noSleep = () => Promise.resolve()

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseRetryAfter', () => {
  it('parsar numeriska sekunder', () => {
    expect(parseRetryAfter('5')).toBe(5000)
    expect(parseRetryAfter('0')).toBe(0)
    expect(parseRetryAfter('30')).toBe(30000)
  })

  it('parsar HTTP-date', () => {
    const future = new Date(Date.now() + 10_000)
    const result = parseRetryAfter(future.toUTCString())
    expect(result).toBeGreaterThan(8_000)
    expect(result).toBeLessThan(11_000)
  })

  it('returnerar null vid null/empty/invalid', () => {
    expect(parseRetryAfter(null)).toBeNull()
    expect(parseRetryAfter('')).toBeNull()
    expect(parseRetryAfter('not-a-date')).toBeNull()
  })

  it('returnerar null vid orimligt stora värden', () => {
    expect(parseRetryAfter('999999')).toBeNull()
    expect(parseRetryAfter('-5')).toBeNull()
  })

  it('returnerar null vid HTTP-date i förflutet', () => {
    const past = new Date(Date.now() - 60_000)
    expect(parseRetryAfter(past.toUTCString())).toBeNull()
  })
})

describe('computeRetryDelay', () => {
  it('föredrar Retry-After om angivet', () => {
    expect(computeRetryDelay(0, 1000, 5000)).toBe(5000)
    expect(computeRetryDelay(2, 1000, 7000)).toBe(7000) // ignorerar baseDelay
  })

  it('exponential backoff från baseDelay om Retry-After saknas', () => {
    // attempt 0: ~1000ms ± 25%
    // attempt 1: ~2000ms ± 25%
    // attempt 2: ~4000ms ± 25%
    const d0 = computeRetryDelay(0, 1000, null)
    const d1 = computeRetryDelay(1, 1000, null)
    const d2 = computeRetryDelay(2, 1000, null)

    expect(d0).toBeGreaterThanOrEqual(750)
    expect(d0).toBeLessThanOrEqual(1250)
    expect(d1).toBeGreaterThanOrEqual(1500)
    expect(d1).toBeLessThanOrEqual(2500)
    expect(d2).toBeGreaterThanOrEqual(3000)
    expect(d2).toBeLessThanOrEqual(5000)
  })

  it('clampar till 0 (negativ jitter ska inte ge negativ delay)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // → jitter = -25%
    expect(computeRetryDelay(0, 100, null)).toBeGreaterThanOrEqual(0)
  })
})

describe('withMistralRetry — happy-path', () => {
  it('returnerar fn() vid success utan retry', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withMistralRetry(fn, { sleep: noSleep })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('withMistralRetry — retryable status', () => {
  it('retry:ar vid 429 och lyckas på andra försök', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeMistralError(429))
      .mockResolvedValueOnce('ok')

    const result = await withMistralRetry(fn, { sleep: noSleep })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retry:ar vid 502/503/504', async () => {
    for (const status of [502, 503, 504]) {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(makeMistralError(status))
        .mockResolvedValueOnce('ok')
      const result = await withMistralRetry(fn, { sleep: noSleep })
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(2)
    }
  })

  it('respekterar Retry-After-header', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeMistralError(429, { 'retry-after': '3' }))
      .mockResolvedValueOnce('ok')

    await withMistralRetry(fn, { sleep })
    expect(sleep).toHaveBeenCalledWith(3000)
  })

  it('throw:ar efter MAX_ATTEMPTS retries', async () => {
    const fn = vi.fn().mockRejectedValue(makeMistralError(429))
    await expect(
      withMistralRetry(fn, { sleep: noSleep, maxAttempts: 3 }),
    ).rejects.toBeInstanceOf(MistralError)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('withMistralRetry — non-retryable status', () => {
  it('throw:ar direkt vid 400 utan retry', async () => {
    const fn = vi.fn().mockRejectedValue(makeMistralError(400))
    await expect(withMistralRetry(fn, { sleep: noSleep })).rejects.toBeInstanceOf(
      MistralError,
    )
    expect(fn).toHaveBeenCalledOnce()
  })

  it('throw:ar direkt vid 401 (auth-fel)', async () => {
    const fn = vi.fn().mockRejectedValue(makeMistralError(401))
    await expect(withMistralRetry(fn, { sleep: noSleep })).rejects.toBeInstanceOf(
      MistralError,
    )
    expect(fn).toHaveBeenCalledOnce()
  })

  it('throw:ar direkt vid 422 (validation)', async () => {
    const fn = vi.fn().mockRejectedValue(makeMistralError(422))
    await expect(withMistralRetry(fn, { sleep: noSleep })).rejects.toBeInstanceOf(
      MistralError,
    )
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('withMistralRetry — non-MistralError', () => {
  it('propagerar network-error utan retry', async () => {
    const networkErr = new Error('ECONNRESET')
    const fn = vi.fn().mockRejectedValue(networkErr)

    await expect(withMistralRetry(fn, { sleep: noSleep })).rejects.toThrow('ECONNRESET')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('propagerar generisk Error utan retry', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('something else'))
    await expect(withMistralRetry(fn, { sleep: noSleep })).rejects.toThrow('something else')
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('withMistralRetry — Sentry-alerting', () => {
  it('alertar på första 429 men inte på efterföljande retries', async () => {
    const Sentry = await import('@sentry/nextjs')
    const captureMessageMock = Sentry.captureMessage as ReturnType<typeof vi.fn>
    captureMessageMock.mockClear()

    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeMistralError(429))
      .mockRejectedValueOnce(makeMistralError(429))
      .mockResolvedValueOnce('ok')

    await withMistralRetry(fn, { sleep: noSleep })

    // Endast ETT call till captureMessage från first-429-alert.
    // (Andra 429 ger ingen ny alert — antalet captureMessage ska vara 1.)
    expect(captureMessageMock).toHaveBeenCalledTimes(1)
    expect(captureMessageMock.mock.calls[0][1].level).toBe('warning')
    expect(captureMessageMock.mock.calls[0][1].tags?.mistral_status).toBe('429')
  })

  it('alertar med level=error vid retry-exhausted', async () => {
    const Sentry = await import('@sentry/nextjs')
    const captureMessageMock = Sentry.captureMessage as ReturnType<typeof vi.fn>
    captureMessageMock.mockClear()

    const fn = vi.fn().mockRejectedValue(makeMistralError(503))
    await expect(
      withMistralRetry(fn, { sleep: noSleep, maxAttempts: 2 }),
    ).rejects.toBeInstanceOf(MistralError)

    // Vid 503 alertar vi inte på first-attempt (bara 429 → warning). Efter
    // exhaustion alertar vi med error.
    const errorCalls = captureMessageMock.mock.calls.filter(
      (call) => call[1]?.level === 'error',
    )
    expect(errorCalls.length).toBe(1)
    expect(errorCalls[0][0]).toContain('exhausted')
  })
})
