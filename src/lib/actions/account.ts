'use server'

import { redirect } from 'next/navigation'

import { deleteSubject, restoreSubject } from '@/lib/protocol/client'

/**
 * Server Actions för account-lifecycle: soft-delete + restore (G6/G7).
 *
 * Soft-delete kallar Selvra-protokollets `DELETE /v1/subjects/{id}` som
 * emit:tar en append-only deletion-event. Read/write-paths returnerar 410
 * Gone direkt efter. Ångerrätt 30 dagar via `restoreSubject`.
 *
 * Vi confirmar deletion via en form-field — användaren måste skriva
 * "RADERA" exakt för att kniven ska aktiveras. Inte aria-perfekt men
 * sufficient friction för danger-zone.
 */

export async function deleteAccount(formData: FormData): Promise<void> {
  const confirm = formData.get('confirm')?.toString().trim()
  if (confirm !== 'RADERA') {
    redirect(`/account?delete_error=${encodeURIComponent('Bekräftelse saknas. Skriv RADERA exakt.')}`)
  }

  try {
    const result = await deleteSubject()
    redirect(`/account?deleted=${encodeURIComponent(result.status)}`)
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    redirect(`/account?delete_error=${encodeURIComponent(msg.slice(0, 200))}`)
  }
}

export async function restoreAccount(): Promise<void> {
  try {
    const result = await restoreSubject()
    redirect(`/account?restored=${encodeURIComponent(result.cancellation_event_id)}`)
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    const msg = err instanceof Error ? err.message : String(err)
    redirect(`/account?restore_error=${encodeURIComponent(msg.slice(0, 200))}`)
  }
}
