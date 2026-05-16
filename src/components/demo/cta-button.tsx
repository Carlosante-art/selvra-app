'use client'

/**
 * CTA-knapp i samma stil som landing-sidans mailto-CTA.
 * Återanvänds över alla tre skärmar.
 *
 * Tre varianter:
 *   - primary (default): mörk bakgrund, ljus text — för "fortsätt"/"visa"
 *   - secondary: neutral bakgrund med kant — för symmetri (export/radera)
 *   - link: ren textlänk, ingen knapp-skin — för sekundära actions
 */

import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'link'

export type CtaButtonProps = {
  onClick: () => void
  children: ReactNode
  variant?: Variant
  ariaLabel?: string
}

const baseClasses =
  'inline-flex items-center justify-center h-11 px-6 text-sm font-sans transition-colors'

export function CtaButton({
  onClick,
  children,
  variant = 'primary',
  ariaLabel,
}: CtaButtonProps) {
  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${baseClasses} rounded-full bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 self-start`}
      >
        {children}
      </button>
    )
  }
  if (variant === 'secondary') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${baseClasses} rounded-full border bg-transparent hover:opacity-80`}
        style={{
          borderColor: 'var(--color-hairline)',
          color: 'var(--color-ink)',
        }}
      >
        {children}
      </button>
    )
  }
  // link
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="font-sans text-sm transition-colors hover:opacity-70 self-start"
      style={{ color: 'var(--color-ink-soft)' }}
    >
      {children} →
    </button>
  )
}
