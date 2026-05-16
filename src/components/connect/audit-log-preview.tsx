'use client'

/**
 * AuditLogPreview — expanderbar "Senaste anrop" per anslutning.
 *
 * Lazy-loadar via getConnectionAuditAction först när användaren expanderar.
 * Visar upp till 10 senaste anrop med käll-attribuerad text.
 *
 * Konstitutionellt:
 * - Audit visar bara metadata (tool_name, timestamp) — aldrig payload
 * - "Claude Desktop läste …" — käll-attribuerat, inte "Du läste"
 * - "Inga anrop ännu" är neutral, inte coachande
 */

import { useState } from 'react'

import {
  getConnectionAuditAction,
  type GetConnectionAuditResult,
} from '@/lib/connect/actions'
import type { AuditEntry } from '@/lib/protocol/client'

export function AuditLogPreview({
  sourceAiId,
  clientDisplayName,
}: {
  sourceAiId: string
  clientDisplayName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'loaded'; items: AuditEntry[]; total: number }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  async function toggle() {
    const next = !expanded
    setExpanded(next)
    if (next && state.kind === 'idle') {
      setState({ kind: 'loading' })
      const result: GetConnectionAuditResult = await getConnectionAuditAction(
        sourceAiId,
        10,
      )
      if (result.ok) {
        setState({ kind: 'loaded', items: result.items, total: result.total })
      } else {
        setState({ kind: 'error', message: result.error })
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        className="font-sans text-xs transition-colors hover:opacity-70 self-start"
        style={{ color: 'var(--color-ink-tertiary)' }}
      >
        {expanded ? 'Dölj senaste anrop' : 'Visa senaste anrop'} {expanded ? '↑' : '↓'}
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 pl-3" style={{ borderLeft: '1px solid var(--color-hairline)' }}>
          {state.kind === 'loading' && (
            <p
              className="font-sans text-xs"
              style={{ color: 'var(--color-ink-tertiary)' }}
            >
              Hämtar…
            </p>
          )}
          {state.kind === 'error' && (
            <p
              className="font-sans text-xs"
              style={{ color: 'var(--color-oxblod)' }}
            >
              {state.message}
            </p>
          )}
          {state.kind === 'loaded' && state.items.length === 0 && (
            <p
              className="font-sans text-xs"
              style={{ color: 'var(--color-ink-tertiary)' }}
            >
              {clientDisplayName} har inte gjort några anrop ännu.
            </p>
          )}
          {state.kind === 'loaded' && state.items.length > 0 && (
            <>
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {state.items.map((entry, idx) => (
                  <li
                    key={`${entry.created_at}-${idx}`}
                    className="font-sans text-xs"
                    style={{ color: 'var(--color-ink-soft)' }}
                  >
                    {clientDisplayName} anropade{' '}
                    <span className="font-mono">{entry.tool_name}</span> ·{' '}
                    {new Date(entry.created_at).toLocaleString('sv-SE')}
                    {entry.verdict ? ` · ${entry.verdict}` : ''}
                  </li>
                ))}
              </ul>
              {state.total > state.items.length && (
                <p
                  className="font-sans text-xs"
                  style={{ color: 'var(--color-ink-tertiary)' }}
                >
                  Visar {state.items.length} av {state.total} totalt.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
