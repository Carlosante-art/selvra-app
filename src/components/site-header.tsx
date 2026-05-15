'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NavLink } from './nav-link'

/**
 * Minimal navigation för app-routes (samtal, tankar, traces, etc.).
 *
 * Per SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md Avsnitt 4.1: landing-sidan
 * (path `/`) har sin egen minimala nav inom hero. Den globala app-nav:en
 * (denna komponent) renderas inte där.
 */

// '/brev' borttagen 2026-05-15 (v1-refaktor Steg 2: brev-paradigm rivs).
// '/thoughts', '/traces', '/onboarding/*' rivs i senare steg (3-5).
// /samtal blir primär entry-point efter refaktorn är klar.
const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '/samtal', label: 'Samtal' },
  { href: '/thoughts', label: 'Tankar' },
  { href: '/traces', label: 'Bakgrund' },
  { href: '/onboarding/intentions', label: 'Intentioner' },
  { href: '/onboarding/sources', label: 'Källor' },
]

export function SiteHeader() {
  const pathname = usePathname()
  // Landing-sidan har egen layout och nav-yta — dölj global header där.
  if (pathname === '/') return null

  return (
    <header
      className="border-b"
      style={{ borderColor: 'var(--color-hairline)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-6 px-6 py-5">
        <Link
          href="/"
          className="text-base font-serif tracking-tight transition-colors"
          style={{ color: 'var(--color-ink)' }}
        >
          Selvra
        </Link>

        <nav aria-label="Primär navigation">
          <ul className="flex items-center gap-1 sm:gap-3 text-sm font-sans">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} label={link.label} />
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/login"
          className="text-sm font-sans transition-colors"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Logga in
        </Link>
      </div>
    </header>
  )
}
