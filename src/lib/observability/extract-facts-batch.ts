/**
 * extractFactsBatch — batch-version av extractFactsFromTurn.
 *
 * Skalbarhets-audit 2026-05-16 visade att synchron per-turn-extraction
 * (extract-facts-from-turn.ts) duplicerar shared system-prompt + 3 few-shots
 * (~600 tokens) i varje LLM-call. Vid 9M turns/månad blir det ~5.4B
 * "wasted" tokens (~€10,800/månad ren overhead).
 *
 * Batch-strategi: skicka N turns till Mistral i ett anrop. Shared prompt
 * amortiseras över batchen. Mistral måste returnera array-of-arrays
 * (per-turn facts) som vi mappar tillbaka till turnId.
 *
 * Pure function — LLM-call:en injektas. Caller (cron-endpoint) persistar
 * via persistConversationFacts + markTurnExtractionStatus.
 *
 * Konstitutionellt: samma extractFactsFromTurn-regler gäller. source_observed
 * måste matcha sourcesConsulted för respektive turn (anti-hallucination).
 * Per-turn parsering skiljer sig från single-turn versionen — vi joinar
 * inte över turn-boundaries.
 */

import type { FactType } from '@/lib/db/conversation-schema'

import type { ExtractedFact, LlmJsonCallFn } from './extract-facts-from-turn'

export type BatchTurnInput = {
  turnId: string
  userText: string
  selvraText: string
  sourcesConsulted: ReadonlyArray<{ sourceAiId: string }>
}

export type BatchExtractionResult = {
  turnId: string
  facts: ExtractedFact[]
}

/**
 * JSON-schema för batch-extraction. Returnerar { results: [{turnId, facts}] }
 * så vi kan mappa per-turn-facts tillbaka utan att lita på array-index.
 *
 * factText/factType/sourceName är samma som FACT_EXTRACTION_SCHEMA i
 * extract-facts-from-turn.ts.
 */
export const BATCH_FACT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          turnId: { type: 'string' },
          facts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factType: {
                  type: 'string',
                  enum: ['user_stated', 'source_observed'],
                },
                factText: { type: 'string', maxLength: 500 },
                sourceName: { type: ['string', 'null'] },
              },
              required: ['factType', 'factText', 'sourceName'],
              additionalProperties: false,
            },
          },
        },
        required: ['turnId', 'facts'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
} as const

const BATCH_SYSTEM_PROMPT = `Du är en assistent som extraherar faktiska påståenden från flera samtals-turer mellan en användare och Selvra (en AI-spegel). Varje tur behandlas separat — facts från en tur kombineras INTE med en annan.

Två fact-typer per tur:

1. USER_STATED — saker användaren själv säger om sig själv som kan vara värdefullt att komma ihåg.
   Exempel: "jag är T1-diabetiker", "min mamma heter Anna", "jag bor i Berlin".

2. SOURCE_OBSERVED — observationer Selvra rapporterade från en kopplad källa.
   sourceName MÅSTE matcha källan exakt som den anges i tillgängliga events för DEN turen.

REGLER:
- Återge faktan rakt, max 200 tecken. Aldrig tolkning eller spekulation.
- Aldrig "du borde", "du skulle", coach-språk eller emoji.
- Aldrig medicinsk diagnos eller klinisk klassificering.
- För source_observed: använd ENDAST sourceName från tillgängliga events för respektive tur. Hitta inte på källor.
- Om en tur inte har relevanta facts: returnera tom array för den turen.
- Returnera EN entry i results per input-tur, med exakt samma turnId.

Du returnerar strukturerad JSON: { results: [{ turnId, facts: [...] }] }.`

// Few-shot för batch-mode. Visar att turnId-mapping ska respekteras och
// att tomma facts-arrays är OK. Bara ETT example för att hålla shared
// prompt-overhead låg — batch-mode-quality kommer från strict json_schema,
// inte exhaustive examples.
const BATCH_FEW_SHOT: { user: string; assistant: string } = {
  user: `TUR turn_aaa:
ANVÄNDAREN: jag är T1-diabetiker sedan 13 år. Bor i Berlin.
SELVRA: Noterat.
KÄLLOR SELVRA HADE: (inga)

TUR turn_bbb:
ANVÄNDAREN: Hej.
SELVRA: Hej.
KÄLLOR SELVRA HADE: (inga)

TUR turn_ccc:
ANVÄNDAREN: Hur var min sömn?
SELVRA: Du sov 5h 40min senaste 5 dagarna [source:garmin]. Baseline 7h 15min.
KÄLLOR SELVRA HADE: - garmin: sleep_summary duration_h_avg=5.67`,
  assistant: JSON.stringify({
    results: [
      {
        turnId: 'turn_aaa',
        facts: [
          { factType: 'user_stated', factText: 'jag är T1-diabetiker sedan 13 år', sourceName: null },
          { factType: 'user_stated', factText: 'bor i Berlin', sourceName: null },
        ],
      },
      { turnId: 'turn_bbb', facts: [] },
      {
        turnId: 'turn_ccc',
        facts: [
          {
            factType: 'source_observed',
            factText: '5h 40min sömn-snitt senaste 5 dagarna',
            sourceName: 'garmin',
          },
        ],
      },
    ],
  }),
}

/**
 * Bygg user-message med N turns formaterade. Varje tur föregås av sin
 * turnId så LLM:n kan mappa facts tillbaka.
 */
export function buildBatchUserMessage(turns: ReadonlyArray<BatchTurnInput>): string {
  return turns
    .map((t) => {
      const sourceList = t.sourcesConsulted
        .map((s) => `- ${s.sourceAiId}`)
        .join('\n')
      return `TUR ${t.turnId}:
ANVÄNDAREN: ${t.userText}
SELVRA: ${t.selvraText}
KÄLLOR SELVRA HADE: ${sourceList || '(inga)'}`
    })
    .join('\n\n')
}

export async function extractFactsBatch(input: {
  turns: ReadonlyArray<BatchTurnInput>
  llmCall: LlmJsonCallFn
}): Promise<BatchExtractionResult[]> {
  if (input.turns.length === 0) return []

  const userMessage = buildBatchUserMessage(input.turns)

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: BATCH_SYSTEM_PROMPT },
    { role: 'user', content: BATCH_FEW_SHOT.user },
    { role: 'assistant', content: BATCH_FEW_SHOT.assistant },
    { role: 'user', content: userMessage },
  ]

  let response: string
  try {
    response = await input.llmCall(messages)
  } catch {
    // LLM-fel propagerar inte — caller (cron) markerar alla turns som failed.
    // Vi returnerar tom array så caller ser "0 results" och triggar fail-path.
    return []
  }

  return parseBatchExtractionResponse(response, input.turns)
}

/**
 * Parsa batch-respons. Defensiv mot LLM-output-variation:
 *   - Validera struktur (results: array of {turnId, facts})
 *   - Filtrera bort turnIds som inte var i input (LLM-hallucination)
 *   - Per-turn: applicera samma source-validation som single-turn-versionen
 *
 * Returnerar BARA turns som LLM:n faktiskt returnerat något för. Saknade
 * turnIds blir caller's problem att markera som failed (eller skipped om
 * det är upprepad failure).
 */
export function parseBatchExtractionResponse(
  rawResponse: string,
  turns: ReadonlyArray<BatchTurnInput>,
): BatchExtractionResult[] {
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
  if (!Array.isArray(obj.results)) return []

  // Bygg lookup för turnId → sourcesConsulted så vi kan validera source_observed
  // anti-hallucination per turn.
  const turnSources = new Map<string, Set<string>>()
  for (const t of turns) {
    turnSources.set(
      t.turnId,
      new Set(t.sourcesConsulted.map((s) => s.sourceAiId.toLowerCase())),
    )
  }

  const validResults: BatchExtractionResult[] = []
  for (const item of obj.results) {
    if (!item || typeof item !== 'object') continue
    const resObj = item as Record<string, unknown>

    const turnId = resObj.turnId
    if (typeof turnId !== 'string') continue
    if (!turnSources.has(turnId)) continue // hallucinerad turnId — droppa

    const knownSources = turnSources.get(turnId)!

    if (!Array.isArray(resObj.facts)) {
      // LLM returnerade entry för denna turn men utan facts-array — räkna som
      // tom (turn är genomgången men 0 facts hittades).
      validResults.push({ turnId, facts: [] })
      continue
    }

    const validFacts: ExtractedFact[] = []
    for (const factItem of resObj.facts) {
      if (!factItem || typeof factItem !== 'object') continue
      const fObj = factItem as Record<string, unknown>

      const factText = fObj.factText
      if (typeof factText !== 'string' || factText.trim().length === 0) continue
      if (factText.length > 500) continue

      const factType = fObj.factType
      if (factType !== 'user_stated' && factType !== 'source_observed') continue

      let sourceName: string | null = null
      if (factType === 'source_observed') {
        const raw = fObj.sourceName
        if (typeof raw !== 'string' || raw.trim().length === 0) continue
        const normalized = raw.trim().toLowerCase()
        if (!knownSources.has(normalized)) continue
        sourceName = normalized
      }

      validFacts.push({
        factText: factText.trim(),
        factType: factType as FactType,
        sourceName,
      })
    }

    validResults.push({ turnId, facts: validFacts })
  }

  return validResults
}
