import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AccessSummaryView } from '@/components/connect/access-summary'
import { ConnectionsList } from '@/components/connect/connections-list'
import { auth } from '@/lib/auth/config'
import type { AccessSummary } from '@/lib/connect/actions'
import { getSnapshot, listConnections } from '@/lib/protocol/client'

export const metadata: Metadata = {
  title: 'Dina anslutningar',
  description:
    'AI-system som har läs-access till din representation. Återkalla när du vill.',
}

export const runtime = 'nodejs'

export default async function ConnectionsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?next=/connections')
  }

  let items: Awaited<ReturnType<typeof listConnections>>['items'] = []
  let fetchError: string | null = null
  try {
    const result = await listConnections()
    items = result.items
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  let summary: AccessSummary | null = null
  let summaryError: string | null = null
  try {
    const snapshot = await getSnapshot()
    summary = {
      factCount: snapshot.total_count,
      divergenceCount: null,
      provenanceAvailable: true,
    }
  } catch (err) {
    summaryError = err instanceof Error ? err.message : String(err)
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
            Dina anslutningar
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            AI-system du har gett läs-access till din representation.
          </p>
        </header>

        {fetchError ? (
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-oxblod)' }}
          >
            Kunde inte hämta anslutningar: {fetchError}
          </p>
        ) : (
          <ConnectionsList initialItems={items} />
        )}

        <AccessSummaryView summary={summary} error={summaryError} />

        <footer
          className="border-t pt-6 flex flex-col gap-3"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          <Link
            href="/connect"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Anslut nytt system →
          </Link>
          <p
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-tertiary)' }}
          >
            Återkallning tar effekt omedelbart. Tokens invalideras genom
            consent-check vid nästa MCP-anrop.
          </p>
        </footer>
      </article>
    </main>
  )
}
