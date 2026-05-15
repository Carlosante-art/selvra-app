/**
 * /samtal/thread/[thread_id]/export — markdown-export av tråd.
 *
 * Per konsument-track §2 patient-ägd portabilitet: granular pendant till
 * SREF-export (hela kontot). En tråd ska kunna kopieras till en annan AI,
 * notes-app, eller arkiv.
 *
 * Server Component fetchar + formaterar. Client-side copy-knapp använder
 * navigator.clipboard.
 */

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import {
  fetchAllTurns,
  getConversationOwned,
} from '@/lib/db/conversation-queries'
import { formatThreadAsMarkdown } from '@/lib/conversation/format-as-markdown'

import { CopyMarkdownButton } from './_components/CopyMarkdownButton'

type Props = {
  params: Promise<{ thread_id: string }>
}

export default async function ThreadExportPage({ params }: Props) {
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
  const markdown = formatThreadAsMarkdown({
    title: conversation.title,
    startedAt: conversation.startedAt,
    turns,
  })

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link
            href={`/samtal/thread/${thread_id}`}
            className="text-sm text-neutral-500 dark:text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors w-fit"
          >
            ← Tillbaka till tråden
          </Link>
          <h1 className="text-2xl font-medium tracking-tight">Export (markdown)</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Kopiera nedan till valfri AI, notes-app eller arkiv. Din data är din.
          </p>
        </header>

        <CopyMarkdownButton markdown={markdown} />

        <pre className="text-xs leading-relaxed bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4 overflow-auto whitespace-pre-wrap font-mono">
          {markdown}
        </pre>
      </article>
    </main>
  )
}
