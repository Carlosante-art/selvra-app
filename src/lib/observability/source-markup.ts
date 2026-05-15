/**
 * V1 Steg 9: source-attribution-markup-parser.
 *
 * Per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §7: LLM-output ska
 * inkludera käll-attribuering inline via [source:NAME]-markup. UI:t
 * renderar dessa som klickbara badges som länkar till /minne?source=NAME.
 *
 * Exempel-input:
 *   "Du sov 5h 40min senaste 5 dagarna [source:garmin]. Baseline är 7h
 *    [source:garmin_baseline]."
 *
 * Exempel-output (segments):
 *   [
 *     { type: 'text', value: 'Du sov 5h 40min senaste 5 dagarna ' },
 *     { type: 'source', name: 'garmin' },
 *     { type: 'text', value: '. Baseline är 7h ' },
 *     { type: 'source', name: 'garmin_baseline' },
 *     { type: 'text', value: '.' },
 *   ]
 *
 * Pure function — kan användas både server- och klient-side.
 *
 * Källa-namn-format: lowercase + underscore. Regex är permissiv för att
 * matcha även namn med siffror eller bindestreck om LLM råkar producera
 * sådana. Whitespace inuti markup blockeras dock — det är inte giltig
 * source-syntax.
 */

export type MarkupSegment =
  | { type: 'text'; value: string }
  | { type: 'source'; name: string }

// [source:X] där X är lowercase a-z + digit + underscore + bindestreck.
// Whitespace blockeras. \[ och \] för literal-brackets. Global flag för
// att hitta alla matches.
const SOURCE_MARKUP_REGEX = /\[source:([a-z0-9_-]+)\]/gi

export function parseSourceMarkup(text: string): MarkupSegment[] {
  const segments: MarkupSegment[] = []
  let lastIndex = 0

  // matchAll ger alla träffar med index. Vi bygger ett segment-array
  // genom att alternera text-segment (allt före match) + source-segment.
  for (const match of text.matchAll(SOURCE_MARKUP_REGEX)) {
    if (match.index === undefined) continue

    // Text före markup (om finns)
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      })
    }

    // Source-segment. Normalisera namn till lowercase för konsistens.
    segments.push({
      type: 'source',
      name: match[1].toLowerCase(),
    })

    lastIndex = match.index + match[0].length
  }

  // Trailing text efter sista markup
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  // Edge-case: ingen markup alls → ett text-segment med hela texten
  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: 'text', value: text })
  }

  return segments
}

/**
 * Hämta unika källa-namn från text (i ordning de förekommer). Användbar
 * för att bygga "Källor: X · Y · Z"-footer eller filter-listor.
 */
export function extractSourceNames(text: string): string[] {
  const names = new Set<string>()
  const ordered: string[] = []
  for (const match of text.matchAll(SOURCE_MARKUP_REGEX)) {
    const name = match[1].toLowerCase()
    if (!names.has(name)) {
      names.add(name)
      ordered.push(name)
    }
  }
  return ordered
}

/**
 * Strippa markup helt (för plain-text-export, sökning, etc.).
 * Lämnar bara texten. Använd `extractSourceNames` separat om du behöver
 * källorna.
 */
export function stripSourceMarkup(text: string): string {
  return text
    .replace(SOURCE_MARKUP_REGEX, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/ {2,}/g, ' ') // collapse multiple spaces efter strip
}
