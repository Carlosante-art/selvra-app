/**
 * Formatera en conversation-tråd som markdown — pure function.
 *
 * Format:
 *   # <tråd-titel>
 *   Startade: 2026-05-15
 *   Källor: dexcom · garmin · selvra_self_report  (unika i tråden)
 *
 *   ## Du — 2026-05-15 14:32
 *   <user-text>
 *
 *   ## Selvra — 2026-05-15 14:32
 *   <selvra-text>
 *
 *   Källor: dexcom · garmin
 *
 *   ---
 *
 * Användning: per-thread export så användaren kan kopiera till annan AI,
 * notes-app eller arkiv. Granular pendant till SREF-export.
 */

export type FormatThreadInput = {
  title: string | null
  startedAt: Date
  turns: ReadonlyArray<{
    turnIndex: number
    userText: string
    selvraText: string | null
    sourcesConsulted: ReadonlyArray<{ source_ai_id: string }> | null
    createdAt: Date
  }>
}

export function formatThreadAsMarkdown(input: FormatThreadInput): string {
  const lines: string[] = []

  // Titel + meta
  lines.push(`# ${input.title ?? 'Samtal med Selvra'}`)
  lines.push('')
  lines.push(`Startade: ${formatDate(input.startedAt)}`)

  // Sammanlagda källor över hela tråden
  const allSources = new Set<string>()
  for (const turn of input.turns) {
    if (turn.sourcesConsulted) {
      for (const s of turn.sourcesConsulted) {
        allSources.add(s.source_ai_id)
      }
    }
  }
  if (allSources.size > 0) {
    lines.push(`Källor: ${[...allSources].sort().join(' · ')}`)
  }
  lines.push('')

  // Tråd-historik
  for (const turn of input.turns) {
    const timestamp = formatDateTime(turn.createdAt)
    lines.push(`## Du — ${timestamp}`)
    lines.push('')
    lines.push(turn.userText)
    lines.push('')

    if (turn.selvraText) {
      lines.push(`## Selvra — ${timestamp}`)
      lines.push('')
      lines.push(turn.selvraText)
      lines.push('')

      if (turn.sourcesConsulted && turn.sourcesConsulted.length > 0) {
        const turnSources = turn.sourcesConsulted
          .map((s) => s.source_ai_id)
          .sort()
          .join(' · ')
        lines.push(`Källor: ${turnSources}`)
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace('T', ' ')
}
