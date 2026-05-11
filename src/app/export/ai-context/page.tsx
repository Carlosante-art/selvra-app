import Link from 'next/link'

import { CopyButton } from '@/components/copy-button'
import { generateAiContext } from '@/lib/ai-context/format'
import {
  ALL_LAYERS,
  isValidLayer,
  isValidPeriod,
} from '@/lib/ai-context/types'
import type { AiContextLayer, AiContextPeriod } from '@/lib/ai-context/types'

type SearchParams = Promise<{
  period?: string
  layers?: string
}>

const PERIOD_OPTIONS: Array<{ value: AiContextPeriod; label: string }> = [
  { value: 'week', label: 'Senaste veckan' },
  { value: 'month', label: 'Senaste månaden' },
  { value: 'all', label: 'All historik' },
]

const LAYER_OPTIONS: Array<{ value: AiContextLayer; label: string; description: string }> = [
  {
    value: 'intentions',
    label: 'Intentioner',
    description: 'Vad du sagt att du vill (Lager 1).',
  },
  {
    value: 'thoughts',
    label: 'Tankar',
    description: 'Vad du skrivit till Selvra (Lager 2).',
  },
  {
    value: 'patterns',
    label: 'Bakgrunds-observationer',
    description: 'Mönster Dreamer härlett autonomt. Mest känslig — överväg om du vill dela.',
  },
]

export default async function AiContextPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const period: AiContextPeriod = isValidPeriod(params.period ?? null)
    ? (params.period as AiContextPeriod)
    : 'week'
  const layers: AiContextLayer[] = params.layers
    ? params.layers
        .split(',')
        .map((s) => s.trim())
        .filter(isValidLayer)
    : ALL_LAYERS

  const text = await generateAiContext({ period, layers })
  const charCount = text.length

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">
            Dela med valfri AI
          </h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Strukturerad text-profil du kan klistra in i ChatGPT, Claude,
            Gemini eller någon annan AI. När du pratar med en ny AI känner
            den dig inte — det här är hur du ger den din kontext direkt,
            utan att vara inlåst i deras minne.
          </p>
        </header>

        <form
          method="GET"
          action="/export/ai-context"
          className="flex flex-col gap-6 rounded-md border border-neutral-200 dark:border-neutral-800 px-5 py-5"
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              Tidsperiod
            </legend>
            <div className="flex flex-col gap-2">
              {PERIOD_OPTIONS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-3 text-sm leading-relaxed cursor-pointer"
                >
                  <input
                    type="radio"
                    name="period"
                    value={p.value}
                    defaultChecked={period === p.value}
                    className="h-4 w-4"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <legend className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              Lager att inkludera
            </legend>
            <div className="flex flex-col gap-3">
              {LAYER_OPTIONS.map((l) => (
                <label
                  key={l.value}
                  className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="layers"
                    value={l.value}
                    defaultChecked={layers.includes(l.value)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    <span className="block font-medium">{l.label}</span>
                    <span className="block text-neutral-600 dark:text-neutral-400 text-xs">
                      {l.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              Uppdatera
            </button>
          </div>
        </form>

        <section className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-medium">Genererad text</h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-500 font-mono tabular-nums">
              {charCount} tecken
            </span>
          </header>
          <pre
            aria-label="Genererad AI-context"
            className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-4 text-xs font-mono leading-relaxed text-neutral-800 dark:text-neutral-200"
          >
            {text}
          </pre>
          <div className="flex flex-wrap gap-3">
            <CopyButton text={text} label="Kopiera till klippbord" />
            <a
              href={`/api/export/ai-context?period=${period}&layers=${layers.join(',')}&download=1`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 px-5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              Ladda ner som .txt
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            Hur du använder texten
          </h2>
          <ol className="flex flex-col gap-1 list-decimal pl-5">
            <li>Klistra in i början av en konversation med valfri AI.</li>
            <li>Ställ din fråga normalt — AI:n har nu din kontext.</li>
            <li>När du byter AI: gör samma sak. Din representation följer dig.</li>
          </ol>
          <p>
            Detta är inte memory-recall. AI:n får din kontext för
            konversationen; den lagras inte permanent hos leverantören om
            inte du gör det aktivt.
          </p>
          <p>
            Vill du ha den fulla, kryptografiskt signerade representationen?
            Använd istället{' '}
            <Link
              href="/export"
              className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline underline-offset-2"
            >
              SREF v1-export
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
