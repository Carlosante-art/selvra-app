/**
 * /minne — transparens-yta. Här ser användaren exakt vad Selvra "minns"
 * om henne.
 *
 * v1 två-kategori-modell (per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §5):
 *
 *   1. Vad du sagt
 *      Allt användaren sagt — extraherade user-stated facts från samtal.
 *      Data-källa just nu: legacy selvra.thought.recorded-events från
 *      Selvra-protokollet. När conversation_facts-tabellen skapas i Steg 8
 *      kommer denna kategori byta data-källa till
 *      conversation_facts(fact_type=user_stated) + ev. legacy-merge.
 *
 *   2. Vad dina källor visat
 *      Observationer från kopplade källor (Garmin/Strava/Calendar/Gmail/
 *      Dexcom). Källa-attribuerade. Data-källa just nu: legacy
 *      insight.derived-events från Selvra-protokollet (Dreamer-output).
 *      När conversation_facts-tabellen skapas i Steg 8 kommer denna
 *      kategori byta till conversation_facts(fact_type=source_observed).
 *
 *   3. Explicita minnen
 *      User-skrivna explicita minnen ("jag är T1-diabetiker") från
 *      conversation_memory_facts. Användaren skapar dessa genom att
 *      säga "Kom ihåg X" i ett samtal. Selvra kan inte skapa dem utan
 *      användarens bekräftelse.
 *
 * Plus globala actions:
 *   - Exportera allt (SREF v1) → befintlig /api/export/sref
 *   - Radera enskilt fakta via MemoryFactRow
 *   - DangerZone — purge alla conversations / delete-account
 *
 * Konstitutionellt krav (IF1 + EU Data Act): användaren kan radera,
 * exportera, och se exakt vad som finns. Inget är dolt.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import {
  listConversationFactsForUi,
  listMemoryFactsForUi,
} from '@/lib/db/conversation-queries'
import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'

import { DangerZone } from './_components/DangerZone'
import { MemoryFactRow } from './_components/MemoryFactRow'

export default async function MinnePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // V1 Steg 8: läs primärt conversation_facts (per fact_type). Fallback
  // till legacy-events när conversation_facts är tom (Carl-dogfood-
  // pre-migration eller om extractFactsFromTurn ej hunnit producera än).
  //
  // Parallella fetches. Sektionen renderar empty-state om respektive
  // källa fall:ar — vi tar inte ner hela vyn för en enskild fail.
  const [
    memoryFacts,
    userStatedFacts,
    sourceObservedFacts,
    userStatedLegacy,
    sourceObservedLegacy,
  ] = await Promise.all([
    listMemoryFactsForUi(session.user.id),
    listConversationFactsForUi(session.user.id, {
      factType: 'user_stated',
      limit: 30,
    }),
    listConversationFactsForUi(session.user.id, {
      factType: 'source_observed',
      limit: 30,
    }),
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

        {/* 1. Vad du sagt — primärt conversation_facts, legacy fallback */}
        <section aria-label="Vad du sagt" className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Vad du sagt
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Saker du själv har sagt om dig själv i samtal med Selvra.
          </p>
          {userStatedFacts.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {userStatedFacts.slice(0, 15).map((fact) => (
                <li
                  key={fact.id}
                  className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
                >
                  <span className="text-neutral-500 dark:text-neutral-500 mr-2">
                    {fact.extractedAt.toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    :
                  </span>
                  {fact.factText}
                </li>
              ))}
            </ul>
          ) : userStatedLegacy.length > 0 ? (
            <>
              <p className="text-xs italic text-neutral-500 dark:text-neutral-500">
                Visar legacy data — nya facts extraheras automatiskt från
                samtal framöver.
              </p>
              <ul className="flex flex-col gap-2">
                {userStatedLegacy.slice(0, 10).map((event) => (
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
            </>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inget sparat än. Det du säger till Selvra i samtal sparas här
              automatiskt.
            </p>
          )}
        </section>

        {/* 2. Vad dina källor visat — primärt conversation_facts, legacy fallback */}
        <section
          aria-label="Vad dina källor visat"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Vad dina källor visat
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Observationer från kopplade källor (Garmin, Strava, Calendar,
            Gmail). Käll-attribuerade.
          </p>
          {sourceObservedFacts.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {sourceObservedFacts.slice(0, 15).map((fact) => (
                <li
                  key={fact.id}
                  className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
                >
                  {fact.sourceName && (
                    <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mr-2">
                      [{fact.sourceName}]
                    </span>
                  )}
                  {fact.factText}
                </li>
              ))}
            </ul>
          ) : sourceObservedLegacy.length > 0 ? (
            <>
              <p className="text-xs italic text-neutral-500 dark:text-neutral-500">
                Visar legacy data — nya observationer extraheras automatiskt
                från samtal framöver.
              </p>
              <ul className="flex flex-col gap-2">
                {sourceObservedLegacy.slice(0, 10).map((event) => (
                  <li
                    key={event.event_id}
                    className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
                  >
                    {extractInsightDescription(event.payload)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inga observationer från källor än.{' '}
              <Link href="/welcome/sources" className="underline underline-offset-2">
                Koppla en källa →
              </Link>
            </p>
          )}
        </section>

        {/* 3. Explicita minnen */}
        <section
          aria-label="Explicita minnen"
          className="flex flex-col gap-3"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Explicita minnen
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Saker du bett Selvra komma ihåg, ord för ord. Selvra kan inte
            lägga till här utan att du bekräftar.
          </p>
          {memoryFacts.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              Inga explicita minnen sparade. När du säger till Selvra
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
