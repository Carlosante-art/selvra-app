import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AuditPagination } from '@/components/connect/audit-pagination'
import { auth } from '@/lib/auth/config'
import { getClientById } from '@/lib/connect/clients'
import { getConnectionAudit } from '@/lib/protocol/client'

export const runtime = 'nodejs'

const PAGE_SIZE = 50

type Props = {
  params: Promise<{ client: string }>
  searchParams: Promise<{ offset?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { client: clientParam } = await params
  const client = getClientById(clientParam)
  if (!client) return { title: 'Audit-historik' }
  return {
    title: `Audit-historik — ${client.displayName}`,
    description: `Fullständig logg av MCP-anrop från ${client.displayName}.`,
  }
}

export default async function AuditHistoryPage({ params, searchParams }: Props) {
  const { client: clientParam } = await params
  const { offset: offsetParam } = await searchParams

  const client = getClientById(clientParam)
  if (!client) notFound()

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?next=/connections/${clientParam}/audit`)
  }

  const offset = parseOffset(offsetParam)

  let items: Awaited<ReturnType<typeof getConnectionAudit>>['items'] = []
  let total = 0
  let hasMore = false
  let fetchError: string | null = null

  try {
    const result = await getConnectionAudit(client.sourceAiId, {
      limit: PAGE_SIZE,
      offset,
    })
    items = result.items
    total = result.total_count
    hasMore = result.has_more
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/connections"
            className="font-sans text-sm transition-colors hover:opacity-70 self-start"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            ← Anslutningar
          </Link>
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(28px, 3.5vw + 0.5rem, 40px)',
              lineHeight: 1.15,
              color: 'var(--color-ink)',
            }}
          >
            Audit-historik
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            Fullständig logg av MCP-anrop från {client.displayName}. Metadata
            (vilken resurs, tidpunkt, status) — aldrig konversationens innehåll.
          </p>
        </header>

        {fetchError ? (
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-oxblod)' }}
          >
            Kunde inte hämta audit-historik: {fetchError}
          </p>
        ) : items.length === 0 && offset === 0 ? (
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            {client.displayName} har inte gjort några anrop ännu.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-0 list-none p-0 m-0">
              {items.map((entry, idx) => (
                <li
                  key={`${entry.timestamp}-${idx}`}
                  className="flex flex-col gap-1 py-3"
                  style={{
                    borderBottom: '1px solid var(--color-hairline)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <span
                      className="font-mono text-sm"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {entry.resource_path}
                    </span>
                    <span
                      className="font-sans text-xs"
                      style={{ color: 'var(--color-ink-tertiary)' }}
                    >
                      {new Date(entry.timestamp).toLocaleString('sv-SE')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span
                      className="font-sans text-xs"
                      style={{
                        color:
                          entry.response_status === 'ok'
                            ? 'var(--color-ink-tertiary)'
                            : 'var(--color-oxblod)',
                      }}
                    >
                      {entry.response_status}
                    </span>
                    {entry.duration_ms != null && (
                      <span
                        className="font-sans text-xs"
                        style={{ color: 'var(--color-ink-tertiary)' }}
                      >
                        {entry.duration_ms} ms
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <AuditPagination
              offset={offset}
              pageSize={PAGE_SIZE}
              hasMore={hasMore}
              total={total}
            />
          </>
        )}

        <footer
          className="border-t pt-6 flex flex-col gap-3"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          <Link
            href="/connections"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Tillbaka till anslutningar →
          </Link>
          <p
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-tertiary)' }}
          >
            Audit-loggen är permanent — varje MCP-anrop registreras oavsett om
            klient-anslutningen senare återkallas. Selvra loggar metadata, inte
            konversation.
          </p>
        </footer>
      </article>
    </main>
  )
}

function parseOffset(raw: string | undefined): number {
  if (!raw) return 0
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n) || n < 0) return 0
  return n
}
