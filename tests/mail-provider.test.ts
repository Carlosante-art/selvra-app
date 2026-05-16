// Mail-abstraktion-tester. Verifierar att getMailProvider() väljer rätt
// implementation baserat på MAIL_PROVIDER env-var och att ResendMailProvider
// gör korrekt HTTP-call-shape (Auth.js-kompatibelt format).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { __resetMailProviderForTesting, getMailProvider } from '@/lib/mail'
import { ResendMailProvider } from '@/lib/mail/resend'

const originalEnv = { ...process.env }

beforeEach(() => {
  __resetMailProviderForTesting()
  // Reset till känt state
  delete process.env.MAIL_PROVIDER
  delete process.env.RESEND_API_KEY
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe('getMailProvider — factory', () => {
  it('default till resend när MAIL_PROVIDER ej satt', () => {
    process.env.RESEND_API_KEY = 're_test123'
    const provider = getMailProvider()
    expect(provider.providerName).toBe('resend')
  })

  it('case-insensitive provider-namn', () => {
    process.env.MAIL_PROVIDER = 'RESEND'
    process.env.RESEND_API_KEY = 're_test123'
    const provider = getMailProvider()
    expect(provider.providerName).toBe('resend')
  })

  it('throw vid resend utan API-key', () => {
    process.env.MAIL_PROVIDER = 'resend'
    expect(() => getMailProvider()).toThrow(/RESEND_API_KEY/)
  })

  it('throw vid postmark (ej implementerad)', () => {
    process.env.MAIL_PROVIDER = 'postmark'
    expect(() => getMailProvider()).toThrow(/postmark.*inte implementerad/)
  })

  it('throw vid mailgun (ej implementerad)', () => {
    process.env.MAIL_PROVIDER = 'mailgun'
    expect(() => getMailProvider()).toThrow(/mailgun.*inte implementerad/)
  })

  it('throw vid okänd provider', () => {
    process.env.MAIL_PROVIDER = 'sendgrid'
    expect(() => getMailProvider()).toThrow(/sendgrid.*okänt/)
  })

  it('cachar provider-instans (singleton)', () => {
    process.env.RESEND_API_KEY = 're_test123'
    const a = getMailProvider()
    const b = getMailProvider()
    expect(a).toBe(b)
  })
})

describe('ResendMailProvider — HTTP-call', () => {
  it('throw vid construct utan API-key', () => {
    expect(() => new ResendMailProvider('')).toThrow(/RESEND_API_KEY/)
  })

  it('POST:ar till Resend-API med Bearer-auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '',
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new ResendMailProvider('re_secret_abc')
    await provider.sendMagicLink({
      to: 'user@example.com',
      magicLink: 'https://selvra.ai/api/auth/callback?token=xyz',
      from: 'noreply@selvra.ai',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer re_secret_abc')
    expect(init.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(init.body as string)
    expect(body.to).toBe('user@example.com')
    expect(body.from).toBe('noreply@selvra.ai')
    expect(body.subject).toContain('selvra.ai')
    expect(body.html).toContain('https://selvra.ai/api/auth/callback?token=xyz')
    expect(body.text).toContain('https://selvra.ai/api/auth/callback?token=xyz')
  })

  it('throw vid HTTP-fel med status + body i meddelandet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"error":"invalid api key"}',
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new ResendMailProvider('re_bad_key')
    await expect(
      provider.sendMagicLink({
        to: 'user@example.com',
        magicLink: 'https://selvra.ai/auth?t=x',
        from: 'noreply@selvra.ai',
      }),
    ).rejects.toThrow(/HTTP 401/)
  })

  it('email-content är svensk + neutral (ingen marknadsförings-copy)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '',
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = new ResendMailProvider('re_test')
    await provider.sendMagicLink({
      to: 'user@example.com',
      magicLink: 'https://selvra.ai/auth?t=x',
      from: 'noreply@selvra.ai',
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    // Konstitutionell check: ingen FOMO, ingen "välkommen tillbaka", etc.
    expect(body.text).toMatch(/Logga in/)
    expect(body.text).toMatch(/giltig i 24 timmar/)
    expect(body.text).not.toMatch(/välkommen|grattis|fantastiskt|nytt!/i)
    expect(body.html).not.toMatch(/välkommen|grattis|fantastiskt|nytt!/i)
  })
})
