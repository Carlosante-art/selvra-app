'use client'

import { useEffect, useState } from 'react'

/**
 * /export/ai-context/quick — Carl-dogfood-utility.
 *
 * Inte feature. Inte produkt-positionering. Bara bekvämlighet för Carl-
 * copy-paste-friktion när han pratar med ChatGPT/Claude/Gemini i webb-UI.
 *
 * Bookmarklet öppnar denna sida i en popup → vi fetchar context-text
 * från /api/export/ai-context, auto-kopierar till urklipp, visar
 * bekräftelse, stänger fönstret efter 1.5s. Carl klistrar in på den
 * AI-sida han var på.
 *
 * Inget MCP-protokoll. Ingen extension-installation. Inga produkt-
 * implikationer (browser-extension som Nivå 1.5 är medvetet INTE valt —
 * se STRATEGIC_FUTURE_POSITIONING_2026-05-12.md).
 *
 * Default config: period=week, layers=intentions,thoughts. Override via
 * URL-params om Carl vill ha annan default i sin bookmarklet.
 *
 * Bookmarklet-installation: dra denna länk till bookmark bar:
 *   javascript:window.open('https://selvra-app-production.up.railway.app/export/ai-context/quick','_selvra','width=420,height=260');
 */

type Status = 'loading' | 'copied' | 'error'

export default function QuickContextPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [charCount, setCharCount] = useState<number>(0)

  useEffect(() => {
    const url = new URL(window.location.href)
    const period = url.searchParams.get('period') ?? 'week'
    const layers = url.searchParams.get('layers') ?? 'intentions,thoughts'
    const autoClose = url.searchParams.get('autoclose') !== '0'

    const params = new URLSearchParams({ period, layers })

    fetch(`/api/export/ai-context?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${await r.text()}`)
        }
        return r.text()
      })
      .then(async (text) => {
        await navigator.clipboard.writeText(text)
        setCharCount(text.length)
        setStatus('copied')
        if (autoClose) {
          setTimeout(() => {
            try {
              window.close()
            } catch {
              // window.close() failar för icke-popup-fönster — OK, lämna
              // bara öppen så Carl kan se bekräftelsen.
            }
          }, 1500)
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setStatus('error')
      })
  }, [])

  return (
    <main
      style={{
        background: '#FAF8F3',
        color: '#2A2826',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <p style={{ fontSize: '1rem', color: '#5C4A3E', margin: 0 }}>
            Kopierar Selvra-kontext…
          </p>
        )}

        {status === 'copied' && (
          <>
            <p
              style={{
                fontFamily: 'serif',
                fontSize: '1.5rem',
                lineHeight: 1.3,
                margin: '0 0 0.5rem 0',
                color: '#2A2826',
              }}
            >
              Kopierad till urklipp
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#5C4A3E',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Klistra in på chatgpt.com / claude.ai / gemini.google.com /
              perplexity.ai.
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#8B7E68',
                marginTop: '1rem',
                marginBottom: 0,
              }}
            >
              {charCount.toLocaleString('sv-SE')} tecken · fönstret stängs
              automatiskt
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p
              style={{
                fontFamily: 'serif',
                fontSize: '1.25rem',
                margin: '0 0 0.5rem 0',
                color: '#6E2F2A',
              }}
            >
              Kunde inte hämta context
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#5C4A3E',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#8B7E68',
                marginTop: '1rem',
                marginBottom: 0,
              }}
            >
              Är du inloggad på Selvra-app i samma browser?
            </p>
          </>
        )}
      </div>
    </main>
  )
}
