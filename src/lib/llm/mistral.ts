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

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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
    const response = await getClient().chat.complete({
      model,
      messages: finalMessages,
      temperature: 0.7,
      maxTokens: 2000,
    })

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
