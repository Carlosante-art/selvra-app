/**
 * /samtal/thread/[thread_id] — visa specifik tråd.
 * Skeleton-stub.
 *
 * Fas 1: ladda thread_id från db.consumerConversations, alla turer från
 * conversationTurns where conversation_id = thread_id, ordnade på
 * turn_index. Auth-gate: thread.userId måste matcha session.user.id.
 */

import { ChatInput } from '../../_components/ChatInput'
import { ChatMessages } from '../../_components/ChatMessages'

type Props = {
  params: Promise<{ thread_id: string }>
}

export default async function ThreadPage({ params }: Props) {
  const { thread_id } = await params
  // TODO Fas 1: faktisk ladda + auth-check
  const turns: never[] = []

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">
            Tråd
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            Samtal {thread_id.slice(0, 8)}…
          </h1>
        </header>

        <ChatMessages turns={turns} />
        <ChatInput conversationId={thread_id} />
      </article>
    </main>
  )
}
