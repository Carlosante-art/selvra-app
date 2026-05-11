'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * App-wide error boundary. Required as Client Component per Next.js
 * App Router convention. Visar lugn error-state istället för stack-trace.
 */

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Logga till console för dev; produktion får detta via server-logs ändå.
    console.error('App error:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">
            Något gick fel
          </h1>
        </header>

        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
          En oväntad situation hindrade Selvra från att visa den här sidan.
          Inget av din data är förlorad — felet är i visningen, inte i det
          du har skrivit.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-500">
            Felreferens: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Försök igen
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-6 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Till startsidan
          </Link>
        </div>
      </article>
    </main>
  )
}
