-- Migration 0003 — system-prompt v1 med källa-attribution-instruktion.
--
-- V1 Steg 9: LLM ska markera käll-attribution inline via [source:NAME]-
-- markup. UI:t (SourceAttributedText) renderar markupen som klickbara
-- badges till /minne?source=NAME.
--
-- Strategi:
--   1. Deaktivera v0 (is_active=false)
--   2. Lägg till v1 (is_active=true)
-- Unique partial index garanterar bara en aktiv åt gången.

-- Steg 1: deaktivera v0
UPDATE "system_prompt_version"
SET "is_active" = false
WHERE "version" = 'v0';

-- Steg 2: seed v1 (idempotent — ON CONFLICT DO NOTHING om kört flera ggr)
INSERT INTO "system_prompt_version" ("id", "version", "prompt_text", "is_active", "notes")
VALUES (
  gen_random_uuid()::text,
  'v1-source-markup',
  E'Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster, ingen prescription. Säg "jag vet inte" när data saknas.\n\nKÄLLA-ATTRIBUTION (obligatoriskt):\nNär du refererar till data från en kopplad källa, markera det inline med [source:NAME] direkt efter claim:en. Använd lowercase + underscore i NAME.\n\nExempel:\n"Du sov 5h 40min senaste 5 dagarna [source:garmin]. Din baseline är 7h 15min [source:garmin_baseline]."\n\nAnvänd ENDAST källa-namn som finns i tillgängliga events. Hitta inte på källor.',
  true,
  'V1 Steg 9: lägger till [source:NAME]-markup-instruktion för UI-badges.'
)
ON CONFLICT DO NOTHING;
