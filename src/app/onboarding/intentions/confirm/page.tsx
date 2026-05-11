import Link from 'next/link'

import { getSnapshot } from '@/lib/protocol/client'

export default async function ConfirmPage() {
  let snapshotItemsCount = 0
  let fetchError: string | null = null
  try {
    const snapshot = await getSnapshot()
    snapshotItemsCount = snapshot.items.length
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">Klart.</h1>
        </header>

        <p className="text-lg leading-relaxed">
          Selvra observerar från och med nu.
        </p>

        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          Dina intentioner finns sparade i protokollet. Första brevet kommer
          enligt rytmen du valt.
        </p>

        <section
          aria-label="Tekniskt status (dogfood)"
          className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-6 py-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
        >
          <p className="font-medium uppercase tracking-wide text-xs text-neutral-500 dark:text-neutral-500 mb-2">
            Dogfood-status (v0.0)
          </p>
          {fetchError ? (
            <p>Kunde inte hämta snapshot från protokollet: {fetchError}</p>
          ) : (
            <>
              <p>
                Snapshot returnerade <strong>{snapshotItemsCount}</strong>{' '}
                ProfileFact(s). Intentioner är skrivna som events men
                projiceras inte till ProfileFacts än — det är en separat
                slice (projection eller GET /events-endpoint).
              </p>
              <p className="mt-2">
                Round-trip-loopen är validerad: intentioner ligger i
                event-loggen och kan läsas tillbaka via direct event-query
                tills projection-regel finns på plats.
              </p>
            </>
          )}
        </section>

        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          Tills dess: skriv tankar om du vill. De blir källa för första
          brevet.
        </p>

        <div className="flex gap-3 pt-4">
          <Link
            href="/onboarding/intentions"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-6 text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Justera intentioner
          </Link>
        </div>
      </article>
    </main>
  )
}
