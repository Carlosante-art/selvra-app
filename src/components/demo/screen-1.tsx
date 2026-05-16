'use client'

/**
 * Skärm 1 — Tesen. "Du, sett."
 *
 * Spec: Rubrik + underrubrik + tre korta brödtext-stycken med generös
 * vit yta. CTA primär + expanderbar "För vem den är"-sektion.
 *
 * Layout matchar landing-sidans typografi (Source Serif 4, clamp-storlekar,
 * vänster-justerad efter rubrik-block).
 */

import { useState } from 'react'

import { CtaButton } from './cta-button'

export type Screen1Props = {
  onAdvance: () => void
}

export function Screen1({ onAdvance }: Screen1Props) {
  const [whoForOpen, setWhoForOpen] = useState(false)

  return (
    <section className="flex flex-col gap-12 pt-8 pb-16" aria-labelledby="screen-1-heading">
      <header className="flex flex-col gap-6">
        <h1
          id="screen-1-heading"
          className="font-serif font-normal tracking-tight"
          style={{
            fontSize: 'clamp(40px, 5vw + 0.5rem, 64px)',
            lineHeight: 1.05,
            color: 'var(--color-ink)',
          }}
        >
          Du, sett.
        </h1>
        <p
          className="font-serif font-normal"
          style={{
            fontSize: 'clamp(18px, 1.5vw + 0.5rem, 22px)',
            lineHeight: 1.4,
            color: 'var(--color-ink-soft)',
          }}
        >
          Av en motor som aldrig vet mer än du har gett den.
        </p>
      </header>

      <div className="flex flex-col gap-8 max-w-[58ch]">
        <p
          className="leading-relaxed"
          style={{ fontSize: '17px', color: 'var(--color-ink)' }}
        >
          Selvra samlar dina källor — sömn, puls, kalender, dina egna ord —
          och bygger en strukturerad representation av dig. Käll-attribuerad
          ner till varje rad.
        </p>

        <p
          className="leading-relaxed"
          style={{ fontSize: '17px', color: 'var(--color-ink)' }}
        >
          Du ser den. Du äger den. Du kan flytta den.
        </p>

        <p
          className="leading-relaxed"
          style={{ fontSize: '17px', color: 'var(--color-ink)' }}
        >
          I appen ser du mönster du är för nära för att se själv. Utanför
          appen kan din representation följa dig in i andra AI-system —
          Claude, ChatGPT, Cursor — via öppet protokoll, när du ger dem
          tillgång. Du slipper förklara dig från början varje gång.
        </p>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <CtaButton onClick={onAdvance}>Visa mig vad det betyder</CtaButton>

        <div>
          <button
            type="button"
            onClick={() => setWhoForOpen((v) => !v)}
            aria-expanded={whoForOpen}
            aria-controls="who-for-content"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Vem den är för {whoForOpen ? '–' : '+'}
          </button>
          {whoForOpen && (
            <p
              id="who-for-content"
              className="mt-4 leading-relaxed max-w-[52ch]"
              style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
            >
              Selvra är för människor i Norden och Europa som föredrar
              förståelse framför instruktion. Inte mainstream. Inte för alla.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
