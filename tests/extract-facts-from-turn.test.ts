// extractFactsFromTurn + parseFactExtractionResponse-tester
// Pure-function — inject:ad llmCall.

import { describe, expect, it, vi } from 'vitest'

import {
  extractFactsFromTurn,
  parseFactExtractionResponse,
  type LlmCallFn,
} from '../src/lib/observability/extract-facts-from-turn'

const NO_SOURCES: never[] = []
const GARMIN_SOURCE = [
  {
    sourceAiId: 'garmin',
    timestamp: new Date('2026-05-15T08:00:00Z'),
    summary: 'sleep_summary duration_h=5.4',
  },
]

describe('parseFactExtractionResponse', () => {
  it('parsar giltig JSON med user_stated + source_observed', () => {
    const response = JSON.stringify({
      facts: [
        { factType: 'user_stated', factText: 'jag är T1-diabetiker', sourceName: null },
        { factType: 'source_observed', factText: '5.4h sömn i natt', sourceName: 'garmin' },
      ],
    })
    const result = parseFactExtractionResponse(response, GARMIN_SOURCE)
    expect(result).toHaveLength(2)
    expect(result[0].factType).toBe('user_stated')
    expect(result[1].factType).toBe('source_observed')
    expect(result[1].sourceName).toBe('garmin')
  })

  it('strippar kod-fence (```json ... ```)', () => {
    const response = '```json\n' + JSON.stringify({
      facts: [{ factType: 'user_stated', factText: 'jag bor i Berlin', sourceName: null }],
    }) + '\n```'
    const result = parseFactExtractionResponse(response, NO_SOURCES)
    expect(result).toHaveLength(1)
    expect(result[0].factText).toBe('jag bor i Berlin')
  })

  it('returnerar tom array vid ogiltig JSON', () => {
    expect(parseFactExtractionResponse('inte json', NO_SOURCES)).toEqual([])
    expect(parseFactExtractionResponse('{', NO_SOURCES)).toEqual([])
    expect(parseFactExtractionResponse('', NO_SOURCES)).toEqual([])
  })

  it('returnerar tom array när facts saknas eller är fel typ', () => {
    expect(parseFactExtractionResponse('{}', NO_SOURCES)).toEqual([])
    expect(parseFactExtractionResponse('{"facts":"not-array"}', NO_SOURCES)).toEqual([])
    expect(parseFactExtractionResponse('null', NO_SOURCES)).toEqual([])
  })

  it('filtrerar bort entries utan factText eller tom string', () => {
    const response = JSON.stringify({
      facts: [
        { factType: 'user_stated', factText: 'giltig', sourceName: null },
        { factType: 'user_stated', factText: '', sourceName: null },
        { factType: 'user_stated', sourceName: null }, // saknar factText
        { factType: 'user_stated', factText: '   ', sourceName: null }, // bara whitespace
      ],
    })
    const result = parseFactExtractionResponse(response, NO_SOURCES)
    expect(result).toHaveLength(1)
    expect(result[0].factText).toBe('giltig')
  })

  it('filtrerar bort entries med okänd factType', () => {
    const response = JSON.stringify({
      facts: [
        { factType: 'unknown', factText: 'a', sourceName: null },
        { factType: 'user_stated', factText: 'b', sourceName: null },
        { factType: null, factText: 'c', sourceName: null },
      ],
    })
    const result = parseFactExtractionResponse(response, NO_SOURCES)
    expect(result).toHaveLength(1)
    expect(result[0].factText).toBe('b')
  })

  it('source_observed kräver sourceName som matchar källa', () => {
    const response = JSON.stringify({
      facts: [
        // fabricated source — inte i sourcesConsulted
        { factType: 'source_observed', factText: 'fake', sourceName: 'oura' },
        // giltig
        { factType: 'source_observed', factText: '5h', sourceName: 'garmin' },
        // saknar sourceName
        { factType: 'source_observed', factText: 'no-source' },
      ],
    })
    const result = parseFactExtractionResponse(response, GARMIN_SOURCE)
    expect(result).toHaveLength(1)
    expect(result[0].factText).toBe('5h')
    expect(result[0].sourceName).toBe('garmin')
  })

  it('normaliserar sourceName till lowercase', () => {
    const response = JSON.stringify({
      facts: [
        { factType: 'source_observed', factText: 'x', sourceName: 'GARMIN' },
      ],
    })
    const result = parseFactExtractionResponse(response, GARMIN_SOURCE)
    expect(result).toHaveLength(1)
    expect(result[0].sourceName).toBe('garmin')
  })

  it('cap:par factText över 500 tecken', () => {
    const longText = 'x'.repeat(501)
    const response = JSON.stringify({
      facts: [{ factType: 'user_stated', factText: longText, sourceName: null }],
    })
    const result = parseFactExtractionResponse(response, NO_SOURCES)
    expect(result).toHaveLength(0)
  })

  it('trim:ar factText whitespace', () => {
    const response = JSON.stringify({
      facts: [
        { factType: 'user_stated', factText: '  jag är T1D  ', sourceName: null },
      ],
    })
    const result = parseFactExtractionResponse(response, NO_SOURCES)
    expect(result[0].factText).toBe('jag är T1D')
  })
})

describe('extractFactsFromTurn — fail-safe', () => {
  it('LLM-call kastar fel → tom array', async () => {
    const llmCall: LlmCallFn = vi.fn(async () => {
      throw new Error('upstream down')
    })

    const result = await extractFactsFromTurn({
      userText: 'jag är T1D',
      selvraText: 'ok',
      sourcesConsulted: NO_SOURCES,
      llmCall,
    })

    expect(result).toEqual([])
    expect(llmCall).toHaveBeenCalledOnce()
  })

  it('LLM returnerar gibberish → tom array', async () => {
    const llmCall: LlmCallFn = vi.fn(async () => 'inte json alls')

    const result = await extractFactsFromTurn({
      userText: 'a',
      selvraText: 'b',
      sourcesConsulted: NO_SOURCES,
      llmCall,
    })

    expect(result).toEqual([])
  })

  it('LLM returnerar valid JSON → facts extraheras', async () => {
    const llmCall: LlmCallFn = vi.fn(async () =>
      JSON.stringify({
        facts: [
          {
            factType: 'user_stated',
            factText: 'jag bor i Berlin',
            sourceName: null,
          },
        ],
      }),
    )

    const result = await extractFactsFromTurn({
      userText: 'jag bor i Berlin förresten',
      selvraText: 'OK',
      sourcesConsulted: NO_SOURCES,
      llmCall,
    })

    expect(result).toHaveLength(1)
    expect(result[0].factText).toBe('jag bor i Berlin')
    expect(result[0].factType).toBe('user_stated')
  })
})
