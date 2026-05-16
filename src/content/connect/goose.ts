/**
 * Goose — Block:s open-source AI-agent. CLI/desktop, ingen mobile-version.
 *
 * Goose hör hemma i open-infrastructure-rummet — användare där tänker
 * redan i protokoll- och federations-termer, vilket gör dem till en
 * naturlig matchning för Selvras position. Inte volym, utan positionering.
 *
 * MCP-konfiguration sker via `~/.config/goose/config.yaml` under
 * extensions-sektionen, eller via `goose configure`-interaktiv CLI.
 * Båda vägar dokumenterade nedan.
 */

import type { ConnectClientContent } from './types'

export const gooseContent: ConnectClientContent = {
  id: 'goose',
  displayName: 'Goose',
  description:
    'Block:s open-source AI-agent (CLI/desktop). Stöder MCP via extensions-systemet i ~/.config/goose/config.yaml.',
  sourceAiId: '9c1e7204-4d5f-52c8-b7af-17cd4d996a21',
  configFormat: 'goose-yaml',
  desktop: {
    planRequirement: null,
    configPaths: {
      macos: '~/.config/goose/config.yaml',
      linux: '~/.config/goose/config.yaml',
      windows: '%APPDATA%\\Block\\goose\\config\\config.yaml',
    },
    instructionSteps: [
      'Öppna en terminal och kör `goose configure`.',
      'Välj "Add Extension" → "Remote Extension (Streamable HTTP)".',
      'Name: Selvra',
      'URL: https://mcp.selvra.ai/mcp',
      'Authorization header: Bearer <token från denna sida>',
      'Spara. Goose laddar om extensions automatiskt.',
      'Eller: redigera config.yaml direkt med snippet ovan och starta om Goose.',
      'Klicka "Testa anslutning" nedan.',
    ],
    docsLink: 'https://block.github.io/goose/docs/getting-started/using-extensions',
  },
  mobile: {
    supported: false,
    platforms: [],
    planRequirement: null,
    instructionSteps: [],
    docsLink: 'https://block.github.io/goose',
    notes: 'Goose är CLI/desktop-baserad och har ingen mobile-version.',
  },
}
