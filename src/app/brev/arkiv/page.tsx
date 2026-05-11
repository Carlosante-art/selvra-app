import Link from 'next/link'

import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'

/**
 * /brev/arkiv — bounded lista av tidigare reflektioner.
 *
 * Per designval 8: "föregående arkiverade men inte stackade. Selvra
 * producerar inte content för konsumtion."
 *
 * UX-modus: filing-cabinet, inte scrollable-feed. Bounded list. Inget
 * infinite-scroll, inga sort-options. Bara: tidsstämpel + första-mening +
 * klick-att-läsa-helt.
 */

type ReflectionContent = {
  text?: string
  format?: string
  language?: string
}

type ReflectionPayload = {
  version?: number
  synthesis_type?: string
  content?: ReflectionContent
  model_used?: string
}

async function loadReflections(): Promise<EventListItem[]> {
  try {
    const res = await listEvents({
      eventType: 'selvra.reflection.generated',
      limit: 100,
    })
    return res.items
  } catch {
    return []
  }
}

function firstSentenceOf(text: string, maxChars = 100): string {
  const trimmed = text.trim()
  // Plocka första non-greeting-meningen: skippa "Kära Carl,"-rad om finns
  const lines = trimmed.split(/\n\n+/)
  const firstBlock = (lines.length > 1 && lines[0].length < 30 ? lines[1] : lines[0]) ?? ''
  if (firstBlock.length <= maxChars) return firstBlock
  return firstBlock.slice(0, maxChars).replace(/\s+\S*$/, '') + '…'
}

function formatArchiveDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ArkivPage() {
  const reflections = await loadReflections()

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Tidigare brev</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Bevarade brev från tidigare veckor. Senaste brevet finns alltid
            på <Link href="/brev" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              /brev
            </Link>.
          </p>
        </header>

        {reflections.length === 0 ? (
          <EmptyArkivView />
        ) : (
          <section className="flex flex-col gap-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              {reflections.length} brev. Sorterade nyaste först.
            </p>
            <ul className="flex flex-col gap-3">
              {reflections.map((event) => {
                const p = event.payload as ReflectionPayload
                const text = p.content?.text ?? ''
                const preview = firstSentenceOf(text)
                return (
                  <li key={event.event_id}>
                    <Link
                      href={`/brev/arkiv/${event.event_id}`}
                      className="block rounded-md border border-neutral-200 dark:border-neutral-800 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
                        <time
                          dateTime={event.created_at}
                          className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums"
                        >
                          {formatArchiveDate(event.created_at)}
                        </time>
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                          {p.synthesis_type ?? 'reflection'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {preview}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <p>
            Arkivet är read-only. Brev är frusna dokument — de annoteras inte
            utan står som de skrevs. Tankar tillkomna efter ett brev visas
            under senaste brev på{' '}
            <Link href="/brev" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              /brev
            </Link>
            , inte i arkivet.
          </p>
        </section>
      </article>
    </main>
  )
}

function EmptyArkivView() {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        Inga tidigare brev än.
      </p>
      <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
        När ett nytt brev genereras blir det tillgängligt på{' '}
        <Link href="/brev" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
          /brev
        </Link>
        . Föregående brev arkiveras automatiskt här.
      </p>
    </section>
  )
}
