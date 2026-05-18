'use client'

import { useState, useTransition } from 'react'

import type { CommunicationPreference } from '@/lib/protocol/client'
import { disablePreferenceAction } from '@/lib/preferences/actions'

const CATEGORY_LABELS: Record<string, string> = {
  language: 'Språk',
  tone: 'Ton',
  medical_context: 'Medicinsk kontext',
  communication_style: 'Kommunikationsstil',
  source_attribution: 'Käll-attribuering',
  other: 'Övrigt',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function PreferencesList({
  initial,
}: {
  initial: CommunicationPreference[]
}) {
  const [items, setItems] = useState(initial)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDisable(preferenceId: string) {
    setPendingId(preferenceId)
    startTransition(async () => {
      const result = await disablePreferenceAction(preferenceId)
      if (result.status === 'success') {
        setItems((prev) => prev.filter((p) => p.id !== preferenceId))
      }
      setPendingId(null)
    })
  }

  if (items.length === 0) {
    return (
      <p
        className="font-serif italic leading-relaxed"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Inga aktiva preferenser ännu. Skriv en nedan så börjar AI-systemet
        läsa dem vid första kontext-hämtning per samtal.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((pref) => {
        const isPending = pendingId === pref.id
        return (
          <li
            key={pref.id}
            className="flex flex-col gap-2 border-l-2 pl-4 py-2"
            style={{
              borderColor: 'var(--color-hairline)',
              opacity: isPending ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <p
              className="font-serif leading-relaxed"
              style={{ fontSize: '17px', color: 'var(--color-ink)' }}
            >
              {pref.raw_utterance}
            </p>
            <div className="flex items-center gap-3">
              {pref.category && (
                <span
                  className="font-sans text-xs uppercase tracking-wide"
                  style={{ color: 'var(--color-ink-tertiary)' }}
                >
                  {CATEGORY_LABELS[pref.category] ?? pref.category}
                </span>
              )}
              {pref.updated_at && (
                <span
                  className="font-sans text-xs"
                  style={{ color: 'var(--color-ink-tertiary)' }}
                >
                  {formatDate(pref.updated_at)}
                </span>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDisable(pref.id)}
                className="font-sans text-xs ml-auto transition-opacity hover:opacity-70 disabled:opacity-30"
                style={{ color: 'var(--color-ink-soft)' }}
              >
                {isPending ? 'Inaktiverar…' : 'Inaktivera'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
