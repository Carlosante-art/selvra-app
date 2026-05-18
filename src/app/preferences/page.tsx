import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PreferencesForm } from '@/components/preferences/preferences-form'
import { PreferencesList } from '@/components/preferences/preferences-list'
import { auth } from '@/lib/auth/config'
import {
  listCommunicationPreferences,
  type CommunicationPreference,
} from '@/lib/protocol/client'

export const metadata: Metadata = {
  title: 'Hur jag vill att AI ska tala med mig',
  description:
    'Dina egna preferenser för hur AI-system ska kommunicera med dig. ' +
    'Skrivs ordagrant, läses av Claude, ChatGPT och andra anslutna system.',
}

export const runtime = 'nodejs'

export default async function PreferencesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?next=/preferences')
  }

  let preferences: CommunicationPreference[] = []
  let fetchError: string | null = null
  let constitutionalNote: string | null = null

  try {
    const result = await listCommunicationPreferences()
    preferences = result.preferences
    constitutionalNote = result.constitutional_note
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(32px, 4vw + 0.5rem, 48px)',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
            }}
          >
            Hur jag vill att AI ska tala med mig
          </h1>
          <p
            className="font-serif leading-relaxed"
            style={{ fontSize: '17px', color: 'var(--color-ink-soft)' }}
          >
            Skriv preferenser med dina egna ord — som om du sa dem till
            AI:n själv. De följer dig mellan Claude, ChatGPT och andra
            anslutna system.
          </p>
        </header>

        <section className="flex flex-col gap-6">
          <h2
            className="font-sans text-xs uppercase tracking-wide"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Mina preferenser
          </h2>
          {fetchError ? (
            <p
              className="font-serif italic leading-relaxed"
              style={{ color: '#b94d3a' }}
            >
              Kunde inte hämta preferenser: {fetchError}
            </p>
          ) : (
            <PreferencesList initial={preferences} />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2
            className="font-sans text-xs uppercase tracking-wide"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Lägg till en preferens
          </h2>
          <PreferencesForm />
        </section>

        <section className="flex flex-col gap-3">
          <h2
            className="font-sans text-xs uppercase tracking-wide"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Exempel
          </h2>
          <ul
            className="font-serif italic flex flex-col gap-2 leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            <li>&ldquo;Tala svenska om inte annat anges.&rdquo;</li>
            <li>
              &ldquo;Coacha mig inte, ge mig data och frågor.&rdquo;
            </li>
            <li>&ldquo;Var rak, inte överdrivet positiv.&rdquo;</li>
            <li>
              &ldquo;När du nämner mina värden, säg alltid källan.&rdquo;
            </li>
          </ul>
          <p
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-tertiary)' }}
          >
            Exemplen är statiska — Selvra föreslår inte preferenser åt dig.
            Du skriver fritt eller skriver inget.
          </p>
        </section>

        <footer
          className="border-t pt-6 flex flex-col gap-3"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          {constitutionalNote && (
            <p
              className="font-sans text-xs leading-relaxed"
              style={{ color: 'var(--color-ink-tertiary)' }}
            >
              {constitutionalNote}
            </p>
          )}
          <Link
            href="/connections"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            ← Dina anslutningar
          </Link>
        </footer>
      </article>
    </main>
  )
}
