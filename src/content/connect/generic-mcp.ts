/**
 * Generisk MCP-klient — för klienter utan dedikerad katalog-entry.
 */

import type { ConnectClientContent } from './types'

export const genericContent: ConnectClientContent = {
  id: 'generic-mcp',
  displayName: 'Annan MCP-klient',
  description:
    'För klienter som följer Model Context Protocol-specifikationen men inte finns i katalogen ovan.',
  sourceAiId: 'e40b3b8e-4f6b-50b5-b5cf-5fb2d22e0e96',
  configFormat: 'generic-mcp',
  desktop: {
    planRequirement: null,
    configPaths: null,
    instructionSteps: [
      'Konfigurera klienten med endpoint + Bearer-token enligt klientens egen dokumentation.',
      'Vissa klienter kräver omstart efter config-ändring.',
      'Klicka "Testa anslutning" nedan när klienten är igång.',
    ],
    docsLink: 'https://modelcontextprotocol.io',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android', 'web'],
    planRequirement: null,
    instructionSteps: [
      'Samma URL och token som desktop — endpoint är https://mcp.selvra.ai/mcp och Bearer-auth.',
      'Klient-specifika setup-steg varierar; se klientens egen MCP-dokumentation.',
    ],
    docsLink: 'https://modelcontextprotocol.io',
    notes:
      'Selvra känner inte till de specifika setup-stegen för okända klienter — du får hänvisas till deras egen dokumentation.',
  },
}
