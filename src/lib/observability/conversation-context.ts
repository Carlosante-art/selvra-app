/**
 * Conversation-context-builder — bygger LLM-prompt-context från
 * tråd-historik + memory-facts + relevanta events + aktuell tur.
 *
 * Pure function. Ingen DB-anslutning, ingen LLM-anrop, ingen fetcher.
 * Anropas i sendMessage-Server-Action efter att alla data hämtats,
 * resultatet skickas direkt till Mistral (eller annan provider).
 *
 * Format: Mistral chat-API-kompatibel array. För andra providers (Anthropic
 * EU-tier, etc.) konvertera vid call-site.
 *
 * Spec per CONSUMER_SYSTEM_PROMPT_DRAFT.md kontext-injection. Lager:
 *   1. System-prompt (statisk per release)
 *   2. Memory-facts (som första assistant-yttring)
 *   3. Relevant data (som second system-message)
 *   4. Thread-historik (alternerande user/assistant)
 *   5. Aktuell tur (sista user-message)
 *
 * Lagrens närvaro är beroende av input — empty arrays utesluts från output.
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ConversationTurn = {
  turnIndex: number
  userText: string
  selvraText: string | null
  createdAt: Date
}

export type MemoryFact = {
  factText: string
  validFrom: Date
}

export type RelevantEvent = {
  sourceAiId: string
  timestamp: Date
  summary: string
}

export type BuildContextInput = {
  systemPrompt: string
  recentTurns: readonly ConversationTurn[]
  activeMemoryFacts: readonly MemoryFact[]
  relevantEvents: readonly RelevantEvent[]
  currentUserText: string
}

/**
 * Bygg messages-array för LLM-anrop. Returnerar i kronologisk ordning;
 * sista elementet är ALLTID den aktuella user-turen.
 */
export function buildConversationContext(
  input: BuildContextInput,
): ChatMessage[] {
  const messages: ChatMessage[] = []

  // 1. System-prompt (alltid först)
  messages.push({ role: 'system', content: input.systemPrompt })

  // 2. Memory-facts — som första assistant-yttring så LLM behandlar dem
  //    som "vad jag redan vet om användaren"
  if (input.activeMemoryFacts.length > 0) {
    messages.push({
      role: 'assistant',
      content: formatMemoryFacts(input.activeMemoryFacts),
    })
  }

  // 3. Relevanta events — som andra system-message så de inte konfunderas
  //    med assistant-yttranden
  if (input.relevantEvents.length > 0) {
    messages.push({
      role: 'system',
      content: formatRelevantEvents(input.relevantEvents),
    })
  }

  // 4. Tråd-historik (alternerande user/assistant). Bevarar bara turer
  //    där selvraText finns — pending turer (LLM-svar inte landat) skulle
  //    förvirra historiken.
  for (const turn of input.recentTurns) {
    messages.push({ role: 'user', content: turn.userText })
    if (turn.selvraText) {
      messages.push({ role: 'assistant', content: turn.selvraText })
    }
  }

  // 5. Aktuell tur — sista user-message
  messages.push({ role: 'user', content: input.currentUserText })

  return messages
}

/**
 * Formatera memory-facts som "sparade minnen om användaren". Datum-formel
 * är YYYY-MM-DD så LLM kan hänvisa till när faktan sparades om relevant.
 */
function formatMemoryFacts(facts: readonly MemoryFact[]): string {
  const lines = ['Sparade minnen om användaren:']
  for (const fact of facts) {
    const date = isoDate(fact.validFrom)
    lines.push(`- ${fact.factText} (sedan ${date})`)
  }
  return lines.join('\n')
}

/**
 * Formatera events som tids-stämplad lista per källa. Använder
 * YYYY-MM-DD HH:MM så LLM kan referera till exakt tidpunkt.
 */
function formatRelevantEvents(events: readonly RelevantEvent[]): string {
  const lines = ['Aktuell data från användarens källor:']
  for (const event of events) {
    const ts = isoDateTime(event.timestamp)
    lines.push(`[${ts}] ${event.sourceAiId}: ${event.summary}`)
  }
  return lines.join('\n')
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isoDateTime(d: Date): string {
  // YYYY-MM-DD HH:MM (utan sekunder, utan tidszon-suffix)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}
