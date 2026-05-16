/**
 * pg-mem-baserad in-memory Drizzle-DB för integration-tester.
 *
 * Vi använder drizzle's `pg-proxy`-adapter istället för `node-postgres`
 * eftersom pg-mem inte implementerar `getTypeParser` som node-postgres
 * kräver. pg-proxy tar bara en callback (sql, params) → rows och
 * bypass:ar pg.Pool helt.
 *
 * Schema deklareras inline (CREATE TABLE) — våra produktions-migrations
 * har DO/EXCEPTION-block som pg-mem inte stöder.
 *
 * Pattern: per-test createTestDb() ger isolerad DB.
 */

import { drizzle } from 'drizzle-orm/pg-proxy'
import { newDb, type IMemoryDb } from 'pg-mem'

import * as conversationSchema from '@/lib/db/conversation-schema'
import * as authSchema from '@/lib/db/schema'

const schema = { ...authSchema, ...conversationSchema }
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

export type TestDb = {
  db: DrizzleDb
  mem: IMemoryDb
  /** Direct SQL — useful för seed/audit i tester. */
  raw: (sql: string) => Promise<void>
  /** Cleanup (no-op för pg-proxy, exists för API-parity). */
  pool: { end: () => Promise<void> }
}

const SETUP_SQL = `
  -- Auth.js tables — minimal (bara user-PK behövs för FK-cascades)
  CREATE TABLE "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text,
    "email" text UNIQUE,
    "emailVerified" timestamptz,
    "image" text,
    "selvra_tenant_id" text,
    "selvra_subject_id" text
  );

  -- Konsument-Fas-1 tabeller
  CREATE TABLE "consumer_conversation" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "title" text,
    "started_at" timestamptz NOT NULL DEFAULT NOW(),
    "last_message_at" timestamptz NOT NULL DEFAULT NOW(),
    "archived_at" timestamptz,
    CONSTRAINT "fk_conv_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
  );

  CREATE TABLE "conversation_turn" (
    "id" text PRIMARY KEY NOT NULL,
    "conversation_id" text NOT NULL,
    "turn_index" integer NOT NULL,
    "user_text" text NOT NULL,
    "selvra_text" text,
    "sources_consulted" jsonb,
    "llm_provider" text,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "extraction_status" text NOT NULL DEFAULT 'pending',
    "extraction_attempted_at" timestamptz,
    "extraction_failure_reason" text,
    CONSTRAINT "fk_turn_conv" FOREIGN KEY ("conversation_id") REFERENCES "consumer_conversation"("id") ON DELETE CASCADE
  );

  CREATE TABLE "system_prompt_version" (
    "id" text PRIMARY KEY NOT NULL,
    "version" text NOT NULL,
    "prompt_text" text NOT NULL,
    "is_active" boolean NOT NULL DEFAULT false,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT NOW()
  );

  CREATE TABLE "conversation_memory_fact" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "fact_text" text NOT NULL,
    "source_turn_id" text,
    "valid_from" timestamptz NOT NULL DEFAULT NOW(),
    "valid_until" timestamptz,
    "redacted_at" timestamptz,
    CONSTRAINT "fk_fact_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_fact_turn" FOREIGN KEY ("source_turn_id") REFERENCES "conversation_turn"("id")
  );

  CREATE TABLE "conversation_fact" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "thread_id" text NOT NULL,
    "turn_id" text NOT NULL,
    "fact_text" text NOT NULL,
    "fact_type" text NOT NULL,
    "source_name" text,
    "extracted_at" timestamptz NOT NULL DEFAULT NOW(),
    "user_deleted_at" timestamptz,
    CONSTRAINT "fk_cf_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_cf_thread" FOREIGN KEY ("thread_id") REFERENCES "consumer_conversation"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_cf_turn" FOREIGN KEY ("turn_id") REFERENCES "conversation_turn"("id") ON DELETE CASCADE
  );
`

/**
 * Skapa ny isolerad in-memory DB med schema upplagt. Returnerar drizzle-
 * instansen + raw-SQL för seed/audit.
 */
export function createTestDb(): TestDb {
  const mem = newDb()

  // Kör schema-setup synkront via pg-mem direct (innan drizzle-callbacken
  // någonsin anropas)
  mem.public.none(SETUP_SQL)

  // pg-proxy-callback: drizzle skickar sql + params. pg-mem's
  // prepare/bind/executeAll-path kraschar med "No execution context" för
  // UPDATE-statements, så vi interpolerar parametrar manuellt och kör
  // via mem.public.query() istället. Acceptabel för test-only kontext
  // (interpolation = SQL-injection-risk i prod).
  //
  // Drizzle's pg-proxy förväntar rows som ARRAY-OF-ARRAYS (positional),
  // inte object-rows. pg-mem returnerar object-rows + fields-metadata,
  // så vi map:ar via fields-ordning.
  const db = drizzle(
    async (sql, params) => {
      const interpolated = sql.replace(/\$(\d+)/g, (_, idx) =>
        formatParam(params[parseInt(idx, 10) - 1]),
      )
      const result = mem.public.query(interpolated)
      const rows = result.rows.map((row: Record<string, unknown>) =>
        result.fields.map((f) => row[f.name]),
      )
      return { rows }
    },
    { schema },
  )

  const raw = async (sql: string): Promise<void> => {
    mem.public.none(sql)
  }

  const pool = { end: async () => {} }

  return { db, mem, pool, raw }
}

/**
 * Manuell SQL-escape för test-only param-interpolation. Hanterar de
 * datatyper drizzle skickar via pg-proxy:
 *   null/undefined → NULL
 *   string → 'escaped'
 *   number → numeriskt
 *   boolean → TRUE/FALSE
 *   Date → 'ISO 8601'::timestamp
 *   object/array → 'json'::jsonb (för sources_consulted m.fl.)
 */
function formatParam(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date) {
    // Strip 'Z' så pg-mem tolkar som timestamp utan tz istället för timestamptz.
    const iso = value.toISOString().replace('Z', '')
    return `'${iso}'`
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value).replace(/'/g, "''")
    return `'${json}'::jsonb`
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Seed:a en testanvändare i user-tabellen. Returnerar userId.
 * Användbart för tester som behöver giltig FK till user.id.
 */
export async function seedUser(
  testDb: TestDb,
  opts: { email?: string; id?: string } = {},
): Promise<string> {
  const id = opts.id ?? crypto.randomUUID()
  const email = opts.email ?? `${id}@test.local`
  await testDb.raw(
    `INSERT INTO "user" ("id", "email") VALUES ('${id}', '${email}')`,
  )
  return id
}
