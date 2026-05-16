import type { Metadata } from 'next'

/**
 * Selvra landing — pre-launch minimal.
 *
 * Per .gsd/SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md Steg 3:
 * En sida, en mening, en CTA. Brev-paradigm-copy rivad.
 * Allt webb-UI parkerat — selvra-konsument byggs som iOS-app, launch H2 2026.
 *
 * SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md är obsolete för denna sida.
 * Backend bevaras (60% iOS-portbar) men har ingen webb-yta utöver
 * landing + login (scaffold) + privacy.
 */

export const metadata: Metadata = {
  title: 'Selvra',
  description:
    'AI som vet vad du har levt, inte bara vad du har sagt. iOS-app launch H2 2026.',
}

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <article className="max-w-prose w-full flex flex-col gap-10 text-center">
        <h1
          className="font-serif font-normal tracking-tight"
          style={{
            fontSize: 'clamp(56px, 6vw + 1rem, 88px)',
            lineHeight: 1.05,
            color: 'var(--color-ink)',
          }}
        >
          Selvra
        </h1>

        <p
          className="font-serif font-normal tracking-tight"
          style={{
            fontSize: 'clamp(22px, 2vw + 0.5rem, 28px)',
            lineHeight: 1.4,
            color: 'var(--color-ink)',
          }}
        >
          AI som vet vad du har levt, inte bara vad du har sagt.
        </p>

        <p
          className="leading-relaxed text-left mx-auto max-w-[52ch]"
          style={{
            fontSize: '17px',
            color: 'var(--color-ink-soft)',
          }}
        >
          Bygger en iOS-app för dig som vill förstå dig själv genom det du
          redan har — kalender, sömn, träning, dina ord. Källa-attribuerat.
          Patient-ägt. Europeisk infrastruktur. EU AI Act-compliant.
        </p>

        <div
          className="flex flex-col gap-3 items-center pt-6 border-t mx-auto"
          style={{ borderColor: 'var(--color-hairline)', maxWidth: '32ch' }}
        >
          <p
            className="text-sm font-sans"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Launch H2 2026.
          </p>
          <a
            href="mailto:hello@selvra.ai?subject=Selvra%20pre-launch%20uppdatering"
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-sans hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Få uppdatering
          </a>
        </div>
      </article>
    </main>
  )
}
