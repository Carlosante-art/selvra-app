'use server'

import { redirect } from 'next/navigation'

import { recordSignalPreference } from '@/lib/protocol/client'

/**
 * Server Action för signal-opt-in. Persisterar val som
 * `selvra.preference.signal_optin`-event i Selvra-protokollet
 * (kategori: profile_updated). Senare läses preferensen av
 * leverans-koden (när cron-trigger för söndag-brev byggs).
 */

export async function submitSignalPreference(formData: FormData): Promise<void> {
  const raw = formData.get('enabled')
  if (typeof raw !== 'string') {
    redirect('/onboarding/done')
    return
  }
  const enabled = raw === 'yes'
  await recordSignalPreference({
    enabled,
    delivered_at: new Date().toISOString(),
  })
  redirect('/onboarding/done')
}
