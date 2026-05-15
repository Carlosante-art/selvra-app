/**
 * processStreamingUserTurnWithTools — kombinerar tool-call med streaming.
 *
 * Pipeline:
 *   1. Memory-fact-kortslut (identisk med non-tool, non-streaming-vägen)
 *   2. Tool-loop (non-stream): callMistralWithTools tills LLM:n svarar
 *      med 'message' eller max-iterations nådda
 *   3. Final stream: om vi gick via 'message' yieldar vi hela texten som
 *      ett enda chunk. Om tool-loopen var tom (eller max-iter nådda),
 *      streamar vi via llmFinalStream för en konsistent klient-UX.
 *   4. Post-stream validation + fallback (samma pattern som
 *      processStreamingUserTurn)
 *
 * Trade-off: tool-loop introducerar pre-stream latens (1-2 LLM-anrop
 * innan tokens börjar flöda) men ger bättre källval. Klient ser bara
 * längre paus innan stream_start.
 *
 * Pure function — alla LLM-call:ar + tool-executor injektas.
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
  validateConsumerOutput,
  type LockViolation,
} from './consumer-lock-validate'

export type LlmStreamToolFn = (
  messages: ReadonlyArray<ChatMessage>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: ReadonlyArray<{ type: 'function'; function: any }>,
  opts?: { toolChoice?: 'auto' | 'none' | 'any' },
) => Promise<ToolAwareResponse>

export type LlmStreamFinalFn = (
  messages: ReadonlyArray<ChatMessage>,
) => AsyncIterable<string>

export type SearchEventsExecutor = (
  args: unknown,
) => Promise<{ events: readonly RelevantEvent[]; query: unknown }>

export type ProcessStreamingTurnWithToolsInput = {
  systemPrompt: string
  currentUserText: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  llmCallWithTools: LlmStreamToolFn
  llmFinalStream: LlmStreamFinalFn
  searchEventsTool: { type: 'function'; function: unknown }
  executeSearchEvents: SearchEventsExecutor
  /** Max tool-call-iterationer. Default 2. */
  maxToolIterations?: number
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
      rejectedText: string
    }

const FALLBACK_TEXT =
  'Jag kan inte svara på det just nu — mitt svar följde inte mina egna regler. ' +
  'Vill du formulera om frågan, eller ska jag visa vad källorna säger?'

function buildMemoryAcknowledgement(factText: string): string {
  return (
    `Jag har sparat det som en explicit fakta i ditt minne. ` +
    `Den syns i /minne och du kan radera den när du vill.\n\n` +
    `Sparat: "${factText}"`
  )
}

export async function* processStreamingUserTurnWithTools(
  input: ProcessStreamingTurnWithToolsInput,
): AsyncGenerator<StreamEvent, void, void> {
  const maxToolIterations = input.maxToolIterations ?? 2

  // STEG 1: Memory-fact-kortslut
  const memoryCheck = detectMemoryFact(input.currentUserText)
  if (memoryCheck.isMemoryRequest && memoryCheck.factText) {
    yield {
      kind: 'memory_request',
      factText: memoryCheck.factText,
      acknowledgement: buildMemoryAcknowledgement(memoryCheck.factText),
    }
    return
  }

  // STEG 2: Bygg initial context utan events. Tool-call äger event-fetch.
  const baseMessages = buildConversationContext({
    systemPrompt: input.systemPrompt,
    recentTurns: input.recentTurns,
    activeMemoryFacts: input.activeMemoryFacts,
    relevantEvents: [],
    currentUserText: input.currentUserText,
  })

  const conversation: ChatMessage[] = baseMessages.map((m): ChatMessage => {
    if (m.role === 'assistant') {
      return { role: 'assistant', content: m.content }
    }
    return { role: m.role, content: m.content }
  })

  const sourcesConsulted: RelevantEvent[] = []
  let directMessageText: string | null = null

  // STEG 3: Tool-loop (non-stream). LLM:n får tool-call:a max-iter gånger.
  for (let iter = 0; iter < maxToolIterations; iter++) {
    const response = await input.llmCallWithTools(conversation, [
      input.searchEventsTool as { type: 'function'; function: unknown },
    ] as ReadonlyArray<{ type: 'function'; function: unknown }>)

    if (response.kind === 'message') {
      directMessageText = response.text
      break
    }

    // tool_calls: bygg assistant + tool-messages, fortsätt loopen
    conversation.push({
      role: 'assistant',
      content: response.assistantText,
      toolCalls: response.calls.map((c) => ({
        id: c.id,
        function: { name: c.name, arguments: c.arguments },
      })),
    })

    for (const call of response.calls) {
      if (call.name !== 'search_events') {
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

  // STEG 4: Signalera stream-start. Klient vet nu vilka sources LLM använde.
  yield {
    kind: 'stream_start',
    sourcesConsulted,
  }

  // STEG 5: Final-text till klient.
  //   - Om tool-loopen gav 'message' direkt: yielda hela texten som ett
  //     chunk (klient ser inget stream-flicker, ändå konsistent event-flow)
  //   - Annars: streama via llmFinalStream
  let fullText = ''

  if (directMessageText !== null) {
    fullText = directMessageText
    yield { kind: 'chunk', text: directMessageText }
  } else {
    // Max tool-iterations nådda utan 'message' — tvinga final response
    for await (const chunk of input.llmFinalStream(conversation)) {
      fullText += chunk
      yield { kind: 'chunk', text: chunk }
    }
  }

  // STEG 6: Post-stream-validation
  const validation = validateConsumerOutput(
    fullText,
    sourcesConsulted.map((e) => ({ source_ai_id: e.sourceAiId })),
  )

  if (validation.valid) {
    yield {
      kind: 'stream_end',
      selvraText: fullText,
      sourcesConsulted,
    }
    return
  }

  yield {
    kind: 'fallback',
    selvraText: FALLBACK_TEXT,
    lastViolations: validation.violations,
    rejectedText: fullText,
  }
}
