'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Minimal app-footer för app-routes (brev, account, etc.).
 *
 * Per SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md Avsnitt 5.7: landing-sidan
 * har sin egen minimal footer per spec. Den globala app-footern (denna)
 * renderas inte på `/`.
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
          Selvra — ett brev till dig själv, varje vecka.
        </p>
        <nav className="flex items-center gap-4 flex-wrap">
          <Link
            href="/export"
            className="transition-colors"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Exportera
          </Link>
          <Link
            href="/account"
            className="transition-colors"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Konto
          </Link>
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
