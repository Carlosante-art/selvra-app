'use client'

/**
 * Skärm 2 — Representationen. Hjärtat av demon.
 *
 * Spec v2 (2026-05-16): "Varje rad kan raderas..."-stroffen ligger direkt
 * under underrubriken, inte i footer. Ny "Tillgång"-sektion efter de fyra
 * data-sektionerna manifesterar MCP-portabilitet konkret ("Inga AI-system
 * har just nu läsåtkomst"). Modal-texter uppdaterade med "signerad",
 * "stöder Selvra-protokollet", "Inga kopior".
 *
 * Repetitions-disciplin: "representation", "käll-attribuerad", "du äger
 * den" sägs varje koncept EN gång på sin starkaste plats. Bra läsare
 * fattar.
 *
 * Konstitutionell: ingen klinisk vokabulär. Bara "överväldigad", "tung",
 * "sliten" — vanliga ord.
 */

import { useState } from 'react'

import { CtaButton } from './cta-button'
import { Modal } from './modal'
import { SourceBadge } from './source-badge'

export type Screen2Props = {
  onAdvance: () => void
}

type DataRow = {
  text: string
  source: string
}

const KROPP: DataRow[] = [
  { text: 'Sömn senaste 7 dagar: 5h 40min/natt i snitt', source: 'Garmin' },
  { text: 'Baseline senaste 90 dagar: 7h 15min/natt', source: 'Garmin' },
  { text: 'HRV idag: 28% under baseline', source: 'HealthKit' },
]

const TID: DataRow[] = [
  { text: 'Möten efter kl 17 senaste veckan: 8', source: 'Kalender' },
  { text: 'Tidigaste möte i morgon: 08:00', source: 'Kalender' },
]

const ORD: DataRow[] = [
  {
    text: "Senast skrivna ord: 'överväldigad', tisdag 22:14",
    source: 'Anteckningar',
  },
  {
    text: "Återkommande ord senaste månaden: 'tung', 'sliten', 'okej'",
    source: 'Anteckningar',
  },
]

export function Screen2({ onAdvance }: Screen2Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <section
      className="flex flex-col gap-12 pt-8 pb-16"
      aria-labelledby="screen-2-heading"
    >
      <header className="flex flex-col gap-3">
        <h1
          id="screen-2-heading"
          className="font-serif font-normal tracking-tight"
          style={{
            fontSize: 'clamp(32px, 4vw + 0.5rem, 48px)',
            lineHeight: 1.1,
            color: 'var(--color-ink)',
          }}
        >
          Din representation. Just nu.
        </h1>
        <p
          className="font-sans"
          style={{ fontSize: '13px', color: 'var(--color-ink-tertiary)' }}
        >
          Demo med syntetisk data — exempel-användare i mars.
        </p>
        <p
          className="leading-relaxed pt-2"
          style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
        >
          Varje rad kan raderas. Hela kan exporteras. Selvra äger inget av
          detta.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <DataSection title="Kropp" rows={KROPP} />
        <DataSection title="Tid" rows={TID} />
        <DataSection title="Ord" rows={ORD} />
        <PatternSection />
      </div>

      <AccessSection />

      <div className="flex flex-wrap gap-3 pt-2">
        <CtaButton variant="secondary" onClick={() => setExportOpen(true)}>
          Exportera (SREF v1)
        </CtaButton>
        <CtaButton variant="secondary" onClick={() => setDeleteOpen(true)}>
          Radera allt
        </CtaButton>
      </div>

      <div className="pt-2">
        <CtaButton onClick={onAdvance}>Hur den byggs</CtaButton>
      </div>

      <Modal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        titleId="export-modal-title"
        title="Exportera (SREF v1)"
      >
        <p>
          I appen laddas en signerad JSON-fil i SREF v1-format. Andra system
          som stöder Selvra-protokollet kan läsa den. Stänger demo.
        </p>
        <div className="pt-4">
          <CtaButton variant="secondary" onClick={() => setExportOpen(false)}>
            Stäng
          </CtaButton>
        </div>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        titleId="delete-modal-title"
        title="Radera allt"
      >
        <p>
          I appen raderas hela representationen omedelbart. Inga kopior.
          Stänger demo.
        </p>
        <div className="pt-4">
          <CtaButton variant="secondary" onClick={() => setDeleteOpen(false)}>
            Stäng
          </CtaButton>
        </div>
      </Modal>
    </section>
  )
}

function DataSection({ title, rows }: { title: string; rows: DataRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="font-serif font-normal"
        style={{
          fontSize: '18px',
          letterSpacing: '0.02em',
          color: 'var(--color-ink)',
        }}
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {rows.map((row, i) => (
          <li
            key={i}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-relaxed"
            style={{ fontSize: '16px', color: 'var(--color-ink)' }}
          >
            <span className="tabular-nums">{row.text}</span>
            <SourceBadge source={row.source} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function PatternSection() {
  return (
    <div
      className="flex flex-col gap-3 pl-6 py-2"
      style={{
        borderLeft: '2px solid var(--color-oxblod)',
      }}
    >
      <h2
        className="font-serif font-normal"
        style={{
          fontSize: '18px',
          letterSpacing: '0.02em',
          color: 'var(--color-ink)',
        }}
      >
        Mönster
      </h2>
      <p
        className="leading-relaxed"
        style={{ fontSize: '16px', color: 'var(--color-ink)' }}
      >
        Senaste tre månaderna har följande kombination återkommit 9 gånger:
        sömn under 6h + möten efter 17 + ord som &lsquo;överväldigad&rsquo;
        eller &lsquo;tung&rsquo; inom 48h.
      </p>
      <p
        className="font-sans italic"
        style={{ fontSize: '14px', color: 'var(--color-ink-soft)' }}
      >
        Selvra drar inga slutsatser. Du gör det.
      </p>
      <div className="pt-1">
        <SourceBadge source="Mönster, beräknat över 90 dagar" />
      </div>
    </div>
  )
}

function AccessSection() {
  return (
    <div
      className="flex flex-col gap-3 border-t pt-8"
      style={{ borderColor: 'var(--color-hairline)' }}
    >
      <h2
        className="font-serif font-normal"
        style={{
          fontSize: '18px',
          letterSpacing: '0.02em',
          color: 'var(--color-ink)',
        }}
      >
        Tillgång
      </h2>
      <p
        className="leading-relaxed"
        style={{ fontSize: '16px', color: 'var(--color-ink)' }}
      >
        Inga AI-system har just nu läsåtkomst till denna representation.
      </p>
      <p
        className="leading-relaxed"
        style={{ fontSize: '14px', color: 'var(--color-ink-soft)' }}
      >
        I appen kan du ge tillgång per AI-system och per datatyp. Tillgång
        kan återkallas när som helst.
      </p>
    </div>
  )
}
