'use client'

/**
 * AuditLogPreview — expanderbar "Senaste anrop" per anslutning.
 *
 * Preview-vy med 10 senaste anrop. För full historik finns separat
 * route /connections/[client]/audit (länkad via "Se all historik"-länk
 * när preview-listan är expanderad).
 *
 * Lazy-loadar via getConnectionAuditAction först när användaren expanderar.
 *
 * Konstitutionellt:
 * - Audit visar bara metadata (resource_path, timestamp) — aldrig payload
 * - "Claude Desktop anropade …" — käll-attribuerat, inte "Du läste"
 * - "Inga anrop ännu" är neutral, inte coachande
 * - Preview != audit. Full audit-historik är konstitutionellt löfte och
 *   måste alltid vara tillgänglig från denna komponent.
 */

import Link from 'next/link'
import { useState } from 'react'

import {
  getConnectionAuditAction,
  type GetConnectionAuditResult,
} from '@/lib/connect/actions'
import type { AuditEntry } from '@/lib/protocol/client'

export function AuditLogPreview({
  sourceAiId,
  clientId,
  clientDisplayName,
}: {
  sourceAiId: string
  clientId: string
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
        { limit: 10 },
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
                    key={`${entry.timestamp}-${idx}`}
                    className="font-sans text-xs"
                    style={{ color: 'var(--color-ink-soft)' }}
                  >
                    {clientDisplayName} anropade{' '}
                    <span className="font-mono">{entry.resource_path}</span> ·{' '}
                    {new Date(entry.timestamp).toLocaleString('sv-SE')}
                    {entry.response_status !== 'ok'
                      ? ` · ${entry.response_status}`
                      : ''}
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between gap-3 flex-wrap pt-1">
                {state.total > state.items.length ? (
                  <p
                    className="font-sans text-xs"
                    style={{ color: 'var(--color-ink-tertiary)' }}
                  >
                    Visar {state.items.length} av {state.total} totalt.
                  </p>
                ) : (
                  <span />
                )}
                <Link
                  href={`/connections/${clientId}/audit`}
                  className="font-sans text-xs transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  Se all historik →
                </Link>
              </div>
            </>
          )}
          {state.kind === 'loaded' && state.items.length === 0 && (
            <Link
              href={`/connections/${clientId}/audit`}
              className="font-sans text-xs transition-colors hover:opacity-70"
              style={{ color: 'var(--color-ink-tertiary)' }}
            >
              Öppna full audit-vy →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
