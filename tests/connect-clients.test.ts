// Tests för src/lib/connect/clients.ts — klient-katalog + config-snippet-byggare.
//
// UUID5-konsistens kritisk: matchar samma derivation som selvra-protocol-
// sidan (SELVRA_SOURCE_AI_NAMESPACE). Hardcoded values testas mot pre-
// computed values från Python uuid.uuid5(...).

import { describe, expect, it } from 'vitest'

import {
  buildConfigSnippet,
  CLIENTS,
  getClientById,
  getClientBySourceAiId,
  type ClientMeta,
} from '@/lib/connect/clients'

describe('CLIENTS catalog', () => {
  it('innehåller alla 5 v1-klienter', () => {
    const ids = CLIENTS.map((c) => c.id)
    expect(ids).toEqual([
      'claude-desktop',
      'claude-code',
      'cursor',
      'chatgpt-desktop',
      'generic-mcp',
    ])
  })

  it('alla sourceAiId är unika UUIDs', () => {
    const uuids = CLIENTS.map((c) => c.sourceAiId)
    const unique = new Set(uuids)
    expect(unique.size).toBe(uuids.length)
    // Alla matchar UUID-format
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    for (const u of uuids) {
      expect(u).toMatch(uuidRe)
    }
  })

  it('UUID5-värden matchar Python-deriverade konstanter', () => {
    // Lås:er namespace + klient-namn-mapping. Om någon ändrar dessa
    // bryter alla existerande grants i selvra-protocol-DB.
    const expected: Record<string, string> = {
      'claude-desktop': 'f208ffdb-5445-5d4e-93be-c9bac0030571',
      'claude-code': 'ccd910a9-9a99-5beb-a30a-3bab05342e37',
      cursor: '87d04481-b344-5ea6-b799-ab49a202b07f',
      'chatgpt-desktop': 'd4ad7c9f-b441-55dc-ade3-b641e6151067',
      'generic-mcp': 'e40b3b8e-4f6b-50b5-b5cf-5fb2d22e0e96',
    }
    for (const client of CLIENTS) {
      expect(client.sourceAiId).toBe(expected[client.id])
    }
  })
})

describe('getClientById', () => {
  it('returnerar klient för känd id', () => {
    expect(getClientById('claude-desktop')?.displayName).toBe('Claude Desktop')
  })

  it('returnerar null för okänd id', () => {
    expect(getClientById('random-malicious-client')).toBeNull()
  })
})

describe('getClientBySourceAiId', () => {
  it('reverse-lookup fungerar för känt UUID', () => {
    const result = getClientBySourceAiId('f208ffdb-5445-5d4e-93be-c9bac0030571')
    expect(result?.id).toBe('claude-desktop')
  })

  it('returnerar null för okänt UUID', () => {
    expect(getClientBySourceAiId('00000000-0000-0000-0000-000000000000')).toBeNull()
  })
})

describe('buildConfigSnippet', () => {
  const tokenStub = 'eyJ.test.token'
  const endpointStub = 'https://mcp.selvra.ai/mcp'

  it('claude-desktop-json: giltig JSON med mcpServers + token', () => {
    const client = getClientById('claude-desktop') as ClientMeta
    const snippet = buildConfigSnippet({ client, token: tokenStub, endpoint: endpointStub })
    const parsed = JSON.parse(snippet)
    expect(parsed.mcpServers.selvra.transport.url).toBe(endpointStub)
    expect(parsed.mcpServers.selvra.transport.headers.Authorization).toBe(
      `Bearer ${tokenStub}`,
    )
  })

  it('cursor-json: giltig JSON med headers', () => {
    const client = getClientById('cursor') as ClientMeta
    const snippet = buildConfigSnippet({ client, token: tokenStub, endpoint: endpointStub })
    const parsed = JSON.parse(snippet)
    expect(parsed.mcpServers.selvra.url).toBe(endpointStub)
    expect(parsed.mcpServers.selvra.headers.Authorization).toBe(`Bearer ${tokenStub}`)
  })

  it('chatgpt-text: text-format med endpoint + token', () => {
    const client = getClientById('chatgpt-desktop') as ClientMeta
    const snippet = buildConfigSnippet({ client, token: tokenStub, endpoint: endpointStub })
    expect(snippet).toContain(endpointStub)
    expect(snippet).toContain(`Bearer ${tokenStub}`)
    expect(snippet).toContain('Settings')
  })

  it('generic-mcp: text-format med MCP-handshake-hint', () => {
    const client = getClientById('generic-mcp') as ClientMeta
    const snippet = buildConfigSnippet({ client, token: tokenStub, endpoint: endpointStub })
    expect(snippet).toContain(endpointStub)
    expect(snippet).toContain(`Bearer ${tokenStub}`)
    expect(snippet).toContain('MCP-handshake')
  })
})

describe('konstitutionella checks', () => {
  it('inga personality-claims i client.description', () => {
    const forbiddenWords = [
      /\bdin assistent\b/i,
      /\bförstår dig\b/i,
      /\bkommer ihåg dig\b/i,
      /\bjuste för dig\b/i,
    ]
    for (const client of CLIENTS) {
      for (const re of forbiddenWords) {
        expect(client.description).not.toMatch(re)
      }
    }
  })

  it('inga "powered by" i descriptions', () => {
    for (const client of CLIENTS) {
      expect(client.description.toLowerCase()).not.toMatch(/powered by/)
    }
  })
})
