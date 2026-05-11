'use server'

import { redirect } from 'next/navigation'

import { recordThought } from '@/lib/protocol/client'

const MAX_THOUGHT_CHARS = 4000

export async function submitThought(formData: FormData): Promise<void> {
  const raw = formData.get('text')
  if (typeof raw !== 'string') return

  const text = raw.trim()
  if (text.length === 0) return

  // Hård gräns för att inte trigga protokollets payload-size-guard.
  const bounded = text.length > MAX_THOUGHT_CHARS ? text.slice(0, MAX_THOUGHT_CHARS) : text

  const now = new Date().toISOString()
  await recordThought({
    text: bounded,
    captured_at: now,
  })

  // Subtil bekräftelse via searchParam — sparad-flash + tid.
  const flash = encodeURIComponent(now)
  redirect(`/thoughts?saved=${flash}`)
}
