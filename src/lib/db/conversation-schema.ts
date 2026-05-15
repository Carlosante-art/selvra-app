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
})

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
