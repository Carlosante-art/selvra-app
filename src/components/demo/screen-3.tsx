'use client'

/**
 * Skärm 3 — Hur den byggs.
 *
 * Spec: Tre numrerade punkter med lucide-ikoner. Avslutande rad. CTA
 * primär (mailto) + sekundär länk tillbaka till start.
 *
 * Mailto matchar landing-sidans exakt: hello@selvra.ai med samma subject.
 */

import { ArrowRightFromLine, Layers, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  {
    icon: LinkIcon,
    text: 'Du kopplar in det du redan använder — Apple Health, kalender, dina anteckningar. Selvra läser. Inget att logga.',
  },
  {
    icon: Layers,
    text: 'Selvra strukturerar datan i en representation du kan se. Käll-attribuerad ner till varje rad. Mönster över källor och tid räknas automatiskt.',
  },
  {
    icon: ArrowRightFromLine,
    text: 'Selvra har ingen egen chat. Du pratar i Claude, ChatGPT eller Cursor — verktygen du redan använder. När du ger dem tillgång till din representation går de från kalla till varma: ingen mer "förklara dig från början", varje samtal startar där du är.',
  },
]

export function Screen3() {
  return (
    <section className="flex flex-col gap-12 pt-8 pb-16" aria-labelledby="screen-3-heading">
      <header>
        <h1
          id="screen-3-heading"
          className="font-serif font-normal tracking-tight"
          style={{
            fontSize: 'clamp(32px, 4vw + 0.5rem, 48px)',
            lineHeight: 1.1,
            color: 'var(--color-ink)',
          }}
        >
          Selvra läser data du redan har.
        </h1>
      </header>

      <ol className="flex flex-col gap-8 list-none p-0 m-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={i} className="flex flex-row gap-5 items-start">
              <div
                className="shrink-0 mt-1"
                style={{ color: 'var(--color-ink-soft)' }}
              >
                <Icon size={20} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className="font-sans"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-ink-tertiary)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p
                  className="leading-relaxed max-w-[55ch]"
                  style={{ fontSize: '17px', color: 'var(--color-ink)' }}
                >
                  {step.text}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <figure
        className="border-l-2 pl-5 py-1 max-w-[55ch] ml-5 my-0 flex flex-col gap-2"
        style={{ borderColor: 'var(--color-hairline)' }}
      >
        <figcaption
          className="font-sans"
          style={{
            fontSize: '12px',
            color: 'var(--color-ink-tertiary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Exempel — Selvra läste från ChatGPT 2026-05-17
        </figcaption>
        <blockquote
          className="font-serif italic leading-relaxed m-0"
          style={{ fontSize: '17px', color: 'var(--color-ink)' }}
        >
          Carl förbereder ett samtal med chefen på fredag. Han vill be om
          att gå ner till 80%. Han har två argument han kan använda — och
          har inte bestämt sig för vilket han faktiskt tror på själv.
        </blockquote>
      </figure>

      <p
        className="leading-relaxed max-w-[55ch]"
        style={{ fontSize: '17px', color: 'var(--color-ink)' }}
      >
        Spotify, Garmin, Strava, Apple Health, kalendern, samtalen med
        Claude eller ChatGPT — Selvra läser dem du har. Ju fler, desto
        klarare mönster.
      </p>

      <figure
        className="border-l-2 pl-5 py-1 max-w-[55ch] ml-5 my-0 flex flex-col gap-3"
        style={{ borderColor: 'var(--color-hairline)' }}
      >
        <figcaption
          className="font-sans"
          style={{
            fontSize: '12px',
            color: 'var(--color-ink-tertiary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Exempel — sex källor, en vecka
        </figcaption>
        <blockquote
          className="font-serif italic leading-relaxed m-0"
          style={{ fontSize: '17px', color: 'var(--color-ink)' }}
        >
          Den här veckan har du spelat samma artist tre kvällar i rad på
          Spotify. Garmin visar högre vilo-puls. Stravas senaste löppass
          var långsammare än ditt snitt. Kalendern blev tätare. Du sa
          &ldquo;jag vet inte vad jag behöver&rdquo; till Claude i tisdags.
          Apple Health visar att djup-sömnen halverats den här veckan.
        </blockquote>
        <p
          className="font-serif italic leading-relaxed m-0"
          style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
        >
          Var för sig: sex notiser. Tillsammans: ett mönster du kanske inte
          sett själv. Selvra visar det. Inget mer.
        </p>
      </figure>

      <p
        className="font-serif italic leading-relaxed max-w-[55ch]"
        style={{ fontSize: '17px', color: 'var(--color-ink-soft)' }}
      >
        Det din kropp redan vet. Strukturerat så du kan se det. Portabelt så
        det följer dig.
      </p>

      <div
        className="flex flex-col sm:flex-row sm:items-center gap-5 pt-4 border-t"
        style={{ borderColor: 'var(--color-hairline)' }}
      >
        <a
          href="mailto:hello@selvra.ai?subject=Selvra%20pre-launch%20uppdatering"
          className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-6 text-sm font-sans hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors self-start"
        >
          Lämna mail för uppdatering
        </a>
        <Link
          href="/"
          className="font-sans text-sm transition-colors hover:opacity-70 self-start"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Tillbaka till start →
        </Link>
      </div>
    </section>
  )
}
