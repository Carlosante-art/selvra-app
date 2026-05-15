/**
 * /samtal — chat-ytan med Selvra. Konsument-Fas-1 skeleton.
 *
 * Asymmetri mot brev: brevet (/brev) är frozen reflektion. Samtalet
 * (/samtal) är on-demand dialog. Två separata ytor med olika kontrakt.
 * Brev får aldrig ersättas av samtal (DESIGN.md §3 designval 9).
 *
 * Skeleton-state: visar tom shell + placeholder. Faktisk dialog-pipeline
 * (LLM-anrop via Mistral, källa-attribuering, conversation-minnes-injection)
 * är ej implementerad. När Fas 1 aktiveras: koppla in _actions/sendMessage
 * mot LLM-provider och Selvra-protokoll-event-fetch.
 */

import { ChatInput } from './_components/ChatInput'
import { ChatMessages } from './_components/ChatMessages'

export default async function SamtalPage() {
  // TODO Fas 1: ladda senaste eller aktiva conversation_thread för userId
  // från db.consumerConversations. För skeleton: tom tråd.
  const turns: never[] = []

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
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

        <ChatMessages turns={turns} />
        <ChatInput conversationId={null} />
      </article>
    </main>
  )
}
