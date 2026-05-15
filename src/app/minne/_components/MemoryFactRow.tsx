'use client'

/**
 * MemoryFactRow — visa en explicit minnes-fakta med radera-knapp.
 *
 * Per konsument-track §2: användaren ser exakt vad Selvra minns + kan
 * radera enskilt. Confirm-dialog innan radera så ingen olycklig klick.
 */

import { useState, useTransition } from 'react'

import { redactFact } from '../_actions/redactFact'

type Props = {
  fact: {
    id: string
    factText: string
    validFrom: Date
  }
}

export function MemoryFactRow({ fact }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleRedact() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    startTransition(async () => {
      await redactFact({ factId: fact.id })
    })
  }

  return (
    <li className="flex flex-col gap-1 border border-neutral-200 dark:border-neutral-800 rounded-md p-3">
      <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
        {fact.factText}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500 dark:text-neutral-500">
          sparat {fact.validFrom.toLocaleDateString('sv-SE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <button
          type="button"
          onClick={handleRedact}
          disabled={isPending}
          className="text-xs text-neutral-500 dark:text-neutral-500 underline underline-offset-2 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {isPending
            ? 'Raderar…'
            : confirming
              ? 'Bekräfta — radera permanent'
              : 'Radera'}
        </button>
      </div>
    </li>
  )
}
