'use server'

import { redirect } from 'next/navigation'

import { declareIntention } from '@/lib/protocol/client'
import type {
  DeliveryRhythm,
  IntentionDeliveryRhythmPayload,
  IntentionSelfDirectedPayload,
} from '@/lib/protocol/types'

const VALID_RHYTHMS: ReadonlySet<DeliveryRhythm> = new Set([
  'sunday_morning',
  'friday_afternoon',
  'before_events',
  'custom',
])

export async function submitIntentions(formData: FormData): Promise<void> {
  const selfDirected: string[] = []
  for (let i = 1; i <= 5; i++) {
    const raw = formData.get(`intention_${i}`)
    if (typeof raw !== 'string') continue
    const text = raw.trim()
    if (text.length > 0) selfDirected.push(text)
  }

  const rhythmRaw = formData.get('rhythm')
  const rhythm =
    typeof rhythmRaw === 'string' && VALID_RHYTHMS.has(rhythmRaw as DeliveryRhythm)
      ? (rhythmRaw as DeliveryRhythm)
      : null

  const customRaw = formData.get('rhythm_custom')
  const customDescription =
    typeof customRaw === 'string' && customRaw.trim().length > 0
      ? customRaw.trim()
      : null

  const now = new Date().toISOString()

  // Self-directed intentions — submit sequentially. Selvra source-rate-limit
  // är 5/min default, så 5 + 1 rhythm går precis under taket.
  for (const text of selfDirected) {
    const payload: IntentionSelfDirectedPayload = {
      intent_type: 'self_directed',
      text,
      value: null,
      temporal_validity: { valid_from: now, valid_until: null },
      declared_at: now,
    }
    await declareIntention(payload)
  }

  // Delivery rhythm — optional, en gång.
  if (rhythm) {
    const payload: IntentionDeliveryRhythmPayload = {
      intent_type: 'delivery_rhythm',
      text: null,
      value: {
        rhythm,
        custom_description: rhythm === 'custom' ? customDescription : null,
      },
      temporal_validity: { valid_from: now, valid_until: null },
      declared_at: now,
    }
    await declareIntention(payload)
  }

  redirect('/onboarding/sources')
}
