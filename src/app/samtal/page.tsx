/**
 * /samtal — chat-ytan med Selvra. Ny tråd-yta + lista över befintliga.
 *
 * Asymmetri mot brev: brevet (/brev) är frozen reflektion. Samtalet
 * (/samtal) är on-demand dialog. Två separata ytor med olika kontrakt.
 *
 * Render-pipeline:
 *   1. Auth-gate via auth() — anonym → /login
 *   2. listConversationsForUser för sidebar/lista
 *   3. ChatInput med conversationId=null → sendMessage skapar tråd auto
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import { listConversationsForUser } from '@/lib/db/conversation-queries'

import { OptimisticChatFeed } from './_components/OptimisticChatFeed'

type SearchParams = Promise<{ archived?: string }>

export default async function SamtalPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const params = await searchParams
  const showArchived = params.archived === '1'
  const threads = await listConversationsForUser(session.user.id, {
    limit: 20,
    includeArchived: showArchived,
  })

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        <header>
          <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">
            Samtal
          </p>
          <h1 className="text-3xl font-medium tracking-tight">På riktigt nu</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2 leading-relaxed">
            Ställ en fråga om dig själv. Selvra läser bara där dina källor
            redan finns. Inga råd, ingen coachning — observationer med
            källa, frågor när det är värt att fråga.
          </p>
        </header>

        <OptimisticChatFeed initialTurns={[]} conversationId={null} />

        <section
          aria-label="Tidigare samtal"
          className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-8"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-neutral-700 dark:text-neutral-300">
              {showArchived ? 'Alla samtal (inkl arkiverade)' : 'Tidigare samtal'}
            </h2>
            <Link
              href={showArchived ? '/samtal' : '/samtal?archived=1'}
              className="text-xs text-neutral-500 dark:text-neutral-500 underline underline-offset-2"
            >
              {showArchived ? 'Bara aktiva' : 'Visa arkiverade'}
            </Link>
          </div>

          {threads.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 italic">
              {showArchived
                ? 'Inga arkiverade samtal.'
                : 'Inga samtal än. Det första du skriver startar en tråd.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/samtal/thread/${thread.id}`}
                    className="text-sm text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    {thread.title ?? `Tråd ${thread.id.slice(0, 8)}…`}
                    <span className="text-neutral-500 dark:text-neutral-500 ml-2">
                      ({formatRelative(thread.lastMessageAt)})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  )
}

/**
 * "för 2 min sedan" / "för 3h sedan" / "i går" / "för 5 dagar sedan".
 * Mjuk relativ-tid så listan känns levande utan dashboard-look.
 */
function formatRelative(d: Date): string {
  const ms = Date.now() - d.getTime()
  const min = Math.floor(ms / 60_000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (min < 2) return 'just nu'
  if (min < 60) return `${min} min sedan`
  if (hr < 24) return `${hr}h sedan`
  if (day === 1) return 'i går'
  if (day < 7) return `${day} dagar sedan`
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}
