'use client'

/**
 * StreamingChatFeed — streaming-variant av OptimisticChatFeed.
 *
 * POST:ar mot /api/chat/stream och läser NDJSON-event-stream. Token-chunks
 * renderas live så user ser Selvra skriva. När stream är klar refreshar
 * Server Components så DB-sanningen tar över.
 *
 * Event-hantering:
 *   meta         → spara conversationId (för navigation efter klar)
 *   memory_ack   → ersätt optimistic selvraText med ack-text, klar
 *   stream_start → init Selvra-bubble med tom text + isStreaming + sources
 *   chunk        → append text till selvraText (cursor blinkar)
 *   final        → ersätt med slutgiltig text, isStreaming=false
 *   invalidated  → ersätt med fallback-text, isStreaming=false
 *   error        → kasta → felmeddelande inline + behåll input
 *
 * Vid första turn (conversationId=null) navigerar vi till tråd-URL:n efter
 * klar — då laddas tråden från DB via Server Components.
 */

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { ChatMessages } from './ChatMessages'

type SourceRef = { source_ai_id: string }

type Turn = {
  id: string
  turnIndex: number
  userText: string
  selvraText: string | null
  sourcesConsulted: readonly SourceRef[] | null
  createdAt: Date
  isStreaming?: boolean
}

type Props = {
  initialTurns: readonly Turn[]
  conversationId: string | null
}

export function StreamingChatFeed({ initialTurns, conversationId }: Props) {
  const router = useRouter()
  const [localTurns, setLocalTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  // Counter för stabila optimistic-id:n utan Date.now / Math.random (pure).
  const optimisticCounterRef = useRef(0)

  const allTurns = [...initialTurns, ...localTurns]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = text.trim()
    if (!message || isPending) return
    setError(null)
    setText('')
    setIsPending(true)

    optimisticCounterRef.current += 1
    const optimisticId = `optimistic-${optimisticCounterRef.current}`
    const baseTurn: Turn = {
      id: optimisticId,
      turnIndex: allTurns.length,
      userText: message,
      selvraText: null,
      sourcesConsulted: null,
      createdAt: new Date(),
      isStreaming: false, // user-tur, ingen Selvra-stream än
    }
    setLocalTurns((prev) => [...prev, baseTurn])

    let convId: string | null = conversationId
    const wasNewThread = conversationId === null

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text: message }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          let event: { type: string; [k: string]: unknown }
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }
          handleEvent(event, optimisticId)
          if (event.type === 'meta' && typeof event.conversationId === 'string') {
            convId = event.conversationId
          }
          if (event.type === 'error' && typeof event.message === 'string') {
            throw new Error(event.message)
          }
        }
      }

      // Stream klar. För ny tråd: navigera till tråd-URL (component unmountar
      // → localTurns rensas naturligt). För befintlig: refresh + rensa
      // localTurns inom samma React-batch så server-rendered data tar över
      // utan flicker.
      if (wasNewThread && convId) {
        router.push(`/samtal/thread/${convId}`)
      } else {
        router.refresh()
        setLocalTurns([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel.')
      setText(message)
      setLocalTurns((prev) => prev.filter((t) => t.id !== optimisticId))
    } finally {
      setIsPending(false)
    }
  }

  function handleEvent(
    event: { type: string; [k: string]: unknown },
    optimisticId: string,
  ) {
    setLocalTurns((prev) =>
      prev.map((t) => {
        if (t.id !== optimisticId) return t
        switch (event.type) {
          case 'memory_ack':
            return {
              ...t,
              selvraText: typeof event.text === 'string' ? event.text : '',
              isStreaming: false,
            }
          case 'stream_start': {
            const sources = Array.isArray(event.sources)
              ? (event.sources as SourceRef[])
              : null
            return {
              ...t,
              selvraText: '',
              sourcesConsulted: sources,
              isStreaming: true,
            }
          }
          case 'chunk':
            return {
              ...t,
              selvraText:
                (t.selvraText ?? '') +
                (typeof event.text === 'string' ? event.text : ''),
              isStreaming: true,
            }
          case 'final':
            return {
              ...t,
              selvraText:
                typeof event.selvraText === 'string'
                  ? event.selvraText
                  : (t.selvraText ?? ''),
              isStreaming: false,
            }
          case 'invalidated':
            return {
              ...t,
              selvraText:
                typeof event.selvraText === 'string'
                  ? event.selvraText
                  : 'Jag kan inte svara på det just nu.',
              isStreaming: false,
            }
          default:
            return t
        }
      }),
    )
  }

  return (
    <>
      <ChatMessages turns={allTurns} />
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
