// parseSourceMarkup + extractSourceNames + stripSourceMarkup-tester

import { describe, expect, it } from 'vitest'

import {
  extractSourceNames,
  parseSourceMarkup,
  stripSourceMarkup,
} from '../src/lib/observability/source-markup'

describe('parseSourceMarkup', () => {
  it('returnerar tom array för tom string', () => {
    expect(parseSourceMarkup('')).toEqual([])
  })

  it('text utan markup → ett text-segment', () => {
    const result = parseSourceMarkup('Bara vanlig text.')
    expect(result).toEqual([{ type: 'text', value: 'Bara vanlig text.' }])
  })

  it('text med en source-markup', () => {
    const result = parseSourceMarkup(
      'Du sov 5h senaste veckan [source:garmin].',
    )
    expect(result).toEqual([
      { type: 'text', value: 'Du sov 5h senaste veckan ' },
      { type: 'source', name: 'garmin' },
      { type: 'text', value: '.' },
    ])
  })

  it('flera source-markups', () => {
    const result = parseSourceMarkup(
      'A [source:garmin] B [source:strava] C.',
    )
    expect(result).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'source', name: 'garmin' },
      { type: 'text', value: ' B ' },
      { type: 'source', name: 'strava' },
      { type: 'text', value: ' C.' },
    ])
  })

  it('markup vid start av texten', () => {
    const result = parseSourceMarkup('[source:dexcom] visade 7.4 mmol/L.')
    expect(result).toEqual([
      { type: 'source', name: 'dexcom' },
      { type: 'text', value: ' visade 7.4 mmol/L.' },
    ])
  })

  it('markup vid slut av texten', () => {
    const result = parseSourceMarkup('Värde 7.4 [source:dexcom]')
    expect(result).toEqual([
      { type: 'text', value: 'Värde 7.4 ' },
      { type: 'source', name: 'dexcom' },
    ])
  })

  it('hela texten är bara en markup', () => {
    const result = parseSourceMarkup('[source:garmin]')
    expect(result).toEqual([{ type: 'source', name: 'garmin' }])
  })

  it('normaliserar source-namn till lowercase', () => {
    const result = parseSourceMarkup('A [source:GARMIN] B [source:DexCom]')
    expect(result).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'source', name: 'garmin' },
      { type: 'text', value: ' B ' },
      { type: 'source', name: 'dexcom' },
    ])
  })

  it('accepterar underscore och bindestreck i namn', () => {
    const result = parseSourceMarkup(
      '[source:garmin_baseline] vs [source:apple-health]',
    )
    expect(result).toEqual([
      { type: 'source', name: 'garmin_baseline' },
      { type: 'text', value: ' vs ' },
      { type: 'source', name: 'apple-health' },
    ])
  })

  it('ignorerar markup med whitespace i namnet', () => {
    const result = parseSourceMarkup('A [source:gar min] B')
    // matchar inte → hela texten är text-segment
    expect(result).toEqual([{ type: 'text', value: 'A [source:gar min] B' }])
  })
})

describe('extractSourceNames', () => {
  it('returnerar tom array för text utan markup', () => {
    expect(extractSourceNames('vanlig text')).toEqual([])
  })

  it('returnerar unika namn i ordning', () => {
    const result = extractSourceNames(
      '[source:garmin] A [source:strava] B [source:garmin] C',
    )
    expect(result).toEqual(['garmin', 'strava'])
  })

  it('lowercase-normaliserade', () => {
    const result = extractSourceNames('[source:GARMIN] [source:garmin]')
    expect(result).toEqual(['garmin'])
  })
})

describe('stripSourceMarkup', () => {
  it('tar bort alla markup', () => {
    const result = stripSourceMarkup(
      'Du sov 5h [source:garmin] senaste veckan [source:garmin_baseline].',
    )
    expect(result).toBe('Du sov 5h senaste veckan.')
  })

  it('text utan markup förblir oförändrad', () => {
    expect(stripSourceMarkup('Vanlig text')).toBe('Vanlig text')
  })

  it('konsoliderar whitespace innan punctuation', () => {
    expect(stripSourceMarkup('Värde [source:dexcom] .')).toBe('Värde.')
  })
})
