import 'server-only'

/**
 * generateThreadTitle — kort LLM-call för att autogenerera en titel på
 * en konversations-tråd efter första turen.
 *
 * Två syften:
 *   - Tråd-listan i /samtal blir läsbar (annars 'Tråd 8af2…')
 *   - Caller kan visa titeln i thread/[id]-header
 *
 * Kostnad: typiskt ~30 input + ~10 output tokens. Med mistral-small-latest
 * (€0.20/1M tokens) blir det <€0.001 per tråd. Acceptabel overhead.
 *
 * Konstitutionellt: titeln är ETT till output som SKA följa samma regler
 * som vanlig chat — inga manipulations-fraser, inget coachande språk.
 * Men eftersom titeln är så kort + LLM får specifik instruktion, hoppas
 * vi den följer. Lock-validate körs ändå som extra säkerhet.
 *
 * Fail-soft: vid LLM-fel returneras null. Caller hanterar (lämnar titel
 * som null, UI fallback:ar till id-snippet).
 */

import { callMistral } from './mistral'
import {
  validateConsumerOutput,
} from '@/lib/observability/consumer-lock-validate'
import { logger } from '@/lib/logging'

const TITLE_SYSTEM_PROMPT = `Du genererar en kort titel (max 6 ord) för ett samtal mellan användaren och Selvra. Titeln ska vara beskrivande och neutral — inga citat, inga utropstecken, inga manipulations-fraser. Inga råd. Returnera bara titeln, ingen punkt på slutet, ingen förklaring.`

export async function generateThreadTitle(
  firstUserText: string,
  firstSelvraText: string,
): Promise<string | null> {
  const log = logger.child({ module: 'llm/generate-title' })

  try {
    const userPrompt = `Användare: "${truncate(firstUserText, 300)}"\nSelvra: "${truncate(firstSelvraText, 300)}"\n\nTitel:`

    const response = await callMistral([
      { role: 'system', content: TITLE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ])

    const title = sanitizeTitle(response)
    if (!title || title.length === 0) {
      log.warn('generated_title_empty')
      return null
    }

    // Lock-validate även titeln. Konservativt.
    const validation = validateConsumerOutput(title, [])
    if (!validation.valid) {
      log.warn('generated_title_failed_validation', {
        violations: validation.violations.map((v) => v.rule),
      })
      return null
    }

    log.info('generated_title_ok', { length: title.length })
    return title
  } catch (err) {
    log.error('generated_title_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

function sanitizeTitle(raw: string): string {
  // LLM lägger ibland citat-tecken runt eller "Titel: X" som prefix.
  // Strippa.
  let title = raw.trim()
  title = title.replace(/^titel\s*:\s*/i, '')
  title = title.replace(/^["']/, '').replace(/["']$/, '')
  title = title.replace(/[.!?]+$/, '')
  // Begränsa till ~6 ord
  const words = title.split(/\s+/)
  if (words.length > 6) {
    title = words.slice(0, 6).join(' ')
  }
  return title.trim()
}
