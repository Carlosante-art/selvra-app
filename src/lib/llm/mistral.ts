import 'server-only'

/**
 * Mistral LLM-client för konsument-Selvra.
 *
 * EU-suveränitet: Mistral är franskt företag med EU-baserad infra. Inga
 * sub-processors utanför EU per default. Detta uppfyller konsument-track
 * §2 EU-suverän infrastruktur.
 *
 * Modell-val: default `mistral-large-latest` (rekommendation per
 * CONSUMER_SYSTEM_PROMPT_DRAFT.md). Override via env `MISTRAL_MODEL` om
 * Carl vill testa `mistral-small-latest` (billigare) eller annan modell
 * i Fas 1-dogfood.
 *
 * Signatur matchar `LlmCallFn` från process-user-turn.ts så den kan
 * inject:as direkt i orchestratorn.
 */

import { Mistral } from '@mistralai/mistralai'

import { logger } from '@/lib/logging'
import { withMistralRetry } from './mistral-retry'

/**
 * Tool-aware message-type. Används av callMistralWithTools där LLM:n
 * kan begära tool-anrop och vi skickar tillbaka tool-result. Bakåt-
 * kompatibel: enkla {role, content}-messages är en delmängd där tool-
 * fälten är undefined.
 */
export type ChatMessage =
  | {
      role: 'system' | 'user'
      content: string
    }
  | {
      role: 'assistant'
      content: string | null
      /** Set när LLM:n begärt tool-anrop. Annars undefined. */
      toolCalls?: ReadonlyArray<{
        id: string
        function: { name: string; arguments: string }
      }>
    }
  | {
      role: 'tool'
      toolCallId: string
      name: string
      content: string
    }

export type ToolCallRequest = {
  id: string
  name: string
  /** Argumenten är JSON-string per Mistral spec; orchestratorn parsar. */
  arguments: string
}

export type ToolAwareResponse =
  | { kind: 'message'; text: string }
  | { kind: 'tool_calls'; calls: readonly ToolCallRequest[]; assistantText: string | null }

let client: Mistral | null = null

/**
 * Lazy-init av Mistral-klienten. Skapas vid första call så MISTRAL_API_KEY
 * inte krävs vid build (Vercel build-step). Vid faktisk anrop krävs den.
 */
function getClient(): Mistral {
  if (!client) {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      throw new Error(
        'MISTRAL_API_KEY env-var saknas. Sätt i .env.local för dev, ' +
          'eller via Vercel project-settings för deploy.',
      )
    }
    client = new Mistral({ apiKey })
  }
  return client
}

/**
 * Kalla Mistral chat-API med messages-array från `buildConversationContext`.
 *
 * `retryHint` (om angiven) läggs som extra system-message i slutet av
 * messages — den kommer från `processUserTurn` när förra svar bröt
 * konstitutionen. Mistral får då explicit ledtråd om vad som gick fel.
 *
 * Returnerar bara textinnehållet i svaret. Sources-attribuering, lock-
 * validation och retry-orchestration sker i process-user-turn.ts.
 */
export async function callMistral(
  messages: ReadonlyArray<ChatMessage>,
  retryHint?: string,
): Promise<string> {
  const log = logger.child({ module: 'llm/mistral' })
  const model = process.env.MISTRAL_MODEL ?? 'mistral-large-latest'

  const finalMessages: ChatMessage[] = retryHint
    ? [...messages, { role: 'system', content: retryHint }]
    : [...messages]

  const t0 = Date.now()
  try {
    const response = await withMistralRetry(
      () =>
        getClient().chat.complete({
          model,
          // Mistral SDK accepterar tool/assistant-tool-call-messages som vår
          // ChatMessage-union representerar 1:1. Cast så TS accepterar.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: finalMessages as any,
          temperature: 0.7,
          maxTokens: 2000,
        }),
      { module: 'llm/mistral' },
    )

    const content = response.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('Mistral returned non-string or empty content')
    }

    log.info('mistral_response', {
      model,
      durationMs: Date.now() - t0,
      promptMessages: finalMessages.length,
      responseLength: content.length,
      hadRetryHint: Boolean(retryHint),
    })
    return content
  } catch (err) {
    log.error('mistral_call_failed', {
      model,
      durationMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * JSON-schema-strikt chat-anrop. Mistral garanterar att svaret är giltig
 * JSON som matchar schemat. För `extractFactsFromTurn` v2 — vi får
 * structurellt-giltig JSON utan kod-fence-stripping eller defensiv parsing.
 *
 * Per Mistral docs: när responseFormat.type='json_schema' MÅSTE prompten
 * också explicit instruera modellen att producera JSON. SDK:n validerar
 * inte detta — det är upp till caller.
 *
 * Returnerar rå JSON-text (caller anropar JSON.parse). Vid Mistral-fel
 * eller om innehållet är non-string kastas Error.
 */
export async function callMistralJsonSchema(
  messages: ReadonlyArray<ChatMessage>,
  schemaName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaDefinition: Record<string, any>,
): Promise<string> {
  const log = logger.child({ module: 'llm/mistral/json-schema' })
  const model = process.env.MISTRAL_MODEL ?? 'mistral-large-latest'

  const t0 = Date.now()
  try {
    const response = await withMistralRetry(
      () =>
        getClient().chat.complete({
          model,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          responseFormat: {
            type: 'json_schema',
            jsonSchema: {
              name: schemaName,
              schemaDefinition,
              strict: true,
            },
          },
          temperature: 0.3, // lägre temp för strukturerad output
          maxTokens: 2000,
        }),
      { module: 'llm/mistral/json-schema' },
    )

    const content = response.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('Mistral returned non-string or empty content for json_schema mode')
    }

    log.info('mistral_json_schema_ok', {
      model,
      schemaName,
      durationMs: Date.now() - t0,
      responseLength: content.length,
    })
    return content
  } catch (err) {
    log.error('mistral_json_schema_failed', {
      model,
      schemaName,
      durationMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * Tool-aware chat-anrop. Skickar `tools` till Mistral. LLM:n får välja
 * mellan att svara med text eller anropa ett verktyg.
 *
 * Returnerar diskriminerad union:
 *   - { kind: 'message', text } — direkt svar, ingen tool-call
 *   - { kind: 'tool_calls', calls, assistantText } — LLM ber om tool-anrop
 *
 * Orchestratorn (process-user-turn-with-tools.ts) ansvarar för att
 * exekvera tool-anropen och göra ev. andra anrop. Wrappern är en-shot.
 */
export async function callMistralWithTools(
  messages: ReadonlyArray<ChatMessage>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: ReadonlyArray<{ type: 'function'; function: any }>,
  opts: { toolChoice?: 'auto' | 'none' | 'any' } = {},
): Promise<ToolAwareResponse> {
  const log = logger.child({ module: 'llm/mistral/with-tools' })
  const model = process.env.MISTRAL_MODEL ?? 'mistral-large-latest'

  const t0 = Date.now()
  try {
    const response = await withMistralRetry(
      () =>
        getClient().chat.complete({
          model,
          // SDK-types accepterar union — vi castar för att inkludera tool/
          // assistant-tool-call-messages som vår union representerar 1:1.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: tools as any,
          toolChoice: opts.toolChoice ?? 'auto',
          temperature: 0.7,
          maxTokens: 2000,
        }),
      { module: 'llm/mistral/with-tools' },
    )

    const choice = response.choices?.[0]
    if (!choice) {
      throw new Error('Mistral returned no choices')
    }

    const message = choice.message
    const toolCalls = message?.toolCalls ?? []

    if (toolCalls.length > 0) {
      const calls: ToolCallRequest[] = toolCalls.map((tc) => ({
        id: tc.id ?? '',
        name: tc.function.name,
        arguments:
          typeof tc.function.arguments === 'string'
            ? tc.function.arguments
            : JSON.stringify(tc.function.arguments),
      }))
      const assistantText =
        typeof message?.content === 'string' && message.content.length > 0
          ? message.content
          : null
      log.info('mistral_tool_calls', {
        model,
        durationMs: Date.now() - t0,
        toolNames: calls.map((c) => c.name),
        hadAssistantText: assistantText !== null,
      })
      return { kind: 'tool_calls', calls, assistantText }
    }

    const content = message?.content
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('Mistral returned non-string or empty content')
    }
    log.info('mistral_with_tools_message', {
      model,
      durationMs: Date.now() - t0,
      responseLength: content.length,
    })
    return { kind: 'message', text: content }
  } catch (err) {
    log.error('mistral_with_tools_failed', {
      model,
      durationMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * Streaming variant av callMistral. Yieldar token-chunks (string) som de
 * kommer från Mistral. Caller ansvarar för att samla fullText om den
 * behövs för post-stream-validation.
 *
 * Använder samma model + temperature som callMistral så streaming-svaret
 * är identiskt till non-streaming utöver leveransformen.
 *
 * NOTE: ContentChunk[]-fallet ignoreras — vår system-prompt genererar
 * aldrig tool-calls eller multi-modal, så delta.content är alltid string
 * eller null. Loggar warning om annat ses så vi upptäcker drift.
 */
export async function* streamMistral(
  messages: ReadonlyArray<ChatMessage>,
  retryHint?: string,
): AsyncGenerator<string, void, void> {
  const log = logger.child({ module: 'llm/mistral/stream' })
  const model = process.env.MISTRAL_MODEL ?? 'mistral-large-latest'

  const finalMessages: ChatMessage[] = retryHint
    ? [...messages, { role: 'system', content: retryHint }]
    : [...messages]

  const t0 = Date.now()
  let chunkCount = 0
  let totalLength = 0
  try {
    // Streaming: retry är OK för INITIAL connect (innan första chunk
    // emitterats). Mid-stream-fel kan inte retry:as utan att klient ser
    // dubblerade tokens. SDK:n returnerar stream-objektet från chat.stream()
    // FÖRE några events kommer — så wrapping av just stream-init är säker.
    const stream = await withMistralRetry(
      () =>
        getClient().chat.stream({
          model,
          // Samma cast som callMistral — SDK accepterar tool/assistant-tool-call
          // varianter som vår ChatMessage-union representerar.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: finalMessages as any,
          temperature: 0.7,
          maxTokens: 2000,
        }),
      { module: 'llm/mistral/stream' },
    )

    for await (const event of stream) {
      const delta = event.data?.choices?.[0]?.delta?.content
      if (delta == null) continue
      if (typeof delta !== 'string') {
        log.warn('mistral_stream_non_string_delta', {
          deltaType: Array.isArray(delta) ? 'array' : typeof delta,
        })
        continue
      }
      chunkCount += 1
      totalLength += delta.length
      yield delta
    }

    log.info('mistral_stream_complete', {
      model,
      durationMs: Date.now() - t0,
      promptMessages: finalMessages.length,
      chunkCount,
      totalLength,
      hadRetryHint: Boolean(retryHint),
    })
  } catch (err) {
    log.error('mistral_stream_failed', {
      model,
      durationMs: Date.now() - t0,
      chunkCount,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
