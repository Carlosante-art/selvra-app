'use server'

/**
 * purgeConversations — hård delete av alla conversations + memory-facts
 * för current user. Behåller auth-konto intakt.
 *
 * Krever att användaren skrivit "RADERA" som bekräftelse — defense mot
 * olyckligt klick.
 *
 * Per konsument-track §2 patient-ägd portabilitet: detta är användarens
 * rätt. Selvra ska aldrig försvåra avlägsnande.
 */

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import { purgeUserConversations } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

const CONFIRM_TEXT = 'RADERA'

export async function purgeConversations(input: {
  confirmText: string
}): Promise<{ deletedConversations: number; deletedFacts: number }> {
  const log = logger.child({ module: 'minne/purgeConversations' })

  if (input.confirmText !== CONFIRM_TEXT) {
    log.warn('purge_confirm_mismatch')
    throw new Error(
      `Bekräftelse-text matchar inte. Skriv "${CONFIRM_TEXT}" exakt.`,
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    log.warn('purge_unauthorized')
    throw new Error('Inloggning krävs.')
  }

  const result = await purgeUserConversations(session.user.id)
  log.info('conversations_purged', result)
  revalidatePath('/minne')
  revalidatePath('/samtal')
  return result
}
