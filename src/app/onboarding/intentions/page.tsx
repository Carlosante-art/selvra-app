import { submitIntentions } from '@/lib/actions/intentions'

const EXAMPLES = [
  'Träna fyra gånger i veckan',
  'Sova sju timmar minst',
  'Skriva tre dagar i veckan',
  'Inte titta på telefon första timmen på morgonen',
]

const RHYTHMS: Array<{ value: string; label: string }> = [
  { value: 'sunday_morning', label: 'Söndag morgon' },
  { value: 'friday_afternoon', label: 'Fredag eftermiddag' },
  { value: 'before_events', label: 'Inför specifika events (kopplar till kalender)' },
  { value: 'custom', label: 'Annan rytm' },
]

export default function IntentionsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Intentioner</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Vad du säger att du vill. Skriv upp till fem. Selvra speglar
            mönster mellan vad du säger och vad dina källor visar.
          </p>
          <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            Skriv som du tänker. Exempel:
          </p>
          <ul className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400 pl-4 flex flex-col gap-1">
            {EXAMPLES.map((ex) => (
              <li key={ex}>&ldquo;{ex}&rdquo;</li>
            ))}
          </ul>
        </header>

        <form action={submitIntentions} className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Intentioner</legend>
            {[1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                type="text"
                name={`intention_${i}`}
                maxLength={500}
                placeholder={i === 1 ? 'Skriv din första intention…' : ' '}
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
              />
            ))}
          </fieldset>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          <fieldset className="flex flex-col gap-3">
            <legend className="text-base font-medium leading-relaxed">
              Och en till — när vill du reflektera?
            </legend>
            <div className="flex flex-col gap-2">
              {RHYTHMS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-3 text-base leading-relaxed cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rhythm"
                    value={r.value}
                    defaultChecked={r.value === 'sunday_morning'}
                    className="h-4 w-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              name="rhythm_custom"
              maxLength={200}
              placeholder="…om 'Annan rytm', beskriv när"
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
            />
          </fieldset>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Fortsätt
            </button>
          </div>
        </form>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
          Du kan ändra senare.
        </p>
      </article>
    </main>
  )
}
