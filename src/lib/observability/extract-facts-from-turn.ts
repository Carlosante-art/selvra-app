/**
 * extractFactsFromTurn — V1 Steg 8 fact-extraction från samtals-turn.
 *
 * Per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §7:
 * "Selvra kör extractFactsFromTurn efter varje user-turn. Extraherar 0-N
 * facts som kan vara värdefulla för framtida samtal."
 *
 * Två fact-typer:
 *   - user_stated: sak användaren själv sagt om sig själv ("jag är T1D",
 *     "jag bor i Berlin", "min mamma heter Anna"). Extraheras från
 *     userText. Källa = null.
 *   - source_observed: observation från kopplad källa som Selvra
 *     refererade till i sitt svar. Extraheras från selvraText +
 *     sourcesConsulted. Källa = sourceName.
 *
 * Pure function — LLM-call:en injektas som callback. Persistens sker av
 * call-site via persistConversationFacts. Tomma facts-arrays är OK.
 *
 * Fail-safe: vid LLM-fel eller JSON-parse-fel returneras tom array.
 * Fact-extraction är opportunistisk, inte kritisk för samtals-flow.
 */

import type { RelevantEvent } from './conversation-context'
import type { FactType } from '@/lib/db/conversation-schema'

export type LlmCallFn = (
  messages: ReadonlyArray<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>,
) => Promise<string>

export type ExtractedFact = {
  factText: string
  factType: FactType
  sourceName: string | null
}

export type ExtractFactsInput = {
  userText: string
  selvraText: string
  sourcesConsulted: readonly RelevantEvent[]
  llmCall: LlmCallFn
}

const FACT_EXTRACTION_SYSTEM_PROMPT = `Du är en assistent som extraherar faktiska påståenden från ett samtal mellan en användare och Selvra (en AI-spegel).

Du ska identifiera två typer:

1. USER_STATED: Saker användaren själv säger om sig själv som kan vara värdefullt att komma ihåg. Exempel: "jag är T1-diabetiker", "min mamma heter Anna", "jag bor i Berlin", "jag sov dåligt i natt".

2. SOURCE_OBSERVED: Observationer Selvra rapporterade FRÅN EN KOPPLAD KÄLLA. Måste ha source_name som matchar källan Selvra refererade till. Exempel: { factText: "5.4h sömn i natt", sourceName: "garmin" }, { factText: "23 möten denna vecka", sourceName: "google_calendar" }.

Returnera ENDAST giltig JSON i exakt detta format:
{
  "facts": [
    { "factType": "user_stated", "factText": "...", "sourceName": null },
    { "factType": "source_observed", "factText": "...", "sourceName": "..." }
  ]
}

Om inga facts kan extraheras: { "facts": [] }

Regler:
- Återge faktan kort, max 200 tecken
- Aldrig spekulation eller tolkning
- Aldrig diagnos eller medicinsk klassificering
- Aldrig "du borde", "du skulle" eller liknande coach-språk
- Inga emoji
- Endast giltig JSON — ingen kommentar före eller efter`

export async function extractFactsFromTurn(
  input: ExtractFactsInput,
): Promise<ExtractedFact[]> {
  const sourceList = input.sourcesConsulted
    .map((s) => `- ${s.sourceAiId}: ${s.summary}`)
    .join('\n')

  const userMessage = `ANVÄNDARENS TUR:
${input.userText}

SELVRA SVARADE:
${input.selvraText}

KÄLLOR SELVRA HADE TILLGÅNG TILL:
${sourceList || '(inga)'}

Extrahera 0-N facts.`

  let response: string
  try {
    response = await input.llmCall([
      { role: 'system', content: FACT_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ])
  } catch {
    // LLM-fel ska inte ta ner samtals-pipelinen. Returnera tom array.
    return []
  }

  return parseFactExtractionResponse(response, input.sourcesConsulted)
}

/**
 * Parsa LLM-respons. Defensiv mot LLM-output-variation:
 *   - Strippa kod-fence (```json ... ```)
 *   - Validera struktur (facts: array)
 *   - Filtrera bort ogiltiga entries (saknad factType, tom factText, etc.)
 *   - För source_observed: kräv att sourceName matchar känd source
 *     (annars hallucination — skippa)
 */
export function parseFactExtractionResponse(
  rawResponse: string,
  sourcesConsulted: readonly RelevantEvent[],
): ExtractedFact[] {
  // Strippa kod-fence om finns
  const stripped = rawResponse
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch {
    return []
  }

  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.facts)) return []

  const knownSources = new Set(
    sourcesConsulted.map((s) => s.sourceAiId.toLowerCase()),
  )

  const valid: ExtractedFact[] = []
  for (const item of obj.facts) {
    if (!item || typeof item !== 'object') continue
    const factObj = item as Record<string, unknown>

    const factText = factObj.factText
    if (typeof factText !== 'string' || factText.trim().length === 0) continue
    if (factText.length > 500) continue // sanity-cap

    const factType = factObj.factType
    if (factType !== 'user_stated' && factType !== 'source_observed') continue

    let sourceName: string | null = null
    if (factType === 'source_observed') {
      const raw = factObj.sourceName
      if (typeof raw !== 'string' || raw.trim().length === 0) continue
      const normalized = raw.trim().toLowerCase()
      // Anti-hallucination: source_observed måste ha sourceName som matchar
      // någon källa Selvra faktiskt hade tillgång till. Annars skippas
      // entry:n.
      if (!knownSources.has(normalized)) continue
      sourceName = normalized
    }

    valid.push({
      factText: factText.trim(),
      factType,
      sourceName,
    })
  }

  return valid
}
