'use client'

import { useActionState, useRef } from 'react'

import { addPreferenceAction, type ActionState } from '@/lib/preferences/actions'

const CATEGORY_OPTIONS = [
  { value: 'none', label: '— ingen kategori —' },
  { value: 'language', label: 'Språk' },
  { value: 'tone', label: 'Ton' },
  { value: 'medical_context', label: 'Medicinsk kontext' },
  { value: 'communication_style', label: 'Kommunikationsstil' },
  { value: 'source_attribution', label: 'Käll-attribuering' },
  { value: 'other', label: 'Övrigt' },
] as const

const initialState: ActionState = { status: 'idle' }

export function PreferencesForm() {
  const [state, formAction, pending] = useActionState(
    addPreferenceAction,
    initialState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Rensa form vid lyckad insert
  if (state.status === 'success' && formRef.current) {
    formRef.current.reset()
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3"
    >
      <label
        htmlFor="raw_utterance"
        className="font-sans text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Din preferens
      </label>
      <textarea
        id="raw_utterance"
        name="raw_utterance"
        required
        maxLength={500}
        placeholder="Skriv som om du sa det själv. Exempel: &ldquo;Tala svenska om inte annat anges&rdquo;."
        className="resize-y rounded-md border px-3 py-2 font-serif text-base leading-relaxed focus:outline-none focus:ring-2"
        style={{
          borderColor: 'var(--color-hairline)',
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          minHeight: '4.5rem',
        }}
      />

      <label
        htmlFor="category"
        className="font-sans text-xs uppercase tracking-wide mt-2"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Kategori (frivillig)
      </label>
      <select
        id="category"
        name="category"
        defaultValue="none"
        className="rounded-md border px-3 py-2 font-sans text-sm"
        style={{
          borderColor: 'var(--color-hairline)',
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
        }}
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-4 py-2 font-sans text-sm transition-opacity disabled:opacity-50"
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
          }}
        >
          {pending ? 'Sparar…' : 'Spara preferens'}
        </button>

        {state.status === 'success' && state.message && (
          <span
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            {state.message}
          </span>
        )}
        {state.status === 'error' && state.message && (
          <span
            className="font-sans text-xs"
            style={{ color: '#b94d3a' }}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}
