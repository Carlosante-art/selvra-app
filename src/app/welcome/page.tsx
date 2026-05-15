/**
 * /welcome — noll-friktion-introduktion efter login.
 *
 * Per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §6: ersätter den
 * tvingande 4-stegs-onboarding (intentions → signal → sources → done).
 *
 * Användaren möts av två val:
 *   - "Börja prata" → /samtal direkt (källor kan kopplas senare)
 *   - "Koppla källor först" → /welcome/sources (Strava, Google, etc.)
 *
 * Ingen tvingande intention-skrivning. Ingen "signal"-preferenssida.
 * Ingen klart-firande. Källor kopplas opportunistiskt under samtal.
 *
 * Auth-gate: session.user.id krävs — anonyma redirectas till /login.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'

export default async function WelcomePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-medium tracking-tight">Selvra</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Ett samtal som vet vad du har levt, inte bara vad du har sagt.
          </p>
        </header>

        <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          Du behöver inte koppla något nu. Du kan börja prata direkt.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/samtal"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Börja prata
          </Link>
          <Link
            href="/welcome/sources"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-8 text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Koppla källor först
          </Link>
        </div>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500 pt-4">
          Källor kan kopplas eller kopplas bort när som helst senare via{' '}
          <Link href="/minne" className="underline underline-offset-2">
            /minne
          </Link>
          .
        </p>
      </article>
    </main>
  )
}
