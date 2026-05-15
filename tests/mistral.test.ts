// Mistral LLM-client tester — mockar @mistralai/mistralai SDK.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 'server-only' är Next.js build-time-package — ej tillgänglig i vitest.
// Stubb:as till tom modul så imports av server-only-filer fungerar.
vi.mock('server-only', () => ({}))

// Hoisted mock-state — refs måste finnas innan vi.mock-factorerna kör.
const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}))

vi.mock('@mistralai/mistralai', () => ({
  // Mistral är en class — `new Mistral(...)` kallas i src. function-keyword
  // (inte arrow) krävs för att new fungerar med vi.fn(). `this`-bindning
  // sätter chat-objektet på instansen.
  Mistral: vi.fn(function (this: { chat: { complete: typeof mockComplete } }) {
    this.chat = { complete: mockComplete }
  }),
}))

// Logger mockas så test-output är ren
vi.mock('@/lib/logging', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

// Återställ MISTRAL_API_KEY mellan tester så lazy-init testas korrekt
const ORIGINAL_API_KEY = process.env.MISTRAL_API_KEY
const ORIGINAL_MODEL = process.env.MISTRAL_MODEL

beforeEach(() => {
  process.env.MISTRAL_API_KEY = 'test-key-stub'
  delete process.env.MISTRAL_MODEL
  mockComplete.mockReset()
  // Återställ klient-singleton mellan tester
  vi.resetModules()
})

afterEach(() => {
  if (ORIGINAL_API_KEY !== undefined) {
    process.env.MISTRAL_API_KEY = ORIGINAL_API_KEY
  } else {
    delete process.env.MISTRAL_API_KEY
  }
  if (ORIGINAL_MODEL !== undefined) {
    process.env.MISTRAL_MODEL = ORIGINAL_MODEL
  } else {
    delete process.env.MISTRAL_MODEL
  }
})

describe('callMistral — happy path', () => {
  it('returnerar text-content från response', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'Selvras svar.' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    const result = await callMistral([
      { role: 'system', content: 'Du är Selvra.' },
      { role: 'user', content: 'Hej.' },
    ])

    expect(result).toBe('Selvras svar.')
  })

  it('skickar messages-array oförändrad till SDK', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    const messages = [
      { role: 'system' as const, content: 'sys' },
      { role: 'user' as const, content: 'u1' },
      { role: 'assistant' as const, content: 'a1' },
      { role: 'user' as const, content: 'u2' },
    ]
    await callMistral(messages)

    expect(mockComplete).toHaveBeenCalledOnce()
    const call = mockComplete.mock.calls[0][0]
    expect(call.messages).toEqual(messages)
  })

  it('default-modell är mistral-large-latest', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral([{ role: 'user', content: 'x' }])

    expect(mockComplete.mock.calls[0][0].model).toBe('mistral-large-latest')
  })

  it('MISTRAL_MODEL env-var override:ar default', async () => {
    process.env.MISTRAL_MODEL = 'mistral-small-latest'
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral([{ role: 'user', content: 'x' }])

    expect(mockComplete.mock.calls[0][0].model).toBe('mistral-small-latest')
  })
})

describe('callMistral — retry-hint', () => {
  it('läggs som extra system-message när angiven', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'rättat svar' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral(
      [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'u' },
      ],
      'Förra svaret bröt mot regel X.',
    )

    const sentMessages = mockComplete.mock.calls[0][0].messages
    expect(sentMessages).toHaveLength(3)
    expect(sentMessages[2]).toEqual({
      role: 'system',
      content: 'Förra svaret bröt mot regel X.',
    })
  })

  it('utan retry-hint: messages oförändrad längd', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'u' },
    ])

    expect(mockComplete.mock.calls[0][0].messages).toHaveLength(2)
  })
})

describe('callMistral — fel-vägar', () => {
  it('saknad MISTRAL_API_KEY → tydligt fel', async () => {
    delete process.env.MISTRAL_API_KEY

    const { callMistral } = await import('../src/lib/llm/mistral')
    await expect(
      callMistral([{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/MISTRAL_API_KEY/)
  })

  it('tom content → kastar', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: '' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await expect(
      callMistral([{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/non-string or empty/)
  })

  it('non-string content → kastar', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await expect(
      callMistral([{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/non-string or empty/)
  })

  it('SDK kastar (rate limit, network) → re-kastas', async () => {
    mockComplete.mockRejectedValue(new Error('Rate limit exceeded'))

    const { callMistral } = await import('../src/lib/llm/mistral')
    await expect(
      callMistral([{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/Rate limit/)
  })

  it('saknade choices → kastar', async () => {
    mockComplete.mockResolvedValue({ choices: [] })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await expect(
      callMistral([{ role: 'user', content: 'x' }]),
    ).rejects.toThrow(/non-string or empty/)
  })
})

describe('callMistral — request-parametrar', () => {
  it('temperature default 0.7', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral([{ role: 'user', content: 'x' }])

    expect(mockComplete.mock.calls[0][0].temperature).toBe(0.7)
  })

  it('maxTokens default 2000', async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    })

    const { callMistral } = await import('../src/lib/llm/mistral')
    await callMistral([{ role: 'user', content: 'x' }])

    expect(mockComplete.mock.calls[0][0].maxTokens).toBe(2000)
  })
})
