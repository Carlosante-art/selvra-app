/**
 * Klient-katalog för connect-flow. Innehåll bor i src/content/connect/* —
 * denna fil är aggregator + helpers.
 *
 * v2 (mobile-stöd, 2026-05-16): varje klient har desktop- + mobile-sektion
 * (se ConnectClientContent). Vissa klienter har mobile.supported=false
 * (Cursor, Claude Code) — UI visar disabled-toggle med tooltip.
 *
 * Strict whitelist matchar selvra-protocol-sidan (src/selvra/mcp/tokens.py
 * _KNOWN_CLIENTS). Lägga till ny klient: ny content-fil + entry här +
 * uppdatera _KNOWN_CLIENTS i selvra-protocol. UUID5 pre-computed via:
 *   uuid.uuid5("e7a4b8d0-1c5f-4e92-8a67-f3d9c2e4b5a1", client_id)
 *
 * Bakåtkompatibilitet: `ClientMeta` (gamla typen) bevaras via export så
 * befintliga konsumenter (ConnectionsList, etc.) inte bryts. Den deriveras
 * ur ConnectClientContent — desktop-sektion är default.
 */

import { chatgptContent } from '@/content/connect/chatgpt-desktop'
import { claudeCodeContent } from '@/content/connect/claude-code'
import { claudeContent } from '@/content/connect/claude-desktop'
import { cursorContent } from '@/content/connect/cursor'
import { genericContent } from '@/content/connect/generic-mcp'
import { gooseContent } from '@/content/connect/goose'
import type {
  ConnectClientContent,
  PlatformKey,
} from '@/content/connect/types'

export type { ConnectClientContent, PlatformKey }

export const CLIENT_CONTENTS: ConnectClientContent[] = [
  claudeContent,
  claudeCodeContent,
  cursorContent,
  chatgptContent,
  gooseContent,
  genericContent,
]

/**
 * Bakåtkompatibel ClientMeta-typ för befintliga konsumenter (ConnectionsList,
 * AccessSummary, etc.) som bara bryr sig om display-namn + config-format.
 * Härleds ur ConnectClientContent — desktop-config:en är default.
 */
export type ClientMeta = {
  id: ConnectClientContent['id']
  displayName: string
  description: string
  sourceAiId: string
  configFormat: ConnectClientContent['configFormat']
  configPaths: { macos?: string; windows?: string; linux?: string } | null
  docsUrl: string | null
}

function toClientMeta(content: ConnectClientContent): ClientMeta {
  return {
    id: content.id,
    displayName: content.displayName,
    description: content.description,
    sourceAiId: content.sourceAiId,
    configFormat: content.configFormat,
    configPaths: content.desktop.configPaths ?? null,
    docsUrl: content.desktop.docsLink ?? null,
  }
}

export const CLIENTS: ClientMeta[] = CLIENT_CONTENTS.map(toClientMeta)

export function getClientById(id: string): ClientMeta | null {
  return CLIENTS.find((c) => c.id === id) ?? null
}

/** v2: hämta full content (med desktop + mobile) för id. */
export function getClientContentById(id: string): ConnectClientContent | null {
  return CLIENT_CONTENTS.find((c) => c.id === id) ?? null
}

/**
 * Reverse-lookup: source_ai_id (UUID) → klient-meta. Används av
 * /connections-vyn för att visa display-namn för anslutna källor.
 */
export function getClientBySourceAiId(sourceAiId: string): ClientMeta | null {
  return CLIENTS.find((c) => c.sourceAiId === sourceAiId) ?? null
}

/**
 * Plattform-stöd-badge för klient-val-sidan. Returnerar mänsklig text
 * baserat på desktop + mobile.supported.
 */
export function platformBadge(content: ConnectClientContent): string {
  return content.mobile.supported ? 'Desktop + Mobile' : 'Desktop endast'
}

/**
 * Bygg konfig-snippet för en given klient + token + endpoint.
 * Endast använt för desktop-flöden i v2 — mobile-flöden använder
 * instructionSteps istället för kopierbar config-snippet.
 *
 * Returnerar formatted JSON eller text-instruktion beroende på klient.
 */
export function buildConfigSnippet(input: {
  client: ClientMeta
  token: string
  endpoint: string
}): string {
  const { client, token, endpoint } = input

  switch (client.configFormat) {
    case 'claude-desktop-json':
      return JSON.stringify(
        {
          mcpServers: {
            selvra: {
              transport: {
                type: 'streamable-http',
                url: endpoint,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          },
        },
        null,
        2,
      )

    case 'cursor-json':
      return JSON.stringify(
        {
          mcpServers: {
            selvra: {
              url: endpoint,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          },
        },
        null,
        2,
      )

    case 'chatgpt-text':
      return [
        'I ChatGPT Desktop:',
        '1. Öppna Settings → Connectors → Add Custom MCP Server',
        `2. Endpoint: ${endpoint}`,
        `3. Authorization header: Bearer ${token}`,
        '4. Spara. Anslutningen blir aktiv vid nästa konversation.',
      ].join('\n')

    case 'goose-yaml':
      // YAML-snippet att klistra i ~/.config/goose/config.yaml under
      // extensions:. Alternativ: kör `goose configure` interaktivt.
      return [
        'extensions:',
        '  selvra:',
        '    type: streamable_http',
        `    url: ${endpoint}`,
        '    headers:',
        `      Authorization: "Bearer ${token}"`,
      ].join('\n')

    case 'generic-mcp':
      return [
        `Endpoint: ${endpoint}`,
        `Transport: Streamable HTTP (MCP-specifikation)`,
        `Authorization: Bearer ${token}`,
        '',
        'Använd standard MCP-handshake (initialize → resources/tools/prompts list).',
      ].join('\n')
  }
}
