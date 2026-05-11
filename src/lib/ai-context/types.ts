/**
 * AI-context export typer. Used by /api/export/ai-context och /export/ai-context.
 */

export type AiContextPeriod = 'week' | 'month' | 'all'

export type AiContextLayer = 'intentions' | 'thoughts' | 'patterns'

export type AiContextOptions = {
  period: AiContextPeriod
  layers: AiContextLayer[]
}

export const ALL_LAYERS: AiContextLayer[] = ['intentions', 'thoughts', 'patterns']

export function isValidPeriod(value: string | null): value is AiContextPeriod {
  return value === 'week' || value === 'month' || value === 'all'
}

export function isValidLayer(value: string): value is AiContextLayer {
  return value === 'intentions' || value === 'thoughts' || value === 'patterns'
}

export function periodToDays(period: AiContextPeriod): number | null {
  if (period === 'week') return 7
  if (period === 'month') return 31
  return null // 'all' → no time filter
}

export function periodLabel(period: AiContextPeriod): string {
  if (period === 'week') return 'senaste 7 dagarna'
  if (period === 'month') return 'senaste 31 dagarna'
  return 'all historik'
}
