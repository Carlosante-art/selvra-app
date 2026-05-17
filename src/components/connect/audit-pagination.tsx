'use client'

/**
 * AuditPagination — Föregående/Nästa-knappar för /connections/[client]/audit.
 *
 * URL-state via search-param ?offset=N. Default offset=0. Server-componenten
 * läser searchParams och renderar fönstret; denna komponent bara navigerar.
 *
 * Konstitutionellt: paginering är mekanik, inte upplevelse. Knappar säger
 * "Föregående" / "Nästa", inte "Mer av det här" eller "Utforska vidare".
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function AuditPagination({
  offset,
  pageSize,
  hasMore,
  total,
}: {
  offset: number
  pageSize: number
  hasMore: boolean
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function navigateTo(nextOffset: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (nextOffset === 0) {
      params.delete('offset')
    } else {
      params.set('offset', String(nextOffset))
    }
    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname
    startTransition(() => {
      router.push(url, { scroll: true })
    })
  }

  const canGoPrev = offset > 0
  const prevOffset = Math.max(0, offset - pageSize)
  const nextOffset = offset + pageSize
  const windowEnd = Math.min(offset + pageSize, total)
  const windowStart = total === 0 ? 0 : offset + 1

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pt-4">
      <p
        className="font-sans text-xs"
        style={{ color: 'var(--color-ink-tertiary)' }}
      >
        Visar {windowStart}–{windowEnd} av {total} anrop
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigateTo(prevOffset)}
          disabled={!canGoPrev || pending}
          className="font-sans text-sm transition-colors hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          ← Föregående
        </button>
        <button
          type="button"
          onClick={() => navigateTo(nextOffset)}
          disabled={!hasMore || pending}
          className="font-sans text-sm transition-colors hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Nästa →
        </button>
      </div>
    </div>
  )
}
