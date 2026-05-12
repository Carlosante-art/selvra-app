import { describe, expect, it } from 'vitest'

import type {
  IntentionPayload,
  IntentionSelfDirectedPayload,
  IntentionDeliveryRhythmPayload,
} from '../src/lib/protocol/types'

/**
 * Type-narrowing-tester för IntentionPayload-discriminated-union.
 *
 * Selvra-protokollet differentierar self-directed-intentioner (fritext-mål)
 * från delivery-rhythm-preferences (kategorial). Discriminated-union säkrar
 * att felaktig sammanslagning av payload-fält ger compile-error, inte
 * runtime-bug. Dessa tester är dokumentation av kontraktet — om någon
 * ändrar IntentionPayload-struktur, failar testen och förändringen blir
 * synlig.
 */

describe('IntentionPayload discriminated-union', () => {
  it('accepts self_directed-form med text + null value', () => {
    const payload: IntentionSelfDirectedPayload = {
      intent_type: 'self_directed',
      text: 'Träna fyra gånger i veckan',
      value: null,
      temporal_validity: {
        valid_from: '2026-03-01T00:00:00Z',
        valid_until: null,
      },
      declared_at: '2026-03-01T08:00:00Z',
    }
    expect(payload.intent_type).toBe('self_directed')
    expect(payload.text).toBeTypeOf('string')
    expect(payload.value).toBeNull()
  })

  it('accepts delivery_rhythm-form med null text + rhythm-value', () => {
    const payload: IntentionDeliveryRhythmPayload = {
      intent_type: 'delivery_rhythm',
      text: null,
      value: {
        rhythm: 'sunday_morning',
        custom_description: null,
      },
      temporal_validity: {
        valid_from: '2026-03-01T00:00:00Z',
        valid_until: null,
      },
      declared_at: '2026-03-01T08:00:00Z',
    }
    expect(payload.intent_type).toBe('delivery_rhythm')
    expect(payload.text).toBeNull()
    expect(payload.value.rhythm).toBe('sunday_morning')
  })

  it('IntentionPayload union accepts båda formerna', () => {
    const intentions: IntentionPayload[] = [
      {
        intent_type: 'self_directed',
        text: 'Sova sju timmar',
        value: null,
        temporal_validity: { valid_from: '2026-01-01T00:00:00Z', valid_until: null },
        declared_at: '2026-01-01T00:00:00Z',
      },
      {
        intent_type: 'delivery_rhythm',
        text: null,
        value: { rhythm: 'friday_afternoon', custom_description: null },
        temporal_validity: { valid_from: '2026-01-01T00:00:00Z', valid_until: null },
        declared_at: '2026-01-01T00:00:00Z',
      },
    ]
    expect(intentions).toHaveLength(2)
    expect(intentions[0].intent_type).not.toBe(intentions[1].intent_type)
  })
})
