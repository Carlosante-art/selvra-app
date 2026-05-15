'use server'

/**
 * sendMessage — Server Action.
 *
 * Pipeline mot DB + Mistral via processUserTurn-orchestratorn. Auto-
 * genererar tråd-titel på första turn-paret.
 *
 * Auth-gate: session.user.id krävs. Anonyma anrop kastar.
 *
 * Återstående pre-Fas-1 stub:
 *   - stubFetchRelevantEvents: returnerar [] (kommer via #4)
 */

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import {
  fetchActiveMemoryFacts,
  fetchRecentTurns,
  persistMemoryFact,
  persistTurn,
  updateConversationTitle,
} from '@/lib/db/conversation-queries'
import { generateThreadTitle } from '@/lib/llm/generate-title'
import { callMistral } from '@/lib/llm/mistral'
import { logger } from '@/lib/logging'
import { processUserTurn } from '@/lib/observability/process-user-turn'
import type { RelevantEvent } from '@/lib/observability/conversation-context'

const SYSTEM_PROMPT_V0 = `Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.`

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

  const [recentTurns, activeMemoryFacts, relevantEvents] = await Promise.all([
    input.conversationId
      ? fetchRecentTurns(input.conversationId, 5)
      : Promise.resolve([]),
    fetchActiveMemoryFacts(userId),
    stubFetchRelevantEvents(input.text),
  ])

  const result = await processUserTurn({
    systemPrompt: SYSTEM_PROMPT_V0,
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
      const { conversationId } = await persistTurn({
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
      revalidatePath(`/samtal/thread/${conversationId}`)
      revalidatePath('/samtal')
      break
    }
  }
}

async function stubFetchRelevantEvents(_userText: string): Promise<RelevantEvent[]> {
  // Wireas via consumer/event-fetcher-PR.
  return []
}
