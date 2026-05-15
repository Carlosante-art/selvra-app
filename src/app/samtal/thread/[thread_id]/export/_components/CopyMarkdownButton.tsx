'use client'

/**
 * CopyMarkdownButton — klipper markdown-versionen till clipboard.
 * Vid lyckad copy: visar 'Kopierat' i 2 sekunder. Vid fel: visar
 * 'Kopiering misslyckades' (browser blockerade clipboard t.ex.).
 */

import { useState } from 'react'

type Props = {
  markdown: string
}

export function CopyMarkdownButton({ markdown }: Props) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown)
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('err')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
    >
      {status === 'ok'
        ? 'Kopierat ✓'
        : status === 'err'
          ? 'Kopiering misslyckades'
          : 'Kopiera som markdown'}
    </button>
  )
}
