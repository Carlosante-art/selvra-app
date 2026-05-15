/**
 * processUserTurnWithTools — tool-call-variant av processUserTurn.
 *
 * Skillnader mot non-tool-call:
 *   - Inga pre-fetchade events i context. LLM:n bestämmer själv om/när
 *     den behöver tool-call:a search_events.
 *   - Två LLM-anrop per tur (call #1 med tools, call #2 utan).
 *   - sourcesConsulted ackumuleras från alla tool-call-resultat istället
 *     för att passeras in.
 *
 * Trade-off: bättre källval (LLM:n filtrerar relevant data) mot dubbel
 * latens. Aktiveras via env-flag i sendMessage så Carl kan jämföra båda
 * vägarna under dogfood.
 *
 * Pure function — LLM-anrop OCH tool-executor injektas. Server Action
 * wire:ar callMistralWithTools + callMistral + executeSearchEvents.
 */

import type { ChatMessage, ToolAwareResponse } from '@/lib/llm/mistral'

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

// Type-aliaser för läsbarhet — vi använder ChatMessage som den unifierade
// message-typen och ToolAwareResponse som union för LLM-svaret.
export type ToolAwareMessage = ChatMessage
export type { ToolAwareResponse }

export type LlmToolCallFn = (
  messages: ReadonlyArray<ChatMessage>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: ReadonlyArray<{ type: 'function'; function: any }>,
  opts?: { toolChoice?: 'auto' | 'none' | 'any' },
) => Promise<ToolAwareResponse>

export type LlmFinalCallFn = (
  messages: ReadonlyArray<ChatMessage>,
  retryHint?: string,
) => Promise<string>

export type SearchEventsExecutor = (
  args: unknown,
) => Promise<{ events: readonly RelevantEvent[]; query: unknown }>

export type ProcessTurnWithToolsInput = {
  systemPrompt: string
  currentUserText: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  llmCallWithTools: LlmToolCallFn
  llmFinalCall: LlmFinalCallFn
  searchEventsTool: { type: 'function'; function: unknown }
  executeSearchEvents: SearchEventsExecutor
  /** Max tool-call-loop-iterationer. Default 2. */
  maxToolIterations?: number
  /** Max validation-retries på final response. Default 1 (tool-loop är dyrt). */
  maxValidationRetries?: number
}

export type ProcessTurnWithToolsResult =
  | {
      kind: 'memory_request'
      factText: string
      acknowledgement: string
    }
  | {
      kind: 'llm_response'
      selvraText: string
      attempts: number
      sourcesConsulted: readonly RelevantEvent[]
      toolCallCount: number
    }
  | {
      kind: 'fallback'
      selvraText: string
      lastViolations: readonly LockViolation[]
      attempts: number
      sourcesConsulted: readonly RelevantEvent[]
      toolCallCount: number
    }

const FALLBACK_TEXT =
  'Jag kan inte svara på det just nu — mitt svar följde inte mina egna regler. ' +
  'Vill du formulera om frågan, eller ska jag visa vad källorna säger?'

export async function processUserTurnWithTools(
  input: ProcessTurnWithToolsInput,
): Promise<ProcessTurnWithToolsResult> {
  const maxToolIterations = input.maxToolIterations ?? 2
  const maxValidationRetries = input.maxValidationRetries ?? 1

  // STEG 1: Memory-fact-detection (samma som non-tool)
  const memoryCheck = detectMemoryFact(input.currentUserText)
  if (memoryCheck.isMemoryRequest && memoryCheck.factText) {
    return {
      kind: 'memory_request',
      factText: memoryCheck.factText,
      acknowledgement: buildMemoryAcknowledgement(memoryCheck.factText),
    }
  }

  // STEG 2: Initial context UTAN events. LLM:n får tool-call:a för data.
  const baseMessages = buildConversationContext({
    systemPrompt: input.systemPrompt,
    recentTurns: input.recentTurns,
    activeMemoryFacts: input.activeMemoryFacts,
    relevantEvents: [], // tom — tool-call äger event-fetch
    currentUserText: input.currentUserText,
  })

  // Konvertera till tool-aware-message-array (alla är text-meddelanden än).
  // Narrowa explicit per role så TS:s diskriminerade-union-inference funkar.
  const conversation: ChatMessage[] = baseMessages.map((m): ChatMessage => {
    if (m.role === 'assistant') {
      return { role: 'assistant', content: m.content }
    }
    return { role: m.role, content: m.content }
  })

  // STEG 3: Tool-call-loop. LLM får göra upp till maxToolIterations
  // tool-calls innan vi tvingar final response.
  const sourcesConsulted: RelevantEvent[] = []
  let toolCallCount = 0

  for (let iter = 0; iter < maxToolIterations; iter++) {
    const response = await input.llmCallWithTools(conversation, [
      input.searchEventsTool as { type: 'function'; function: unknown },
    ] as ReadonlyArray<{ type: 'function'; function: unknown }>)

    if (response.kind === 'message') {
      // LLM beslöt sig för direkt svar utan tool-call.
      // Validera och returnera (eller fallback om violation).
      return await validateOrFallback({
        response: response.text,
        sourcesConsulted,
        toolCallCount,
        attempts: iter + 1,
        conversation,
        llmFinalCall: input.llmFinalCall,
        maxValidationRetries,
      })
    }

    // tool_calls: exekvera alla, bygg assistant + tool-messages
    toolCallCount += response.calls.length

    // Push assistant-message med tool-calls
    conversation.push({
      role: 'assistant',
      content: response.assistantText,
      toolCalls: response.calls.map((c) => ({
        id: c.id,
        function: { name: c.name, arguments: c.arguments },
      })),
    })

    // Exekvera varje tool-call
    for (const call of response.calls) {
      if (call.name !== 'search_events') {
        // Okänt verktyg — skicka error som tool-result så LLM:n vet
        conversation.push({
          role: 'tool',
          toolCallId: call.id,
          name: call.name,
          content: JSON.stringify({ error: `Okänt verktyg: ${call.name}` }),
        })
        continue
      }

      let parsedArgs: unknown = {}
      try {
        parsedArgs = JSON.parse(call.arguments)
      } catch {
        parsedArgs = {}
      }

      const result = await input.executeSearchEvents(parsedArgs)
      sourcesConsulted.push(...result.events)

      // Skicka result som tool-message
      conversation.push({
        role: 'tool',
        toolCallId: call.id,
        name: call.name,
        content: JSON.stringify({
          events: result.events.map((e) => ({
            source: e.sourceAiId,
            timestamp: e.timestamp.toISOString(),
            summary: e.summary,
          })),
          query: result.query,
        }),
      })
    }
  }

  // STEG 4: Max tool-iterations nådda — tvinga final response utan tools.
  // LLM får ingen ny chans att tool-call:a; den måste svara med vad den har.
  const finalText = await input.llmFinalCall(conversation)
  return await validateOrFallback({
    response: finalText,
    sourcesConsulted,
    toolCallCount,
    attempts: maxToolIterations + 1,
    conversation,
    llmFinalCall: input.llmFinalCall,
    maxValidationRetries,
  })
}

/**
 * Validera response. Vid violation: retry final-call max maxValidationRetries
 * gånger med retry-hint. Vid sista-fail: fallback.
 */
async function validateOrFallback(args: {
  response: string
  sourcesConsulted: readonly RelevantEvent[]
  toolCallCount: number
  attempts: number
  conversation: readonly ChatMessage[]
  llmFinalCall: LlmFinalCallFn
  maxValidationRetries: number
}): Promise<ProcessTurnWithToolsResult> {
  let currentResponse = args.response
  let attempts = args.attempts
  let lastViolations: readonly LockViolation[] = []

  for (let retry = 0; retry <= args.maxValidationRetries; retry++) {
    const validation = validateConsumerOutput(
      currentResponse,
      args.sourcesConsulted.map((e) => ({ source_ai_id: e.sourceAiId })),
    )

    if (validation.valid) {
      return {
        kind: 'llm_response',
        selvraText: currentResponse,
        attempts,
        sourcesConsulted: args.sourcesConsulted,
        toolCallCount: args.toolCallCount,
      }
    }

    lastViolations = validation.violations
    if (retry >= args.maxValidationRetries) break

    // Retry med hint
    const retryHint = buildRetryHint(validation.violations)
    currentResponse = await args.llmFinalCall(args.conversation, retryHint)
    attempts += 1
  }

  return {
    kind: 'fallback',
    selvraText: FALLBACK_TEXT,
    lastViolations,
    attempts,
    sourcesConsulted: args.sourcesConsulted,
    toolCallCount: args.toolCallCount,
  }
}

function buildMemoryAcknowledgement(factText: string): string {
  return (
    `Jag har sparat det som en explicit fakta i ditt minne. ` +
    `Den syns i /minne och du kan radera den när du vill.\n\n` +
    `Sparat: "${factText}"`
  )
}

function buildRetryHint(violations: readonly LockViolation[]): string {
  const violationLines = violations.map((v) => `  - ${describeViolation(v)}`)
  return (
    `Ditt förra svar bröt mot Selvras konstitution:\n` +
    violationLines.join('\n') +
    `\n\nGenerera om svaret. Följ DU FÅR / DU FÅR ALDRIG-listorna strikt.`
  )
}
