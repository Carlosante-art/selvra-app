'use client'

/**
 * /demo — tre-skärmars onboarding-demo (reflektions-instrument, ej launch).
 *
 * Per .gsd/DEMO_ONBOARDING_2026-05-16.md. Carl skickar denna till 3-5
 * personer och lyssnar på första-reaktion. URL-state via ?step=1|2|3 så
 * back/forward i webbläsaren fungerar.
 *
 * Tre lager manifesterade:
 *   1. Tesen — "Du, sett."
 *   2. Representationen (med mönstret i) — "Din representation. Just nu."
 *   3. Hur den byggs — "Selvra läser data du redan har."
 *
 * Subtil fade-in mellan skärmar via key-prop på wrapper-div. Reduced-motion
 * respekteras via globals.css media-query.
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

import { Screen1 } from '@/components/demo/screen-1'
import { Screen2 } from '@/components/demo/screen-2'
import { Screen3 } from '@/components/demo/screen-3'

const VALID_STEPS = [1, 2, 3] as const
type Step = (typeof VALID_STEPS)[number]

function parseStep(raw: string | null): Step {
  const n = raw ? parseInt(raw, 10) : 1
  if (n === 1 || n === 2 || n === 3) return n
  return 1
}

function DemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(() =>
    parseStep(searchParams.get('step')),
  )

  // Sync state vid back/forward
  useEffect(() => {
    setStep(parseStep(searchParams.get('step')))
  }, [searchParams])

  const navigate = useCallback(
    (next: Step) => {
      setStep(next)
      router.push(`/demo?step=${next}`, { scroll: true })
      // Scroll till top när skärm byts (anchor link kan annars stannar mitt i)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [router],
  )

  return (
    <main className="landing-page flex flex-1 flex-col items-stretch px-6 py-8 sm:px-8 sm:py-12">
      <div className="w-full max-w-[58ch] mx-auto">
        <ProgressIndicator current={step} />
        <div key={step}>
          {step === 1 && <Screen1 onAdvance={() => navigate(2)} />}
          {step === 2 && <Screen2 onAdvance={() => navigate(3)} />}
          {step === 3 && <Screen3 />}
        </div>
      </div>
    </main>
  )
}

function ProgressIndicator({ current }: { current: Step }) {
  return (
    <nav
      aria-label="Demo-progress"
      className="flex items-center gap-2 pt-4 pb-2"
    >
      {VALID_STEPS.map((s) => (
        <span
          key={s}
          aria-current={current === s ? 'step' : undefined}
          className="block h-px transition-all"
          style={{
            width: s === current ? '32px' : '16px',
            backgroundColor:
              s === current ? 'var(--color-ink)' : 'var(--color-hairline)',
          }}
        />
      ))}
      <span className="sr-only">
        Steg {current} av {VALID_STEPS.length}
      </span>
    </nav>
  )
}

// Suspense-wrapper krävs av Next.js för useSearchParams i App Router.
export default function DemoPage() {
  return (
    <Suspense fallback={<DemoFallback />}>
      <DemoContent />
    </Suspense>
  )
}

function DemoFallback() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <p style={{ color: 'var(--color-ink-soft)' }} className="font-sans text-sm">
        Laddar…
      </p>
    </main>
  )
}
