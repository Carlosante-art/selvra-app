import { submitThought } from '@/lib/actions/thoughts'

type SearchParams = Promise<{ saved?: string }>

function formatSavedFlash(savedIso: string | undefined): string | null {
  if (!savedIso) return null
  const d = new Date(savedIso)
  if (Number.isNaN(d.getTime())) return null
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `Tanke sparad ${hh}:${mm}.`
}

export default async function BrevPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const flash = formatSavedFlash(params.saved)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        {/* Förhandsvisning-banner — tydlig om att detta är handskriven exempel */}
        <aside
          aria-label="Förhandsvisning-status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-medium mb-1">Förhandsvisa brev-formatet</p>
          <p>
            Texten nedan är handskriven exempel baserad på dina riktiga
            events från idag. När synthesis-pipelinen är byggd genereras
            brevet automatiskt enligt samma format.
          </p>
        </aside>

        <section className="flex flex-col gap-8">
          <header>
            <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">
              Speglingar
            </p>
            <h1 className="text-3xl font-medium tracking-tight">
              Vecka 19
            </h1>
          </header>

          <div className="flex flex-col gap-6 text-lg leading-relaxed">
            <p>
              Du deklarerade tre intentioner i morse:
              <em>
                {' '}
                &ldquo;Träna 3 gånger i veckan&rdquo;,{' '}
                &ldquo;Sova 7 timmar&rdquo;,{' '}
                &ldquo;Ha intention när jag gör något.&rdquo;
              </em>
            </p>

            <p>
              Du skrev åtta minuter senare:{' '}
              <em>
                &ldquo;Jag vill att det jag gör ska ha ett syfte, att jag
                rör mig mot något och att allt jag gör leder till ett
                mål.&rdquo;
              </em>
            </p>

            <p>
              Två av dina tre intentioner berör målmedvetenhet. Din tanke
              åtta minuter senare återanvänder samma tema med andra ord
              — &ldquo;syfte&rdquo;, &ldquo;riktning&rdquo;,
              &ldquo;mål&rdquo;.
            </p>

            <p className="text-neutral-700 dark:text-neutral-300">
              — Är detta något du upptäcker nu, eller något du redan
              visste om dig själv?
            </p>
          </div>

          <footer className="text-sm italic text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            Källor: dina egna intentioner (declared 2026-05-11 12:58) · dina
            egna tankar (recorded 2026-05-11 13:06)
          </footer>
        </section>

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
