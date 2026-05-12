import { regenerateBrev } from '@/lib/actions/triggers'
import { submitThought } from '@/lib/actions/thoughts'
import { ErrorNotice } from '@/components/error-notice'
import { TriggerButton } from '@/components/trigger-button'
import { getLatestReflection, listEvents } from '@/lib/protocol/client'
import type { EventListItem, LatestReflection } from '@/lib/protocol/types'

type SearchParams = Promise<{
  saved?: string
  regenerated?: string
  regenerate_error?: string
}>

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

async function loadThoughtsSince(iso: string): Promise<EventListItem[]> {
  try {
    const res = await listEvents({
      eventType: 'selvra.thought.recorded',
      since: new Date(iso),
      limit: 50,
    })
    // listEvents returnerar nyaste först; vänd för att visa kronologiskt
    return [...res.items].reverse()
  } catch {
    return []
  }
}

export default async function BrevPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const flash = formatSavedFlash(params.saved)
  const regenerated = params.regenerated
  const regenerateError = params.regenerate_error
  const reflection = await loadReflection()

  // Designval 10: tankar tillkomna efter brevets genereringstid visas under
  // brevet (associerade med, men inte annoterade i, det frusna dokumentet).
  const thoughtsSinceLetter =
    reflection && 'created_at' in reflection
      ? await loadThoughtsSince(reflection.created_at)
      : []

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        {regenerated && (
          <ErrorNotice variant="ok">
            Nytt brev genererat. Event {regenerated.slice(0, 8)}…
          </ErrorNotice>
        )}
        {regenerateError && (
          <ErrorNotice variant="error">
            Re-generering misslyckades: {regenerateError}
          </ErrorNotice>
        )}

        {reflection && 'content' in reflection ? (
          <LiveReflection reflection={reflection} />
        ) : (
          <EmptyOrError reflection={reflection} />
        )}

        <RegenerateSection />

        {thoughtsSinceLetter.length > 0 && (
          <ThoughtsSinceLetter thoughts={thoughtsSinceLetter} />
        )}

        <ArchiveLink />

        <OwnershipBanner />

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

function RegenerateSection() {
  return (
    <section
      aria-label="Re-generera brev"
      className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex flex-col gap-3"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Vill du se hur brevet skiftar efter att du skrivit nya tankar? Trigga
        en ny synthesis-körning.
      </p>
      <form action={regenerateBrev}>
        <TriggerButton
          label="Generera nytt brev"
          pendingLabel="Genererar… (30–60s)"
        />
      </form>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Använder samma prompt-version som senaste brev. Nya brevet
        persisteras som event och visas omedelbart här.
      </p>
    </section>
  )
}

function ArchiveLink() {
  return (
    <section
      aria-label="Tidigare brev"
      className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex items-center justify-between gap-4 flex-wrap"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Tidigare brev finns arkiverade — bevarade som de skrevs.
      </p>
      <a
        href="/brev/arkiv"
        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline underline-offset-2"
      >
        Öppna arkivet →
      </a>
    </section>
  )
}

function OwnershipBanner() {
  return (
    <section
      aria-label="Data-ägarskap"
      className="border-t border-neutral-200 dark:border-neutral-800 pt-8 flex flex-col gap-3"
    >
      <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
        Du äger denna representation
      </h2>
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Allt Selvra vet om dig — intentioner, tankar, reflektioner, källor,
        provenance — kan exporteras som ett enskilt JSON-dokument (SREF v1).
        EU-deployed. Kryptografiskt signerbart. Inget tredjepartsföretag har
        kopia. Du tar med dig din representation om du byter tjänst.
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        <a
          href="/api/export/sref"
          download
          className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
        >
          Exportera allt som SREF v1
        </a>
        <a
          href="/export/ai-context"
          className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          Dela med valfri AI
        </a>
        <a
          href="/export"
          className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          Förstå vad SREF är
        </a>
      </div>
    </section>
  )
}

function ThoughtsSinceLetter({ thoughts }: { thoughts: EventListItem[] }) {
  return (
    <section
      aria-label="Tankar tillkomna sedan brevet skrevs"
      className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-8"
    >
      <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
        Tankar sedan brevet
      </h2>
      <ul className="flex flex-col gap-5">
        {thoughts.map((t) => {
          const subjectShort = String(t.subject_id).slice(0, 8)
          return (
            <li
              key={t.event_id}
              className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              <div className="flex items-start gap-3">
                <time
                  dateTime={t.created_at}
                  className="text-xs text-neutral-500 dark:text-neutral-500 font-mono tabular-nums whitespace-nowrap pt-0.5"
                >
                  {formatThoughtTimestamp(t.created_at)}
                </time>
                <span>
                  &ldquo;{String((t.payload as { text?: string }).text ?? '')}&rdquo;
                </span>
              </div>
              <p className="ml-[5.25rem] mt-1 text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                Sparad under subject {subjectShort}… · event {t.event_id.slice(0, 8)}…
              </p>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
        Tankarna är sparade i Selvra-protokollet under ditt subject-id som
        append-only events. De annoteras inte i brevet ovan — brevet är
        frusen-dokument; dina tankar är separat tråd som finns parallellt.
      </p>
    </section>
  )
}

function formatThoughtTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // Format: "tis 14:30" — close-by-time relevant context, not full date
  const weekday = d.toLocaleDateString('sv-SE', { weekday: 'short' })
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${weekday} ${hh}:${mm}`
}

function EmptyOrError({
  reflection,
}: {
  reflection: { error: string } | null
}) {
  if (reflection && 'error' in reflection) {
    return (
      <ErrorNotice variant="error" title="Kunde inte hämta brevet">
        <p className="font-mono text-xs">{reflection.error}</p>
      </ErrorNotice>
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
