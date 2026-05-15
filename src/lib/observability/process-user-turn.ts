/**
 * processUserTurn — orchestrator för en Selvra-konversations-tur.
 *
 * Binder ihop pipelinen:
 *   1. detectMemoryFact: är detta en "kom ihåg X"-request?
 *   2. buildConversationContext: bygg LLM-prompt-array
 *   3. (injicerad LLM-call): anropa LLM
 *   4. validateConsumerOutput: kontroll mot konstitutionen
 *   5. Vid violations: retry med justerad prompt (max 2x)
 *   6. Om sista retry också fail:ar: fallback-text
 *
 * Pure function — LLM-call:en injektas som callback. Det gör hela
 * pipelinen testbar utan deps. Server Action wire:ar i den faktiska
 * Mistral-anropet vid Fas 1-aktivering.
 *
 * Output är diskriminerad union så call-sites kan skilja på
 * memory-request (skriv till conversation_memory_facts + erkänn) från
 * vanligt LLM-svar (skriv selvraText till conversation_turns).
 */

import {
  buildConversationContext,
  type ConversationTurn,
  type MemoryFact,
  type RelevantEvent,
} from './conversation-context'
import { detectMemoryFact } from './memory-fact-detector'
import {
  describeViolation,
  validateConsumerOutput,
  type LockViolation,
} from './consumer-lock-validate'

export type LlmCallFn = (
  messages: ReadonlyArray<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  retryHint?: string,
) => Promise<string>

export type ProcessTurnInput = {
  systemPrompt: string
  currentUserText: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  relevantEvents: readonly RelevantEvent[]
  llmCall: LlmCallFn
  /** Hur många retries vid lock-violation. Default 2. */
  maxRetries?: number
}

export type ProcessTurnResult =
  | {
      kind: 'memory_request'
      factText: string
      /** Erkännande-text Selvra ska säga till användaren. */
      acknowledgement: string
    }
  | {
      kind: 'llm_response'
      selvraText: string
      /** Antal LLM-anrop som gjordes (1 = lyckades direkt, 2-3 = retries). */
      attempts: number
      /** Sources som returneras till caller för persistens. Tom = LLM hade
       *  inga events att jobba med. */
      sourcesConsulted: readonly RelevantEvent[]
    }
  | {
      kind: 'fallback'
      /** Strukturerad fallback-text när alla retries fail:at. */
      selvraText: string
      /** Violations från sista LLM-svar (för audit + Sentry). */
      lastViolations: readonly LockViolation[]
      attempts: number
    }

/**
 * Strukturerad fallback-text när LLM inte producerar valid output efter
 * retries. Behåller Selvras tonalitet (käll-attribuerad, icke-coachande).
 */
const FALLBACK_TEXT =
  'Jag kan inte svara på det just nu — mitt svar följde inte mina egna regler. ' +
  'Vill du formulera om frågan, eller ska jag visa vad källorna säger?'

export async function processUserTurn(
  input: ProcessTurnInput,
): Promise<ProcessTurnResult> {
  const maxRetries = input.maxRetries ?? 2

  // STEG 1: Memory-fact-detection. Om användaren ber Selvra spara något,
  // kortsluts pipelinen — vi vill inte LLM-anrop på "kom ihåg X". Erkänn
  // direkt med strukturerad text, faktan persistas av call-site.
  const memoryCheck = detectMemoryFact(input.currentUserText)
  if (memoryCheck.isMemoryRequest && memoryCheck.factText) {
    return {
      kind: 'memory_request',
      factText: memoryCheck.factText,
      acknowledgement: buildMemoryAcknowledgement(memoryCheck.factText),
    }
  }

  // STEG 2: Bygg LLM-context
  const messages = buildConversationContext({
    systemPrompt: input.systemPrompt,
    recentTurns: input.recentTurns,
    activeMemoryFacts: input.activeMemoryFacts,
    relevantEvents: input.relevantEvents,
    currentUserText: input.currentUserText,
  })

  // STEG 3-5: LLM-anrop med retry-loop på lock-violations
  let lastViolations: readonly LockViolation[] = []
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const retryHint =
      attempt === 1
        ? undefined
        : buildRetryHint(lastViolations)

    const response = await input.llmCall(messages, retryHint)
    const validation = validateConsumerOutput(
      response,
      input.relevantEvents.map((e) => ({ source_ai_id: e.sourceAiId })),
    )

    if (validation.valid) {
      return {
        kind: 'llm_response',
        selvraText: response,
        attempts: attempt,
        sourcesConsulted: input.relevantEvents,
      }
    }

    lastViolations = validation.violations
  }

  // STEG 6: Alla retries fail:ade → fallback
  return {
    kind: 'fallback',
    selvraText: FALLBACK_TEXT,
    lastViolations,
    attempts: maxRetries + 1,
  }
}

/**
 * Erkännande Selvra säger när användaren ber spara minne. Behåller
 * tonen: rakt, inte servicefokuserat. Refererar till /minne så
 * användaren vet var faktan syns.
 */
function buildMemoryAcknowledgement(factText: string): string {
  return (
    `Jag har sparat det som en explicit fakta i ditt minne. ` +
    `Den syns i /minne och du kan radera den när du vill.\n\n` +
    `Sparat: "${factText}"`
  )
}

/**
 * Bygg retry-hint som läggs till i nästa LLM-anrop. Strukturerad så
 * LLM:n förstår exakt vad som gick fel i förra svaret. Caller skickar
 * detta som extra system-message eller i prompt-suffix.
 */
function buildRetryHint(violations: readonly LockViolation[]): string {
  const violationLines = violations.map((v) => `  - ${describeViolation(v)}`)
  return (
    `Ditt förra svar bröt mot Selvras konstitution:\n` +
    violationLines.join('\n') +
    `\n\nGenerera om svaret. Följ DU FÅR / DU FÅR ALDRIG-listorna strikt.`
  )
}
