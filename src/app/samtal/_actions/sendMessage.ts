'use server'

/**
 * sendMessage — Server Action. Skeleton-stub.
 *
 * När Fas 1 aktiveras ska denna:
 *   1. Validera auth (next-auth session)
 *   2. Hämta eller skapa conversation_thread för userId
 *   3. Skriva user-tur till conversation_turns
 *   4. Fetcha relevanta events från Selvra-protokollet (vad är relevant
 *      avgörs av LLM via tool-call eller heuristic)
 *   5. Bygg LLM-prompt med:
 *      - system: konstitutionella regler (käll-attribuering, anti-coach)
 *      - context: senaste N turer + relevanta events + memory_facts
 *      - user: aktuell tur
 *   6. Kalla Mistral (EU-region) med stream-svar
 *   7. Skriv tillbaka selvra_text + sources_consulted till samma tur
 *   8. Constitutional lock-validate på svaret (utvidgad från Stillras)
 *   9. revalidate /samtal eller redirect till thread/[id]
 *
 * Skeleton-state: bara log + redirect, ingen DB-skrivning, inget LLM-anrop.
 * Inga npm-deps installerade (Mistral SDK skulle vara separat beslut).
 */

import { logger } from '@/lib/logging'

type SendMessageInput = {
  conversationId: string | null
  text: string
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const log = logger.child({ module: 'samtal/sendMessage' })

  // STUB: Fas 1 ska skriva till DB, anropa LLM, validera svar. Idag
  // bara loggning + ingen sida-effekt. Detta är medveten skeleton —
  // inte missad implementation.
  log.info('skeleton: sendMessage triggered, no-op', {
    conversationId: input.conversationId,
    textLength: input.text.length,
  })

  // När Fas 1 aktiveras:
  //   - throw new ApiError om validation fail
  //   - revalidatePath('/samtal') eller redirect(`/samtal/thread/${id}`)
}
