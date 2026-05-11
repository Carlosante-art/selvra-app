import { submitThought } from '@/lib/actions/thoughts'
import { getLatestReflection } from '@/lib/protocol/client'
import type { LatestReflection } from '@/lib/protocol/types'

type SearchParams = Promise<{ saved?: string }>

function formatSavedFlash(savedIso: string | undefined): string | null {
  if (!savedIso) return null
  const d = new Date(savedIso)
  if (Number.isNaN(d.getTime())) return null
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `Tanke sparad ${hh}:${mm}.`
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  })
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${date}, ${hh}:${mm}`
}

function isoWeek(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  // ISO 8601 week number — torsdagsbaserad
  const target = new Date(d.valueOf())
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7)
}

async function loadReflection(): Promise<LatestReflection | { error: string } | null> {
  try {
    return await getLatestReflection('weekly_letter')
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export default async function BrevPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const flash = formatSavedFlash(params.saved)
  const reflection = await loadReflection()

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        {reflection && 'content' in reflection ? (
          <LiveReflection reflection={reflection} />
        ) : (
          <EmptyOrError reflection={reflection} />
        )}

        {/* Tankar-yta under brevet — designval 10 */}
        <section
          aria-label="Lägg till en tanke om brevet"
          className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-8"
        >
          <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
            Lägg till en tanke
          </h2>
          <form action={submitThought} className="flex flex-col gap-3">
            <input type="hidden" name="return_to" value="/brev" />
            <label htmlFor="brev-thought-text" className="sr-only">
              Tanke om brevet
            </label>
            <textarea
              id="brev-thought-text"
              name="text"
              rows={4}
              maxLength={4000}
              required
              placeholder="…"
              className="w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              >
                Spara
              </button>
              {flash && (
                <span className="text-sm text-neutral-500 dark:text-neutral-500">
                  {flash}
                </span>
              )}
            </div>
          </form>
        </section>
      </article>
    </main>
  )
}

function LiveReflection({ reflection }: { reflection: LatestReflection }) {
  const text = reflection.content.text
  // Dela upp på dubbla newlines → stycken; bevarar prosa-flow.
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
  const generatedAt = formatGeneratedAt(reflection.created_at)
  const weekNum = isoWeek(reflection.created_at)

  return (
    <section className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">
          Speglingar
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          Vecka {weekNum}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
          Genererat {generatedAt} · {reflection.model_used}
        </p>
      </header>

      <div className="flex flex-col gap-6 text-lg leading-relaxed">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={
              i === paragraphs.length - 1 && p.startsWith('Källor')
                ? 'text-sm italic text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-4'
                : undefined
            }
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}

function EmptyOrError({
  reflection,
}: {
  reflection: { error: string } | null
}) {
  if (reflection && 'error' in reflection) {
    return (
      <section
        aria-label="Fel vid hämtning av reflektion"
        className="rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
      >
        <p className="font-medium mb-1">Kunde inte hämta brevet</p>
        <p className="font-mono text-xs">{reflection.error}</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-medium tracking-tight">
          Inget brev än
        </h1>
      </header>
      <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
        Selvra observerar dina källor och dina anteckningar. Första brevet
        kommer enligt rytmen du valt.
      </p>
      <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
        Tills dess: skriv tankar nedan. De blir källa för brevet när det
        skrivs.
      </p>
    </section>
  )
}
