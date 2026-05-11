'use server'

import { redirect } from 'next/navigation'

import { triggerDreamerRun, triggerReflectionRun } from '@/lib/protocol/client'

/**
 * Server Actions för manuell trigger av synthesis + Dreamer från UI.
 * Båda är synkrona — tar 20-60s. Form-pending-state hanteras
 * client-side med useFormStatus().
 */

export async function regenerateBrev(): Promise<void> {
  try {
    const result = await triggerReflectionRun()
    redirect(`/brev?regenerated=${encodeURIComponent(result.event_id)}`)
  } catch (err) {
    // NEXT_REDIRECT is internal control-flow, ignore re-throw
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    redirect(`/brev?regenerate_error=${encodeURIComponent(msg.slice(0, 200))}`)
  }
}

export async function regenerateDreamer(): Promise<void> {
  try {
    const result = await triggerDreamerRun()
    redirect(
      `/traces?dreamer_run=${encodeURIComponent(result.run_id)}&insights=${result.insights_produced}`,
    )
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    redirect(`/traces?dreamer_error=${encodeURIComponent(msg.slice(0, 200))}`)
  }
}
