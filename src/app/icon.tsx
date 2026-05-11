import { ImageResponse } from 'next/og'

/**
 * App-icon — 512×512. Wordmark "S" på paper-bg, ink-text.
 *
 * Doktrin-låst typografi-stack är inte vald än (mood-board pending),
 * så icon:en använder system-serif som proxy. När mood-boarden landar
 * och vi importerar GT Sectra / Tiempos / Source Serif Pro: byt
 * `fontFamily` här till den valda serifen.
 *
 * Statiskt cachad av Next.js — ändras bara när denna fil ändras.
 */

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAF8F3',
          color: '#2A2826',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontSize: 360,
          fontWeight: 500,
          letterSpacing: '-0.02em',
        }}
      >
        S
      </div>
    ),
    { ...size },
  )
}
