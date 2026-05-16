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
import { Suspense, useCallback } from 'react'

import { Screen1 } from '@/components/demo/screen-1'
import { Screen2 } from '@/components/demo/screen-2'
import { Screen3 } from '@/components/demo/screen-3'

type Step = 1 | 2 | 3

function parseStep(raw: string | null): Step {
  const n = raw ? parseInt(raw, 10) : 1
  if (n === 1 || n === 2 || n === 3) return n
  return 1
}

function DemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Step är derivat från URL — searchParams är source of truth. Tidigare
  // useState+useEffect-paret triggade react-hooks/set-state-in-effect-warning
  // (cascading renders). Direkt derivation matchar React-rekommendationen
  // och tar bort dual-state-issue där lokal state och URL kan divergera.
  const step = parseStep(searchParams.get('step'))

  const navigate = useCallback(
    (next: Step) => {
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
        <div key={step}>
          {step === 1 && <Screen1 onAdvance={() => navigate(2)} />}
          {step === 2 && <Screen2 onAdvance={() => navigate(3)} />}
          {step === 3 && <Screen3 />}
        </div>
      </div>
    </main>
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
