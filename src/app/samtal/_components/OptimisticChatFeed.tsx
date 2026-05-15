'use client'

/**
 * OptimisticChatFeed — wrapper Client Component som ger sammanhållen
 * useOptimistic-state över messages + input.
 *
 * När användaren submittar:
 *   1. addOptimisticTurn → user-tur visas omedelbart i UI
 *      + "Selvra svarar…"-spinner visas där svaret kommer
 *   2. sendMessage Server Action körs (DB + LLM + lock-validate)
 *   3. revalidatePath i Server Action → initialTurns uppdateras → React
 *      ersätter optimistic state med real data automatiskt
 *
 * UX-vinst: user ser sitt eget message direkt även om LLM-call tar 2-3
 * sekunder. Inget "skickar..."-tom-skärm-bias.
 */

import { useOptimistic, useState, useTransition } from 'react'

import { sendMessage } from '../_actions/sendMessage'
import { ChatMessages } from './ChatMessages'

type Turn = {
  id: string
  turnIndex: number
  userText: string
  selvraText: string | null
  sourcesConsulted: readonly { source_ai_id: string }[] | null
  createdAt: Date
}

type Props = {
  initialTurns: readonly Turn[]
  conversationId: string | null
}

export function OptimisticChatFeed({ initialTurns, conversationId }: Props) {
  const [optimisticTurns, addOptimisticTurn] = useOptimistic<
    readonly Turn[],
    string
  >(initialTurns, (state, userText) => [
    ...state,
    {
      id: `optimistic-${Date.now()}`,
      turnIndex: state.length,
      userText,
      selvraText: null,
      sourcesConsulted: null,
      createdAt: new Date(),
    },
  ])

  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = text.trim()
    if (!message || isPending) return
    setError(null)
    setText('')

    startTransition(async () => {
      addOptimisticTurn(message)
      try {
        await sendMessage({ conversationId, text: message })
      } catch (err) {
        // Rate-limit, auth, eller annat fel. Visa inline + lämna texten
        // tillbaka i inputen så user inte tappar sin formulering.
        setError(err instanceof Error ? err.message : 'Något gick fel.')
        setText(message)
      }
    })
  }

  return (
    <>
      <ChatMessages turns={optimisticTurns} />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-6"
      >
        <label htmlFor="samtal-text" className="sr-only">
          Skriv en fråga eller tanke
        </label>
        <textarea
          id="samtal-text"
          name="text"
          rows={4}
          maxLength={4000}
          required
          placeholder="Vad vill du veta om dig själv?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending}
          className="w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
        />
        {error && (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 leading-relaxed"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="self-start inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
        >
          {isPending ? 'Selvra läser…' : 'Skicka'}
        </button>
      </form>
    </>
  )
}
