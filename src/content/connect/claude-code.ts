/**
 * Claude Code — Anthropics CLI-agent. Endast desktop (ingen mobile-version).
 */

import type { ConnectClientContent } from './types'

export const claudeCodeContent: ConnectClientContent = {
  id: 'claude-code',
  displayName: 'Claude Code',
  description:
    'Anthropics CLI-agent för terminal. Stöder MCP via ~/.claude/mcp.json eller .mcp.json per repo.',
  sourceAiId: 'ccd910a9-9a99-5beb-a30a-3bab05342e37',
  configFormat: 'claude-desktop-json',
  desktop: {
    planRequirement: null,
    configPaths: {
      macos: '~/.claude/mcp.json',
      linux: '~/.claude/mcp.json',
      windows: '%USERPROFILE%\\.claude\\mcp.json',
    },
    instructionSteps: [
      'Öppna config-filen (skapa den om den inte finns).',
      'Klistra in JSON-snippet ovan.',
      'Starta om Claude Code-sessionen.',
      'Klicka "Testa anslutning" nedan.',
    ],
    docsLink: 'https://docs.claude.com/en/docs/claude-code/mcp',
  },
  mobile: {
    supported: false,
    platforms: [],
    planRequirement: null,
    instructionSteps: [],
    docsLink: 'https://docs.claude.com/en/docs/claude-code/mcp',
    notes: 'Claude Code är CLI-verktyg och har ingen mobile-version.',
  },
}
