# Selvra-app — fortsatt arbete

**Kontext: var vi är, vad som händer härnäst**

---

## Var Selvra-app står just nu

Pipeline klar och levererande. End-to-end-loop:
intentioner + tankar + Dexcom → Claude Opus → reflektion-event → projection → HTTP → /brev.

Brev v0.2 visar **dokumenterad cross-layer-observation**: kroppens glukos-cykel (82→58→95% över 10 mmol/L) korsade tematiskt med "rörelse-mot-något"-formuleringen exakt under veckans mest intensiva fysiologiska arbetsperiod. Det är mönster Carl inte själv såg. Det är vad doktrinen lovade.

Gap-tesen är empiriskt bevisad **för den datamängd som finns**. Begränsningen är inte arkitektur eller prompt. Det är **att Selvra bara har en av tre primära datakällor som matchar Carls intentioner**.

Carls fem intentioner deklarerade i Lager 1:

1. "Träna 3 gånger i veckan" — kräver träning-data (saknas)
2. "Sova 7 timmar" — kräver sömn-data (saknas)
3. "Ha intention när jag gör något" — kräver kontextdata (delvis fångad i tankar-yta)
4. Glukos-relaterat (täcks av Dexcom via Path C, klart)
5. Leverans-tajming (delivery_rhythm, intern)

Tre av fem intentioner saknar matchande Lager 3-data. Det betyder Selvra inte kan generera fullständiga cross-layer-observationer för 60% av Carls deklarerade liv. Brev v0.2 var skarp för det substrat som fanns. Nästa brev kräver mer substrat.

---

## Nästa konkret steg — Open Wearables Fas 2-5

Per pivot-dokument i ~/selvra-app/.gsd/decisions/SOURCE_STRATEGY_PIVOT_2026-05-11.md.

Mål: koppla Garmin via Open Wearables så att träning-events och sömn-events flödar in i Selvras event-log under Carls subject_id. Då matchar tre av fem intentioner sin datakälla.

Fas 2: Deploya Open Wearables-instans på samma infrastruktur som Selvra-protokollet (Frankfurt-region, samma stack: FastAPI + PostgreSQL + Redis + Celery). Admin-konto. API-keys.

Fas 3: Koppla Open Wearables-webhooks till Selvras http-fasad. Mapping från Open Wearables event-schema till SelvraEvent-format. Provenance: source = "open-wearables", specific_provider = "garmin". ComplianceModerator-pass per existerande pattern. Persist till event-log.

Fas 4: Selvra-app källtoggling-vy per DESIGN.md Steg 4. "Kropp och aktivitet" → koppla Garmin via Open Wearables. OAuth-flöde, callback, bekräftelse.

Fas 5: Carl kopplar sin Garmin Connect. Events flödar in. Verifiera mot subject_id 2bfe0414-... att activity_events och sleep_events finns med rätt provenance.

Tids-skala: dagar, inte veckor. Carl och Claude Code bygger snabbt.

---

## Subject-aliasing — pending teknisk skuld

Alt 4 hardcoded räcker för Carl som single user. Innan v1 publik release måste detta lösas formellt — antingen Alt 1 (subject_alias-tabell i Selvra-protokoll), Alt 2 (UUID5-derivation från extern identitet), eller Alt 3 (event-baserad aliasing).

Detta blockerar inte Open Wearables-arbete. Carl är fortfarande single user. Subject-aliasing-frågan dokumenterad i ~/selvra-app/.gsd/decisions/SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md.

Flagga som blocker innan publik release.

---

## Auto-trigger — söndag-cron

Per STATE.md next-kandidat 1. När Open Wearables är klar och brev v0.3 testas mot fullständig datamängd: bygg söndag-cron i protokoll-lagret som triggar reflection_synthesis automatiskt. Manuell trigger-knapp i selvra-app behålls som override.

Detta är **efter** Open Wearables, inte parallellt. Skälen:

1. Auto-trigger mot ofullständig data är inte värdefullt — du fortsätter generera brev som missar 60% av intentionerna.
2. Söndag-cron som infrastruktur kan vänta. Manuell trigger räcker för iteration.
3. När Garmin-data flödar in kommer brev v0.3 sannolikt kräva prompt-iteration igen. Bättre att iterera prompten manuellt först, sen automatisera när formatet stabiliserats.

---

## Vad som inte ska göras i denna fas

Tre saker explicit ute scope:

**1. Subject-aliasing-formalisering.** Pending teknisk skuld, dokumenterad. Inte blocker för Carl. Löses innan publik release, inte före Open Wearables.

**2. Spotify, Calendar, Mail-integrationer.** Per source-strategi-doc, dessa är post-Open-Wearables. Inte parallellt.

**3. Synthesis-pipeline arkitektur-ändringar.** Pipelinen fungerar. Iterationer sker i prompten, inte i koden. Om prompt-iteration mot fullständig data avslöjar att Claude Opus inte räcker — då utvärderas Claude Opus 4.5 eller annan modell. Inte före.

---

## Vad Carl behöver göra nu

Inget tekniskt. Dogfood-veckan har startat. Carl skriver tankar när de uppstår, lever med de fem intentionerna, samlar substrat. När Open Wearables-deployment är klar och Garmin är kopplad: brev v0.3 genereras mot fullständig datamängd.

Då blir det första riktiga test av Selvras tes — kan reflektion-motorn observera mönster mellan intention, tanke, kropp (Dexcom), aktivitet (Garmin) och sömn (Garmin) som Carl inte själv såg?

Om ja: lås doktrinen. Skala till andra användare när subject-aliasing är formaliserad. Iterera Selvra-protokollets vertikaler.

Om nej: iterera prompten, möjligen arkitektur, möjligen doktrinen själv.

Inte förrän dess.

---

## Långsiktigt — vad detta arbete bygger mot

Selvra-app v1 publik release förutsätter:

1. Open Wearables full integration (denna fas)
2. Subject-aliasing formalisering
3. Auto-trigger på leverans-tajming
4. Dogfood-vecka validerad med fullständig data
5. Källtoggling för Calendar och Spotify
6. Möjlighet att skala till 10-50 externa power-users

Det är **veckor av fokuserat arbete**, inte månader. Selvra-protokollet är klart. Pipelinen är klar. Det som återstår är **kompletta integrationer + validering med riktiga användare**.

Forsyne, Stillra, Motiq står som existerande eller publicerade vertikaler. Selvra-app är konsument-yta ovanpå samma protokoll. När detta är klart har Selvra:

- Bevisad reflektion-motor (brev v0.2 första bevis)
- Multi-source aggregation (efter Open Wearables)
- Cross-layer-observation (efter fullständig data)
- Konsument-app (efter v1 stabilisering)
- Existerande vertikaler som beviser protokollets bredd

Det är fundament för publik kommunikation 2026 Q3-Q4 och funding-pitch 2027.

---

**Nästa drag: bygg Open Wearables Fas 2-5. Kör nu. Lås doktrinen efter.**
