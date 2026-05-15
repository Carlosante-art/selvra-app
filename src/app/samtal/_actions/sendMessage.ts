'use server'

/**
 * sendMessage — Server Action.
 *
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

// System-prompten lever just nu som markdown i .gsd/. När Fas 1 aktiveras
// portas v0 till en versionerad ts-konstant (eller laddas från en tabell
// så Carl kan ändra utan deploy).
const SYSTEM_PROMPT_V0 = `Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.`

type SendMessageInput = {
  conversationId: string | null
  text: string
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const log = logger.child({ module: 'samtal/sendMessage' })

  // STUB: faktiska implementeringar bygger när Fas 1-besluten är fattade.
  // Skeleton wire:ar bara pipelinen så orchestratorn körs end-to-end utan
  // sida-effekter — testning och kod-review kan ske utan DB/LLM.

  const recentTurns = await stubFetchRecentTurns(input.conversationId)
  const activeMemoryFacts = await stubFetchMemoryFacts()
  const relevantEvents = await stubFetchRelevantEvents(input.text)

  const result = await processUserTurn({
    systemPrompt: SYSTEM_PROMPT_V0,
    currentUserText: input.text,
    recentTurns,
    activeMemoryFacts,
    relevantEvents,
    llmCall: callMistral,
  })

  switch (result.kind) {
    case 'memory_request':
      log.info('memory_request detected', { factLength: result.factText.length })
      await stubPersistMemoryFact(result.factText)
      await stubPersistTurn({
        conversationId: input.conversationId,
        userText: input.text,
        selvraText: result.acknowledgement,
        sourcesConsulted: [],
      })
      break
    case 'llm_response':
      log.info('llm_response valid', { attempts: result.attempts })
      await stubPersistTurn({
        conversationId: input.conversationId,
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: result.sourcesConsulted,
      })
      break
    case 'fallback':
      log.warn('fallback after retries', {
        attempts: result.attempts,
        violations: result.lastViolations.map((v) => v.rule),
      })
      await stubPersistTurn({
        conversationId: input.conversationId,
        userText: input.text,
        selvraText: result.selvraText,
        sourcesConsulted: [],
      })
      break
  }

  // Fas 1: revalidatePath('/samtal') eller redirect(`/samtal/thread/${id}`)
}

// ─── Stubbar — ersätts vid Fas 1-aktivering ──────────────────────────────

async function stubFetchRecentTurns(
  _conversationId: string | null,
): Promise<ConversationTurn[]> {
  // Fas 1: SELECT från conversation_turns where conversation_id = $1
  //        ORDER BY turn_index DESC LIMIT 5 → reverse för kronologi
  return []
}

async function stubFetchMemoryFacts(): Promise<MemoryFact[]> {
  // Fas 1: SELECT från conversation_memory_facts where user_id = session.user.id
  //        AND redacted_at IS NULL AND valid_from <= NOW()
  //        AND (valid_until IS NULL OR valid_until > NOW())
  return []
}

async function stubFetchRelevantEvents(_userText: string): Promise<RelevantEvent[]> {
  // Fas 1: heuristik eller LLM-tool-call för att avgöra vilka events från
  // Selvra-protokollet (via stillra-vard/selvra-server) som är relevanta.
  // Returnera fetched events i RelevantEvent-form.
  return []
}

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
}
