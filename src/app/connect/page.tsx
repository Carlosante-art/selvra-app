import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth/config'
import { CLIENTS } from '@/lib/connect/clients'

export const metadata: Metadata = {
  title: 'Anslut till AI',
  description:
    'Ge en MCP-klient läs-access till din representation. Read-only. 30 dagar. Återkallas när du vill.',
}

export const runtime = 'nodejs'

export default async function ConnectPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?next=/connect')
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-4">
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(32px, 4vw + 0.5rem, 48px)',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
            }}
          >
            Anslut till AI
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: '17px', color: 'var(--color-ink-soft)' }}
          >
            Välj klient. Du får en konfiguration att klistra in och en token
            som ger läs-access i 30 dagar.
          </p>
        </header>

        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {CLIENTS.map((client) => (
            <li key={client.id}>
              <Link
                href={`/connect/${client.id}`}
                className="flex flex-col gap-1 p-5 transition-colors hover:opacity-80"
                style={{
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                <span
                  className="font-serif"
                  style={{
                    fontSize: '18px',
                    color: 'var(--color-ink)',
                  }}
                >
                  {client.displayName}
                </span>
                <span
                  className="font-sans"
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-ink-soft)',
                  }}
                >
                  {client.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <footer
          className="border-t pt-8 flex flex-col gap-4"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            Selvra använder Model Context Protocol (MCP), en öppen standard.
            Klienter som stöder MCP kan läsa din representation när du ger
            dem tillgång.
          </p>
          <Link
            href="/connections"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Se dina anslutningar →
          </Link>
        </footer>
      </article>
    </main>
  )
}
