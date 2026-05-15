'use server'

/**
 * sendMessage — Server Action.
 *
 * Pipeline mot DB + Mistral via processUserTurn-orchestratorn. Auto-
 * genererar tråd-titel på första turn-paret. Relevanta events fetchas
 * från Selvra-protokollet (senaste 7 dagar, max 20 events).
 *
 * Auth-gate: session.user.id krävs. Anonyma anrop kastar.
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
import { callMistral, callMistralWithTools } from '@/lib/llm/mistral'
import {
  executeSearchEvents,
  searchEventsTool,
} from '@/lib/llm/tools/search-events'
import { logger } from '@/lib/logging'
import { extractFactsFromTurn } from '@/lib/observability/extract-facts-from-turn'
import { fetchRelevantEvents } from '@/lib/observability/fetch-relevant-events'
import { processUserTurn } from '@/lib/observability/process-user-turn'
import { processUserTurnWithTools } from '@/lib/observability/process-user-turn-with-tools'

// Fallback om DB-fetch fail:ar. Identisk text som migrations-seed:en.
// När fetchActiveSystemPrompt returnerar något använder vi det istället —
// så Carl kan iterera via UPDATE utan att röra denna konstant.
const SYSTEM_PROMPT_FALLBACK = `Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.`

// Rate-limit: max N turer per användare per fönster. Skydd mot bot-spam
// och stuck-loop som annars skulle spränga LLM-budget + Selvra-protokoll-
// fetch-kvot. För Carl-personal-tool: generöst men ändå begränsande.
const RATE_LIMIT_TURNS = 15
const RATE_LIMIT_WINDOW_SECONDS = 60

/**
 * Mappa tool-call-resultat till non-tool diskriminerad union så call-sites
 * kan dela persist-logik. Tappar bort `toolCallCount` (loggas separat).
 */
function mapToolResultToNonToolShape(
  result: Awaited<ReturnType<typeof processUserTurnWithTools>>,
): Awaited<ReturnType<typeof processUserTurn>> {
  switch (result.kind) {
    case 'memory_request':
      return {
        kind: 'memory_request',
        factText: result.factText,
        acknowledgement: result.acknowledgement,
      }
    case 'llm_response':
      return {
        kind: 'llm_response',
        selvraText: result.selvraText,
        attempts: result.attempts,
        sourcesConsulted: result.sourcesConsulted,
      }
    case 'fallback':
      return {
        kind: 'fallback',
        selvraText: result.selvraText,
        lastViolations: result.lastViolations,
        attempts: result.attempts,
      }
  }
}

type SendMessageInput = {
  conversationId: string | null
  text: string
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const log = logger.child({ module: 'samtal/sendMessage' })

  const session = await auth()
  if (!session?.user?.id) {
    log.warn('sendMessage_unauthorized')
    throw new Error('Inloggning krävs.')
  }
  const userId = session.user.id

  // Sentry user-context för grouping. sendDefaultPii: false hindrar
  // email/ip från att samlas; vi sätter bara id explicit för aggregat.
  Sentry.setUser({ id: userId })

  // Rate-limit-check. Räkna user:s turer senaste 60s. Över limit → kasta
  // tydligt fel som UI fångar och visar inline. Mätningen är conservative
  // (turen vi precis försöker spara räknas inte än).
  const recentTurnCount = await countRecentTurnsForUser({
    userId,
    sinceSeconds: RATE_LIMIT_WINDOW_SECONDS,
  })
  if (recentTurnCount >= RATE_LIMIT_TURNS) {
    log.warn('sendMessage_rate_limited', {
      userId,
      recentTurnCount,
      limit: RATE_LIMIT_TURNS,
    })
    throw new Error(
      `Du har skrivit ${recentTurnCount} meddelanden de senaste minuten. ` +
        `Vänta en stund — Selvra svarar bättre när det inte är stressigt.`,
    )
  }

  // Tool-call-flagga: när aktiv hoppar vi över naivt 7-dagars-pre-fetch
  // och låter LLM:n tool-call:a search_events on-demand. Två LLM-anrop
  // per tur (dubbel latens) men bättre källval.
  const useToolCall = process.env.SELVRA_USE_TOOL_CALL === '1'

  // Fetch context parallellt: DB (turns + memory-facts + system-prompt) +
  // Selvra-protokoll (events). Defensiv: system-prompt-fetch får aldrig
  // ta ner pipelinen — fallback till hardcoded vid fel. Vid tool-call
  // skippas pre-fetch (LLM:n äger event-fetch via search_events).
  const [recentTurns, activeMemoryFacts, relevantEvents, activePrompt] =
    await Promise.all([
      input.conversationId
        ? fetchRecentTurns(input.conversationId, 5)
        : Promise.resolve([]),
      fetchActiveMemoryFacts(userId),
      useToolCall ? Promise.resolve([]) : fetchRelevantEvents(input.text),
      fetchActiveSystemPrompt().catch(() => null),
    ])

  const systemPrompt = activePrompt?.promptText ?? SYSTEM_PROMPT_FALLBACK
  if (activePrompt) {
    log.info('using_db_prompt', { version: activePrompt.version })
  }
  if (useToolCall) {
    log.info('using_tool_call_pathway')
  }

  const result = useToolCall
    ? mapToolResultToNonToolShape(
        await processUserTurnWithTools({
          systemPrompt,
          currentUserText: input.text,
          recentTurns,
          activeMemoryFacts,
          llmCallWithTools: callMistralWithTools,
          llmFinalCall: callMistral,
          searchEventsTool,
          executeSearchEvents,
        }),
      )
    : await processUserTurn({
        systemPrompt,
        currentUserText: input.text,
        recentTurns,
        activeMemoryFacts,
        relevantEvents,
        llmCall: callMistral,
      })

  switch (result.kind) {
    case 'memory_request': {
      const { conversationId, turnId } = await persistTurn({
        conversationId: input.conversationId,
        userId,
        userText: input.text,
        selvraText: result.acknowledgement,
        sourcesConsulted: null,
        llmProvider: null,
      })
      await persistMemoryFact({
        userId,
        factText: result.factText,
        sourceTurnId: turnId,
      })
      log.info('memory_request_persisted', {
        conversationId,
        factLength: result.factText.length,
      })
      revalidatePath(`/samtal/thread/${conversationId}`)
      revalidatePath('/samtal')
      break
    }
    case 'llm_response': {
      const isFirstTurn = input.conversationId === null
      const { conversationId, turnId } = await persistTurn({
        conversationId: input.conversationId,
        userId,
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: result.sourcesConsulted.map((e) => ({
          sourceAiId: e.sourceAiId,
        })),
        llmProvider: 'mistral',
      })
      log.info('llm_response_persisted', {
        conversationId,
        attempts: result.attempts,
      })

      // V1 Steg 8: extrahera facts från turn till conversation_facts.
      // Synkront — opportunistisk men inte critical-path. Fail får inte
      // ta ner samtals-flow (extractFactsFromTurn returnerar [] vid fel).
      const extractedFacts = await extractFactsFromTurn({
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: result.sourcesConsulted,
        llmCall: callMistral,
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
          log.info('facts_extracted', {
            conversationId,
            count: extractedFacts.length,
          })
        } catch (err) {
          // Persistens-fail ska inte ta ner samtals-pipelinen
          log.warn('facts_persist_failed', {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      // Sentry: warning om LLM behövde retries (löstes via lock-validate).
      // Synligt i Sentry-dashen för system-prompt-iterations utan att gräva
      // i Vercel-logs.
      if (result.attempts > 1) {
        Sentry.captureMessage('llm_retry_needed', {
          level: 'warning',
          tags: { attempts: String(result.attempts) },
          extra: { conversationId },
        })
      }

      // Auto-generera tråd-titel på första turn-paret. Synkron — Carl-
      // personal-tool tolererar extra ~1s latens; Vercel serverless kan
      // inte fire-and-forget tillförlitligt.
      if (isFirstTurn) {
        const title = await generateThreadTitle(input.text, result.selvraText)
        if (title) {
          await updateConversationTitle({ conversationId, title, userId })
          log.info('thread_title_generated', { conversationId, title })
        }
      }

      revalidatePath(`/samtal/thread/${conversationId}`)
      revalidatePath('/samtal')
      break
    }
    case 'fallback': {
      const { conversationId } = await persistTurn({
        conversationId: input.conversationId,
        userId,
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: null,
        llmProvider: 'mistral',
      })
      log.warn('fallback_persisted', {
        conversationId,
        attempts: result.attempts,
        violations: result.lastViolations.map((v) => v.rule),
      })

      // Sentry: error om user fick fallback istället för LLM-svar. Kritiskt
      // för system-prompt-iterations — Carl vill se 'love_bombing: 4 events
      // denna vecka' utan logs-grävande. primary_rule som tag (single-value),
      // resten i extra för full audit.
      Sentry.captureMessage('llm_fallback_after_retries', {
        level: 'error',
        tags: {
          attempts: String(result.attempts),
          primary_rule: result.lastViolations[0]?.rule ?? 'unknown',
        },
        extra: {
          conversationId,
          allViolations: result.lastViolations.map((v) => ({
            rule: v.rule,
            match: v.match,
          })),
        },
      })

      revalidatePath(`/samtal/thread/${conversationId}`)
      revalidatePath('/samtal')
      break
    }
  }
}
