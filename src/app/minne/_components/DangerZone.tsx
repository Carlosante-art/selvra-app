'use client'

/**
 * DangerZone — två separata destruktiva actions:
 *   1. "Radera alla samtal" (purgeConversations, bekräfta "RADERA")
 *   2. "Avregistrera helt" (deleteAccount, bekräfta "AVREGISTRERA")
 *
 * Båda är expand-on-click så de inte är synliga som default. Confirm-
 * text måste skrivas exakt — knappen disabled tills match.
 *
 * Per konsument-track: Selvra ska aldrig försvåra avlägsnande, men det
 * får inte heller råka hända. Två lager friction (expand + typed confirm)
 * är rimligt skydd.
 */

import { useState, useTransition } from 'react'

import { deleteAccount } from '../_actions/deleteAccount'
import { purgeConversations } from '../_actions/purgeConversations'

export function DangerZone() {
  return (
    <div className="flex flex-col gap-4">
      <PurgeConversationsAction />
      <DeleteAccountAction />
    </div>
  )
}

function PurgeConversationsAction() {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePurge() {
    setError(null)
    startTransition(async () => {
      try {
        await purgeConversations({ confirmText: text })
        setExpanded(false)
        setText('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fel uppstod.')
      }
    })
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors w-fit"
      >
        Radera alla samtal →
      </button>
    )
  }

  return (
    <section
      aria-label="Radera samtal"
      className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 rounded-md p-4"
    >
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Detta raderar alla samtal, alla turer och alla explicit-minnen
        permanent. Auth-kontot bevaras så du kan starta om.
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-500">
        Skriv <code className="font-mono">RADERA</code> nedan för att bekräfta.
      </p>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="RADERA"
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePurge}
          disabled={text !== 'RADERA' || isPending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 text-white px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Raderar…' : 'Radera permanent'}
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false)
            setText('')
            setError(null)
          }}
          className="text-sm text-neutral-500 dark:text-neutral-500 underline underline-offset-2"
        >
          Avbryt
        </button>
      </div>
    </section>
  )
}

function DeleteAccountAction() {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteAccount({ confirmText: text })
        // redirect sker via Server Action — denna kod nås ej
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fel uppstod.')
      }
    })
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 transition-colors w-fit"
      >
        Avregistrera helt →
      </button>
    )
  }

  return (
    <section
      aria-label="Avregistrera helt"
      className="flex flex-col gap-3 border border-red-300 dark:border-red-800 rounded-md p-4"
    >
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Detta raderar <strong>hela kontot</strong> permanent — alla samtal,
        alla minnen, auth-rader, alla källkopplingar. Du måste registrera
        om från noll om du kommer tillbaka.
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-500">
        Om du vill bevara data: exportera först via SREF-länken ovan.
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-500">
        Skriv <code className="font-mono">AVREGISTRERA</code> nedan för att
        bekräfta.
      </p>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="AVREGISTRERA"
        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={text !== 'AVREGISTRERA' || isPending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-red-700 text-white px-4 text-sm font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Avregistrerar…' : 'Avregistrera permanent'}
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false)
            setText('')
            setError(null)
          }}
          className="text-sm text-neutral-500 dark:text-neutral-500 underline underline-offset-2"
        >
          Avbryt
        </button>
      </div>
    </section>
  )
}
