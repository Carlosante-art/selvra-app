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
  validateConsumerOutput,
  type LockViolation,
} from './consumer-lock-validate'

export type LlmStreamFn = (
  messages: ReadonlyArray<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  retryHint?: string,
) => AsyncIterable<string>

export type ProcessStreamingTurnInput = {
  systemPrompt: string
  currentUserText: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  relevantEvents: readonly RelevantEvent[]
  llmStream: LlmStreamFn
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

  // Violation → fallback. Klient ersätter den stream:ade texten med
  // FALLBACK_TEXT. rejectedText skickas tillbaka så route-handlern kan
  // audit:a den i Sentry (vad bröt LLM mot?).
  yield {
    kind: 'fallback',
    selvraText: FALLBACK_TEXT,
    lastViolations: validation.violations,
    rejectedText: fullText,
  }
}

function buildMemoryAcknowledgement(factText: string): string {
  return (
    `Jag har sparat det som en explicit fakta i ditt minne. ` +
    `Den syns i /minne och du kan radera den när du vill.\n\n` +
    `Sparat: "${factText}"`
  )
}
