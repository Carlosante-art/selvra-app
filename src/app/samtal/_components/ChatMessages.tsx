/**
 * ChatMessages — Server Component, renderar tråd-historik.
 *
 * Asymmetri: användar-tur höger-utan-källor, Selvra-tur vänster-med-källor.
 * Källa-attribuering i footer per tur (DESIGN.md §3 designval 5).
 *
 * Skeleton-state: tom tråd → empty-state. När conversation_turns finns,
 * iterera + rendera per tur.
 */

// Sources har minst { source_ai_id }. event_id + type är optional eftersom
// vi sparar dem inte konsekvent i conversation_turn (just nu). UI:t visar
// bara source_ai_id i footer-raden.
type SourceRef = { source_ai_id: string }

type Turn = {
  id: string
  turnIndex: number
  userText: string
  selvraText: string | null
  sourcesConsulted: readonly SourceRef[] | null
  createdAt: Date
  /** Endast set från klient-streaming. Visar cursor + skippar "läser…"-text. */
  isStreaming?: boolean
}

type Props = {
  turns: readonly Turn[]
}

export function ChatMessages({ turns }: Props) {
  if (turns.length === 0) {
    return (
      <section
        aria-label="Inga turer än"
        className="rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 px-6 py-12 text-center"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed">
          Tråden är tom. Det första du skriver startar samtalet.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label="Tråd-historik"
      className="flex flex-col gap-6"
    >
      {turns.map((turn) => (
        <ChatTurn key={turn.id} turn={turn} />
      ))}
    </section>
  )
}

function ChatTurn({ turn }: { turn: Turn }) {
  return (
    <article className="flex flex-col gap-4">
      <div className="self-end max-w-[80%] rounded-2xl bg-neutral-200 dark:bg-neutral-800 px-4 py-3">
        <p className="text-base leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
          {turn.userText}
        </p>
      </div>

      {turn.selvraText !== null || turn.isStreaming ? (
        <div className="self-start max-w-[90%] flex flex-col gap-3">
          <p className="text-base leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
            {turn.selvraText ?? ''}
            {turn.isStreaming && (
              <span
                aria-hidden="true"
                className="inline-block w-2 h-4 ml-0.5 bg-neutral-500 dark:bg-neutral-400 align-text-bottom animate-pulse"
              />
            )}
          </p>
          {turn.sourcesConsulted && turn.sourcesConsulted.length > 0 && (
            <p className="text-xs italic text-neutral-500 dark:text-neutral-500">
              Källor: {turn.sourcesConsulted.map((s) => s.source_ai_id).join(' · ')}
            </p>
          )}
        </div>
      ) : (
        <div className="self-start text-sm text-neutral-500 dark:text-neutral-500 italic">
          Selvra läser dina källor…
        </div>
      )}
    </article>
  )
}
