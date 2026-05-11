export default function CheckEmailPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">
            Länken är på väg.
          </h1>
        </header>

        <p className="text-lg leading-relaxed">
          Vi har skickat en länk till din e-post. Klicka på den för att
          fortsätta.
        </p>

        <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
          Länken är giltig i 24 timmar. Inget annat händer förrän du
          klickar.
        </p>
      </article>
    </main>
  )
}
