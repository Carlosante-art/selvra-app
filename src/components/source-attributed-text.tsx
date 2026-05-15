/**
 * SourceAttributedText — renderar text med [source:X]-markup som inline
 * Selvra-stil + klickbara badges till /minne?source=X.
 *
 * Per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §7. Användbar både i
 * Server Components (Selvra-historik) och Client Components (streaming-
 * tokens som ackumuleras). Pure function — ingen state.
 *
 * Whitespace-disciplin: text-segment renderas exakt (whitespace-pre-wrap
 * styling antas i parent). Source-badge är inline-span med subtil rounded
 * background.
 */

import Link from 'next/link'

import { parseSourceMarkup } from '@/lib/observability/source-markup'

export function SourceAttributedText({ text }: { text: string }) {
  const segments = parseSourceMarkup(text)

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.value}</span>
        }
        return (
          <Link
            key={i}
            href={`/minne?source=${encodeURIComponent(segment.name)}`}
            className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors no-underline"
            aria-label={`Källa: ${segment.name}. Öppna alla observationer från denna källa.`}
          >
            {segment.name}
          </Link>
        )
      })}
    </>
  )
}
