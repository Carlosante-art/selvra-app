import { submitSignalPreference } from '@/lib/actions/signal'

/**
 * Onboarding Steg 5 — Signal-opt-in. Per DESIGN.md §5.
 *
 * Default off enligt designval 7. Explicit deklaration av vad signalen
 * INTE gör — bygger förtroende på rätt sätt, inte via marketing.
 */

export default function SignalPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">
            Signal när brevet är klart?
          </h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Reflektionen finns i appen oavsett. Vill du ha en stilla
            påminnelse när den är skriven?
          </p>
        </header>

        <form
          action={submitSignalPreference}
          className="flex flex-col gap-6"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Signal-preferens</legend>
            <label className="flex items-center gap-3 cursor-pointer text-base leading-relaxed">
              <input
                type="radio"
                name="enabled"
                value="yes"
                className="h-4 w-4"
              />
              <span>Ja, signal när reflektionen är klar</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-base leading-relaxed">
              <input
                type="radio"
                name="enabled"
                value="no"
                defaultChecked
                className="h-4 w-4"
              />
              <span>Nej, jag öppnar själv</span>
            </label>
          </fieldset>

          <section className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 px-4 py-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Vad signalen INTE gör:
            </p>
            <ul className="flex flex-col gap-1 list-disc pl-5">
              <li>Skickar inte "vi saknar dig"-påminnelser.</li>
              <li>Skickar inte "du har inte tränat på 3 dagar"-notiser.</li>
              <li>Inga badge-räkneverk eller streaks.</li>
              <li>Inga prescriptive coaching-prompts.</li>
            </ul>
            <p className="mt-2">
              Bara den ena signalen, max veckovis, faktabaserad: "Veckans
              reflektion är klar."
            </p>
          </section>

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
