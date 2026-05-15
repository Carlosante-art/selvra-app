// PII-scrubbing — P0 enligt selvra-audit 2026-05-15. Veckobrev = max-PII-yta;
// scrubbern är andra försvarslagret efter caller-disciplin.
//
// Mappar 1:1 mot frida-app/lib/__tests__/scrub.test.ts.

import { describe, expect, it } from 'vitest'
import {
  SENSITIVE_KEY_PATTERN,
  scrubMessage,
  scrubObject,
} from '../src/lib/observability/scrub'

describe('SENSITIVE_KEY_PATTERN — fångar känsliga nyckel-namn', () => {
  it.each([
    'email',
    'e-mail',
    'EMAIL',
    'user_email',
    'note',
    'notes',
    'user_notes',
    'brief',
    'morning_brief',
    'glucose',
    'mmol',
    'value_mmol',
    'reading',
    'user_words',
    'quote',
    'lyrics',
    'password',
    'secret',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'apikey',
    'authorization',
  ])('matchar "%s"', (key) => {
    expect(SENSITIVE_KEY_PATTERN.test(key)).toBe(true)
  })

  it.each(['id', 'status', 'duration_ms', 'created_at', 'count', 'success'])(
    'rör inte ofarlig nyckel "%s"',
    (key) => {
      expect(SENSITIVE_KEY_PATTERN.test(key)).toBe(false)
    },
  )
})

describe('scrubObject — primitiver passerar', () => {
  it.each([null, undefined, 0, 1, '', 'hej', true, false])('%s', (v) => {
    expect(scrubObject(v as never)).toBe(v)
  })
})

describe('scrubObject — nyckel-baserad redaktion', () => {
  it('top-level känsliga nycklar redigeras', () => {
    const out = scrubObject({
      id: 'abc',
      email: 'kari@example.com',
      notes: 'brev-text',
      status: 'ok',
    })
    expect(out).toEqual({
      id: 'abc',
      email: '[redacted]',
      notes: '[redacted]',
      status: 'ok',
    })
  })

  it('redigerar oavsett värde-typ', () => {
    const out = scrubObject({
      value_mmol: 7.4,
      brief: { text: 'veckobrev', sections: [1, 2, 3] },
      token: { access: 'abc', refresh: 'def' },
    })
    expect(out.value_mmol).toBe('[redacted]')
    expect(out.brief).toBe('[redacted]')
    expect(out.token).toBe('[redacted]')
  })

  it('rekurserar in i nested objekt under ofarliga nycklar', () => {
    const out = scrubObject({ meta: { email: 'a@b.com', count: 3 } })
    expect(out).toEqual({ meta: { email: '[redacted]', count: 3 } })
  })

  it('rekurserar genom arrays', () => {
    const out = scrubObject([
      { email: 'a@b.com', id: 1 },
      { email: 'c@d.com', id: 2 },
    ])
    expect(out).toEqual([
      { email: '[redacted]', id: 1 },
      { email: '[redacted]', id: 2 },
    ])
  })
})

describe('scrubObject — immutability', () => {
  it('muterar inte input-objektet', () => {
    const input = { email: 'a@b.com', id: 1 }
    scrubObject(input)
    expect(input.email).toBe('a@b.com')
  })

  it('muterar inte nestat objekt', () => {
    const inner = { email: 'a@b.com' }
    scrubObject({ outer: inner })
    expect(inner.email).toBe('a@b.com')
  })
})

describe('scrubObject — säkerhet mot patologisk input', () => {
  it('djup-gräns kapar utan stack-overflow', () => {
    let deep: unknown = { email: 'leaf' }
    for (let i = 0; i < 50; i++) deep = { nested: deep }
    expect(() => scrubObject(deep)).not.toThrow()
  })

  it('cyklisk struktur kraschar inte', () => {
    type Cyclic = { id: number; self?: Cyclic }
    const a: Cyclic = { id: 1 }
    a.self = a
    expect(() => scrubObject(a)).not.toThrow()
  })
})

describe('scrubMessage — regex-skyddsnät', () => {
  it('mmol-värde: "blod 7.4 mmol nu"', () => {
    expect(scrubMessage('blod 7.4 mmol nu')).toBe('blod [redacted] nu')
  })

  it('mmol/L-variant', () => {
    expect(scrubMessage('sensorvärde 7,4 mmol/L')).toBe('sensorvärde [redacted]')
  })

  it('mg/dl-variant', () => {
    expect(scrubMessage('120 mg/dl efter måltid')).toBe('[redacted] efter måltid')
  })

  it('e-post', () => {
    expect(scrubMessage('kari@example.com loggade in')).toBe('[redacted] loggade in')
  })

  it('falska positiver: "API tog 7.4 ms" passerar', () => {
    expect(scrubMessage('API tog 7.4 ms')).toBe('API tog 7.4 ms')
  })

  it('falska positiver: "200 events laddade" passerar', () => {
    expect(scrubMessage('200 events laddade')).toBe('200 events laddade')
  })

  it('flera mönster scrubbas i samma message', () => {
    expect(
      scrubMessage('kari@example.com loggade 7.4 mmol efter pasta'),
    ).toBe('[redacted] loggade [redacted] efter pasta')
  })
})
