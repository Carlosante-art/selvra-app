import { NextResponse } from 'next/server'

import { generateAiContext } from '@/lib/ai-context/format'
import {
  ALL_LAYERS,
  isValidLayer,
  isValidPeriod,
} from '@/lib/ai-context/types'
import type { AiContextLayer, AiContextOptions } from '@/lib/ai-context/types'

/**
 * GET /api/export/ai-context?period=week|month|all&layers=intentions,thoughts,patterns
 *
 * Returnerar strukturerad text-profil att klistra in i extern AI.
 * Format: plain text med Content-Disposition: inline (visa i browser
 * OR Content-Disposition: attachment via ?download=1 (ladda ner som .txt).
 */

export async function GET(request: Request) {
  const url = new URL(request.url)
  const periodParam = url.searchParams.get('period')
  const layersParam = url.searchParams.get('layers')
  const download = url.searchParams.get('download') === '1'

  const period = isValidPeriod(periodParam) ? periodParam : 'week'
  const layers: AiContextLayer[] = layersParam
    ? layersParam
        .split(',')
        .map((s) => s.trim())
        .filter(isValidLayer)
    : ALL_LAYERS

  const options: AiContextOptions = { period, layers }

  let text: string
  try {
    text = await generateAiContext(options)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new NextResponse(
      `Selvra AI-context export failed: ${msg}`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } },
    )
  }

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (download) {
    const today = new Date().toISOString().slice(0, 10)
    headers['Content-Disposition'] =
      `attachment; filename="selvra-ai-context-${today}.txt"`
  }

  return new NextResponse(text, { status: 200, headers })
}
