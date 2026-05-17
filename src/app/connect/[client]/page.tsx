import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ConnectFlow } from '@/components/connect/connect-flow'
import { OAuthConnectorInstructions } from '@/components/connect/oauth-connector-instructions'
import {
  BetaStatusNote,
  PlanRequirementNote,
} from '@/components/connect/plan-and-beta-notes'
import { resolvePlatform } from '@/components/connect/platform'
import { PlatformToggle } from '@/components/connect/platform-toggle'
import { auth } from '@/lib/auth/config'
import {
  getClientById,
  getClientContentById,
} from '@/lib/connect/clients'

export const runtime = 'nodejs'

type Props = {
  params: Promise<{ client: string }>
  searchParams: Promise<{ platform?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { client: clientParam } = await params
  const client = getClientById(clientParam)
  if (!client) return { title: 'Klient' }
  return {
    title: `Anslut ${client.displayName}`,
    description: `Generera token + konfiguration för ${client.displayName}.`,
  }
}

export default async function ClientConnectPage({
  params,
  searchParams,
}: Props) {
  const { client: clientParam } = await params
  const { platform: platformParam } = await searchParams

  const client = getClientById(clientParam)
  const content = getClientContentById(clientParam)
  if (!client || !content) notFound()

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?next=/connect/${clientParam}`)
  }

  const mcpEndpoint =
    process.env.NEXT_PUBLIC_MCP_ENDPOINT ?? 'https://mcp.selvra.ai/mcp'

  const platform = resolvePlatform(platformParam, content.mobile.supported)
  const activeSection =
    platform === 'mobile' ? content.mobile : content.desktop

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-8">
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

        <PlatformToggle
          active={platform}
          mobileSupported={content.mobile.supported}
          mobileUnsupportedReason={
            content.mobile.notes ?? 'Inte tillgängligt för denna klient ännu.'
          }
        />

        {activeSection.planRequirement && (
          <PlanRequirementNote requirement={activeSection.planRequirement} />
        )}

        {activeSection.betaStatus && (
          <BetaStatusNote status={activeSection.betaStatus} />
        )}

        {activeSection.oauthDcrSupported ? (
          <OAuthConnectorInstructions
            mcpEndpoint={mcpEndpoint}
            instructionSteps={activeSection.instructionSteps}
          />
        ) : (
          <ConnectFlow
            client={client}
            mcpEndpoint={mcpEndpoint}
            platform={platform}
            mobileInstructionSteps={
              platform === 'mobile' ? content.mobile.instructionSteps : undefined
            }
            mobileDocsLink={
              platform === 'mobile' ? content.mobile.docsLink : undefined
            }
          />
        )}

        {platform === 'desktop' && activeSection.notes && (
          <aside
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-tertiary)' }}
          >
            {activeSection.notes}
          </aside>
        )}

        {platform === 'mobile' && content.mobile.notes && (
          <aside
            className="font-sans text-xs"
            style={{ color: 'var(--color-ink-tertiary)' }}
          >
            {content.mobile.notes}
          </aside>
        )}

        <footer
          className="border-t pt-6"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          <a
            href={activeSection.docsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            {client.displayName} MCP-dokumentation →
          </a>
        </footer>
      </article>
    </main>
  )
}
