/**
 * Claude Code — Anthropics CLI-agent. Endast desktop (ingen mobile-version).
 *
 * 2026-05-18 update: Claude Code stödjer OAuth-DCR via en CLI-kommando.
 * `claude mcp add --transport http <name> <url>` triggar automatiskt
 * DCR-registration + browser-popup för consent. Ingen manuell config-
 * fil-redigering behövs.
 */

import type { ConnectClientContent } from './types'

export const claudeCodeContent: ConnectClientContent = {
  id: 'claude-code',
  displayName: 'Claude Code',
  description:
    'Anthropics CLI-agent för terminal. Stöder MCP via OAuth 2.1 + DCR direkt via CLI.',
  sourceAiId: 'ccd910a9-9a99-5beb-a30a-3bab05342e37',
  configFormat: 'claude-desktop-json',
  desktop: {
    planRequirement: null,
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna en terminal (utanför nuvarande Claude Code-session så den inte stör en pågående konversation).',
      'Kör: claude mcp add --transport http selvra https://mcp.selvra.ai/mcp',
      'Claude Code öppnar en browser-flik för OAuth-godkännande. Klicka Godkänn i Selvras consent-screen.',
      'Klart. Starta en ny Claude Code-session — Selvra-verktygen är nu tillgängliga via /mcp-slash-kommandot.',
    ],
    docsLink: 'https://code.claude.com/docs/en/mcp',
    notes:
      'Verifiera anslutning i Claude Code-sessionen med /mcp — visar alla anslutna servrar + status. Lägger persistent config i ~/.claude/mcp.json (eller .mcp.json om per-project flagga används).',
  },
  mobile: {
    supported: false,
    platforms: [],
    planRequirement: null,
    instructionSteps: [],
    docsLink: 'https://code.claude.com/docs/en/mcp',
    notes: 'Claude Code är CLI-verktyg och har ingen mobile-version.',
  },
}
