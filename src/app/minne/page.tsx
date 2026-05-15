/**
 * /minne — transparens-yta. Här ser användaren exakt vad Selvra "minns"
 * om henne. Per konsument-track §2 patient-ägd portabilitet: detta är
 * konstitutionellt krav, inte feature.
 *
 * Fyra block (per PHASE_1_SKELETON_SKETCH §2.4):
 *   1. Senaste reflektion (brev) — länk till /brev
 *   2. Tankar (självrapport) — från befintliga thoughts
 *   3. Bakgrunds-observationer (Dreamer) — från befintlig /traces
 *   4. Explicit minnes-fakta — från ny conversation_memory_facts
 *
 * Plus två globala actions:
 *   - Exportera allt (SREF v1) → befintlig /api/export/sref
 *   - Radera allt och avregistrera → confirm-flow (Fas 1 beslut)
 *
 * Skeleton-state: shell + placeholders. När Fas 1 aktiveras: faktiska
 * Server-side-fetches mot befintliga endpoints + nya conversation-tabeller.
 */

import Link from 'next/link'

export default async function MinnePage() {
  // TODO Fas 1: parallella fetches mot:
  //   - getLatestReflection('weekly_letter')
  //   - listEvents({eventType: 'selvra.thought.recorded'})
  //   - listEvents({eventType: 'insight.derived'})
  //   - db.select().from(conversationMemoryFacts).where(eq(userId, ...))

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        <header>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">
            Minne
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            Vad Selvra minns om dig
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-3 leading-relaxed">
            Detta är allt. Inget är dolt. Du kan radera vad du vill, exportera
            allt, eller avregistrera helt — utan att Selvra försöker hålla
            kvar dig.
          </p>
        </header>

        <section
          aria-label="Senaste reflektion"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Senaste reflektion
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            <Link href="/brev" className="underline underline-offset-2">
              Öppna /brev
            </Link>{' '}
            — frusna dokument, en åt gången.
          </p>
        </section>

        <section
          aria-label="Tankar"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Tankar (självrapport)
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
            Skeleton: lista över thought-events kommer här. Varje rad har
            radera-knapp.
          </p>
        </section>

        <section
          aria-label="Bakgrund"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Bakgrund (Selvras observationer)
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            <Link href="/traces" className="underline underline-offset-2">
              Öppna /traces
            </Link>{' '}
            — vad Selvras Dreamer reasonar om i bakgrunden.
          </p>
        </section>

        <section
          aria-label="Minnes-fakta"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Explicit minnen
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
            Skeleton: när du säger till Selvra &quot;Kom ihåg X&quot; sparas
            X här. Idag är listan tom.
          </p>
        </section>

        <section
          aria-label="Agency"
          className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-8"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Din data är din
          </h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/export/sref"
              className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Exportera allt (SREF v1) →
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Radera allt och avregistrera — kommer i Fas 1.
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}
