/**
 * ChatGPT — OpenAIs klient. MCP-stöd via Custom Connectors. Beta i maj 2026,
 * mest moget på desktop, mer brokigt på mobile-appen.
 *
 * Tekniskt ID är fortfarande 'chatgpt-desktop' (låst i protocol UUID5
 * pre-computed mapping). Display-namn är "ChatGPT" eftersom samma
 * grants/token gäller desktop, mobile-app och chatgpt.com webb.
 */

import type { ConnectClientContent } from './types'

export const chatgptContent: ConnectClientContent = {
  id: 'chatgpt-desktop',
  displayName: 'ChatGPT',
  description:
    'OpenAIs klient. Stöder MCP via Custom Connectors i desktop-appen, mobile-appen och chatgpt.com.',
  sourceAiId: 'd4ad7c9f-b441-55dc-ade3-b641e6151067',
  configFormat: 'chatgpt-text',
  desktop: {
    planRequirement: 'ChatGPT Plus, Pro, Team eller Enterprise (inte gratis-planen).',
    configPaths: null,
    instructionSteps: [
      'Öppna ChatGPT Desktop → Settings → Connectors / Custom MCP servers.',
      'Add Custom Connector.',
      `URL: https://mcp.selvra.ai/mcp`,
      'Authorization: Bearer-token (klistra in token från denna sida).',
      'Spara. Connector aktiveras vid nästa konversation.',
    ],
    docsLink: 'https://platform.openai.com/docs/mcp',
    betaStatus:
      'ChatGPT-stöd för MCP är beta i maj 2026. Read-anrop fungerar pålitligt. Avancerade tool-anrop kan misslyckas.',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android'],
    planRequirement: 'ChatGPT Plus, Pro, Team eller Enterprise (inte gratis-planen).',
    instructionSteps: [
      'Öppna ChatGPT-appen på telefonen.',
      'Settings → Connectors → Add custom connector.',
      'URL: https://mcp.selvra.ai/mcp',
      'Authorization: Bearer-token (klistra in token från denna sida).',
      'Spara och starta nytt samtal.',
    ],
    docsLink: 'https://platform.openai.com/docs/mcp',
    betaStatus:
      'MCP-stödet i ChatGPT mobile är beta i maj 2026. Read-anrop (query_representation, snapshot) fungerar pålitligt. Avancerade tool-anrop kan misslyckas — du kan rapportera problem via audit-loggen i /connections.',
    notes:
      'Token måste kopieras från denna sida till telefonen. Enklast: öppna selvra-app i telefonens webbläsare och kopiera token där.',
  },
}
