// Tests för mobile-stöd i connect-flow:
// - Content-shape (desktop + mobile per klient)
// - platformBadge-logik
// - resolvePlatform default + supported-check
// - Konstitutionella checks på all ny copy (PlatformToggle, plan-/beta-notes,
//   alla 5 content-filer): inga FOMO-imperativ, inga "kommer snart"-löften,
//   plan-krav + beta-status synliga upfront

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { chatgptContent } from '@/content/connect/chatgpt-desktop'
import { claudeCodeContent } from '@/content/connect/claude-code'
import { claudeContent } from '@/content/connect/claude-desktop'
import { cursorContent } from '@/content/connect/cursor'
import { genericContent } from '@/content/connect/generic-mcp'
import { gooseContent } from '@/content/connect/goose'
import { resolvePlatform } from '@/components/connect/platform'
import {
  CLIENT_CONTENTS,
  getClientContentById,
  platformBadge,
} from '@/lib/connect/clients'

describe('CLIENT_CONTENTS — katalog-shape', () => {
  it('innehåller alla 6 v2-klienter (Goose tillagd 2026-05-16)', () => {
    const ids = CLIENT_CONTENTS.map((c) => c.id)
    expect(ids).toEqual([
      'claude-desktop',
      'claude-code',
      'cursor',
      'chatgpt-desktop',
      'goose',
      'generic-mcp',
    ])
  })

  it('varje content har både desktop- och mobile-sektion', () => {
    for (const content of CLIENT_CONTENTS) {
      expect(content.desktop).toBeDefined()
      expect(content.mobile).toBeDefined()
      expect(typeof content.mobile.supported).toBe('boolean')
      expect(Array.isArray(content.mobile.platforms)).toBe(true)
    }
  })

  it('Cursor + Claude Code + Goose har mobile.supported=false (CLI-only)', () => {
    expect(cursorContent.mobile.supported).toBe(false)
    expect(claudeCodeContent.mobile.supported).toBe(false)
    expect(gooseContent.mobile.supported).toBe(false)
  })

  it('Claude + ChatGPT + generic har mobile.supported=true', () => {
    expect(claudeContent.mobile.supported).toBe(true)
    expect(chatgptContent.mobile.supported).toBe(true)
    expect(genericContent.mobile.supported).toBe(true)
  })

  it('Goose saknar plan-krav (open-source) och beta-status (stable MCP-stöd)', () => {
    expect(gooseContent.desktop.planRequirement).toBeNull()
    expect(gooseContent.desktop.betaStatus).toBeUndefined()
    expect(gooseContent.configFormat).toBe('goose-yaml')
  })

  it('Goose mobile-notes förklarar CLI-only-naturen', () => {
    expect(gooseContent.mobile.notes).toMatch(/CLI|ingen mobile/i)
  })

  it('Claude desktop saknar plan-krav, mobile kräver Pro+', () => {
    expect(claudeContent.desktop.planRequirement).toBeNull()
    expect(claudeContent.mobile.planRequirement).toBeTruthy()
    expect(claudeContent.mobile.planRequirement).toMatch(/Pro|Max|Team|Enterprise/i)
  })

  it('ChatGPT desktop OCH mobile kräver Plus+ (samma policy)', () => {
    expect(chatgptContent.desktop.planRequirement).toMatch(/Plus|Pro|Team|Enterprise/i)
    expect(chatgptContent.mobile.planRequirement).toMatch(/Plus|Pro|Team|Enterprise/i)
  })

  it('ChatGPT mobile + desktop har beta-status satt', () => {
    expect(chatgptContent.desktop.betaStatus).toBeTruthy()
    expect(chatgptContent.mobile.betaStatus).toBeTruthy()
    expect(chatgptContent.mobile.betaStatus).toMatch(/beta/i)
  })

  it('Claude har INTE beta-status (stable)', () => {
    expect(claudeContent.desktop.betaStatus).toBeUndefined()
    expect(claudeContent.mobile.betaStatus).toBeUndefined()
  })

  it('Cursor + Claude Code mobile har tom instructionSteps + förklarande notes', () => {
    expect(cursorContent.mobile.instructionSteps).toEqual([])
    expect(cursorContent.mobile.notes).toBeTruthy()
    expect(claudeCodeContent.mobile.instructionSteps).toEqual([])
    expect(claudeCodeContent.mobile.notes).toBeTruthy()
  })
})

describe('getClientContentById', () => {
  it('returnerar content för känt id', () => {
    expect(getClientContentById('claude-desktop')?.displayName).toBe('Claude')
    expect(getClientContentById('chatgpt-desktop')?.displayName).toBe('ChatGPT')
  })

  it('returnerar null för okänt id', () => {
    expect(getClientContentById('xyz')).toBeNull()
  })
})

describe('platformBadge', () => {
  it('Desktop + Mobile för supported klienter', () => {
    expect(platformBadge(claudeContent)).toBe('Desktop + Mobile')
    expect(platformBadge(chatgptContent)).toBe('Desktop + Mobile')
  })

  it('Desktop endast för Cursor + Claude Code', () => {
    expect(platformBadge(cursorContent)).toBe('Desktop endast')
    expect(platformBadge(claudeCodeContent)).toBe('Desktop endast')
  })
})

describe('resolvePlatform', () => {
  it('default desktop när param saknas', () => {
    expect(resolvePlatform(undefined, true)).toBe('desktop')
  })

  it('mobile när param=mobile OCH supported', () => {
    expect(resolvePlatform('mobile', true)).toBe('mobile')
  })

  it('faller till desktop när mobile param men ej supported (Cursor)', () => {
    expect(resolvePlatform('mobile', false)).toBe('desktop')
  })

  it('faller till desktop vid invalid param-värde', () => {
    expect(resolvePlatform('android', true)).toBe('desktop')
    expect(resolvePlatform('', true)).toBe('desktop')
  })
})

describe('konstitutionella checks på copy', () => {
  const sources = [
    'src/components/connect/platform-toggle.tsx',
    'src/components/connect/plan-and-beta-notes.tsx',
    'src/content/connect/claude-desktop.ts',
    'src/content/connect/claude-code.ts',
    'src/content/connect/cursor.ts',
    'src/content/connect/chatgpt-desktop.ts',
    'src/content/connect/goose.ts',
    'src/content/connect/generic-mcp.ts',
    'src/app/connect/page.tsx',
    'src/app/connect/[client]/page.tsx',
  ].map((p) => ({
    path: p,
    content: readFileSync(resolve(process.cwd(), p), 'utf-8'),
  }))

  const forbidden = [
    { re: /\bAnslut nu\b/i, why: 'FOMO-imperativ' },
    { re: /\bkommer snart\b/i, why: 'icke-verifierbart löfte' },
    { re: /\bpowered by\b/i, why: 'varumärkes-promotion' },
    { re: /\bdin assistent\b/i, why: 'personality-claim om klient-AI' },
    { re: /\bkraftfull\b/i, why: 'upplevelse-adjektiv' },
    { re: /\bmagisk[at]?\b/i, why: 'magic-words' },
    { re: /\bsmidigast\b/i, why: 'upplevelse-adjektiv' },
    { re: /\bwe want to hear from you\b/i, why: 'säljpitch' },
    { re: /\bearly access\b/i, why: 'beta-omskrivning — säg beta rakt' },
    { re: /\bpreview\b/i, why: 'beta-omskrivning — säg beta rakt' },
  ]

  for (const file of sources) {
    for (const { re, why } of forbidden) {
      it(`${file.path}: ${why}`, () => {
        expect(file.content).not.toMatch(re)
      })
    }
  }

  it('ChatGPT content säger "beta" rakt (inte "early access")', () => {
    const text =
      sources.find((s) => s.path.endsWith('chatgpt-desktop.ts'))?.content ?? ''
    expect(text).toMatch(/beta/i)
    expect(text).not.toMatch(/early access/i)
  })

  it('Cursor mobile-notes förklarar saknaden faktabaserat', () => {
    const text = sources.find((s) => s.path.endsWith('cursor.ts'))?.content ?? ''
    expect(text).toMatch(/ingen mobile-version/i)
  })

  it('Plan-note säger "kommer misslyckas" rakt om plan saknas', () => {
    const text =
      sources.find((s) => s.path.endsWith('plan-and-beta-notes.tsx'))?.content ??
      ''
    expect(text).toMatch(/misslyckas/i)
  })
})
