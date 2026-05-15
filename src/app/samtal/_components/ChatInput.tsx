'use client'

/**
 * ChatInput — Client Component. Textarea + submit-knapp.
 *
 * Submit kallar Server Action sendMessage. För skeleton: action är stub
 * som inte triggar LLM. När Fas 1 aktiveras: action sparar tur, fetchar
 * relevanta events från Selvra-protokollet, anropar Mistral, sparar svar.
 *
 * Auto-grow textarea + Enter-att-skicka är not-yet — skeleton har bara
 * grundläggande textarea + knapp.
 */

import { useState, useTransition } from 'react'
import { sendMessage } from '../_actions/sendMessage'

type Props = {
  conversationId: string | null
}

export function ChatInput({ conversationId }: Props) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || isPending) return
    const message = text
    setText('')
    startTransition(async () => {
      await sendMessage({ conversationId, text: message })
    })
  }

  return (
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
        className="w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
      />
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="self-start inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
      >
        {isPending ? 'Skickar…' : 'Skicka'}
      </button>
    </form>
  )
}
