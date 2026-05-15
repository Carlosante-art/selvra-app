/**
 * /goodbye — landar här efter deleteAccount Server Action.
 *
 * Selvra-tonalitet: ingen sycophantic "tack för din tid", ingen FOMO-krok
 * "vi saknar dig redan", inga försök att övertala att komma tillbaka.
 * Bara konstatera att raderingen är klar och att representationen är borta.
 */

import Link from 'next/link'

export default function GoodbyePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <article className="max-w-prose w-full flex flex-col gap-6 text-center">
        <h1 className="text-3xl font-medium tracking-tight">
          Klart.
        </h1>
        <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
          Ditt konto är raderat. Alla samtal, alla minnen, alla källkopplingar
          är borta från Selvra. Backupar rensas inom 30 dagar enligt rutin.
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
          Om du senare ändrar dig kan du registrera ett nytt konto. Det
          gamla finns inte kvar i någon form.
        </p>
        <Link
          href="/"
          className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 mt-4"
        >
          Tillbaka till start
        </Link>
      </article>
    </main>
  )
}
