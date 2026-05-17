/**
 * Klient-katalog för connect-flow. Hardcoded v1 — strict whitelist matchar
 * selvra-protocol-sidan (src/selvra/mcp/tokens.py _KNOWN_CLIENTS).
 *
 * Lägga till ny klient: lägg entry här + uppdatera _KNOWN_CLIENTS i
 * selvra-protocol. Båda sidor måste vara synca för att UUID5-mapping ska
 * fungera konsekvent.
 *
 * UUID:n nedan är pre-computed via:
 *   uuid.uuid5("e7a4b8d0-1c5f-4e92-8a67-f3d9c2e4b5a1", client_name)
 * Stable över tid — UI använder dessa för reverse-lookup
 * (server → UUID, UI → display-namn).
 */

import type { ConsumerClientName } from '@/lib/protocol/client'

export type ClientMeta = {
  id: ConsumerClientName
  displayName: string
  description: string
  /** UUID5-deriverad från id mot SELVRA_SOURCE_AI_NAMESPACE. Pre-computed. */
  sourceAiId: string
  /** Klient-specifik konfig-format (kopierbar). */
  configFormat: 'claude-desktop-json' | 'cursor-json' | 'chatgpt-text' | 'generic-mcp'
  /** Path-instruktioner per OS för config-fil. null = ej tillämpligt. */
  configPaths: { macos?: string; windows?: string; linux?: string } | null
  /** Officiell dokumentationslänk. */
  docsUrl: string | null
}

export const CLIENTS: ClientMeta[] = [
  {
    id: 'claude-desktop',
    displayName: 'Claude Desktop',
    description:
      'Anthropics desktop-klient (macOS, Windows). Stöder MCP via claude_desktop_config.json.',
    sourceAiId: 'f208ffdb-5445-5d4e-93be-c9bac0030571',
    configFormat: 'claude-desktop-json',
    configPaths: {
      macos:
        '~/Library/Application Support/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    },
    docsUrl: 'https://modelcontextprotocol.io/quickstart/user',
  },
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    description:
      'Anthropics CLI-agent. Stöder MCP via ~/.claude/mcp.json eller .mcp.json i repo.',
    sourceAiId: 'ccd910a9-9a99-5beb-a30a-3bab05342e37',
    configFormat: 'claude-desktop-json',
    configPaths: {
      macos: '~/.claude/mcp.json',
      linux: '~/.claude/mcp.json',
      windows: '%USERPROFILE%\\.claude\\mcp.json',
    },
    docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    description:
      'AI-driven kod-editor. Stöder MCP via ~/.cursor/mcp.json (global) eller .cursor/mcp.json (per workspace).',
    sourceAiId: '87d04481-b344-5ea6-b799-ab49a202b07f',
    configFormat: 'cursor-json',
    configPaths: {
      macos: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json',
      windows: '%USERPROFILE%\\.cursor\\mcp.json',
    },
    docsUrl: 'https://docs.cursor.com/context/mcp',
  },
  {
    id: 'chatgpt-desktop',
    displayName: 'ChatGPT Desktop',
    description:
      'OpenAIs desktop-app. MCP-stöd via Connectors (beta, varierar med tier).',
    sourceAiId: 'd4ad7c9f-b441-55dc-ade3-b641e6151067',
    configFormat: 'chatgpt-text',
    configPaths: null,
    docsUrl: 'https://platform.openai.com/docs/mcp',
  },
  {
    id: 'generic-mcp',
    displayName: 'Annan MCP-klient',
    description:
      'Generisk anslutning för klienter som följer Model Context Protocol-specifikationen.',
    sourceAiId: 'e40b3b8e-4f6b-50b5-b5cf-5fb2d22e0e96',
    configFormat: 'generic-mcp',
    configPaths: null,
    docsUrl: 'https://modelcontextprotocol.io',
  },
]

export function getClientById(id: string): ClientMeta | null {
  return CLIENTS.find((c) => c.id === id) ?? null
}

/**
 * Reverse-lookup: source_ai_id (UUID) → klient-meta. Används av
 * /connections-vyn för att visa display-namn för anslutna källor.
 */
export function getClientBySourceAiId(sourceAiId: string): ClientMeta | null {
  return CLIENTS.find((c) => c.sourceAiId === sourceAiId) ?? null
}

/**
 * Bygg konfig-snippet för en given klient + token + endpoint.
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
