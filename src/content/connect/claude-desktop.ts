/**
 * Claude — Anthropics klient. Stöder MCP på alla plattformar 2026.
 *
 * Tekniskt ID är fortfarande 'claude-desktop' (låst i protocol UUID5
 * pre-computed mapping). Display-namn är "Claude" eftersom samma
 * grants/token gäller desktop, mobile-app och claude.ai webb.
 *
 * 2026-05-17 update: Claude Desktop (latest), claude.ai webb och
 * mobile-app stödjer ALLA remote MCP via Custom Connectors + OAuth 2.1
 * + Dynamic Client Registration (MCP-spec 2025-03+). Användaren behöver
 * bara klistra in vår MCP-URL — Claude registrerar sig själv mot vår
 * /oauth/register, redirectar till vår /oauth/authorize-consent-screen
 * och får tokens automatiskt. Ingen token-kopiering, ingen config-fil.
 */

import type { ConnectClientContent } from './types'

export const claudeContent: ConnectClientContent = {
  id: 'claude-desktop',
  displayName: 'Claude',
  description:
    'Anthropics klient. Stöder MCP via Claude Desktop, Claude mobile-app (iOS/Android) och claude.ai i webbläsare.',
  sourceAiId: 'f208ffdb-5445-5d4e-93be-c9bac0030571',
  configFormat: 'claude-desktop-json',
  desktop: {
    planRequirement: null,
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna Claude Desktop på din dator.',
      'Klicka Settings → Connectors → "+" → "Add custom connector".',
      'Klistra in URL:en ovan. Lämna namn, client ID och secret tomma.',
      'Klicka Add. En browser-flik öppnas där du godkänner anslutningen.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink:
      'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android', 'web'],
    planRequirement: 'Claude Pro, Max, Team eller Enterprise (inte gratis-planen).',
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna Claude-appen på telefonen (eller claude.ai i webbläsare).',
      'Settings → Connectors → "+" → "Add custom connector".',
      'Klistra in URL:en ovan. Lämna namn, client ID och secret tomma.',
      'Klicka Add. Du redirectas till Selvra för att godkänna.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink:
      'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
  },
}
