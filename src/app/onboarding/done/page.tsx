import Link from 'next/link'

/**
 * Onboarding Steg 5 slut — "Klart"-state.
 *
 * Per DESIGN.md §5: bekräftelse + inbjudan till första-tanken så
 * substrat samlas medan vecka pågår (eliminerar "tomt-tills-söndag"-
 * känsla).
 */

export default function OnboardingDonePage() {
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
          Första brevet kommer enligt rytmen du valt. Tills dess: skriv
          tankar om du vill. De blir källa för brevet.
        </p>

        {/* /thoughts + /brev-länkar borttagna 2026-05-15 (v1-refaktor Steg
            2+4). Hela onboarding-flödet rivs i Steg 5. */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/samtal"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Öppna samtal
          </Link>
        </div>
      </article>
    </main>
  )
}
