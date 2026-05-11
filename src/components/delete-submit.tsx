'use client'

import { useFormStatus } from 'react-dom'

/**
 * Submit-knapp för danger-zone-deletion. Röd-färgad, pending-state
 * sluts av useFormStatus i parent-form. Renderar text "Markera för
 * radering" / "Markerar…" — vi använder "markera" snarare än "radera"
 * eftersom soft-delete är reversibel inom 30d.
 */

export function DeleteSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 text-white px-5 text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-wait transition-colors self-start"
    >
      {pending ? 'Markerar…' : 'Markera för radering'}
    </button>
  )
}
