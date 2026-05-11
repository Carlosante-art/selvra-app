import Link from 'next/link'

/**
 * Minimal footer. En rad. Doktrinärt-aligned export-länk ("du äger
 * representationen") som tyst närvarande, inte CTA-aggressiv.
 */

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-auto">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 flex-wrap px-6 py-6 text-xs text-neutral-500 dark:text-neutral-500">
        <p>Selvra — ett brev till dig själv, varje vecka.</p>
        <nav className="flex items-center gap-4 flex-wrap">
          <Link
            href="/export"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Exportera
          </Link>
          <Link
            href="/account"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Konto
          </Link>
          <Link
            href="/privacy"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Integritet
          </Link>
        </nav>
      </div>
    </footer>
  )
}
