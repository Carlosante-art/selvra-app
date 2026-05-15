/**
 * extractFactsFromTurn — V1 Steg 8 fact-extraction från samtals-turn.
 *
 * V2 (2026-05-16, backend-fokus):
 *   - Använder Mistral's strict json_schema-mode istället för text-parse
 *   - Few-shot examples i prompten för stabilare extraktion
 *   - Bevarad anti-hallucination för source_observed (sourceName måste
 *     finnas i sourcesConsulted)
 *
 * Per .gsd/SELVRA_CONSUMER_V1_BUILD_2026-05-15.md §7: "Selvra kör
 * extractFactsFromTurn efter varje user-turn."
 *
 * Två fact-typer:
 *   - user_stated: sak användaren själv sagt om sig själv
 *   - source_observed: observation från kopplad källa Selvra refererade till
 *
 * Pure function — LLM-call:en injektas. Caller persistar via
 * persistConversationFacts.
 *
 * Fail-safe: vid LLM-fel returneras tom array. Fact-extraction är
 * opportunistisk, inte kritisk för samtals-flow.
 */

import type { FactType } from '@/lib/db/conversation-schema'

import type { RelevantEvent } from './conversation-context'

/**
 * V2: LLM-call-fn returnerar JSON-string som matchar fact-extraction-schemat.
 * Wraps Mistral's json_schema-mode (callMistralJsonSchema från mistral.ts).
 *
 * Legacy text-mode (v1) skickas via samma typ — den används som fallback om
 * caller injectar en text-LLM. parseFactExtractionResponse hanterar båda.
 */
export type LlmJsonCallFn = (
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
  llmCall: LlmJsonCallFn
}

/**
 * JSON-schema för fact-extraction (V2). Skickas till Mistral via
 * callMistralJsonSchema. Sträng "strict": true → Mistral garanterar
 * att svaret matchar exakt.
 */
export const FACT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          factType: {
            type: 'string',
            enum: ['user_stated', 'source_observed'],
            description:
              'user_stated: sak användaren själv sagt. source_observed: observation från kopplad källa Selvra refererade till.',
          },
          factText: {
            type: 'string',
            description:
              'Kort faktatext, max 200 tecken. Återge faktan rakt utan tolkning.',
            maxLength: 500,
          },
          sourceName: {
            type: ['string', 'null'],
            description:
              'Källans namn för source_observed (lowercase). null för user_stated.',
          },
        },
        required: ['factType', 'factText', 'sourceName'],
        additionalProperties: false,
      },
    },
  },
  required: ['facts'],
  additionalProperties: false,
} as const

const FACT_EXTRACTION_SYSTEM_PROMPT = `Du är en assistent som extraherar faktiska påståenden från ett samtal mellan en användare och Selvra (en AI-spegel).

Två fact-typer:

1. USER_STATED — saker användaren själv säger om sig själv som kan vara värdefullt att komma ihåg.
   Exempel: "jag är T1-diabetiker", "min mamma heter Anna", "jag bor i Berlin",
   "jag sov dåligt i natt", "jag har en hund som heter Pim".

2. SOURCE_OBSERVED — observationer Selvra rapporterade från en kopplad källa.
   sourceName MÅSTE matcha källan exakt som den anges i tillgängliga events.
   Exempel: { factType: "source_observed", factText: "5.4h sömn i natt", sourceName: "garmin" }

REGLER:
- Återge faktan rakt, max 200 tecken. Aldrig tolkning eller spekulation.
- Aldrig "du borde", "du skulle", coach-språk eller emoji.
- Aldrig medicinsk diagnos eller klinisk klassificering.
- För source_observed: använd ENDAST sourceName från tillgängliga events. Hitta inte på källor.
- Om inga relevanta facts hittas: returnera tom array.

Du returnerar strukturerad JSON med fält "facts" (array).`

// Few-shot-exempel — visar LLM:n vad korrekt output ser ut. Mistral
// json_schema-mode är strikt men few-shots gör extraktions-kvaliteten
// stabilare (modellen lär sig vad som är "extraktionsvärd").
const FEW_SHOT_EXAMPLES: ReadonlyArray<{ user: string; assistant: string }> = [
  {
    user: `ANVÄNDARENS TUR:
Förresten, jag är T1-diabetiker sedan 13 år. Bor i Berlin sedan 2020.

SELVRA SVARADE:
Noterat.

KÄLLOR SELVRA HADE TILLGÅNG TILL:
(inga)`,
    assistant: JSON.stringify({
      facts: [
        { factType: 'user_stated', factText: 'jag är T1-diabetiker sedan 13 år', sourceName: null },
        { factType: 'user_stated', factText: 'bor i Berlin sedan 2020', sourceName: null },
      ],
    }),
  },
  {
    user: `ANVÄNDARENS TUR:
Hur var min vecka?

SELVRA SVARADE:
Du har sovit 5h 40min i snitt senaste 5 dagarna [source:garmin]. Baseline 7h 15min.

KÄLLOR SELVRA HADE TILLGÅNG TILL:
- garmin: sleep_summary duration_h_avg=5.67`,
    assistant: JSON.stringify({
      facts: [
        {
          factType: 'source_observed',
          factText: '5h 40min sömn-snitt senaste 5 dagarna',
          sourceName: 'garmin',
        },
      ],
    }),
  },
  {
    user: `ANVÄNDARENS TUR:
Hej.

SELVRA SVARADE:
Hej.

KÄLLOR SELVRA HADE TILLGÅNG TILL:
(inga)`,
    assistant: JSON.stringify({ facts: [] }),
  },
]

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
${sourceList || '(inga)'}`

  // Bygg messages med system + few-shot + faktisk turn
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: FACT_EXTRACTION_SYSTEM_PROMPT },
  ]
  for (const example of FEW_SHOT_EXAMPLES) {
    messages.push({ role: 'user', content: example.user })
    messages.push({ role: 'assistant', content: example.assistant })
  }
  messages.push({ role: 'user', content: userMessage })

  let response: string
  try {
    response = await input.llmCall(messages)
  } catch {
    // LLM-fel ska inte ta ner samtals-pipelinen. Returnera tom array.
    return []
  }

  return parseFactExtractionResponse(response, input.sourcesConsulted)
}

/**
 * Parsa LLM-respons. Defensiv mot LLM-output-variation:
 *   - Strippa kod-fence (```json ... ```) om legacy text-mode används
 *   - Validera struktur (facts: array)
 *   - Filtrera bort ogiltiga entries
 *   - source_observed kräver sourceName i sourcesConsulted (anti-hallucination)
 *
 * V2 med json_schema-mode bör inte träffa edge-cases ofta, men parsern
 * körs defensiv för säkerhets skull.
 */
export function parseFactExtractionResponse(
  rawResponse: string,
  sourcesConsulted: readonly RelevantEvent[],
): ExtractedFact[] {
  // Strippa kod-fence om finns (legacy text-mode-fallback)
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
    if (factText.length > 500) continue

    const factType = factObj.factType
    if (factType !== 'user_stated' && factType !== 'source_observed') continue

    let sourceName: string | null = null
    if (factType === 'source_observed') {
      const raw = factObj.sourceName
      if (typeof raw !== 'string' || raw.trim().length === 0) continue
      const normalized = raw.trim().toLowerCase()
      // Anti-hallucination: source_observed-fakta måste ha sourceName som
      // matchar en källa Selvra faktiskt hade tillgång till.
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
