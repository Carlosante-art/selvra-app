import { ImageResponse } from 'next/og'

/**
 * Apple Touch Icon — 180×180. Visas när användaren "Lägg till på
 * hemskärmen" på iPhone. Samma typografi-proxy som icon.tsx; byt när
 * mood-boardens serif är vald.
 *
 * Apple maskar inte cornern (vi behöver inte radius); iOS klipper
 * själv till squircle.
 */

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          fontSize: 128,
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
