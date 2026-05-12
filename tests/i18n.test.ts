import { describe, expect, it } from 'vitest'

import sv from '../locales/sv.json'
import en from '../locales/en.json'

/**
 * i18n-scaffold-test. Verifierar att sv och en har samma struktur så
 * nyckel-mismatch inte uppstår vid translation-lookup.
 *
 * Inte test av t()-funktionen direkt — den kräver Next.js-server-context
 * (cookies/headers) som inte är trivialt att stuba i unit-test.
 */

type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

function flatKeys(obj: Json, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(obj).flatMap(([k, v]) => {
    const next = prefix ? `${prefix}.${k}` : k
    return flatKeys(v as Json, next)
  })
}

describe('i18n locales', () => {
  it('sv and en have identical key sets', () => {
    const svKeys = flatKeys(sv as Json).sort()
    const enKeys = flatKeys(en as Json).sort()
    expect(enKeys).toEqual(svKeys)
  })

  it('all sv values are non-empty strings', () => {
    const keys = flatKeys(sv as Json)
    for (const key of keys) {
      const parts = key.split('.')
      let cur: unknown = sv
      for (const p of parts) cur = (cur as Record<string, unknown>)[p]
      expect(typeof cur).toBe('string')
      expect((cur as string).length).toBeGreaterThan(0)
    }
  })

  it('all en values are non-empty strings', () => {
    const keys = flatKeys(en as Json)
    for (const key of keys) {
      const parts = key.split('.')
      let cur: unknown = en
      for (const p of parts) cur = (cur as Record<string, unknown>)[p]
      expect(typeof cur).toBe('string')
      expect((cur as string).length).toBeGreaterThan(0)
    }
  })
})
