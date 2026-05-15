/**
 * POST /api/chat/stream — streaming chat-endpoint för konsument-Selvra.
 *
 * Pipelinen är samma som sendMessage Server Action men med streaming-
 * LLM och NDJSON-event-respons. Klient (StreamingChatFeed) POST:ar hit
 * och läser response-stream för token-för-token-rendering.
 *
 * NDJSON event-typer (1 JSON-objekt per rad, \n-separerade):
 *   - { type: 'meta', conversationId }     skickas tidigt så klient vet ID
 *   - { type: 'memory_ack', text }         kortslut memory-request, klar
 *   - { type: 'stream_start', sources }    LLM-stream börjar nu
 *   - { type: 'chunk', text }              token-chunk från LLM
 *   - { type: 'final', selvraText, title } persisten klar, slutgiltig text
 *   - { type: 'invalidated', selvraText }  validation-fail, fallback-text
 *   - { type: 'error', message }           något oväntat
 *
 * Auth-gate: session.user.id krävs.
 * Rate-limit: samma som sendMessage (15 turer/min).
 *
 * Persistens sker efter stream är klar (transaktionell) — så ingen halv-
 * stream-tråd hamnar i DB om klienten kopplar bort.
 */

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import {
  countRecentTurnsForUser,
  fetchActiveMemoryFacts,
  fetchActiveSystemPrompt,
  fetchRecentTurns,
  persistConversationFacts,
  persistMemoryFact,
  persistTurn,
  updateConversationTitle,
} from '@/lib/db/conversation-queries'
import { generateThreadTitle } from '@/lib/llm/generate-title'
import {
  callMistral,
  callMistralJsonSchema,
  callMistralWithTools,
  streamMistral,
} from '@/lib/llm/mistral'
import {
  executeSearchEvents,
  searchEventsTool,
} from '@/lib/llm/tools/search-events'
import { logger } from '@/lib/logging'
import {
  extractFactsFromTurn,
  FACT_EXTRACTION_SCHEMA,
} from '@/lib/observability/extract-facts-from-turn'
import { fetchRelevantEvents } from '@/lib/observability/fetch-relevant-events'
import { processStreamingUserTurn } from '@/lib/observability/process-streaming-user-turn'
import { processStreamingUserTurnWithTools } from '@/lib/observability/process-streaming-user-turn-with-tools'

// V1 Steg 9: matchar sendMessage.ts-fallback. När fetchActiveSystemPrompt
// returnerar något används det istället — DB-versionerad iteration.
const SYSTEM_PROMPT_FALLBACK = `Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.

KÄLLA-ATTRIBUTION (obligatoriskt):
När du refererar till data från en kopplad källa, markera det inline med [source:NAME] direkt efter claim:en. Använd lowercase + underscore i NAME.

Exempel:
"Du sov 5h 40min senaste 5 dagarna [source:garmin]. Din baseline är 7h 15min [source:garmin_baseline]."

Använd ENDAST källa-namn som finns i tillgängliga events. Hitta inte på källor.`

const RATE_LIMIT_TURNS = 15
const RATE_LIMIT_WINDOW_SECONDS = 60

// Node runtime krävs: Mistral SDK + auth + db använder Node-API:er.
export const runtime = 'nodejs'
// Vercel Fluid Compute kan streama långt. 5 min räcker mer än väl för en
// LLM-tur men ger marginal vid lock-validate-retry eller långsam Mistral.
export const maxDuration = 300

type StreamRequestBody = {
  conversationId: string | null
  text: string
}

export async function POST(req: Request): Promise<Response> {
  const log = logger.child({ module: 'api/chat/stream' })

  const session = await auth()
  if (!session?.user?.id) {
    log.warn('stream_unauthorized')
    return Response.json({ error: 'Inloggning krävs.' }, { status: 401 })
  }
  const userId = session.user.id
  Sentry.setUser({ id: userId })

  let body: StreamRequestBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Ogiltigt request-format.' }, { status: 400 })
  }

  if (typeof body.text !== 'string' || body.text.trim().length === 0) {
    return Response.json({ error: 'Tom text.' }, { status: 400 })
  }
  if (body.text.length > 4000) {
    return Response.json({ error: 'Texten är för lång (max 4000 tecken).' }, { status: 400 })
  }

  // Rate-limit-check
  const recentTurnCount = await countRecentTurnsForUser({
    userId,
    sinceSeconds: RATE_LIMIT_WINDOW_SECONDS,
  })
  if (recentTurnCount >= RATE_LIMIT_TURNS) {
    log.warn('stream_rate_limited', { userId, recentTurnCount })
    return Response.json(
      {
        error:
          `Du har skrivit ${recentTurnCount} meddelanden de senaste minuten. ` +
          `Vänta en stund — Selvra svarar bättre när det inte är stressigt.`,
      },
      { status: 429 },
    )
  }

  // Tool-call-flagga: när =1 hoppar vi över naivt 7-dagars-pre-fetch
  // och låter LLM:n tool-call:a search_events on-demand innan stream
  // börjar. Identisk env-var som sendMessage Server Action.
  const useToolCall = process.env.SELVRA_USE_TOOL_CALL === '1'

  // Fetch context parallellt (samma som sendMessage). relevantEvents
  // skippas vid tool-call — orchestratorn hanterar event-fetch.
  const [recentTurns, activeMemoryFacts, relevantEvents, activePrompt] =
    await Promise.all([
      body.conversationId
        ? fetchRecentTurns(body.conversationId, 5)
        : Promise.resolve([]),
      fetchActiveMemoryFacts(userId),
      useToolCall ? Promise.resolve([]) : fetchRelevantEvents(body.text),
      fetchActiveSystemPrompt().catch(() => null),
    ])

  const systemPrompt = activePrompt?.promptText ?? SYSTEM_PROMPT_FALLBACK
  const isFirstTurn = body.conversationId === null
  const inputText = body.text

  if (useToolCall) {
    log.info('stream_using_tool_call_pathway')
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      try {
        const turnStream = useToolCall
          ? processStreamingUserTurnWithTools({
              systemPrompt,
              currentUserText: inputText,
              recentTurns,
              activeMemoryFacts,
              llmCallWithTools: callMistralWithTools,
              llmFinalStream: streamMistral,
              searchEventsTool,
              executeSearchEvents,
            })
          : processStreamingUserTurn({
              systemPrompt,
              currentUserText: inputText,
              recentTurns,
              activeMemoryFacts,
              relevantEvents,
              llmStream: streamMistral,
              // V1 Steg 7: non-stream retry vid lock-violation. Klient
              // ersätter stream:ad text med retry-resultatet om OK,
              // annars fallback.
              llmRetry: callMistral,
            })

        // Vi vet inte conversationId förrän efter persistens vid första
        // turn. För befintliga trådar kan vi skicka meta direkt.
        if (body.conversationId) {
          send({ type: 'meta', conversationId: body.conversationId })
        }

        for await (const event of turnStream) {
          switch (event.kind) {
            case 'memory_request': {
              const { conversationId, turnId } = await persistTurn({
                conversationId: body.conversationId,
                userId,
                userText: inputText,
                selvraText: event.acknowledgement,
                sourcesConsulted: null,
                llmProvider: null,
              })
              await persistMemoryFact({
                userId,
                factText: event.factText,
                sourceTurnId: turnId,
              })
              log.info('stream_memory_request_persisted', {
                conversationId,
                factLength: event.factText.length,
              })
              revalidatePath(`/samtal/thread/${conversationId}`)
              revalidatePath('/samtal')
              revalidatePath('/minne')

              if (!body.conversationId) {
                send({ type: 'meta', conversationId })
              }
              send({ type: 'memory_ack', text: event.acknowledgement })
              break
            }

            case 'stream_start': {
              send({
                type: 'stream_start',
                sources: event.sourcesConsulted.map((e) => ({
                  source_ai_id: e.sourceAiId,
                })),
              })
              break
            }

            case 'chunk': {
              send({ type: 'chunk', text: event.text })
              break
            }

            case 'stream_end': {
              const { conversationId, turnId } = await persistTurn({
                conversationId: body.conversationId,
                userId,
                userText: inputText,
                selvraText: event.selvraText,
                sourcesConsulted: event.sourcesConsulted.map((e) => ({
                  sourceAiId: e.sourceAiId,
                })),
                llmProvider: 'mistral',
              })
              log.info('stream_llm_response_persisted', { conversationId })

              // V1 Steg 8 (V2 2026-05-16): json_schema-mode för strikt output.
              const extractedFacts = await extractFactsFromTurn({
                userText: inputText,
                selvraText: event.selvraText,
                sourcesConsulted: event.sourcesConsulted,
                llmCall: (messages) =>
                  callMistralJsonSchema(
                    messages,
                    'fact_extraction',
                    FACT_EXTRACTION_SCHEMA,
                  ),
              })
              if (extractedFacts.length > 0) {
                try {
                  await persistConversationFacts(
                    extractedFacts.map((f) => ({
                      userId,
                      threadId: conversationId,
                      turnId,
                      factText: f.factText,
                      factType: f.factType,
                      sourceName: f.sourceName,
                    })),
                  )
                  log.info('stream_facts_extracted', {
                    conversationId,
                    count: extractedFacts.length,
                  })
                  revalidatePath('/minne')
                } catch (err) {
                  log.warn('stream_facts_persist_failed', {
                    error: err instanceof Error ? err.message : String(err),
                  })
                }
              }

              let title: string | null = null
              if (isFirstTurn) {
                title = await generateThreadTitle(inputText, event.selvraText)
                if (title) {
                  await updateConversationTitle({
                    conversationId,
                    title,
                    userId,
                  })
                  log.info('stream_thread_title_generated', {
                    conversationId,
                    title,
                  })
                }
              }

              revalidatePath(`/samtal/thread/${conversationId}`)
              revalidatePath('/samtal')

              if (!body.conversationId) {
                send({ type: 'meta', conversationId })
              }
              send({ type: 'final', selvraText: event.selvraText, title })
              break
            }

            case 'fallback': {
              const { conversationId } = await persistTurn({
                conversationId: body.conversationId,
                userId,
                userText: inputText,
                selvraText: event.selvraText,
                sourcesConsulted: null,
                llmProvider: 'mistral',
              })
              log.warn('stream_fallback_persisted', {
                conversationId,
                violations: event.lastViolations.map((v) => v.rule),
              })

              Sentry.captureMessage('stream_llm_fallback', {
                level: 'error',
                tags: {
                  primary_rule: event.lastViolations[0]?.rule ?? 'unknown',
                },
                extra: {
                  conversationId,
                  rejectedTextLength: event.rejectedText.length,
                  allViolations: event.lastViolations.map((v) => ({
                    rule: v.rule,
                    match: v.match,
                  })),
                },
              })

              revalidatePath(`/samtal/thread/${conversationId}`)
              revalidatePath('/samtal')

              if (!body.conversationId) {
                send({ type: 'meta', conversationId })
              }
              send({ type: 'invalidated', selvraText: event.selvraText })
              break
            }
          }
        }

        controller.close()
      } catch (err) {
        // Oväntade fel (Mistral-timeout, DB-fail, etc) — skicka error-event
        // så klient kan visa inline + behålla input. Sentry capture för audit.
        const message = err instanceof Error ? err.message : 'Okänt fel'
        log.error('stream_pipeline_failed', { error: message })
        Sentry.captureException(err)
        try {
          send({ type: 'error', message })
        } catch {
          // Stream redan stängd — ignorera.
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
