'use server'

/**
 * sendMessage — Server Action.
 *
<<<<<<< HEAD
 * Pipeline mot Mistral via processUserTurn-orchestratorn. LLM-call:en
 * är nu live (`callMistral`); DB-fetcher och persistens är fortfarande
 * stubbar tills migration körs.
 *
 * Återstående pre-Fas-1 stubbar:
 *   - getRecentTurns: returnerar [] (DB-tabellen finns inte ännu)
 *   - getActiveMemoryFacts: returnerar []
 *   - getRelevantEvents: returnerar []
 *   - persistTurn: loggar, sparar inte (no DB-write)
 *   - persistMemoryFact: loggar, sparar inte
 */

import { callMistral } from '@/lib/llm/mistral'
import { logger } from '@/lib/logging'
import { processUserTurn } from '@/lib/observability/process-user-turn'
import type {
  ConversationTurn,
  MemoryFact,
  RelevantEvent,
} from '@/lib/observability/conversation-context'
=======
 * Pipeline mot DB via processUserTurn-orchestratorn. DB-fetcher och
 * persistens är nu live (Drizzle-queries i conversation-queries.ts).
 * LLM-call är fortfarande stub här — riktig Mistral-call kommer från
 * sammanflätning med consumer/mistral-llm-PR:n.
 *
 * Auth-gate: session.user.id krävs. Anonyma anrop kastar.
 *
 * Återstående pre-Fas-1 stub:
 *   - stubFetchRelevantEvents: returnerar [] (event-fetch mot
 *     Selvra-protokollet är separat task)
 *   - stubLlmCall: ersätts av callMistral vid merge av mistral-PR
 */

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import {
  fetchActiveMemoryFacts,
  fetchRecentTurns,
  persistMemoryFact,
  persistTurn,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'
import {
  processUserTurn,
  type LlmCallFn,
} from '@/lib/observability/process-user-turn'
import type { RelevantEvent } from '@/lib/observability/conversation-context'
>>>>>>> consumer/db-wiring

const SYSTEM_PROMPT_V0 = `Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.`

type SendMessageInput = {
  conversationId: string | null
  text: string
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const log = logger.child({ module: 'samtal/sendMessage' })

  // Auth-gate
  const session = await auth()
  if (!session?.user?.id) {
    log.warn('sendMessage_unauthorized')
    throw new Error('Inloggning krävs.')
  }
  const userId = session.user.id

  // Fetch context från DB (recent turns + active memory facts) parallellt
  // med relevant-events-fetch. Sista är stub tills Selvra-protokoll-fetcher
  // är wirad.
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

  // Persist baserat på result.kind. Varje gren leder till en row i
  // conversation_turns; memory_request lägger även en rad i
  // conversation_memory_facts.
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
      break
    }
    case 'llm_response': {
      const { conversationId } = await persistTurn({
        conversationId: input.conversationId,
        userId,
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: result.sourcesConsulted.map((e) => ({
          sourceAiId: e.sourceAiId,
        })),
        llmProvider: 'mistral', // hardcoded tills multi-provider-router byggs
      })
      log.info('llm_response_persisted', {
        conversationId,
        attempts: result.attempts,
      })
      revalidatePath(`/samtal/thread/${conversationId}`)
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
      break
    }
  }
}

// ─── Stubbar som kvarstår ────────────────────────────────────────────────

async function stubFetchRelevantEvents(_userText: string): Promise<RelevantEvent[]> {
  // Fas 1 nästa steg: heuristik eller LLM-tool-call för att avgöra vilka
  // events från Selvra-protokollet (via stillra-vard/selvra-server) som är
  // relevanta. Returnera fetched events i RelevantEvent-form.
  return []
}

<<<<<<< HEAD
async function stubPersistTurn(_turn: {
  conversationId: string | null
  userText: string
  selvraText: string
  sourcesConsulted: readonly RelevantEvent[]
}): Promise<void> {
  // Fas 1: db.insert(conversationTurns).values({...}). Om conversationId
  // är null: skapa ny conversation först, returnera id för redirect.
}

async function stubPersistMemoryFact(_factText: string): Promise<void> {
  // Fas 1: db.insert(conversationMemoryFacts).values({...}). Validera att
  // användaren inte spammar (rate-limit per user).
=======
const stubLlmCall: LlmCallFn = async (_messages, _retryHint) => {
  // Ersätts av callMistral när consumer/mistral-llm-PR mergeas.
  // Tills dess: konstruerad fallback-text.
  return 'Jag har ingen data att referera till just nu. Vill du koppla källor först?'
>>>>>>> consumer/db-wiring
}
