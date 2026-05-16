'use client'

/**
 * Källa-badge för data-rader i demo.
 *
 * Spec: "small caps eller monospace, neutral färg, ingen bakgrundsfyllning
 * eller MYCKET mild bakgrund. Cursor pointer + hover-tooltip 'I appen
 * öppnar detta källans data.' Inte funktionellt klickbara i demo."
 *
 * Implementation: button med aria-label för screenreaders + title för
 * visual-tooltip. Inte functional click — onClick är no-op. Hover-stil
 * via opacity-shift och hairline-bakgrund (mycket mild, matchar spec).
 */

import type { CSSProperties } from 'react'

export type SourceBadgeProps = {
  source: string
  className?: string
}

export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  return (
    <button
      type="button"
      onClick={() => {
        // No-op i demo. I app: öppna källans data-yta.
      }}
      aria-label={`Källa: ${source}. I appen öppnar detta källans data.`}
      title="I appen öppnar detta källans data."
      className={`font-sans text-xs uppercase tracking-wider px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors hover:opacity-70 ${className}`}
      style={
        {
          color: 'var(--color-ink-tertiary)',
          backgroundColor: 'transparent',
          letterSpacing: '0.08em',
        } as CSSProperties
      }
    >
      [{source}]
    </button>
  )
}
