'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Nav-link med active-state. Markeras som "active" när nuvarande URL
 * matchar exakt eller är en sub-route (t.ex. /onboarding/intentions/confirm
 * räknas som active för /onboarding/intentions).
 */

export function NavLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  const base = 'rounded-md px-2 py-1 transition-colors'
  const inactive =
    'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
  const active =
    'text-neutral-900 dark:text-neutral-100 font-medium'

  return (
    <Link
      href={href}
      className={`${base} ${isActive ? active : inactive}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}
