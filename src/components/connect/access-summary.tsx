/**
 * AccessSummary — "Vad får de se"-sektion på /connections.
 *
 * Visar exakt vilket data-yta anslutna system kan läsa, så användaren
 * förstår scope:t innan hen ger access (eller efter, för transparens).
 *
 * v1: fact-count från snapshot.total_count. Divergens-count kräver
 * protocol-endpoint som inte finns än — markeras som "tillgängliga" utan
 * exakt antal. Provenance per event är statisk fakta om protokollet.
 *
 * Konstitutionellt:
 * - Beskriver mekanik och relationer ("de läser snapshot"), inte upplevelser
 * - Inga upplevelse-adjektiv (se forbidden-list i tests/connect-ux.test.ts)
 * - Käll-attribuerat — "Selvra exponerar" eller "Anslutna system läser"
 */

import type { AccessSummary } from '@/lib/connect/actions'

export function AccessSummaryView({
  summary,
  error,
}: {
  summary: AccessSummary | null
  error: string | null
}) {
  return (
    <section
      className="flex flex-col gap-4 p-5"
      style={{
        border: '1px solid var(--color-hairline)',
        borderRadius: '4px',
      }}
    >
      <h2
        className="font-sans text-xs uppercase tracking-wider"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Vad anslutna system får läsa
      </h2>
      {error ? (
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-oxblod)' }}
        >
          Kunde inte hämta sammanfattning: {error}
        </p>
      ) : (
        <dl className="flex flex-col gap-2">
          <Row
            label="Profil-snapshot"
            value={
              summary
                ? `${summary.factCount} ${summary.factCount === 1 ? 'fakta' : 'fakta'}`
                : '—'
            }
          />
          <Row
            label="Divergenser"
            value={
              summary?.divergenceCount != null
                ? summary.divergenceCount === 1
                  ? '1 aktiv'
                  : `${summary.divergenceCount} aktiva`
                : 'tillgängliga'
            }
          />
          <Row
            label="Provenance"
            value={
              summary?.provenanceAvailable
                ? 'tillgängligt per event'
                : 'ej tillgängligt'
            }
          />
        </dl>
      )}
      <p
        className="font-sans text-xs"
        style={{ color: 'var(--color-ink-tertiary)' }}
      >
        Selvra loggar varje anrop. Audit-loggen visar metadata (vilken
        resurs, tidpunkt) — aldrig konversationens innehåll.
      </p>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 items-baseline">
      <dt
        className="font-sans text-sm"
        style={{ color: 'var(--color-ink-soft)', minWidth: '10em' }}
      >
        {label}
      </dt>
      <dd
        className="font-sans text-sm"
        style={{ color: 'var(--color-ink)' }}
      >
        {value}
      </dd>
    </div>
  )
}
