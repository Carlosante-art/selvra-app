'use client'

/**
 * Modal med focus-trap och Escape-stängning. Accessibility-krav per spec:
 * "Modaler (export, radera) trap focus och stängbara med Escape".
 *
 * Pattern: native dialog är problematiskt med Tailwind v4 + reliable focus-
 * trap. Vi implementerar custom div med:
 *   - aria-modal + role=dialog
 *   - aria-labelledby pekar på titel-id
 *   - Escape stänger
 *   - Focus trapas via querySelectorAll('focusable') + Tab-cycling
 *   - useEffect restore:ar förra-focus-elementet vid close
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  titleId: string
  title: string
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function Modal({ isOpen, onClose, titleId, title, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Focus first focusable inside modal
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
      FOCUSABLE_SELECTOR,
    )
    firstFocusable?.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR,
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(26, 24, 20, 0.4)' }}
      onClick={(e) => {
        // Click på backdrop stänger (men inte inom panelen)
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full sm:max-w-md mx-auto sm:rounded-lg p-6 sm:p-8 flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--color-paper)',
          borderTop: '1px solid var(--color-hairline)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-serif"
            style={{
              fontSize: '20px',
              lineHeight: 1.3,
              color: 'var(--color-ink)',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng dialog"
            className="rounded-sm p-1 transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div
          className="font-serif leading-relaxed"
          style={{
            fontSize: '15px',
            color: 'var(--color-ink-soft)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
