'use client'

/**
 * ConnectionTest — verifierar att en MCP-klient verkligen anslutit efter
 * token-gen. v2 använder Server-Sent Events för realtime-notifiering;
 * fallback till polling om EventSource fails (browser stänger, proxy
 * bryter, etc.).
 *
 * Friktionsfri UX: användaren ser anslutningen pop:a upp i samma ögonblick
 * som klienten gör sitt första MCP-anrop. Ingen 60s-spinner.
 *
 * State-machine:
 *   idle     → "Testa anslutning"-knapp
 *   listening→ "Väntar på {klient}…" (SSE öppen) + fallback-info
 *   success  → "Anslutning verifierad" + tool_name + timestamp
 *   timeout  → 5 min utan event → retry-knapp + lazy-klient-hint
 *   error    → connect-fel → retry-knapp
 *
 * Konstitutionellt:
 * - Audit visar bara metadata (tool_name, timestamp) — aldrig payload
 * - "Klaude Desktop anropade …" käll-attribuerat
 * - Beskriver mekanik ("vi ser första MCP-anrop"), inte upplevelse
 */

import { useEffect, useRef, useState } from 'react'

import { pollConnectionAction } from '@/lib/connect/actions'

type TestState =
  | { kind: 'idle' }
  | { kind: 'listening'; transport: 'sse' | 'polling'; startedAt: string }
  | { kind: 'success'; toolName: string; createdAt: string }
  | { kind: 'timeout' }
  | { kind: 'error'; message: string }

const MAX_DURATION_MS = 5 * 60 * 1_000 // 5 min — täcker lazy klienter
const POLL_INTERVAL_MS = 3_000 // fallback om SSE inte tillgängligt

export function ConnectionTest({
  sourceAiId,
  issuedAt,
  clientDisplayName,
}: {
  sourceAiId: string
  issuedAt: string
  clientDisplayName: string
}) {
  const [state, setState] = useState<TestState>({ kind: 'idle' })
  const sourceRef = useRef<EventSource | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const giveUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cleanup() {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (giveUpTimerRef.current) {
      clearTimeout(giveUpTimerRef.current)
      giveUpTimerRef.current = null
    }
  }

  useEffect(() => cleanup, [])

  function handleHit(toolName: string, createdAt: string) {
    cleanup()
    setState({ kind: 'success', toolName, createdAt })
  }

  function handleTimeout() {
    cleanup()
    setState({ kind: 'timeout' })
  }

  function startPollingFallback(startedAt: string) {
    const tick = async () => {
      const result = await pollConnectionAction(sourceAiId, startedAt)
      if (result.ok && result.hit) {
        handleHit(result.hit.resource_path, result.hit.timestamp)
        return
      }
      if (!result.ok) {
        cleanup()
        setState({ kind: 'error', message: result.error })
        return
      }
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }
    void tick()
  }

  function startTest() {
    cleanup()
    const startedAt = new Date().toISOString()
    setState({ kind: 'listening', transport: 'sse', startedAt })

    giveUpTimerRef.current = setTimeout(handleTimeout, MAX_DURATION_MS)

    // SSE-försök först
    if (typeof EventSource === 'undefined') {
      // Browser saknar EventSource — gå direkt till polling
      setState({ kind: 'listening', transport: 'polling', startedAt })
      startPollingFallback(startedAt)
      return
    }

    const url = `/api/connections/stream?source_ai_id=${encodeURIComponent(sourceAiId)}`
    const es = new EventSource(url)
    sourceRef.current = es

    let opened = false

    es.addEventListener('open', () => {
      opened = true
    })

    es.addEventListener('audit', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as {
          source_ai_id: string
          resource_path: string
          timestamp: string
        }
        const ts = new Date(data.timestamp).getTime()
        const since = new Date(issuedAt).getTime()
        if (!Number.isNaN(ts) && ts >= since) {
          handleHit(data.resource_path, data.timestamp)
        }
      } catch {
        // ignore malformed event
      }
    })

    es.addEventListener('timeout', () => {
      handleTimeout()
    })

    es.addEventListener('error', () => {
      // Om vi aldrig fick 'open' antar vi SSE inte fungerar (proxy/auth/runtime).
      // Fall tillbaka till polling så användaren får svar ändå.
      if (!opened) {
        es.close()
        sourceRef.current = null
        setState({ kind: 'listening', transport: 'polling', startedAt })
        startPollingFallback(startedAt)
      }
      // Om vi var connected och fick error: EventSource auto-reconnectar.
      // Ingen state-ändring behövs.
    })
  }

  if (state.kind === 'idle') {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={startTest}
          className="font-sans text-sm transition-colors hover:opacity-70 self-start"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Testa anslutning
        </button>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          Klicka efter att du startat om {clientDisplayName}. Selvra ser
          anslutningen i samma ögonblick som klienten gör sitt första anrop.
        </p>
      </div>
    )
  }

  if (state.kind === 'listening') {
    return (
      <div className="flex flex-col gap-2">
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Väntar på {clientDisplayName} …
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          {state.transport === 'sse'
            ? 'Lyssnar i realtid. Anslutningen visas så fort den sker.'
            : 'Kontrollerar regelbundet. Anslutningen visas inom några sekunder efter att den sker.'}
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          Vissa klienter (t.ex. Cursor) aktiverar inte MCP förrän första
          prompt. Skicka ett meddelande för att trigga första anropet.
        </p>
      </div>
    )
  }

  if (state.kind === 'success') {
    return (
      <div
        className="flex flex-col gap-2 p-4"
        style={{
          backgroundColor: 'var(--color-hover-bg)',
          borderLeft: '2px solid var(--color-ink-soft)',
          borderRadius: '4px',
        }}
      >
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-ink)' }}
        >
          Anslutning verifierad
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          {clientDisplayName} anropade {state.toolName} ·{' '}
          {new Date(state.createdAt).toLocaleString('sv-SE')}
        </p>
      </div>
    )
  }

  if (state.kind === 'timeout') {
    return (
      <div className="flex flex-col gap-3">
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Ingen anslutning detekterad inom 5 minuter.
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          Kontrollera att du har sparat konfigurationen och startat om{' '}
          {clientDisplayName}. Vissa klienter aktiverar MCP-anslutningen
          först när en konversation startas.
        </p>
        <button
          type="button"
          onClick={startTest}
          className="font-sans text-sm transition-colors hover:opacity-70 self-start"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Testa igen →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p
        className="font-sans text-sm"
        style={{ color: 'var(--color-oxblod)' }}
      >
        Anrop misslyckades: {state.message}
      </p>
      <button
        type="button"
        onClick={startTest}
        className="font-sans text-sm transition-colors hover:opacity-70 self-start"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Försök igen →
      </button>
    </div>
  )
}
