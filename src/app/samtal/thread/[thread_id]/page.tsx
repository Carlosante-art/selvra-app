/**
 * /samtal/thread/[thread_id] — specifik tråd-vy.
 *
 * Auth-gate + ownership-check via getConversationOwned. Trådar som inte
 * tillhör userId returnerar 404 (notFound) så ingen probing-information
 * läcker.
 *
 * Render hela tråd-historiken via fetchAllTurns. ChatInput nederst skickar
 * nästa tur till samma conversationId.
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

import { auth } from '@/lib/auth/config'
import {
  fetchAllTurns,
  getConversationOwned,
} from '@/lib/db/conversation-queries'

import { ArchiveButton } from '../../_components/ArchiveButton'
import { OptimisticChatFeed } from '../../_components/OptimisticChatFeed'

type Props = {
  params: Promise<{ thread_id: string }>
}

export default async function ThreadPage({ params }: Props) {
  const { thread_id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const conversation = await getConversationOwned({
    conversationId: thread_id,
    userId: session.user.id,
  })
  if (!conversation) {
    notFound()
  }

  const turns = await fetchAllTurns(thread_id)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/samtal"
            className="text-sm text-neutral-500 dark:text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors w-fit"
          >
            ← Alla samtal
          </Link>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
            Tråd
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            {conversation.title ?? `Samtal ${thread_id.slice(0, 8)}…`}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Startade {conversation.startedAt.toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'long',
            })}
            {conversation.archivedAt && (
              <span className="ml-2 inline-flex items-center rounded-full bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                arkiverad
              </span>
            )}
          </p>
          <ArchiveButton
            conversationId={thread_id}
            isArchived={conversation.archivedAt !== null}
          />
        </header>

        <OptimisticChatFeed initialTurns={turns} conversationId={thread_id} />
      </article>
    </main>
  )
}
