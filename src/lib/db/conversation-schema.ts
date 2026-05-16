/**
 * Konsument-Fas-1 skeleton — konversations-minne.
 *
 * Tre tabeller per PHASE_1_SKELETON_SKETCH_2026-05-15 §2.3:
 *   - consumer_conversations: en tråd per samtal
 *   - conversation_turns: en tur per användar-yttring + Selvra-svar
 *   - conversation_memory_facts: explicit minnen användaren bett spara
 *
 * Open question (Carl beslutar innan migration körs): ska dessa flyttas
 * till Selvra-protokollet (separat DB) eller ligga kvar i selvra-app:s
 * lokala Drizzle? Skiss-rekommendation är (b) protokollet. Skeleton-
 * placering här är temporär.
 *
 * Skeleton-disciplin: schema-fil bara. Ingen migration körd, ingen
 * drizzle-kit push, ingen DB-impact. När Carl fattar besluten i skissen
 * §4 och Fas 1 faktiskt aktiveras, körs migration.
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'

import { users } from './schema'

// En tråd per "samtal". Kan löpa över dagar/veckor — användaren startar
// ny tråd när hen vill, eller fortsätter i befintlig. Arkivering är
// soft-delete via archivedAt så historik bevaras för audit + SREF-export.
export const consumerConversations = pgTable('consumer_conversation', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'), // ev. auto-genererat efter första tur (LLM-summary)
  startedAt: timestamp('started_at', { mode: 'date' }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { mode: 'date' }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { mode: 'date' }),
})

// En tur = användar-text + Selvra-svar. Selvra-svar är null tills LLM
// returnerat — då uppdateras turen, inte ny tur skapas.
//
// sourcesConsulted är JSON-array av { source_ai_id, event_id, type } så
// källa-attribuering i UI har data att rendera. LLM får INTE skriva
// fritext om källor utan strukturerad referens (constitutional enforcement
// — se DESIGN.md §3 designval 1).
//
// extractionStatus drivs av cron-job /api/cron/extract-facts (migration
// 0005, 2026-05-16). Status-livscykel:
//   - 'pending'   : ny tur, cron plockar upp inom ~10 min
//   - 'processed' : extraction klar (även om 0 facts hittades)
//   - 'failed'    : LLM-fel; cron retry:ar med backoff
//   - 'skipped'   : memory-ack eller fallback-tur som inte ska extraheras
export const conversationTurns = pgTable('conversation_turn', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => consumerConversations.id, { onDelete: 'cascade' }),
  turnIndex: integer('turn_index').notNull(), // monotont stigande inom tråden
  userText: text('user_text').notNull(),
  selvraText: text('selvra_text'), // null tills LLM-svar landat
  sourcesConsulted: jsonb('sources_consulted'), // [{source_ai_id, event_id, type}]
  llmProvider: text('llm_provider'), // 'mistral' | 'anthropic-eu' | etc.
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  extractionStatus: text('extraction_status').notNull().default('pending'),
  extractionAttemptedAt: timestamp('extraction_attempted_at', { mode: 'date' }),
  extractionFailureReason: text('extraction_failure_reason'),
})

export type ExtractionStatus = 'pending' | 'processed' | 'failed' | 'skipped'

// System-prompt-versioner. Lagras i DB så Carl kan iterera under
// Carl-dogfood utan att deploy:a. Senaste isActive=true vinner; cache:as
// per-request i sendMessage. Bara en kan vara aktiv åt gången (UNIQUE
// partial index).
export const systemPromptVersions = pgTable('system_prompt_version', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  version: text('version').notNull(), // ex: 'v0', 'v1', 'carl-2026-05-15'
  promptText: text('prompt_text').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  notes: text('notes'), // varför denna version skapades
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

// V1 conversation_facts (Steg 8 2026-05-15).
// Extraherade facts från samtals-turns. Två typer:
//
//   fact_type='user_stated':
//     Sak användaren själv sagt i samtal som kan vara värdefullt för
//     framtida samtal. Extraheras via extractFactsFromTurn-LLM-call efter
//     varje user-turn. Visas i /minne under "Vad du sagt".
//
//   fact_type='source_observed':
//     Observation från kopplad källa (Garmin, Strava, etc.) som Selvra
//     refererade till i sitt svar. source_name = vilken källa.
//     Visas i /minne under "Vad dina källor visat".
//
// CHECK CONSTRAINT på fact_type sker i migration. Drizzle validerar på
// applikationsnivå när vi insert:ar.
//
// user_deleted_at är soft-delete (samma pattern som conversation_memory_facts).
export const conversationFacts = pgTable('conversation_fact', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  threadId: text('thread_id')
    .notNull()
    .references(() => consumerConversations.id, { onDelete: 'cascade' }),
  turnId: text('turn_id')
    .notNull()
    .references(() => conversationTurns.id, { onDelete: 'cascade' }),
  factText: text('fact_text').notNull(),
  factType: text('fact_type').notNull(), // 'user_stated' | 'source_observed'
  sourceName: text('source_name'), // null för user_stated, namn för source_observed
  extractedAt: timestamp('extracted_at', { mode: 'date' }).notNull().defaultNow(),
  userDeletedAt: timestamp('user_deleted_at', { mode: 'date' }),
})

export type FactType = 'user_stated' | 'source_observed'

// Explicit minnes-fakta. Användaren säger: "Kom ihåg X." Selvra erkänner
// och skapar en rad här. Visas i /minne med radera-knapp per fakta.
//
// validFrom/validUntil ger temporal validity (samma princip som Selvra-
// protokollets events). redactedAt är soft-delete: faktan döljs från
// LLM-context men bevaras för audit + SREF-export-historik.
export const conversationMemoryFacts = pgTable('conversation_memory_fact', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  factText: text('fact_text').notNull(), // användarens egna ord
  sourceTurnId: text('source_turn_id').references(() => conversationTurns.id), // om från samtal
  validFrom: timestamp('valid_from', { mode: 'date' }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { mode: 'date' }), // null = obegränsad
  redactedAt: timestamp('redacted_at', { mode: 'date' }),
})
