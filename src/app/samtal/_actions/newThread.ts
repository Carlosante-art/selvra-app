'use server'

/**
 * newThread — Server Action. Skapar ny conversation_thread.
 * Skeleton-stub.
 *
 * Fas 1 ska:
 *   1. Validera auth
 *   2. INSERT consumer_conversations
 *   3. redirect till /samtal/thread/[id]
 */

import { logger } from '@/lib/logging'

export async function newThread(): Promise<void> {
  const log = logger.child({ module: 'samtal/newThread' })
  log.info('skeleton: newThread triggered, no-op')
}
