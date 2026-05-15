/**
 * processStreamingUserTurn — streaming-variant av processUserTurn.
 *
 * Skillnader mot non-streaming:
 *   - LLM-call:en är streaming (AsyncIterable<string> token-chunks)
 *   - Validation körs POST-stream på samlad fullText
 *   - Ingen retry-loop (visuellt flickering om vi "tar tillbaka" stream)
 *   - Vid validation-fail: yieldar 'fallback'-event så klient ersätter
 *     den stream:ade texten med fallback-meddelande
 *
 * Memory-fact-detection kortslutar precis som non-streaming — ingen
 * LLM-call alls, bara erkännande-text.
 *
 * Pure function — streaming-LLM-call:en injektas som callback. Server-
 * route wire:ar i streamMistral.
 *
 * Output är AsyncGenerator av StreamEvent. Caller (route handler)
 * översätter eventen till NDJSON-lines till klient.
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

export type LlmStreamFn = (
  messages: ReadonlyArray<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  retryHint?: string,
) => AsyncIterable<string>

export type LlmRetryFn = (
  messages: ReadonlyArray<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  retryHint?: string,
) => Promise<string>

export type ProcessStreamingTurnInput = {
  systemPrompt: string
  currentUserText: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  relevantEvents: readonly RelevantEvent[]
  llmStream: LlmStreamFn
  /** V1 Steg 7: non-stream retry-fn för validation-violation. Om utelämnad
   *  faller pipelinen direkt till fallback vid violation (legacy-läge). */
  llmRetry?: LlmRetryFn
}

export type StreamEvent =
  | {
      kind: 'memory_request'
      factText: string
      acknowledgement: string
    }
  | {
      kind: 'stream_start'
      sourcesConsulted: readonly RelevantEvent[]
    }
  | {
      kind: 'chunk'
      text: string
    }
  | {
      kind: 'stream_end'
      selvraText: string
      sourcesConsulted: readonly RelevantEvent[]
    }
  | {
      kind: 'fallback'
      selvraText: string
      lastViolations: readonly LockViolation[]
      /** Den orenade texten klient streamade — för persist-audit. */
      rejectedText: string
    }

const FALLBACK_TEXT =
  'Jag kan inte svara på det just nu — mitt svar följde inte mina egna regler. ' +
  'Vill du formulera om frågan, eller ska jag visa vad källorna säger?'

export async function* processStreamingUserTurn(
  input: ProcessStreamingTurnInput,
): AsyncGenerator<StreamEvent, void, void> {
  // STEG 1: Memory-fact-detection. Samma kortslut som non-streaming.
  const memoryCheck = detectMemoryFact(input.currentUserText)
  if (memoryCheck.isMemoryRequest && memoryCheck.factText) {
    yield {
      kind: 'memory_request',
      factText: memoryCheck.factText,
      acknowledgement: buildMemoryAcknowledgement(memoryCheck.factText),
    }
    return
  }

  // STEG 2: Bygg LLM-context
  const messages = buildConversationContext({
    systemPrompt: input.systemPrompt,
    recentTurns: input.recentTurns,
    activeMemoryFacts: input.activeMemoryFacts,
    relevantEvents: input.relevantEvents,
    currentUserText: input.currentUserText,
  })

  // STEG 3: Signalera stream-start (klient renderar Selvra-bubble + sources)
  yield {
    kind: 'stream_start',
    sourcesConsulted: input.relevantEvents,
  }

  // STEG 4: Streama Mistral, samla fullText för post-validation
  let fullText = ''
  for await (const chunk of input.llmStream(messages)) {
    fullText += chunk
    yield { kind: 'chunk', text: chunk }
  }

  // STEG 5: Post-stream-validation mot konstitutionen
  const validation = validateConsumerOutput(
    fullText,
    input.relevantEvents.map((e) => ({ source_ai_id: e.sourceAiId })),
  )

  if (validation.valid) {
    yield {
      kind: 'stream_end',
      selvraText: fullText,
      sourcesConsulted: input.relevantEvents,
    }
    return
  }

  // V1 Steg 7: Violation → om llmRetry injektad, gör non-stream retry-call
  // med retry-hint, validera, returnera retry-text om OK (klient ersätter
  // sin stream:ade text). Om retry också fail:ar eller llmRetry saknas →
  // fallback.
  if (input.llmRetry) {
    const retryHint = buildRetryHint(validation.violations)
    let retryText: string
    try {
      retryText = await input.llmRetry(messages, retryHint)
    } catch {
      // Retry fail:ade tekniskt — fall till fallback med original-violation
      yield buildFallbackEvent(validation.violations, fullText)
      return
    }

    const retryValidation = validateConsumerOutput(
      retryText,
      input.relevantEvents.map((e) => ({ source_ai_id: e.sourceAiId })),
    )

    if (retryValidation.valid) {
      // Retry OK. Yielda stream_end med retry-text — klient ersätter
      // den stream:ade texten med detta som final.
      yield {
        kind: 'stream_end',
        selvraText: retryText,
        sourcesConsulted: input.relevantEvents,
      }
      return
    }

    // Retry också bröt → fallback. Original-text loggas som rejected.
    yield buildFallbackEvent(retryValidation.violations, fullText)
    return
  }

  // Ingen retry-fn injektad → fallback direkt (legacy-läge).
  yield buildFallbackEvent(validation.violations, fullText)
}

function buildFallbackEvent(
  violations: readonly LockViolation[],
  rejectedText: string,
): StreamEvent {
  return {
    kind: 'fallback',
    selvraText: FALLBACK_TEXT,
    lastViolations: violations,
    rejectedText,
  }
}

function buildRetryHint(violations: readonly LockViolation[]): string {
  const violationLines = violations.map((v) => `  - ${describeViolation(v)}`)
  return (
    `Ditt förra svar bröt mot Selvras konstitution:\n` +
    violationLines.join('\n') +
    `\n\nGenerera om svaret. Följ DU FÅR / DU FÅR ALDRIG-listorna strikt.`
  )
}

function buildMemoryAcknowledgement(factText: string): string {
  return (
    `Jag har sparat det som en explicit fakta i ditt minne. ` +
    `Den syns i /minne och du kan radera den när du vill.\n\n` +
    `Sparat: "${factText}"`
  )
}
