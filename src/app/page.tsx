import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Selvra landing — pre-launch minimal (v2).
 *
 * Per .gsd/SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md §5 vecka 1:
 * en sida, klar position, en CTA. Brev-paradigm-copy rivad i förra
 * iteration (PR #24). Denna iteration uppdaterar copy till canonical
 * positioning från build-plan §1.
 *
 * Pitch (canonical): "Spegling och lättnad. På mätdata och ord."
 */

export const metadata: Metadata = {
  title: 'Selvra',
  description:
    'Spegling och lättnad. På mätdata och ord. iOS-app launch H2 2026.',
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
          Spegling och lättnad. På mätdata och ord.
        </p>

        <div className="text-left mx-auto max-w-[52ch] flex flex-col gap-6">
          <p
            className="leading-relaxed"
            style={{ fontSize: '17px', color: 'var(--color-ink-soft)' }}
          >
            Selvra läser kroppen, kalendern, sömnen, dina ord — och säger
            vad den ser. Källa-attribuerat. Patient-ägt. Europeiskt byggt.
          </p>

          <p
            className="leading-relaxed"
            style={{ fontSize: '17px', color: 'var(--color-ink-soft)' }}
          >
            När du behöver vila finns plats för det. När du behöver förstå
            finns underlag. Inget coaching. Ingen manipulation. Bara det
            som är där.
          </p>
        </div>

        <div
          className="flex flex-col gap-3 items-center pt-6 border-t mx-auto"
          style={{ borderColor: 'var(--color-hairline)', maxWidth: '36ch' }}
        >
          <p
            className="text-sm font-sans"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            iOS-app, launch H2 2026.
          </p>
          <a
            href="mailto:hello@selvra.ai?subject=Selvra%20pre-launch%20uppdatering"
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-sans hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Lämna mail för uppdatering
          </a>
          <Link
            href="/demo"
            className="font-sans text-sm transition-colors hover:opacity-70 pt-2"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Se ett exempel →
          </Link>
        </div>
      </article>
    </main>
  )
}
