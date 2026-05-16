-- 0004: Skala-förberedande indexes på conversation_fact.
--
-- Identifierat av skalbarhets-audit 2026-05-16 (se
-- .gsd/SCALING_AUDIT_2026-05-16.md). Vid 20k+ MAU blir conversation_fact
-- tabellen miljon-stor. Befintliga indexes (idx_facts_user, idx_facts_thread,
-- idx_facts_user_type) räcker för enkla lookup men `listConversationFactsForUi`
-- sorterar på extracted_at DESC och filtrerar ofta på source_name — bägge
-- triggar full scan utan composit-index.
--
-- Idempotent (IF NOT EXISTS) så safe att re-applya.

CREATE INDEX IF NOT EXISTS "idx_facts_user_type_extracted_at"
  ON "conversation_fact" ("user_id", "fact_type", "extracted_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_facts_user_source_extracted_at"
  ON "conversation_fact" ("user_id", "source_name", "extracted_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_facts_thread_extracted_at"
  ON "conversation_fact" ("thread_id", "extracted_at" DESC);
