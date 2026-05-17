/**
 * ChatGPT — OpenAIs klient. MCP-stöd via "Appar" (tidigare "Sammanlänkningar",
 * renamed 2025-12-17).
 *
 * Tekniskt ID är fortfarande 'chatgpt-desktop' (låst i protocol UUID5
 * pre-computed mapping). Display-namn är "ChatGPT" eftersom samma
 * grants/token gäller desktop, mobile-app och chatgpt.com webb.
 *
 * 2026-05-17 update: Instruktionerna verifierade live mot ChatGPT
 * Settings (svensk UI) — inte gissade från docs. Sökväg:
 * Inställningar → Appar → Avancerade inställningar → toggla
 * Utvecklarläge → Tillbaka → Lägg till fler → Ny app → OAuth → Skapa.
 *
 * Utvecklarläge måste aktiveras engångsvis per konto (kräver Plus+).
 * "FÖRHÖJD RISK"-varning visas vid första toggle — det är ChatGPT:s
 * default-text för custom MCP, inte specifikt för Selvra.
 */

import type { ConnectClientContent } from './types'

export const chatgptContent: ConnectClientContent = {
  id: 'chatgpt-desktop',
  displayName: 'ChatGPT',
  description:
    'OpenAIs klient. Stöder MCP via Appar (tidigare "Sammanlänkningar") i desktop-appen, mobile-appen och chatgpt.com.',
  sourceAiId: 'd4ad7c9f-b441-55dc-ade3-b641e6151067',
  configFormat: 'chatgpt-text',
  desktop: {
    planRequirement:
      'ChatGPT Plus, Pro, Team, Enterprise eller Edu (inte gratis-planen). Custom MCP kräver Utvecklarläge.',
    oauthDcrSupported: true,
    instructionSteps: [
      'Öppna ChatGPT (web eller desktop). Klicka din profilbild → Inställningar.',
      'Klicka "Appar" i vänstermenyn.',
      'Klicka "Avancerade inställningar" → toggla på "Utvecklarläge" (engångsvis per konto). Acceptera FÖRHÖJD RISK-varningen.',
      'Klicka "Tillbaka" → klicka "Lägg till fler" uppe till höger.',
      'I "Ny app"-dialogen: Namn = Selvra, URL för MCP-server = klistra in URL:en ovan, Autentisering = OAuth.',
      'Kryssa "Jag förstår och vill fortsätta" → klicka "Skapa". ChatGPT öppnar Selvras consent-screen → godkänn.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink: 'https://developers.openai.com/api/docs/mcp',
    notes:
      'Utvecklarläge aktiveras engångsvis per ChatGPT-konto och syns på alla enheter (desktop/web/mobile). Beskrivning är valfritt — kan vara tomt eller "Min Selvra-representation".',
  },
  mobile: {
    supported: true,
    platforms: ['ios', 'android'],
    planRequirement:
      'ChatGPT Plus, Pro, Team, Enterprise eller Edu (inte gratis-planen). Custom MCP kräver Utvecklarläge (aktiveras engångsvis från desktop/web).',
    oauthDcrSupported: true,
    instructionSteps: [
      'Aktivera Utvecklarläge på chatgpt.com först (engångsvis): Inställningar → Appar → Avancerade inställningar → toggla "Utvecklarläge".',
      'Öppna ChatGPT-appen på telefonen.',
      'Settings → Appar → "Lägg till fler".',
      'Ny app: Namn = Selvra, URL för MCP-server = klistra in URL:en ovan, Autentisering = OAuth.',
      'Kryssa "Jag förstår och vill fortsätta" → "Skapa" → godkänn i Selvras consent-screen.',
      'Klart. Återkalla när som helst i /connections här.',
    ],
    docsLink: 'https://developers.openai.com/api/docs/mcp',
    notes:
      'Mobile-appen ärver Utvecklarläge från ditt ChatGPT-konto — om du aktiverat det på webben funkar custom-app-tillägg direkt i mobil-appen utan extra steg.',
  },
}
