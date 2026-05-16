/**
 * PlanRequirementNote + BetaStatusNote — informations-rutor som visas
 * FÖRE token-generering på /connect/[client].
 *
 * Konstitutionellt: vi gömmer inte plan-krav eller beta-status för att
 * få användaren längre in i flödet. Användare som möter begränsningar
 * sent tappar förtroende mer än användare som ser dem upfront.
 *
 * Båda är rena info-blocks — inte error, inte blocker, inte CTA.
 * Användaren kan fortsätta generera token även om de saknar plan;
 * vi informerar bara om att anslutningen då kommer misslyckas.
 */

export function PlanRequirementNote({ requirement }: { requirement: string }) {
  return (
    <aside
      className="flex flex-col gap-2 p-4"
      style={{
        backgroundColor: 'var(--color-hover-bg)',
        borderLeft: '2px solid var(--color-ink-soft)',
        borderRadius: '4px',
      }}
    >
      <p
        className="font-sans text-xs uppercase tracking-wider"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Plan-krav
      </p>
      <p
        className="font-sans text-sm leading-relaxed"
        style={{ color: 'var(--color-ink)' }}
      >
        Custom MCP-connectors kräver {requirement}
      </p>
      <p
        className="font-sans text-xs"
        style={{ color: 'var(--color-ink-tertiary)' }}
      >
        Med en lägre plan kommer anslutningen att misslyckas — token
        genereras ändå om du vill testa.
      </p>
    </aside>
  )
}

export function BetaStatusNote({ status }: { status: string }) {
  return (
    <aside
      className="flex flex-col gap-2 p-4"
      style={{
        backgroundColor: 'var(--color-hover-bg)',
        borderLeft: '2px solid var(--color-oxblod)',
        borderRadius: '4px',
      }}
    >
      <p
        className="font-sans text-xs uppercase tracking-wider"
        style={{ color: 'var(--color-oxblod)' }}
      >
        Beta-status
      </p>
      <p
        className="font-sans text-sm leading-relaxed"
        style={{ color: 'var(--color-ink)' }}
      >
        {status}
      </p>
    </aside>
  )
}
