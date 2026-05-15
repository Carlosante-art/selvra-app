'use server'

/**
 * archiveThread / unarchiveThread — toggla en tråd:s arkiverat-status.
 *
 * Soft-arkiv: archivedAt-stämpel döljer från default-listan i /samtal
 * men data + turer bevaras. Skiljer sig från purgeConversations (#10)
 * som hård-deleter.
 *
 * Auth-gate + userId-scope i query — annan-users tråd kan inte arkiveras
 * även om id är känt.
 */

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import {
  archiveConversation,
  unarchiveConversation,
} from '@/lib/db/conversation-queries'
import { logger } from '@/lib/logging'

export async function archiveThread(input: {
  conversationId: string
}): Promise<void> {
  const log = logger.child({ module: 'samtal/archiveThread' })
  const session = await auth()
  if (!session?.user?.id) {
    log.warn('archive_unauthorized')
    throw new Error('Inloggning krävs.')
  }
  await archiveConversation({
    conversationId: input.conversationId,
    userId: session.user.id,
  })
  log.info('thread_archived', { conversationId: input.conversationId })
  revalidatePath(`/samtal/thread/${input.conversationId}`)
  revalidatePath('/samtal')
}

export async function unarchiveThread(input: {
  conversationId: string
}): Promise<void> {
  const log = logger.child({ module: 'samtal/unarchiveThread' })
  const session = await auth()
  if (!session?.user?.id) {
    log.warn('unarchive_unauthorized')
    throw new Error('Inloggning krävs.')
  }
  await unarchiveConversation({
    conversationId: input.conversationId,
    userId: session.user.id,
  })
  log.info('thread_unarchived', { conversationId: input.conversationId })
  revalidatePath(`/samtal/thread/${input.conversationId}`)
  revalidatePath('/samtal')
}
