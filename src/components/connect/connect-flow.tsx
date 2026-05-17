'use client'

/**
 * ConnectFlow — klient-specifik anslutnings-UI för /connect/[client].
 *
 * State-machine:
 *   idle        → "Generera anslutnings-token"-knapp
 *   issuing     → loading
 *   issued      → token + fingerprint + config-snippet visas
 *   error       → felmeddelande + retry-knapp
 *
 * Konstitutionellt:
 * - Token visas EN gång; efter copy/render försvinner raw-token från state
 * - Inga personality-claims, inga "powered by"-promotion
 * - "Anslut när du är redo" (lugn), inte "Anslut nu!" (FOMO)
 */

import { useState } from 'react'

import { issueTokenAction, type IssueTokenActionResult } from '@/lib/connect/actions'
import { buildConfigSnippet, type ClientMeta } from '@/lib/connect/clients'

import { ConnectionTest } from './connection-test'

type FlowState =
  | { kind: 'idle' }
  | { kind: 'issuing' }
  | {
      kind: 'issued'
      token: string
      fingerprint: string
      expiresAt: string
      sourceAiId: string
      issuedAt: string
    }
  | { kind: 'error'; message: string }

export function ConnectFlow({
  client,
  mcpEndpoint,
}: {
  client: ClientMeta
  mcpEndpoint: string
}) {
  const [state, setState] = useState<FlowState>({ kind: 'idle' })
  const [copyOk, setCopyOk] = useState(false)

  async function handleGenerate() {
    setState({ kind: 'issuing' })
    const result: IssueTokenActionResult = await issueTokenAction(client.id)
    if (result.ok) {
      setState({
        kind: 'issued',
        token: result.token.token,
        fingerprint: result.token.fingerprint,
        expiresAt: result.token.expires_at,
        sourceAiId: result.token.source_ai_id,
        issuedAt: new Date().toISOString(),
      })
    } else {
      setState({ kind: 'error', message: result.error })
    }
  }

  async function handleCopy() {
    if (state.kind !== 'issued') return
    const snippet = buildConfigSnippet({
      client,
      token: state.token,
      endpoint: mcpEndpoint,
    })
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      // Clipboard kan blockeras; ignore — användaren kan markera och kopiera manuellt
    }
  }

  if (state.kind === 'idle') {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-sans hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors self-start"
        >
          Generera anslutnings-token
        </button>
        <p
          className="font-sans text-xs"
          style={{ color: 'var(--color-ink-tertiary)' }}
        >
          Token är giltig i 30 dagar. Återkallas när som helst från{' '}
          /connections.
        </p>
      </div>
    )
  }

  if (state.kind === 'issuing') {
    return (
      <p
        className="font-sans text-sm"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Genererar token…
      </p>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-oxblod)' }}
        >
          Kunde inte generera token: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          className="font-sans text-sm transition-colors hover:opacity-70 self-start"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Försök igen →
        </button>
      </div>
    )
  }

  // state.kind === 'issued'
  const snippet = buildConfigSnippet({
    client,
    token: state.token,
    endpoint: mcpEndpoint,
  })

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-3 p-5"
        style={{
          backgroundColor: 'var(--color-hover-bg)',
          borderLeft: '2px solid var(--color-oxblod)',
        }}
      >
        <p
          className="font-sans text-xs uppercase tracking-wider"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Token genererad
        </p>
        <p
          className="font-sans"
          style={{
            fontSize: '13px',
            color: 'var(--color-ink-tertiary)',
          }}
        >
          Fingerprint: {state.fingerprint}
        </p>
        <p
          className="font-sans"
          style={{
            fontSize: '13px',
            color: 'var(--color-ink-tertiary)',
          }}
        >
          Gäller till {new Date(state.expiresAt).toLocaleDateString('sv-SE')}.
          Token visas bara en gång — kopiera nu eller generera ny senare.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p
            className="font-sans text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Konfiguration
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            {copyOk ? 'Kopierat ✓' : 'Kopiera'}
          </button>
        </div>
        <pre
          className="font-mono text-xs p-4 overflow-x-auto whitespace-pre-wrap"
          style={{
            backgroundColor: 'var(--color-hover-bg)',
            color: 'var(--color-ink)',
            borderRadius: '4px',
          }}
        >
          {snippet}
        </pre>
      </div>

      <div
        className="flex flex-col gap-2 pt-2 border-t"
        style={{ borderColor: 'var(--color-hairline)' }}
      >
        <p
          className="font-sans text-xs uppercase tracking-wider"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Verifiera anslutning
        </p>
        <ConnectionTest
          sourceAiId={state.sourceAiId}
          issuedAt={state.issuedAt}
          clientDisplayName={client.displayName}
        />
      </div>

      {client.configPaths && (
        <div className="flex flex-col gap-2">
          <p
            className="font-sans text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Filplats
          </p>
          <dl
            className="font-mono text-xs flex flex-col gap-1"
            style={{ color: 'var(--color-ink)' }}
          >
            {client.configPaths.macos && (
              <div className="flex gap-2">
                <dt
                  className="font-sans"
                  style={{ color: 'var(--color-ink-soft)', minWidth: '4em' }}
                >
                  macOS:
                </dt>
                <dd>{client.configPaths.macos}</dd>
              </div>
            )}
            {client.configPaths.linux && (
              <div className="flex gap-2">
                <dt
                  className="font-sans"
                  style={{ color: 'var(--color-ink-soft)', minWidth: '4em' }}
                >
                  Linux:
                </dt>
                <dd>{client.configPaths.linux}</dd>
              </div>
            )}
            {client.configPaths.windows && (
              <div className="flex gap-2">
                <dt
                  className="font-sans"
                  style={{ color: 'var(--color-ink-soft)', minWidth: '4em' }}
                >
                  Windows:
                </dt>
                <dd>{client.configPaths.windows}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
