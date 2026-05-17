'use client'

/**
 * OAuthConnectorInstructions — för klienter som stödjer remote MCP via
 * OAuth 2.1 + Dynamic Client Registration (MCP-spec 2025-03+).
 *
 * Användaren behöver bara:
 * 1. Öppna sin klient
 * 2. Lägga till en custom connector med vår MCP-URL
 * 3. Godkänna i browser-popup som öppnar vår /oauth/authorize
 *
 * INGEN token-kopiering. INGEN JSON-config. INGEN filplats.
 * INGEN starta-om-knapp.
 *
 * Klienten DCR-registrerar sig själv mot vår /oauth/register-endpoint
 * vid första anslutning och driver hela OAuth-flow:n.
 */

import { useState } from 'react'

export function OAuthConnectorInstructions({
  mcpEndpoint,
  instructionSteps,
}: {
  mcpEndpoint: string
  instructionSteps: string[]
}) {
  const [copyOk, setCopyOk] = useState(false)

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(mcpEndpoint)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      // Clipboard kan blockeras — användaren kan markera URL:en manuellt
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* URL — det enda användaren behöver kopiera */}
      <div className="flex flex-col gap-3">
        <p
          className="font-sans text-xs uppercase tracking-wider"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          MCP-URL att klistra in
        </p>
        <div
          className="flex items-center gap-3 p-4 rounded-md"
          style={{
            backgroundColor: 'var(--color-hover-bg)',
            border: '1px solid var(--color-hairline)',
          }}
        >
          <code
            className="font-mono text-sm flex-1 break-all"
            style={{ color: 'var(--color-ink)' }}
          >
            {mcpEndpoint}
          </code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-sans transition-colors flex-shrink-0"
            style={{
              backgroundColor: copyOk
                ? 'var(--color-ink-tertiary)'
                : 'var(--color-ink)',
              color: 'var(--color-paper)',
            }}
          >
            {copyOk ? 'Kopierad' : 'Kopiera'}
          </button>
        </div>
      </div>

      {/* Numrerade steg — klient-specifika */}
      <ol
        className="flex flex-col gap-3 list-decimal list-outside pl-5"
        style={{ color: 'var(--color-ink)' }}
      >
        {instructionSteps.map((step, idx) => (
          <li key={idx} className="font-sans text-sm leading-relaxed">
            {step}
          </li>
        ))}
      </ol>

      {/* Förklaring vad som händer */}
      <aside
        className="font-sans text-xs leading-relaxed border rounded-md p-3"
        style={{
          borderColor: 'var(--color-hairline)',
          color: 'var(--color-ink-tertiary)',
        }}
      >
        Inget att kopiera utöver URL:en. Klienten registrerar sig själv mot
        Selvra och du får en browser-popup där du godkänner anslutningen.
        Token utfärdas automatiskt — du ser den aldrig.
      </aside>
    </div>
  )
}
