/**
 * Cursor — AI-driven kod-editor. Endast desktop i maj 2026 (ingen mobile-app).
 */

import type { ConnectClientContent } from './types'

export const cursorContent: ConnectClientContent = {
  id: 'cursor',
  displayName: 'Cursor',
  description:
    'AI-driven kod-editor (desktop). Stöder MCP via ~/.cursor/mcp.json globalt eller .cursor/mcp.json per workspace.',
  sourceAiId: '87d04481-b344-5ea6-b799-ab49a202b07f',
  configFormat: 'cursor-json',
  desktop: {
    planRequirement: null,
    configPaths: {
      macos: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json',
      windows: '%USERPROFILE%\\.cursor\\mcp.json',
    },
    instructionSteps: [
      'Öppna config-filen (skapa den om den inte finns).',
      'Klistra in JSON-snippet ovan.',
      'Starta om Cursor.',
      'Klicka "Testa anslutning" nedan.',
    ],
    docsLink: 'https://docs.cursor.com/context/mcp',
  },
  mobile: {
    supported: false,
    platforms: [],
    planRequirement: null,
    instructionSteps: [],
    docsLink: 'https://docs.cursor.com/context/mcp',
    notes: 'Cursor har ingen mobile-version i maj 2026.',
  },
}
