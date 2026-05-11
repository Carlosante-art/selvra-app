'use client'

import { useState } from 'react'

export function CopyButton({
  text,
  label = 'Kopiera till klippbord',
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Clipboard-API blockad (insecure context, browser-pref) — visa fallback
          setCopied(false)
          alert(
            'Kunde inte kopiera automatiskt. Markera texten manuellt och tryck Ctrl+C / Cmd+C.',
          )
        }
      }}
      className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
    >
      {copied ? 'Kopierad ✓' : label}
    </button>
  )
}
