/**
 * /minne — transparens-yta. Här ser användaren exakt vad Selvra "minns"
 * om henne. Per konsument-track §2 patient-ägd portabilitet: detta är
 * konstitutionellt krav, inte feature.
 *
 * Status 2026-05-15: v1-refaktor Steg 2 raderade brev-blocket. Återstående
 * tre block kvar tills Steg 6 konsoliderar till två-kategori-modellen
 * ("Vad du sagt" / "Vad dina källor visat" + "Explicita minnen"):
 *   1. Tankar (självrapport) — från Selvra-protokollet listEvents
 *   2. Bakgrunds-observationer (Dreamer) — rivs i Steg 3
 *   3. Explicit minnes-fakta — från conversation_memory_facts
 *
 * Plus globala actions:
 *   - Exportera allt (SREF v1) → befintlig /api/export/sref
 *   - Radera enskilt fakta via MemoryFactRow
 *   - DangerZone — purge alla conversations / delete-account
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import { listMemoryFactsForUi } from '@/lib/db/conversation-queries'
import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'

import { DangerZone } from './_components/DangerZone'
import { MemoryFactRow } from './_components/MemoryFactRow'

export default async function MinnePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Parallella fetches — om någon faller, sektionen visar empty-state
  const [memoryFacts, recentThoughts, recentInsights] = await Promise.all([
    listMemoryFactsForUi(session.user.id),
    safeListEvents({ eventType: 'selvra.thought.recorded', limit: 30 }),
    safeListEvents({ eventType: 'insight.derived', limit: 20 }),
  ])

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

        {/* Block 1 (Senaste reflektion / brev) raderad 2026-05-15 — v1-refaktor Steg 2. */}

        {/* 1. Tankar */}
        <section aria-label="Tankar" className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Tankar (självrapport)
          </h2>
          {recentThoughts.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inga tankar sparade än.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentThoughts.slice(0, 10).map((event) => (
                <li
                  key={event.event_id}
                  className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
                >
                  <span className="text-neutral-500 dark:text-neutral-500 mr-2">
                    {formatDate(event.created_at)}:
                  </span>
                  {extractThoughtText(event.payload)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. Bakgrund (Dreamer) */}
        <section aria-label="Bakgrund" className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Bakgrund (Selvras observationer)
          </h2>
          {recentInsights.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inga bakgrunds-observationer än.{' '}
              <Link href="/traces" className="underline underline-offset-2">
                Mer i /traces.
              </Link>
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {recentInsights.slice(0, 5).map((event) => (
                  <li
                    key={event.event_id}
                    className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
                  >
                    {extractInsightDescription(event.payload)}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
                <Link href="/traces" className="underline underline-offset-2">
                  Alla i /traces →
                </Link>
              </p>
            </>
          )}
        </section>

        {/* 4. Explicit minnen */}
        <section aria-label="Explicit minnen" className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Explicit minnen
          </h2>
          {memoryFacts.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inga explicit minnen sparade. När du säger till Selvra
              &quot;Kom ihåg X&quot; i ett samtal sparas X här.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {memoryFacts.map((fact) => (
                <MemoryFactRow
                  key={fact.id}
                  fact={{
                    id: fact.id,
                    factText: fact.factText,
                    validFrom: fact.validFrom,
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Agency */}
        <section
          aria-label="Agency"
          className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-8"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Din data är din
          </h2>
          <div className="flex flex-col gap-4">
            <Link
              href="/export/sref"
              className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors w-fit"
            >
              Exportera allt (SREF v1) →
            </Link>
            <DangerZone />
          </div>
        </section>
      </article>
    </main>
  )
}

async function safeListEvents(opts: {
  eventType: string
  limit?: number
}): Promise<EventListItem[]> {
  try {
    const res = await listEvents(opts)
    return res.items
  } catch {
    // Protokoll-fel ska inte ta ner hela vyn — visa empty-state för sektionen
    return []
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function extractThoughtText(payload: Record<string, unknown>): string {
  const text = payload.text
  if (typeof text === 'string') return text
  return '(ingen text)'
}

function extractInsightDescription(payload: Record<string, unknown>): string {
  const value = payload.value
  if (value && typeof value === 'object') {
    const desc = (value as Record<string, unknown>).description
    if (typeof desc === 'string') return desc
  }
  const key = payload.key
  if (typeof key === 'string') return key
  return '(ingen beskrivning)'
}
