import { submitThought } from '@/lib/actions/thoughts'

type SearchParams = Promise<{ saved?: string }>

function formatSavedFlash(savedIso: string | undefined): string | null {
  if (!savedIso) return null
  try {
    const d = new Date(savedIso)
    if (Number.isNaN(d.getTime())) return null
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `Sparad ${hh}:${mm}.`
  } catch {
    return null
  }
}

export default async function ThoughtsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const flash = formatSavedFlash(params.saved)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Tankar</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Skriv något du tänker om dig själv. Det blir källa för nästa
            brev.
          </p>
          <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            Inte formellt. Inte en dagbok. Bara det du redan tänker — i
            stället för att tänka det i tystnad.
          </p>
        </header>

        <form action={submitThought} className="flex flex-col gap-4">
          <label htmlFor="thought-text" className="sr-only">
            Tanke
          </label>
          <textarea
            id="thought-text"
            name="text"
            rows={8}
            maxLength={4000}
            required
            placeholder="…"
            className="w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
          />

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
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

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500 pt-2">
          Det du skriver finns kvar. Du behöver inte komma ihåg det.
        </p>
      </article>
    </main>
  )
}
