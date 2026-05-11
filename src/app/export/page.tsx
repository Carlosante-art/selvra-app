import Link from 'next/link'

/**
 * /export — visar exportflöde för användarens SREF v1-doc.
 *
 * Doktrinärt: "du äger representationen" görs synlig som första-klassig
 * funktion. Klicka → server-route fetchar SREF från protokollet → browser
 * laddar ner som JSON-fil.
 */

export default function ExportPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">
            Exportera din representation
          </h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Allt Selvra vet om dig — intentioner, tankar, reflektioner, källor,
            relationer — kan exporteras som ett enskilt JSON-dokument (SREF v1).
            Du äger din representation. Det här är hur du tar den med dig.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 dark:border-neutral-800 px-5 py-5">
          <h2 className="text-base font-medium">SREF v1 — full export</h2>
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Innehåller hela händelse-loggen för ditt subject:
            event-attribuering, provenance-kedja, epistemiska klassificeringar,
            och derived representation. Om protokollet är konfigurerat med
            signerings-nyckel är dokumentet HMAC-signerat så mottagare kan
            verifiera integritet.
          </p>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Format: JSON. Storlek beror på din historik — Carl-dogfood har just
            nu några hundra KB. Filnamn:{' '}
            <span className="font-mono text-xs">selvra-sref-YYYY-MM-DD.json</span>
            .
          </p>
          <div className="pt-2">
            <a
              href="/api/export/sref"
              download
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Ladda ner SREF
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 dark:border-neutral-800 px-5 py-5">
          <h2 className="text-base font-medium">Dela med valfri AI</h2>
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Strukturerad text-profil du kan klistra in i ChatGPT, Claude,
            Gemini eller annan AI. När du pratar med en ny AI känner den
            dig inte — det här är hur du ger den din kontext direkt, utan
            att vara inlåst i deras minne.
          </p>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Konfigurerbar: tidsperiod (vecka/månad/allt), lager
            (intentioner/tankar/mönster). Format: läsbar text, ej JSON.
          </p>
          <div>
            <Link
              href="/export/ai-context"
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Skapa AI-context
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            Vad du kan göra med filen
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5">
            <li>
              Behålla som personlig backup — Selvra kan rivas/migreras utan
              dataförlust.
            </li>
            <li>
              Skicka till läkare eller annan part som behöver bevisat-äkta
              context (signerade SREF:er kan verifieras utan att tillit till
              Selvra-protokollet krävs).
            </li>
            <li>
              Importera till framtida Selvra-kompatibel tjänst om du vill byta
              leverantör. Open standard via SREF-spec.
            </li>
          </ul>
        </section>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
          Export är WRITE-rate-limit-class hos protokollet — replays alla events,
          encodar embeddings, dedupar provenance. Spamma inte; sparas över tid.
        </p>

        <p>
          <Link
            href="/brev"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            ← Tillbaka till brevet
          </Link>
        </p>
      </article>
    </main>
  )
}
