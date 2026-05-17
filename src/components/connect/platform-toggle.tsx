'use client'

/**
 * PlatformToggle — Desktop/Mobile-väljare på /connect/[client].
 *
 * URL-state via search-param (?platform=mobile). Default desktop när
 * param saknas eller är invalid. Toggle uppdaterar URL utan full reload
 * via router.replace.
 *
 * Mobile disabled (Cursor, Claude Code): knappen visas men är inaktiv
 * med tooltip-förklaring. Konstitutionellt — vi gömmer inte att mobile
 * saknas; vi säger det rakt.
 *
 * Tillgänglighet:
 * - Båda knappar är riktiga <button>:s, tabbable
 * - aria-pressed reflekterar vald plattform
 * - Disabled-knappen har aria-disabled + title-tooltip
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

import type { PlatformKey } from '@/content/connect/types'

export function PlatformToggle({
  active,
  mobileSupported,
  mobileUnsupportedReason,
}: {
  active: PlatformKey
  mobileSupported: boolean
  mobileUnsupportedReason?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const setPlatform = useCallback(
    (platform: PlatformKey) => {
      if (platform === active) return
      if (platform === 'mobile' && !mobileSupported) return

      const params = new URLSearchParams(searchParams?.toString() ?? '')
      if (platform === 'desktop') {
        params.delete('platform')
      } else {
        params.set('platform', platform)
      }
      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname
      startTransition(() => {
        router.replace(url, { scroll: false })
      })
    },
    [active, mobileSupported, pathname, router, searchParams],
  )

  return (
    <div
      role="group"
      aria-label="Välj plattform"
      className="inline-flex gap-0 self-start"
      style={{
        border: '1px solid var(--color-hairline)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setPlatform('desktop')}
        aria-pressed={active === 'desktop'}
        disabled={pending && active !== 'desktop'}
        className="font-sans text-sm px-4 py-2 transition-colors"
        style={{
          backgroundColor:
            active === 'desktop'
              ? 'var(--color-hover-bg)'
              : 'transparent',
          color:
            active === 'desktop'
              ? 'var(--color-ink)'
              : 'var(--color-ink-soft)',
          fontWeight: active === 'desktop' ? 500 : 400,
        }}
      >
        Desktop
      </button>
      <button
        type="button"
        onClick={() => setPlatform('mobile')}
        aria-pressed={active === 'mobile'}
        aria-disabled={!mobileSupported}
        disabled={!mobileSupported || (pending && active !== 'mobile')}
        title={
          !mobileSupported
            ? mobileUnsupportedReason ??
              'Inte tillgängligt för denna klient ännu.'
            : undefined
        }
        className="font-sans text-sm px-4 py-2 transition-colors"
        style={{
          backgroundColor:
            active === 'mobile'
              ? 'var(--color-hover-bg)'
              : 'transparent',
          color:
            active === 'mobile'
              ? 'var(--color-ink)'
              : !mobileSupported
                ? 'var(--color-ink-tertiary)'
                : 'var(--color-ink-soft)',
          fontWeight: active === 'mobile' ? 500 : 400,
          cursor: !mobileSupported ? 'not-allowed' : 'pointer',
          borderLeft: '1px solid var(--color-hairline)',
        }}
      >
        Mobile
      </button>
    </div>
  )
}

// resolvePlatform flyttad till './platform' (server-safe utility).
// Importera därifrån direkt — re-export från denna 'use client'-fil
// skulle propagera client-boundary till callers.
