/**
 * GET /api/cron/extract-facts — Vercel Cron-target för async fact-extraction.
 *
 * Schemalagt var 10:e minut via vercel.json `crons`. Plockar upp till
 * `BATCH_SIZE` pending/failed turns och kör batch-extraction. Persistar
 * facts via persistConversationFacts + markerar turns som processed/failed.
 *
 * Auth: Vercel skickar `Authorization: Bearer $CRON_SECRET` när cron triggar
 * (env-var måste sättas i Vercel-dashboard). Manual-trigger från utveckling
 * stoppas av samma header-check.
 *
 * Idempotent: cron som triggas dubbelt processar inte samma turn två gånger
 * eftersom `markTurnExtractionStatus` flyttar status från pending → processed
 * efter persist. WHERE-clausen i getPendingExtractionTurns plockar bara
 * pending/failed.
 *
 * Failure-mode: Om LLM-call:en faller, markerar vi alla turns i batchen som
 * 'failed' med reason. Nästa cron-run (10 min senare) tar dem igen via
 * retryBackoffMinutes-window.
 */

import * as Sentry from '@sentry/nextjs'

import {
  bulkMarkTurnExtractionStatus,
  countPendingExtractionTurns,
  getPendingExtractionTurns,
  markTurnExtractionStatus,
  persistConversationFacts,
} from '@/lib/db/conversation-queries'
import { callMistralJsonSchema } from '@/lib/llm/mistral'
import { logger } from '@/lib/logging'
import {
  BATCH_FACT_EXTRACTION_SCHEMA,
  extractFactsBatch,
} from '@/lib/observability/extract-facts-batch'

export const runtime = 'nodejs'
export const maxDuration = 300

// Batch-size är trade-off mellan token-overhead-amortisering och
// LLM-context-överflöd. 10 turns × ~200 tokens-context per turn = 2000 tokens
// + ~600 tokens shared prompt = 2600 tokens input. Mistral Large hanterar
// detta utan problem. Kan höjas till 20-30 om vi vill spara fler API-calls.
const BATCH_SIZE = 10

// Sentry-alert om backlog växer över denna threshold — antingen cron är
// trasig eller traffic-spike som kräver tätare körningar.
const BACKLOG_WARNING_THRESHOLD = 100

export async function GET(req: Request): Promise<Response> {
  const log = logger.child({ module: 'cron/extract-facts' })

  // Auth-gate: Vercel Cron skickar Bearer-token. Saknas CRON_SECRET helt
  // → 503 (cron är inte konfigurerad). Felaktig token → 401.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    log.error('cron_secret_not_configured')
    return Response.json(
      { error: 'CRON_SECRET ej satt i Vercel-config' },
      { status: 503 },
    )
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    log.warn('cron_unauthorized', { hasHeader: authHeader !== null })
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  let backlog: { pending: number; failed: number }
  try {
    backlog = await countPendingExtractionTurns()
  } catch (err) {
    log.error('cron_count_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return Response.json({ error: 'DB-fel vid backlog-count' }, { status: 500 })
  }

  if (backlog.pending + backlog.failed > BACKLOG_WARNING_THRESHOLD) {
    log.warn('cron_backlog_high', backlog)
    Sentry.captureMessage('extraction backlog över threshold', {
      level: 'warning',
      tags: { module: 'cron/extract-facts' },
      extra: backlog,
    })
  }

  // Inga pending — exit early. Spara LLM-call.
  if (backlog.pending === 0 && backlog.failed === 0) {
    return Response.json({
      ok: true,
      processed: 0,
      backlogBefore: backlog,
      durationMs: Date.now() - startedAt,
    })
  }

  let turns: Awaited<ReturnType<typeof getPendingExtractionTurns>>
  try {
    turns = await getPendingExtractionTurns({ limit: BATCH_SIZE })
  } catch (err) {
    log.error('cron_fetch_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    Sentry.captureException(err)
    return Response.json({ error: 'DB-fel vid fetch' }, { status: 500 })
  }

  if (turns.length === 0) {
    // Backlog säger pending finns men query gav 0 — alla failed-turns är
    // inom backoff-fönster. Inte fel.
    return Response.json({
      ok: true,
      processed: 0,
      backlogBefore: backlog,
      reason: 'all_in_backoff',
      durationMs: Date.now() - startedAt,
    })
  }

  log.info('cron_batch_starting', {
    count: turns.length,
    backlog,
  })

  // Kör batch-extraction. Om LLM-call:en faller → markera alla turns failed.
  let results: Awaited<ReturnType<typeof extractFactsBatch>>
  try {
    results = await extractFactsBatch({
      turns: turns.map((t) => ({
        turnId: t.turnId,
        userText: t.userText,
        selvraText: t.selvraText,
        sourcesConsulted: t.sourcesConsulted,
      })),
      llmCall: (messages) =>
        callMistralJsonSchema(
          messages,
          'batch_fact_extraction',
          BATCH_FACT_EXTRACTION_SCHEMA,
        ),
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    log.error('cron_llm_failed', { reason, turnCount: turns.length })
    Sentry.captureException(err)
    // Markera alla turns failed så de retry:as nästa run.
    for (const t of turns) {
      await markTurnExtractionStatus({
        turnId: t.turnId,
        status: 'failed',
        failureReason: reason.slice(0, 500),
      }).catch(() => {
        // Best-effort. Om mark också faller, accepterar vi att turn ligger
        // kvar i sin tidigare status (pending → backoff-window) och nästa
        // cron försöker igen.
      })
    }
    return Response.json(
      { error: 'LLM-fel; turns markerade failed för retry', reason },
      { status: 500 },
    )
  }

  // Bygg lookup: turnId → original-input (för userId + threadId).
  const turnById = new Map(turns.map((t) => [t.turnId, t] as const))

  // Persistera facts + markera processed per turn. Vi kör per-turn (inte
  // bulk) så en enskild persist-failure inte tar ner hela batchen.
  let factsInserted = 0
  let turnsProcessed = 0
  let turnsFailed = 0
  const processedTurnIds: string[] = []
  const seenTurnIds = new Set<string>()

  for (const result of results) {
    seenTurnIds.add(result.turnId)
    const orig = turnById.get(result.turnId)
    if (!orig) continue // borde inte hända — parseBatch filtrerar redan

    if (result.facts.length > 0) {
      try {
        await persistConversationFacts(
          result.facts.map((f) => ({
            userId: orig.userId,
            threadId: orig.threadId,
            turnId: orig.turnId,
            factText: f.factText,
            factType: f.factType,
            sourceName: f.sourceName,
          })),
        )
        factsInserted += result.facts.length
      } catch (err) {
        log.warn('cron_persist_facts_failed', {
          turnId: result.turnId,
          error: err instanceof Error ? err.message : String(err),
        })
        Sentry.captureException(err)
        await markTurnExtractionStatus({
          turnId: result.turnId,
          status: 'failed',
          failureReason: 'persist_failed',
        })
        turnsFailed += 1
        continue
      }
    }
    processedTurnIds.push(result.turnId)
    turnsProcessed += 1
  }

  // Bulk-mark processed (snabbare än per-turn UPDATE).
  if (processedTurnIds.length > 0) {
    await bulkMarkTurnExtractionStatus({
      turnIds: processedTurnIds,
      status: 'processed',
    })
  }

  // Turns som LLM:n inte returnerade entry för (parse-failure eller
  // missade) — markera failed med reason. Retry nästa run.
  for (const t of turns) {
    if (!seenTurnIds.has(t.turnId)) {
      await markTurnExtractionStatus({
        turnId: t.turnId,
        status: 'failed',
        failureReason: 'llm_no_result',
      })
      turnsFailed += 1
    }
  }

  const durationMs = Date.now() - startedAt
  log.info('cron_batch_done', {
    turnsInput: turns.length,
    turnsProcessed,
    turnsFailed,
    factsInserted,
    durationMs,
  })

  return Response.json({
    ok: true,
    processed: turnsProcessed,
    failed: turnsFailed,
    factsInserted,
    backlogBefore: backlog,
    durationMs,
  })
}
