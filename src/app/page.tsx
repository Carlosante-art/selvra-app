import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header>
          <h1 className="text-4xl font-medium tracking-tight">Selvra</h1>
        </header>

        <p className="text-xl leading-relaxed">
          Ett brev till dig själv, varje vecka, från någon som har observerat
          den.
        </p>

        <section
          aria-label="Exempel-reflektion"
          className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-6 py-2 text-neutral-700 dark:text-neutral-300 italic"
        >
          <p className="text-sm uppercase tracking-wide not-italic text-neutral-500 dark:text-neutral-500 mb-3">
            Exempel
          </p>
          <p className="leading-relaxed">
            &ldquo;Garmin visade 1 träningspass förra veckan. Din intention
            från mars: 4 pass. Du skrev till Selvra på torsdagen att veckan
            varit avvikande. Sömn-snitt: 6h 12min — under din egen markering
            på 7h.&rdquo;
          </p>
        </section>

        <p className="leading-relaxed">
          Selvra läser källor du redan använder och speglar mönster mellan
          vad du säger att du vill och vad datan visar att du gör.
        </p>

        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          Inte en dashboard. Inte en coach. Inte ett socialt nätverk.
        </p>

        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          Du äger representationen. Den ligger i EU. Exporterbar. Raderbar.
        </p>

        <div className="pt-4">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Börja
          </Link>
        </div>
      </article>
    </main>
  )
}
