/**
 * ChatGPT — OpenAIs klient. MCP-stöd via Custom Connectors (renamed
 * "apps" 2025-12-17, men docs + UI använder båda termerna).
 *
 * Tekniskt ID är fortfarande 'chatgpt-desktop' (låst i protocol UUID5
 * pre-computed mapping). Display-namn är "ChatGPT" eftersom samma
 * grants/token gäller desktop, mobile-app och chatgpt.com webb.
 *
 * 2026-05-17 update: ChatGPT stödjer OAuth-DCR via Developer Mode-
 * aktiverade Custom Connectors. Användaren behöver bara aktivera
 * Developer Mode (engångsklick), klistra in MCP-URL, och ChatGPT
 * sköter OAuth-handshake automatiskt mot vår /oauth/-stack.
 * INGEN token-kopiering, INGEN JSON-config.
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
    planRequirement:
      'ChatGPT Plus, Pro, Team, Enterprise eller Edu (inte gratis-planen). Free-tier stöder inte Custom Connectors.',
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna ChatGPT (web eller desktop). Klicka din profilbild → Settings.',
      'Connectors → klicka "Advanced" längst ner → toggla på "Developer mode".',
      'Tillbaka till Connectors → klicka "Add custom connector".',
      'Klistra in URL:en ovan. Authentication: välj OAuth (inte token).',
      'Klicka Add. ChatGPT redirectar dig till Selvra för att godkänna.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink: 'https://developers.openai.com/api/docs/mcp',
    notes:
      'Developer Mode aktiveras engångsvis per ChatGPT-konto. Efter det syns "Add custom connector"-knappen permanent under Connectors.',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android'],
    planRequirement:
      'ChatGPT Plus, Pro, Team, Enterprise eller Edu (inte gratis-planen).',
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna ChatGPT-appen på telefonen.',
      'Settings → Connectors → "Advanced" → toggla på "Developer mode" (engångsvis).',
      'Tillbaka till Connectors → "Add custom connector".',
      'Klistra in URL:en ovan. Authentication: OAuth.',
      'Klicka Add. Du redirectas till Selvra för att godkänna.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink: 'https://developers.openai.com/api/docs/mcp',
    notes:
      'Developer Mode aktiveras engångsvis per ChatGPT-konto och syns på alla enheter (desktop/web/mobile).',
  },
}
