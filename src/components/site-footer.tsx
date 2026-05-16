'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Minimal app-footer för icke-landing-sidor (login, privacy).
 *
 * Per .gsd/SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md Steg 2: webb-UI
 * är parkat. Footer-länkar till /export, /account osv borttagna
 * eftersom de routes är raderade. Bevarar bara /privacy-länk + minimal
 * copy. Landing (`/`) har egen footer-yta inbyggd i page.tsx.
 */

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'var(--color-hairline)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 flex-wrap px-6 py-6 text-xs font-sans">
        <p style={{ color: 'var(--color-ink-tertiary)' }}>
          Selvra — pre-launch. iOS-app H2 2026.
        </p>
        <nav className="flex items-center gap-4 flex-wrap">
          <Link
            href="/privacy"
            className="transition-colors"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Integritet
          </Link>
        </nav>
      </div>
    </footer>
  )
}
