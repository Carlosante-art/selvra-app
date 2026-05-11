'use client'

import { useFormStatus } from 'react-dom'

/**
 * Submit-knapp som visar pending-state under request. Används för manuella
 * trigger-actions som tar 20-60s (Dreamer-trigger, synthesis-trigger).
 */

export function TriggerButton({
  label,
  pendingLabel,
}: {
  label: string
  pendingLabel: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-wait dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
