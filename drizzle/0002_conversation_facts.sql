-- V1 Steg 8: conversation_fact table för extracted facts från samtals-turns.
-- Idempotent: IF NOT EXISTS + DO/EXCEPTION-wrapping på constraints.

CREATE TABLE IF NOT EXISTS "conversation_fact" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "thread_id" text NOT NULL,
  "turn_id" text NOT NULL,
  "fact_text" text NOT NULL,
  "fact_type" text NOT NULL,
  "source_name" text,
  "extracted_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "user_deleted_at" timestamp with time zone
);

DO $$ BEGIN
  ALTER TABLE "conversation_fact"
    ADD CONSTRAINT "fk_fact_user"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_fact"
    ADD CONSTRAINT "fk_fact_thread"
    FOREIGN KEY ("thread_id") REFERENCES "consumer_conversation"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_fact"
    ADD CONSTRAINT "fk_fact_turn"
    FOREIGN KEY ("turn_id") REFERENCES "conversation_turn"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_fact"
    ADD CONSTRAINT "fact_type_check"
    CHECK ("fact_type" IN ('user_stated', 'source_observed'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_facts_user" ON "conversation_fact" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_facts_thread" ON "conversation_fact" ("thread_id");
CREATE INDEX IF NOT EXISTS "idx_facts_user_type" ON "conversation_fact" ("user_id", "fact_type");
