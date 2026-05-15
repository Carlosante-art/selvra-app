'use server'

import { redirect } from 'next/navigation'

import { triggerDreamerRun } from '@/lib/protocol/client'

/**
 * Server Action för manuell trigger av Dreamer från UI.
 * regenerateBrev raderad 2026-05-15 (v1-refaktor: brev-paradigmen rivs,
 * se .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §2 + §8 Steg 2).
 * regenerateDreamer rivs i Steg 3 — kvar tills vidare.
 */

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
