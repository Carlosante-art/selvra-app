import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">
            Sidan finns inte
          </h1>
        </header>

        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
          Du följde en länk som inte längre pekar någonstans, eller skrev en
          adress som inte motsvarar något i Selvra-appen.
        </p>

        <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
          Inget farligt har hänt. Du kan gå tillbaka eller starta om från
          början.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Tillbaka till start
          </Link>
        </div>
      </article>
    </main>
  )
}
