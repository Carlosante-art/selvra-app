'use client'

/**
 * ArchiveButton — toggla tråd:s archive-status. Visar olika text/style
 * beroende på nuvarande status.
 */

import { useTransition } from 'react'

import {
  archiveThread,
  unarchiveThread,
} from '../_actions/archiveThread'

type Props = {
  conversationId: string
  isArchived: boolean
}

export function ArchiveButton({ conversationId, isArchived }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      if (isArchived) {
        await unarchiveThread({ conversationId })
      } else {
        await archiveThread({ conversationId })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="text-sm text-neutral-500 dark:text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50"
    >
      {isPending
        ? 'Sparar…'
        : isArchived
          ? 'Återställ från arkiv'
          : 'Arkivera denna tråd'}
    </button>
  )
}
