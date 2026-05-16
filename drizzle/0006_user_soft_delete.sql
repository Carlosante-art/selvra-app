-- 0006: User-account soft-delete med 30-dagars restore-window + cron-cleanup.
--
-- Audit-fix 2026-05-16 (item #18): deleteUserAccount hard-deletade utan
-- restore-möjlighet. GDPR Art. 17 är OK med "raderat-on-request" men
-- support-burden blir hög när user ångrar sig efter 1-2 dagar.
--
-- Strategi: deleted_at-flag på user-tabellen. Ny soft-delete-flow:
--   1. POST /api/account/delete sätter deleted_at = NOW()
--   2. Sessions invalideras → user kan inte längre använda appen
--   3. Auto-restore om user login:ar med magic-link inom 30 dagar
--      (events.signIn clear:ar deleted_at)
--   4. Cron (daily kl 04 UTC) hard-deletar user-rader där
--      deleted_at < NOW() - 30 days → CASCADE plockar resten
--
-- Audit-fix item #10 (samma migration): cron hard-deletar också:
--   - conversation_fact där user_deleted_at < NOW() - 30 days
--   - conversation_memory_fact där redacted_at < NOW() - 30 days
--
-- Index på deleted_at för effektiv cleanup-query vid skala.

DO $$ BEGIN
  ALTER TABLE "user"
    ADD COLUMN "deleted_at" timestamp with time zone;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Partial index — bara soft-deleted rader behöver indexeras för cron-query.
-- Aktiva users (deleted_at IS NULL) är majoriteten och behöver inte tas
-- med i index-bloat.
CREATE INDEX IF NOT EXISTS "idx_user_deleted_at"
  ON "user" ("deleted_at")
  WHERE "deleted_at" IS NOT NULL;

-- Index för fact-cleanup (motsvarande på conversation_fact + memory_fact).
-- Partial igen för bloat-minimering.
CREATE INDEX IF NOT EXISTS "idx_conv_fact_user_deleted_at"
  ON "conversation_fact" ("user_deleted_at")
  WHERE "user_deleted_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_memory_fact_redacted_at"
  ON "conversation_memory_fact" ("redacted_at")
  WHERE "redacted_at" IS NOT NULL;
