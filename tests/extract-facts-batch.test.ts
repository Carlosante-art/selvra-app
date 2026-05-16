// extractFactsBatch + parseBatchExtractionResponse + buildBatchUserMessage-tester.
//
// Täcker happy-path, source-validation (anti-hallucination), parsing-edge-
// cases och fail-safe vid LLM-fel. Komplement till
// extract-facts-from-turn.test.ts som testar single-turn-versionen.

import { describe, expect, it, vi } from 'vitest'

import {
  buildBatchUserMessage,
  extractFactsBatch,
  parseBatchExtractionResponse,
  type BatchTurnInput,
} from '@/lib/observability/extract-facts-batch'

const sampleTurn = (overrides: Partial<BatchTurnInput> = {}): BatchTurnInput => ({
  turnId: 'turn_test',
  userText: 'jag bor i Berlin',
  selvraText: 'Noterat.',
  sourcesConsulted: [],
  ...overrides,
})

describe('buildBatchUserMessage', () => {
  it('formaterar single turn med turnId', () => {
    const msg = buildBatchUserMessage([
      sampleTurn({ turnId: 'turn_a', userText: 'hej', selvraText: 'hej' }),
    ])
    expect(msg).toContain('TUR turn_a:')
    expect(msg).toContain('ANVÄNDAREN: hej')
    expect(msg).toContain('SELVRA: hej')
    expect(msg).toContain('KÄLLOR SELVRA HADE: (inga)')
  })

  it('separerar flera turns med tom rad', () => {
    const msg = buildBatchUserMessage([
      sampleTurn({ turnId: 'turn_a' }),
      sampleTurn({ turnId: 'turn_b' }),
    ])
    expect(msg).toContain('TUR turn_a:')
    expect(msg).toContain('TUR turn_b:')
    // Två turns separerade med \n\n
    const split = msg.split('\n\nTUR ')
    expect(split.length).toBe(2)
  })

  it('listar sources korrekt', () => {
    const msg = buildBatchUserMessage([
      sampleTurn({
        sourcesConsulted: [{ sourceAiId: 'garmin' }, { sourceAiId: 'dexcom' }],
      }),
    ])
    expect(msg).toContain('- garmin')
    expect(msg).toContain('- dexcom')
    expect(msg).not.toContain('(inga)')
  })
})

describe('parseBatchExtractionResponse — happy-path', () => {
  it('parsar valid response med multiple turns', () => {
    const turns: BatchTurnInput[] = [
      sampleTurn({ turnId: 'turn_a' }),
      sampleTurn({ turnId: 'turn_b' }),
    ]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'user_stated', factText: 'bor i Berlin', sourceName: null },
          ],
        },
        { turnId: 'turn_b', facts: [] },
      ],
    })

    const result = parseBatchExtractionResponse(raw, turns)
    expect(result).toHaveLength(2)
    expect(result[0].turnId).toBe('turn_a')
    expect(result[0].facts).toHaveLength(1)
    expect(result[0].facts[0].factText).toBe('bor i Berlin')
    expect(result[1].turnId).toBe('turn_b')
    expect(result[1].facts).toHaveLength(0)
  })

  it('strippar markdown code-fence', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const raw = '```json\n' + JSON.stringify({ results: [{ turnId: 'turn_a', facts: [] }] }) + '\n```'
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result).toHaveLength(1)
  })
})

describe('parseBatchExtractionResponse — source anti-hallucination', () => {
  it('filtrerar source_observed-facts med okänt sourceName', () => {
    const turns: BatchTurnInput[] = [
      sampleTurn({
        turnId: 'turn_a',
        sourcesConsulted: [{ sourceAiId: 'garmin' }],
      }),
    ]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'source_observed', factText: '5h sömn', sourceName: 'garmin' },
            { factType: 'source_observed', factText: 'fake-data', sourceName: 'fitbit' },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toHaveLength(1)
    expect(result[0].facts[0].sourceName).toBe('garmin')
  })

  it('case-insensitive source matching (normaliserar till lowercase)', () => {
    const turns: BatchTurnInput[] = [
      sampleTurn({
        turnId: 'turn_a',
        sourcesConsulted: [{ sourceAiId: 'garmin' }],
      }),
    ]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'source_observed', factText: '5h', sourceName: 'GARMIN' },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts[0].sourceName).toBe('garmin')
  })

  it('per-turn source-isolation: turn A:s sources gäller inte turn B:s facts', () => {
    const turns: BatchTurnInput[] = [
      sampleTurn({
        turnId: 'turn_a',
        sourcesConsulted: [{ sourceAiId: 'garmin' }],
      }),
      sampleTurn({
        turnId: 'turn_b',
        sourcesConsulted: [{ sourceAiId: 'dexcom' }],
      }),
    ]
    const raw = JSON.stringify({
      results: [
        // turn_b försöker använda garmin som inte är dess source — ska filtreras
        {
          turnId: 'turn_b',
          facts: [
            { factType: 'source_observed', factText: 'spillover', sourceName: 'garmin' },
            { factType: 'source_observed', factText: 'valid', sourceName: 'dexcom' },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toHaveLength(1)
    expect(result[0].facts[0].sourceName).toBe('dexcom')
  })
})

describe('parseBatchExtractionResponse — hallucination-tolerans', () => {
  it('droppar entries med okänd turnId (LLM-hallucination)', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const raw = JSON.stringify({
      results: [
        { turnId: 'turn_a', facts: [] },
        { turnId: 'turn_BOGUS', facts: [{ factType: 'user_stated', factText: 'x', sourceName: null }] },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result).toHaveLength(1)
    expect(result[0].turnId).toBe('turn_a')
  })

  it('returnerar [] vid trasig JSON', () => {
    const turns = [sampleTurn()]
    expect(parseBatchExtractionResponse('not json', turns)).toEqual([])
    expect(parseBatchExtractionResponse('{', turns)).toEqual([])
  })

  it('returnerar [] vid saknad results-array', () => {
    const turns = [sampleTurn()]
    expect(parseBatchExtractionResponse('{}', turns)).toEqual([])
    expect(parseBatchExtractionResponse('{"results": "not-array"}', turns)).toEqual([])
  })

  it('hanterar entry utan facts-array som tom facts-lista', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const raw = JSON.stringify({ results: [{ turnId: 'turn_a' }] })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result).toHaveLength(1)
    expect(result[0].facts).toEqual([])
  })

  it('filtrerar facts med ogiltigt factType', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'user_stated', factText: 'valid', sourceName: null },
            { factType: 'invalid_type', factText: 'bogus', sourceName: null },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toHaveLength(1)
    expect(result[0].facts[0].factText).toBe('valid')
  })

  it('filtrerar facts med tom factText', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'user_stated', factText: '', sourceName: null },
            { factType: 'user_stated', factText: '   ', sourceName: null },
            { factType: 'user_stated', factText: 'OK', sourceName: null },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toHaveLength(1)
    expect(result[0].facts[0].factText).toBe('OK')
  })

  it('filtrerar facts > 500 tecken', () => {
    const turns = [sampleTurn({ turnId: 'turn_a' })]
    const longText = 'a'.repeat(501)
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [{ factType: 'user_stated', factText: longText, sourceName: null }],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toEqual([])
  })

  it('filtrerar source_observed-facts utan sourceName', () => {
    const turns: BatchTurnInput[] = [
      sampleTurn({
        turnId: 'turn_a',
        sourcesConsulted: [{ sourceAiId: 'garmin' }],
      }),
    ]
    const raw = JSON.stringify({
      results: [
        {
          turnId: 'turn_a',
          facts: [
            { factType: 'source_observed', factText: 'x', sourceName: null },
            { factType: 'source_observed', factText: 'y', sourceName: '' },
          ],
        },
      ],
    })
    const result = parseBatchExtractionResponse(raw, turns)
    expect(result[0].facts).toEqual([])
  })
})

describe('extractFactsBatch — fail-safe', () => {
  it('returnerar [] vid LLM-throw (caller markerar failed)', async () => {
    const llmCall = vi.fn().mockRejectedValue(new Error('Mistral timeout'))
    const result = await extractFactsBatch({
      turns: [sampleTurn({ turnId: 'turn_a' })],
      llmCall,
    })
    expect(result).toEqual([])
    expect(llmCall).toHaveBeenCalledOnce()
  })

  it('returnerar [] för tom input utan att kalla LLM', async () => {
    const llmCall = vi.fn()
    const result = await extractFactsBatch({ turns: [], llmCall })
    expect(result).toEqual([])
    expect(llmCall).not.toHaveBeenCalled()
  })

  it('skickar shared system-prompt + few-shot + batch-message', async () => {
    const llmCall = vi.fn().mockResolvedValue(
      JSON.stringify({ results: [{ turnId: 'turn_a', facts: [] }] }),
    )
    await extractFactsBatch({
      turns: [sampleTurn({ turnId: 'turn_a' })],
      llmCall,
    })

    const messages = llmCall.mock.calls[0][0]
    expect(messages).toHaveLength(4) // system + few-shot user + few-shot assistant + batch
    expect(messages[0].role).toBe('system')
    expect(messages[1].role).toBe('user')
    expect(messages[2].role).toBe('assistant')
    expect(messages[3].role).toBe('user')
    expect(messages[3].content).toContain('TUR turn_a:')
  })
})

describe('extractFactsBatch — kostnads-amortisering', () => {
  it('skickar samma shared prompt oavsett batch-size', async () => {
    const llmCall = vi.fn().mockResolvedValue(
      JSON.stringify({ results: [] }),
    )

    // Single-turn batch
    await extractFactsBatch({ turns: [sampleTurn({ turnId: 'a' })], llmCall })
    const singlePrompt = llmCall.mock.calls[0][0][0].content as string

    // Multi-turn batch
    await extractFactsBatch({
      turns: [
        sampleTurn({ turnId: 'a' }),
        sampleTurn({ turnId: 'b' }),
        sampleTurn({ turnId: 'c' }),
      ],
      llmCall,
    })
    const multiPrompt = llmCall.mock.calls[1][0][0].content as string

    // Shared system-prompt är identisk → amortiseras över batchen
    expect(singlePrompt).toBe(multiPrompt)
  })
})
