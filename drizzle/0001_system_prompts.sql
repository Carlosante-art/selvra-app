-- Migration 0001 — system-prompt-versionering i DB.
--
-- Carl-dogfood-iterations-loopen kräver att system-prompten kan ändras
-- utan deploy. Versioner sparas här; senaste isActive=true vinner.

CREATE TABLE IF NOT EXISTS "system_prompt_version" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"prompt_text" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Partial unique index: max EN aktiv version åt gången. Lägg en ny
-- aktiv version → uppdatera gammal till is_active=false först (Server
-- Action ansvarar; index ger DB-side garanti).
CREATE UNIQUE INDEX IF NOT EXISTS "system_prompt_version_active_unique"
  ON "system_prompt_version" ("is_active")
  WHERE "is_active" = true;

-- Seed v0 (samma text som hardcoded SYSTEM_PROMPT_V0 i sendMessage tidigare)
INSERT INTO "system_prompt_version" ("id", "version", "prompt_text", "is_active", "notes")
VALUES (
  gen_random_uuid()::text,
  'v0',
  'Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.',
  true,
  'Initial baseline — seedad vid migration 0001. Iterations sker via INSERT ny version + sätt is_active=true.'
)
ON CONFLICT DO NOTHING;
