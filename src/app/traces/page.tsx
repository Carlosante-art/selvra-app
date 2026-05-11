import Link from 'next/link'

import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'

/**
 * /traces — process-transparens. Visar Dreamer-output: insights som
 * Selvra-protokollet autonomt har härlett från användarens event-log
 * via background reasoning (random walk + consolidation).
 *
 * Doktrinärt: process-transparens som default. Selvra tänker om dig
 * även när du inte använder appen. Det här är synligt protokoll-lager,
 * inte hidden infrastructure.
 *
 * Per Carl-observation 2026-05-11: "Dreamer-output som synligt lager —
 * det är konstitutionellt rätt: process-transparens som default. Och
 * något ingen konkurrent kan kopiera utan att bygga om sin arkitektur."
 */

async function loadDreamerInsights(): Promise<EventListItem[]> {
  try {
    const res = await listEvents({
      eventType: 'insight.derived',
      limit: 50,
    })
    return res.items
  } catch {
    return []
  }
}

type InsightValue = {
  description?: string
  pattern?: string
  evidence?: string[]
  [k: string]: unknown
}

type InsightPayload = {
  key?: string
  value?: InsightValue
  dimensions?: {
    confidence?: string
    data_type?: string
    mutability?: string
    persistence?: string
    domain?: string
    memory_type?: string
  }
  classification?: {
    confidence?: string
    domain?: string
  }
}

function formatTraceTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function TracesPage() {
  const insights = await loadDreamerInsights()

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Bakgrund</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Selvra observerar mönster i bakgrunden, även när du inte använder
            appen. Här visas vad protokollet har lagt märke till — autonomt
            härlett från dina events utan att du frågat.
          </p>
        </header>

        {insights.length === 0 ? (
          <EmptyTracesView />
        ) : (
          <section className="flex flex-col gap-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              {insights.length} observation{insights.length === 1 ? '' : 'er'}.
              Sorterade nyaste först.
            </p>
            <ol className="flex flex-col gap-6">
              {insights.map((e) => (
                <InsightCard key={e.event_id} event={e} />
              ))}
            </ol>
          </section>
        )}

        <section className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            Vad det här är
          </h2>
          <p>
            Selvra-protokollet kör en bakgrunds-process — &ldquo;Dreamer&rdquo; —
            som via random walk över dina events och deras embeddings hittar
            mönster och redundanser. Resultatet sparas som{' '}
            <span className="font-mono text-xs">insight.derived</span>-events
            (append-only, signerade, exportbara via SREF).
          </p>
          <p>
            Dreamer kallar inte sig själv för &ldquo;rätt&rdquo;. Den
            observerar; tolkningen är din. När en observation känns fel
            kan den markeras som sådan (kommer som feedback-flow senare).
          </p>
          <p>
            <Link
              href="/export"
              className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline underline-offset-2"
            >
              Du äger dessa observationer också
            </Link>
            {' '}— de finns i din SREF-export.
          </p>
        </section>
      </article>
    </main>
  )
}

function InsightCard({ event }: { event: EventListItem }) {
  const p = event.payload as InsightPayload
  const key = p.key ?? '(unnamed)'
  const value = p.value ?? {}
  const description = value.description ?? value.pattern ?? '(no description)'
  const dims = p.dimensions ?? p.classification ?? {}
  const confidence = dims.confidence
  const domain = dims.domain

  return (
    <li className="flex flex-col gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-5 py-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h3 className="font-mono text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
          {key}
        </h3>
        <time
          dateTime={event.created_at}
          className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums"
        >
          {formatTraceTimestamp(event.created_at)}
        </time>
      </div>
      <p className="text-base leading-relaxed">{description}</p>
      {(confidence || domain) && (
        <p className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
          {confidence && `confidence: ${confidence}`}
          {confidence && domain && ' · '}
          {domain && `domain: ${domain}`}
        </p>
      )}
      <p className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
        event {event.event_id.slice(0, 8)}…
      </p>
    </li>
  )
}

function EmptyTracesView() {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        Inga observationer än.
      </p>
      <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
        Dreamer kör mot din data — när tillräckligt med events finns för
        meaningful mönster, dyker observationerna upp här.
      </p>
    </section>
  )
}
