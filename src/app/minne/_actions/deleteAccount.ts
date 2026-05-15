'use server'

/**
 * deleteAccount — full avregistrering. Raderar hela user-kontot inkl
 * auth-rader och all conversation-data. Cascade-deletes hanterar resten.
 *
 * Krever bekräftelse "AVREGISTRERA" — strikt match.
 *
 * Per konsument-track §2: användaren ska kunna avregistrera och få fullt
 * arkiv exporterat. Detta är delen "avregistrera". Export-flödet är
 * separat (befintlig /export/sref) — användaren förväntas exportera FÖRE
 * radera om hen vill bevara data.
 *
 * Efter delete: signOut + redirect till /goodbye.
 */

import { redirect } from 'next/navigation'

import { auth, signOut } from '@/lib/auth/config'
import { deleteUserAccount } from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

const CONFIRM_TEXT = 'AVREGISTRERA'

export async function deleteAccount(input: {
  confirmText: string
}): Promise<void> {
  const log = logger.child({ module: 'minne/deleteAccount' })

  if (input.confirmText !== CONFIRM_TEXT) {
    log.warn('delete_account_confirm_mismatch')
    throw new Error(
      `Bekräftelse-text matchar inte. Skriv "${CONFIRM_TEXT}" exakt.`,
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    log.warn('delete_account_unauthorized')
    throw new Error('Inloggning krävs.')
  }

  await deleteUserAccount(session.user.id)
  log.info('account_deleted', { userId: session.user.id })

  // signOut utan redirect så vi kan kontrollera destination här
  await signOut({ redirect: false })
  redirect('/goodbye')
}
