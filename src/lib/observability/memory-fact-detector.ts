/**
 * Memory-fact-detector — identifierar när användaren ber Selvra
 * spara ett explicit minne.
 *
 * Pure function. Ingen DB-anslutning, ingen LLM-anrop, ingen sida-
 * effekt. Anropas i sendMessage-Server-Action INNAN LLM:n får turen
 * så Selvra kan erkänna i sitt svar ("Jag har sparat det") och
 * INSERT-raden i conversation_memory_facts skapas synkront.
 *
 * Heuristik: regex mot svenska + engelska variants av "kom ihåg att X".
 * Konservativ — false-negative är OK (LLM kan fortfarande tolka det
 * och be Selvra-tänk be om confirm), false-positive är inte OK (vi
 * vill inte lägga in random tankar som "explicit minnen").
 *
 * Returnerar bara FAKTA-texten, inte hela tur-texten. Användarens
 * "Förresten, kom ihåg att jag är på antidepressiva sedan januari."
 * → factText: "jag är på antidepressiva sedan januari"
 */

export type MemoryFactDetection = {
  isMemoryRequest: boolean
  /** Fakta-texten, om en memory-request hittades. Normaliserad. */
  factText?: string
}

// Patterns för svenska + engelska. Capture-grupp 1 = fakta-texten efter
// trigger-frasen. Ordningen spelar roll — mer specifika patterns först.
const TRIGGER_PATTERNS: RegExp[] = [
  // Svenska
  /\b(?:kom ihåg|kom-ihåg|minns)\s+(?:att|det\s+att|gärna\s+att)\s+(.+?)(?:[.!?]\s*$|$)/i,
  /\b(?:spara|notera|kom\s+ihåg)\s+(?:att|följande)\s*:?\s*(.+?)(?:[.!?]\s*$|$)/i,
  /\bjag\s+vill\s+(?:att\s+)?du\s+(?:kommer\s+ihåg|minns|sparar|noterar)\s+(?:att\s+)?(.+?)(?:[.!?]\s*$|$)/i,
  /\b(?:lägg\s+till|ta\s+med)\s+(?:som\s+(?:fakta|minne))?\s*:?\s*(.+?)(?:[.!?]\s*$|$)/i,

  // Engelska
  /\b(?:remember|note|save)\s+(?:that\s+)?(.+?)(?:[.!?]\s*$|$)/i,
  /\bi\s+want\s+you\s+to\s+(?:remember|know)\s+(?:that\s+)?(.+?)(?:[.!?]\s*$|$)/i,
]

/**
 * Returnerar `{ isMemoryRequest: true, factText }` om turen innehåller
 * en explicit memory-request. Annars `{ isMemoryRequest: false }`.
 */
export function detectMemoryFact(userText: string): MemoryFactDetection {
  const trimmed = userText.trim()
  if (trimmed.length === 0) {
    return { isMemoryRequest: false }
  }

  for (const pattern of TRIGGER_PATTERNS) {
    const match = pattern.exec(trimmed)
    if (match && match[1]) {
      const factText = normalizeFactText(match[1])
      // Faktan måste vara minst 3 tecken efter normalisering — annars
      // är det troligen falsk positive (t.ex. "kom ihåg det.").
      if (factText.length >= 3) {
        return { isMemoryRequest: true, factText }
      }
    }
  }

  return { isMemoryRequest: false }
}

/**
 * Normalisera fakta-texten: trim, första bokstaven gemen (eftersom
 * "jag är..." är vad LLM ska se, inte "Jag är..."), inget slut-skiljetecken.
 */
function normalizeFactText(raw: string): string {
  let text = raw.trim()
  // Ta bort slut-skiljetecken
  text = text.replace(/[.!?]+$/, '').trim()
  // Första bokstaven gemen om hela ordet inte är CAPS (akronymer bevaras)
  if (text.length > 0 && text[0] !== text[0].toLowerCase()) {
    const firstWord = text.split(/\s+/)[0]
    if (firstWord !== firstWord.toUpperCase()) {
      text = text[0].toLowerCase() + text.slice(1)
    }
  }
  return text
}
