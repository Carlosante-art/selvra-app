import Link from 'next/link'

import { NavLink } from './nav-link'

/**
 * Minimal navigation. Selvra-wordmark som hemma-länk + tre primära ytor
 * (Brev / Tankar / Intentioner) + login. Brevs-metaforen styr tonen — tunt,
 * närvarande, ej dashboard-tongue.
 *
 * Nav-länk får active-state via NavLink (Client Component, läser pathname).
 * Login-state är platshållare tills magic-link är wired. När Auth.js är
 * aktivt: visa "Logga ut" + ev. inställningar; nu: alltid "Logga in".
 */

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '/brev', label: 'Brev' },
  { href: '/thoughts', label: 'Tankar' },
  { href: '/traces', label: 'Bakgrund' },
  { href: '/onboarding/intentions', label: 'Intentioner' },
  { href: '/onboarding/sources', label: 'Källor' },
]

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-6 px-6 py-5">
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Selvra
        </Link>

        <nav aria-label="Primär navigation">
          <ul className="flex items-center gap-1 sm:gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} label={link.label} />
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/login"
          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          Logga in
        </Link>
      </div>
    </header>
  )
}
