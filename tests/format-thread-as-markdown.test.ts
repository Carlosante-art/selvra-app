// Pure-function-tester för markdown-export av tråd.

import { describe, expect, it } from 'vitest'
import { formatThreadAsMarkdown } from '../src/lib/conversation/format-as-markdown'

const TURN_BASE = {
  turnIndex: 0,
  userText: 'Hur var min vecka?',
  selvraText: 'Garmin visade 6h sömn i snitt.',
  sourcesConsulted: [{ source_ai_id: 'garmin' }],
  createdAt: new Date('2026-05-15T14:32:00.000Z'),
}

describe('format-thread-as-markdown — basic format', () => {
  it('titel renderas som h1', () => {
    const md = formatThreadAsMarkdown({
      title: 'Veckan i sammanfattning',
      startedAt: new Date('2026-05-15'),
      turns: [TURN_BASE],
    })
    expect(md).toContain('# Veckan i sammanfattning')
  })

  it('titel null → default-fallback', () => {
    const md = formatThreadAsMarkdown({
      title: null,
      startedAt: new Date('2026-05-15'),
      turns: [],
    })
    expect(md).toContain('# Samtal med Selvra')
  })

  it('start-datum i ISO', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15T08:00:00.000Z'),
      turns: [],
    })
    expect(md).toContain('Startade: 2026-05-15')
  })

  it('sammanlagda källor över hela tråden listas i header', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [
        { ...TURN_BASE, sourcesConsulted: [{ source_ai_id: 'garmin' }] },
        {
          ...TURN_BASE,
          turnIndex: 1,
          sourcesConsulted: [
            { source_ai_id: 'dexcom' },
            { source_ai_id: 'garmin' },
          ],
        },
      ],
    })
    expect(md).toContain('Källor: dexcom · garmin')
  })

  it('inga källor i tråden → ingen header-rad för källor', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [{ ...TURN_BASE, sourcesConsulted: null }],
    })
    expect(md).not.toMatch(/^Källor:/m)
  })
})

describe('format-thread-as-markdown — tur-rendering', () => {
  it('user-tur har h2 + timestamp + text', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [TURN_BASE],
    })
    expect(md).toContain('## Du — 2026-05-15 14:32')
    expect(md).toContain('Hur var min vecka?')
  })

  it('selvra-tur har h2 + timestamp + text + källor', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [TURN_BASE],
    })
    expect(md).toContain('## Selvra — 2026-05-15 14:32')
    expect(md).toContain('Garmin visade 6h sömn i snitt.')
    expect(md).toMatch(/Källor: garmin/)
  })

  it('pending tur (selvraText=null) — bara user-delen visas', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [{ ...TURN_BASE, selvraText: null, sourcesConsulted: null }],
    })
    expect(md).toContain('## Du')
    expect(md).not.toContain('## Selvra')
  })

  it('flera turer separeras med ---', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [
        TURN_BASE,
        { ...TURN_BASE, turnIndex: 1, userText: 'Och idag?' },
      ],
    })
    const separators = (md.match(/^---$/gm) ?? []).length
    expect(separators).toBe(2)
  })
})

describe('format-thread-as-markdown — edge cases', () => {
  it('tom turn-lista → bara header', () => {
    const md = formatThreadAsMarkdown({
      title: 'Tom tråd',
      startedAt: new Date('2026-05-15'),
      turns: [],
    })
    expect(md).toContain('# Tom tråd')
    expect(md).not.toContain('## Du')
    expect(md).not.toContain('## Selvra')
  })

  it('avslutar med ny rad', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [TURN_BASE],
    })
    expect(md.endsWith('\n')).toBe(true)
    expect(md.endsWith('\n\n')).toBe(false) // bara EN trailing newline
  })

  it('källor sorteras alfabetiskt', () => {
    const md = formatThreadAsMarkdown({
      title: 'x',
      startedAt: new Date('2026-05-15'),
      turns: [
        {
          ...TURN_BASE,
          sourcesConsulted: [
            { source_ai_id: 'oura' },
            { source_ai_id: 'garmin' },
            { source_ai_id: 'dexcom' },
          ],
        },
      ],
    })
    expect(md).toContain('Källor: dexcom · garmin · oura')
  })
})
