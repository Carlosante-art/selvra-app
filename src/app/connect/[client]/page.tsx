import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ConnectFlow } from '@/components/connect/connect-flow'
import { auth } from '@/lib/auth/config'
import { getClientById } from '@/lib/connect/clients'

export const runtime = 'nodejs'

type Props = { params: Promise<{ client: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { client: clientParam } = await params
  const client = getClientById(clientParam)
  if (!client) return { title: 'Klient' }
  return {
    title: `Anslut ${client.displayName}`,
    description: `Generera token + konfiguration för ${client.displayName}.`,
  }
}

export default async function ClientConnectPage({ params }: Props) {
  const { client: clientParam } = await params
  const client = getClientById(clientParam)
  if (!client) notFound()

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?next=/connect/${clientParam}`)
  }

  const mcpEndpoint =
    process.env.NEXT_PUBLIC_MCP_ENDPOINT ?? 'https://mcp.selvra.ai/mcp'

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <Link
            href="/connect"
            className="font-sans text-sm transition-colors hover:opacity-70 self-start"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            ← Alla klienter
          </Link>
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(32px, 4vw + 0.5rem, 48px)',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
            }}
          >
            {client.displayName}
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: '15px', color: 'var(--color-ink-soft)' }}
          >
            {client.description}
          </p>
        </header>

        <ConnectFlow client={client} mcpEndpoint={mcpEndpoint} />

        {client.docsUrl && (
          <footer
            className="border-t pt-6"
            style={{ borderColor: 'var(--color-hairline)' }}
          >
            <a
              href={client.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm transition-colors hover:opacity-70"
              style={{ color: 'var(--color-ink-soft)' }}
            >
              {client.displayName} MCP-dokumentation →
            </a>
          </footer>
        )}
      </article>
    </main>
  )
}
