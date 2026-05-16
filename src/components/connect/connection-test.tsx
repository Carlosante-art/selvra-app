'use client'

/**
 * ConnectionTest — verifierar att en MCP-klient verkligen anslutit efter
 * token-gen. Pollar audit-endpoint via Server Action var 2s i upp till 60s
 * och rapporterar första hit:en som detekteras efter token-issuance.
 *
 * State-machine:
 *   idle      → "Testa anslutning"-knapp
 *   polling   → "Väntar på att klienten ska ansluta…" + tid kvar
 *   success   → "Anslutning verifierad" + tidpunkt + tool_name
 *   timeout   → "Ingen anslutning detekterad" + retry-knapp
 *   error     → "Anrop failed" + retry-knapp
 *
 * Konstitutionellt:
 * - Audit visar bara metadata (tool_name, timestamp) — aldrig response-innehåll
 * - "Testa anslutning" beskriver mekanik, inte upplevelse — ingen coach-ton
 * - Käll-attribuerat: "Claude Desktop anropade query_representation"
 */

import { useEffect, useRef, useState } from 'react'

import { pollConnectionAction } from '@/lib/connect/actions'

type TestState =
  | { kind: 'idle' }
  | { kind: 'polling'; attempt: number; maxAttempts: number; sinceIso: string }
  | { kind: 'success'; toolName: string; createdAt: string }
  | { kind: 'timeout' }
  | { kind: 'error'; message: string }

const POLL_INTERVAL_MS = 2_000
const MAX_ATTEMPTS = 30 // 30 × 2s = 60s

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function startTest() {
    setState({
      kind: 'polling',
      attempt: 1,
      maxAttempts: MAX_ATTEMPTS,
      sinceIso: issuedAt,
    })
  }

  useEffect(() => {
    if (state.kind !== 'polling') return

    let cancelled = false

    async function tick() {
      if (state.kind !== 'polling') return
      const result = await pollConnectionAction(sourceAiId, state.sinceIso)
      if (cancelled) return

      if (!result.ok) {
        setState({ kind: 'error', message: result.error })
        return
      }
      if (result.hit) {
        setState({
          kind: 'success',
          toolName: result.hit.tool_name,
          createdAt: result.hit.created_at,
        })
        return
      }
      if (state.attempt >= state.maxAttempts) {
        setState({ kind: 'timeout' })
        return
      }
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return
        setState({
          kind: 'polling',
          attempt: state.attempt + 1,
          maxAttempts: state.maxAttempts,
          sinceIso: state.sinceIso,
        })
      }, POLL_INTERVAL_MS)
    }

    void tick()

    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [state, sourceAiId])

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
          Klicka efter att du startat om {clientDisplayName}. Kontrollerar i
          upp till 60 sekunder om klienten har gjort sitt första anrop.
        </p>
      </div>
    )
  }

  if (state.kind === 'polling') {
    const secondsLeft = (state.maxAttempts - state.attempt + 1) * 2
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
          {secondsLeft}s kvar. Anslutningen sker först när klienten gör sitt
          första anrop mot Selvra.
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
          Ingen anslutning detekterad inom 60 sekunder.
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          Kontrollera att du har sparat konfigurationen och startat om{' '}
          {clientDisplayName}. Vissa klienter aktiverar inte MCP-anslutningen
          förrän en konversation startas.
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
