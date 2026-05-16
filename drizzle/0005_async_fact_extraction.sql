-- 0005: Async fact-extraction via pending-status + cron.
--
-- Skalbarhets-audit 2026-05-16 visade att synchron extractFactsFromTurn-call
-- efter varje user-turn dubblar latensen (5-7s istället för 3-4s) och kostar
-- 50% mer än nödvändigt (varje turn skickar shared system-prompt + 3 few-
-- shots = ~600 tokens overhead). Batch-extraktion via cron amortiserar
-- prompt-overhead över N turns.
--
-- Designval:
--   - extraction_status drivs av cron, inte av stream-pipeline
--   - default 'pending' för nya turns; existerande backfillas till 'processed'
--     eftersom de redan gått igenom inline extraction
--   - 'skipped' för turns som inte ska extraheras (fallback-text, memory-ack)
--   - 'failed' för LLM-fel; cron retry:ar med exponential backoff på
--     extraction_attempted_at
--
-- Idempotent: IF NOT EXISTS + DO/EXCEPTION på constraints.

DO $$ BEGIN
  ALTER TABLE "conversation_turn"
    ADD COLUMN "extraction_status" text NOT NULL DEFAULT 'pending';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_turn"
    ADD COLUMN "extraction_attempted_at" timestamp with time zone;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_turn"
    ADD COLUMN "extraction_failure_reason" text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_turn"
    ADD CONSTRAINT "extraction_status_check"
    CHECK ("extraction_status" IN ('pending', 'processed', 'failed', 'skipped'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Cron-query: hitta N oldest pending turns. Index på (status, created_at).
CREATE INDEX IF NOT EXISTS "idx_turn_extraction_pending"
  ON "conversation_turn" ("extraction_status", "created_at")
  WHERE "extraction_status" IN ('pending', 'failed');

-- Backfill: existerande rader har redan extraherats inline (eller är
-- memory-ack/fallback som inte ska extraheras). Sätt 'processed' så
-- cron inte plockar upp dem.
UPDATE "conversation_turn"
  SET "extraction_status" = 'processed'
  WHERE "extraction_status" = 'pending'
    AND "selvra_text" IS NOT NULL;

-- Memory-ack-turns (selvra_text IS NOT NULL men kort) får också processed —
-- de extraheras inte (ingen användar-fakta att plocka).
UPDATE "conversation_turn"
  SET "extraction_status" = 'skipped'
  WHERE "extraction_status" = 'pending'
    AND "selvra_text" IS NULL;
