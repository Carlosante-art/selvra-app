'use client'

/**
 * ConnectionsList — interaktiv lista över anslutna system med revocation.
 *
 * State managed client-side via Server Action återhämtning efter revoke.
 * useTransition för pending-state under revoke-anrop.
 */

import { useState, useTransition } from 'react'

import {
  listConnectionsAction,
  revokeConnectionAction,
} from '@/lib/connect/actions'
import { getClientBySourceAiId } from '@/lib/connect/clients'
import type { ConnectionItem } from '@/lib/protocol/client'

import { AuditLogPreview } from './audit-log-preview'

export function ConnectionsList({
  initialItems,
}: {
  initialItems: ConnectionItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRevoke(sourceAiId: string) {
    setError(null)
    startTransition(async () => {
      const result = await revokeConnectionAction(sourceAiId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Re-fetch lista
      const list = await listConnectionsAction()
      if (list.ok) {
        setItems(list.items)
      }
    })
  }

  if (items.length === 0) {
    return (
      <p
        className="leading-relaxed"
        style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
      >
        Inga AI-system har just nu läsåtkomst till din representation.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {items.map((item) => {
          const meta = getClientBySourceAiId(item.source_ai_id)
          const displayName = meta?.displayName ?? item.source_ai_id
          return (
            <li
              key={item.source_ai_id}
              className="flex flex-col gap-2 p-5"
              style={{
                border: '1px solid var(--color-hairline)',
                borderRadius: '4px',
              }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span
                    className="font-serif"
                    style={{
                      fontSize: '17px',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {displayName}
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-ink-tertiary)',
                    }}
                  >
                    Ansluten {new Date(item.first_granted_at).toLocaleDateString('sv-SE')}
                    {item.last_active_at
                      ? ` · Senast aktiv ${formatRelative(item.last_active_at)}`
                      : ' · Aldrig aktiv ännu'}
                  </span>
                  <span
                    className="font-sans text-xs"
                    style={{ color: 'var(--color-ink-tertiary)' }}
                  >
                    Läser: {item.resource_types.join(', ')}
                    {item.request_count_24h > 0
                      ? ` · ${item.request_count_24h} ${item.request_count_24h === 1 ? 'anrop' : 'anrop'} senaste 24h`
                      : ''}
                  </span>
                  {item.token_fingerprint && (
                    <span
                      className="font-sans text-xs"
                      style={{ color: 'var(--color-ink-tertiary)' }}
                    >
                      Token{' '}
                      <span className="font-mono">{item.token_fingerprint}</span>
                      {item.token_expires_at
                        ? ` · gäller till ${new Date(item.token_expires_at).toLocaleDateString('sv-SE')}`
                        : ''}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(item.source_ai_id)}
                  disabled={pending}
                  className="font-sans text-sm transition-colors hover:opacity-70 disabled:opacity-50"
                  style={{ color: 'var(--color-oxblod)' }}
                >
                  {pending ? 'Återkallar…' : 'Återkalla access'}
                </button>
              </div>
              <AuditLogPreview
                sourceAiId={item.source_ai_id}
                clientDisplayName={displayName}
              />
            </li>
          )
        })}
      </ul>
      {error && (
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-oxblod)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just nu'
  if (minutes < 60) return `${minutes} min sedan`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} tim sedan`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} dgr sedan`
  return new Date(iso).toLocaleDateString('sv-SE')
}
