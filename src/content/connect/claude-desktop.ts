/**
 * Claude — Anthropics klient. Stöder MCP på alla plattformar 2026.
 *
 * Tekniskt ID är fortfarande 'claude-desktop' (låst i protocol UUID5
 * pre-computed mapping). Display-namn är "Claude" eftersom samma
 * grants/token gäller desktop, mobile-app och claude.ai webb.
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
    configPaths: {
      macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    },
    instructionSteps: [
      'Öppna config-filen (skapa den om den inte finns).',
      'Klistra in JSON-snippet ovan.',
      'Starta om Claude Desktop.',
      'Klicka "Testa anslutning" nedan.',
    ],
    docsLink: 'https://modelcontextprotocol.io/quickstart/user',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android', 'web'],
    planRequirement: 'Claude Pro, Max, Team eller Enterprise (inte gratis-planen).',
    instructionSteps: [
      'Öppna Claude-appen på telefonen (eller claude.ai i webbläsare).',
      'Settings → Connectors → Add custom connector.',
      'Name: Selvra',
      'URL: https://mcp.selvra.ai/mcp',
      'Authentication: Bearer token (klistra in token från denna sida).',
      'Spara och starta nytt samtal.',
      'Tillbaka hit och klicka "Testa anslutning".',
    ],
    docsLink: 'https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
    notes:
      'Token måste kopieras från denna sida till telefonen. Enklast: öppna selvra-app i telefonens webbläsare och kopiera token där.',
  },
}
