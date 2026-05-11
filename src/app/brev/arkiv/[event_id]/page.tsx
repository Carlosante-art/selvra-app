import Link from 'next/link'
import { notFound } from 'next/navigation'

import { listEvents } from '@/lib/protocol/client'
import type { EventListItem } from '@/lib/protocol/types'

/**
 * /brev/arkiv/[event_id] — specifik arkiverad reflektion.
 *
 * Per designval 9: brev som frusen-dokument. Read-only. Ingen
 * tanke-input här (det finns bara på senaste brev /brev).
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
  time_window_days?: number
  designval_version?: string
}

async function loadReflection(eventId: string): Promise<EventListItem | null> {
  try {
    const res = await listEvents({
      eventType: 'selvra.reflection.generated',
      limit: 100,
    })
    return res.items.find((e) => e.event_id === eventId) ?? null
  } catch {
    return null
  }
}

function formatGeneratedAt(iso: string): string {
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

function isoWeek(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const target = new Date(d.valueOf())
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7)
}

export default async function ArkivBrevPage({
  params,
}: {
  params: Promise<{ event_id: string }>
}) {
  const { event_id } = await params
  const reflection = await loadReflection(event_id)
  if (!reflection) notFound()

  const p = reflection.payload as ReflectionPayload
  const text = p.content?.text ?? ''
  const paragraphs = text.split(/\n\n+/).map((s) => s.trim()).filter((s) => s.length > 0)
  const weekNum = isoWeek(reflection.created_at)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
            Tidigare brev · Vecka {weekNum}
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            {formatGeneratedAt(reflection.created_at)}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 font-mono">
            {p.synthesis_type ?? 'reflection'} · {p.model_used ?? 'unknown'} · event{' '}
            {reflection.event_id.slice(0, 8)}…
          </p>
        </header>

        <div className="flex flex-col gap-6 text-lg leading-relaxed">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === paragraphs.length - 1 && para.startsWith('_Källor')
                  ? 'text-sm italic text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-4'
                  : undefined
              }
            >
              {para}
            </p>
          ))}
        </div>

        <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6 text-sm text-neutral-500 dark:text-neutral-500 italic">
          <p>
            Detta brev är arkiverat och read-only. Det observerar veckan
            som den var när det skrevs. För senaste brev + tanke-input
            gå till{' '}
            <Link
              href="/brev"
              className="underline underline-offset-2 not-italic hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              /brev
            </Link>
            .
          </p>
        </section>

        <p>
          <Link
            href="/brev/arkiv"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            ← Tillbaka till arkivet
          </Link>
        </p>
      </article>
    </main>
  )
}
