/**
 * Klient-content-typer för /connect/[client]-vyn.
 *
 * Per klient finns separat desktop- + mobile-sektion. Toggle på sidan
 * styr vilken som renderas. Token-flöde är identiskt mellan plattformar
 * — bara setup-instruktioner och plan-krav skiljer.
 *
 * `supported: false` på mobile gör att toggle visar disabled-state med
 * tooltip ("Inte tillgängligt för denna klient ännu"). Cursor är enda
 * klient utan mobile-app i maj 2026.
 */

import type { ConsumerClientName } from '@/lib/protocol/client'

export type PlatformKey = 'desktop' | 'mobile'

export type DesktopContent = {
  /** Plan-krav om sådant finns. Null = ingen specifik plan krävs (Claude Code, Cursor, generic). */
  planRequirement: string | null
  /** Filplats för config-fil per OS. null = klient har inte fil-baserad config. */
  configPaths?: { macos?: string; windows?: string; linux?: string } | null
  /** Numrerade steg som visas under config-snippet. */
  instructionSteps: string[]
  /** Officiell dokumentations-länk för klient-MCP-setup. */
  docsLink: string
  /** Extra varning eller note (sjötönerat, faktabaserat). */
  notes?: string
  /** Om klient-MCP-stödet är beta — visa upfront. Null = stable. */
  betaStatus?: string | null
}

export type MobileContent = {
  /** false = mobile inte stöds av klienten. UI visar disabled-toggle. */
  supported: boolean
  /** Vilka mobile-plattformar (ios/android/web). Tom = N/A om supported=false. */
  platforms: Array<'ios' | 'android' | 'web'>
  /** Plan-krav — typiskt högre tier för mobile-MCP. */
  planRequirement: string | null
  /** Steg-för-steg setup för mobile-app eller mobile-webbläsare. */
  instructionSteps: string[]
  /** Mobile-specifik dokumentations-länk. */
  docsLink: string
  notes?: string
  betaStatus?: string | null
}

export type ConnectClientContent = {
  /** Tekniskt ID — låst i protocol UUID5-mapping. */
  id: ConsumerClientName
  /** Plattform-agnostiskt display-namn. T.ex. "Claude" (inte "Claude Desktop"). */
  displayName: string
  /** Kort beskrivning av klienten — visas på klient-val-sidan. */
  description: string
  /** UUID5-deriverad från id mot SELVRA_SOURCE_AI_NAMESPACE. */
  sourceAiId: string
  /** Config-format för buildConfigSnippet — bestämmer JSON/YAML/text-format. */
  configFormat:
    | 'claude-desktop-json'
    | 'cursor-json'
    | 'chatgpt-text'
    | 'goose-yaml'
    | 'generic-mcp'
  desktop: DesktopContent
  mobile: MobileContent
}
