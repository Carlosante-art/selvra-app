# Strategic Future Positioning — Selvras 3-5-årsperspektiv

**Status:** Strategisk lärdom från Nivå 1.5-diskussion 2026-05-12.
Cementerar distinktionen mellan **framtids-position** och **leverans-
mekanik**. Inte feature-roadmap — arkitektonisk klarhet om vad som
faktiskt bygger Selvras 2029-position.

**Trigger:** Carl övervägde browser-extension (Nivå 1.5) som svar på
copy-paste-friktion. Push-back blev till bredare strategisk fråga:
*är Selvra byggt för framtiden eller för nuet?*

---

## Slutsatsen

**Selvras arkitektur är redan framtids-positionerad.** MCP, SREF v1,
EU-deployment, constitutional reasoning, multi-source-aggregation,
lock-positioner som arkitektoniska commitments — alla är *strukturella*
beslut som skalar mot 2027-2028 när AI-personal-kategorin konsolideras.

Vad som saknas för framtids-position är **inte fler leverans-mekanismer**.
Inte browser-extension. Inte mobile-app-rewrite. Inte Notion-integration.
Inte ytterligare context-engine-nivåer.

Vad som saknas är fyra distinkta strategiska arbetspår:

---

## Arbetspår 1 — Validerad produkt på icke-Carl-användare

**Strukturell sanning från mega-review R7:** Brev v0.2 fungerar för Carl
(n=1). Hela tesen vilar på antagandet att Carls upplevelse generaliserar.

**Validering är arbete för 2026, inte 2027.** Tills tesen är validerad
finns ingen produkt — bara hypotes med vacker arkitektur.

**Status:** Imperativ 1 från mega-reviewen. Trigger: efter AB + brev v0.3
mot full data. 5-10 beta-users i 4-6 veckor. Tre mått (resonans + retention
+ intent-to-pay). Lockat.

## Arbetspår 2 — Etablerad kategori-position via content/distribution

**Mind-share för kategori-definition byggs i åratal innan kategorin är
hett.** När mainstream upptäcker AI-memory-portability 2028 ska Selvras
namn redan vara associerat med kategorin.

**Konkret:**
- `selvra.ai/journal` som editorial newsletter (veckovis, tankar om
  självobservation, gap-detektering, personlig epistemologi)
- Bygg-i-public-närvaro (X/Mastodon, edited, inte spam)
- Are.na-channel `selvra-observation` (citat, bilder, referenser)
- Skriv om observation-vs-coaching, om personlig epistemologi
- Etablera dig som tänkare i kategorin, inte säljare av produkt

**Tidsestimat:** 6 månaders content-arbete innan publik launch, sedan
veckovis. Parallellt med kod-arbete, inte sekventiellt.

**Status:** Imperativ 2 från mega-reviewen. Carls eget arbete, inte
Claude Codes. Inte påbörjat 2026-05-12. Största enskilda strategiska gap.

## Arbetspår 3 — Protocol-evangelisering av SREF som öppen standard

**Protocol-emergence är 15% sannolikhet enligt mega-reviewen — men du kan
höja sannolikheten genom att aktivt evangelisera formatet.**

**Konkret:**
- Publicera SREF v1-specifikationen som öppen format (selvra.ai/sref-spec)
- Skriv white paper om varför portabel personlig representation behövs
- Bjud in andra utvecklare att läsa Selvra-data via SREF
- Demonstrera cross-vendor-användning: Stillra, Selvra-app, framtida tredje-parts-apps
- Submita SREF som diskussionsdokument till relevant forum (Anthropic
  MCP-community, W3C personal data working groups, etc.)

**Värdet:** Om SREF blir genuine industry-standard innan AI-giganterna
konsoliderar, blir Selvra-as-protocol-stewards en 10-årig värdetillväxt-
position. Det är *Stripe-för-personal-AI-representation*-scenariot från
Scenario C i mega-reviewen.

**Tidsestimat:** 6-12 månaders evangeliserings-arbete för att etablera
mind-share i developer-communities.

**Status:** Inte påbörjat. Beredd att starta efter AB-launch + första
ostvalidering av tesen. SREF v1-implementation finns redan; saknas är
*publicering* + *advocacy*.

## Arbetspår 4 — Strategiska relationer med AI-ekosystem

**Inte sälja in. Inte söka samarbete formellt. Bara finnas i orbit.**

**Konkret:**
- Skriva om MCP-protokollet (Anthropics standard) i `selvra.ai/journal`
- Bidra till Anthropics MCP-community (open-source-bidrag, forum-närvaro)
- Vara känd som "personen som byggt EU-sovereign personal context-protocol"
- När Anthropic / OpenAI / Apple bygger native multi-source-connectors 2027
  ska de känna till Selvra

**Tre potentiella utfall, alla värdefulla:**
- *Inspiration:* Anthropic citerar Selvras SREF i sin egen design
- *Partnership:* explicit samarbete kring portability-standard
- *Acquisition:* Selvra köps för dess SREF-protokoll + EU-position

**Tidsestimat:** 12-24 månaders relations-bygge. Inte snabbt resultat-
producerande, men hög option-värde över tid.

**Status:** Inte påbörjat. Inte tid för det förrän validering finns (annars
finns inget att stå för).

---

## Vad som INTE saknas

**Leverans-mekanik.** Browser extensions, mobile native apps, additional
context-engine-nivåer, Notion-integrationer, fler vertikaler.

Detta är *bygg-arbete* som tjänar distribution och friktion. Det är inte
*position-arbete* som tjänar 2029-positionen.

**Tre regler för leverans-mekanik:**

1. **Bygg ALDRIG en leverans-mekanism innan grund-produkten är validerad.**
   Bygger du browser-extension innan brev v0.3 är validerat på icke-Carl,
   bygger du distribution för en produkt som kanske inte fungerar.

2. **Leverans-mekanik är tjänst för befintliga users, inte mind-share-
   bygge.** En extension går inte viral. Den löser friktion för redan-
   converterade users.

3. **Leverans-mekanik är reversibel. Position är inte.** Du kan alltid
   bygga browser-extension senare. Du kan inte bygga 18 månaders mind-share
   senare.

---

## Hur arbetspåren förhåller sig till lock-positioner och imperativ

| Arbetspår | Bygger... | Trigger | Tids-horisont |
|---|---|---|---|
| 1. Validering | Imperativ 1 + R7-mitigation | Efter AB + brev v0.3 | 4-6 veckor från trigger |
| 2. Distribution | Imperativ 2 + R9-mitigation | Direkt, parallellt med AB-wiring | 6+ månader kontinuerligt |
| 3. SREF-evangeliering | Scenario C-sannolikhets-höjning | Efter AB + grundläggande validering | 6-12 månader |
| 4. AI-ekosystem-relationer | Scenario C + Scenario E (acquisition) | Efter (3) — du behöver något att stå för | 12-24 månader |

Lock-positionerna och de 8 canonical-fraserna är *arkitektoniska
commitments*. De är redan klara.

Imperativen är *strategiska guardrails*. De skyddar mot prematura drag.

Arbetspåren är *aktiv-arbete-för-position*. De byggs över år, inte veckor.

---

## En operativ regel som följer

**Före varje nytt bygg-arbete: fråga vilket av de fyra arbetspåren det
tjänar.**

- Om det inte tjänar något av dem → fråga varför du bygger det
- Om det tjänar "validering" men du har inte validerat än → bygg det
- Om det tjänar "distribution" men du har ingen att distribuera till än
  → vänta
- Om det tjänar "leverans-mekanik" och grundprodukten inte är validerad
  → vänta

Nivå 1.5 (browser-extension) failade test 4: tjänar leverans-mekanik
för validering som inte ännu skett. Därför inte byggd nu.

---

## Carls slutsats (ordagrant)

> "Selvra ska finnas där 2029. Men 'finnas där' byggs inte genom att bygga
> framtidens leverans-mekanik nu. Det byggs genom att vara den seriösa,
> validerade, kategori-definierande aktören när framtiden anländer.
>
> Bookmarklet för copy-paste-friktion. Brev v0.3 för validering. selvra.ai/
> journal för distribution. SREF för protocol-emergence.
>
> Det är vägen till 2029-position. Inte browser extension 2026."

---

## Vad detta dokument inte är

- **Inte feature-roadmap.** Konkret bygg-arbete styrs av AB-checklist +
  trigger-disciplinen i Context Engine + Source Strategy V2.
- **Inte garanti.** Strategi möter verklighet och förändras. Revisita
  detta dokument när nya data finns (post-brev-v0.3-validering är
  naturlig checkpoint).
- **Inte avskräckning från taktisk friktions-lösning.** Bookmarklet för
  Carls egen copy-paste-friktion byggs separat (2-3h). Det är personlig
  bekvämlighet, inte produkt-positionering. Olika kategori.
