'use server'

/**
 * redactFact — Server Action för soft-delete av memory-fact.
 *
 * Per konsument-track §2 patient-ägd portabilitet: användaren ska kunna
 * radera enskilda minnen utan att exportera allt. Soft-delete (sätter
 * redactedAt) bevarar audit-spår men döljer faktan från LLM-context och
 * UI. Hård delete sker via GDPR-export-och-radera-flödet (separat).
 */

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import { redactMemoryFact } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export async function redactFact(input: { factId: string }): Promise<void> {
  const log = logger.child({ module: 'minne/redactFact' })

  const session = await auth()
  if (!session?.user?.id) {
    log.warn('redactFact_unauthorized')
    throw new Error('Inloggning krävs.')
  }

  // redactMemoryFact validerar userId i WHERE-klausulen — annan users
  // fact-id påverkar inget även om factId gissas.
  await redactMemoryFact({
    factId: input.factId,
    userId: session.user.id,
  })

  log.info('memory_fact_redacted', { factId: input.factId })
  revalidatePath('/minne')
}
