# INTENTIONS-PLAN.md — implementation-spec för intentions-input

Genererad efter Steg 0 (pre-implementation reading av `~/selvra/`)
2026-05-10. Detta är konkret instruktion redo att exekvera; ersätter
"Steg 1 + Steg 2" i `.gsd/STATE.md` med specifika filer + payloads.

---

## Findings från Steg 0

**Stort fynd:** Selvra-protokollet har redan en **canonical generisk
event-endpoint** — `POST /v1/subjects/{subject_id}/events`. Den tar
`category` + `event_type` + `payload`. Convenience-routes (memories,
patterns, wellbeing) är tunna wrappers ovanpå.

**Konsekvens:** Ingen ny HTTP-endpoint behövs nödvändigtvis för
intentions. Vi kan posta direkt till generisk events med ett nytt
`event_type`-värde. (Convenience-route är optional polish, defer.)

**Andra fynd:**

- `EventCategory`-enum (`db/models.py`) har inget intention-relevant
  värde. Närmast: `DATA_INGESTED` (passar — användardeklarerad input).
- `event_type`-konvention: `"<scope>.<domain>.<action>"`. Befintliga:
  `stillra.memory.created`, `stillra.wellbeing.snapshot`, etc.
- **Inga hårdkodade event_type-listor** i `projections.py` eller
  `validation/engine.py` — systemet är öppet för nya event_types utan
  per-typ-registrering. ProfileFacts projiceras generiskt.
- Auth: JWT via `Authorization: Bearer <token>`. Claims innehåller
  `tid` (tenant), `subjects` (whitelist), `scopes`, `sub` (källa-ID).
  Verifieras via `selvra.mcp.auth.verify_token`. `MCPScope.WRITE`
  krävs för POST.
- Moderator-pipeline kör på alla writes — kan returnera ACCEPTED (201),
  REQUIRES_USER_REVIEW (202), eller REJECTED (403). Första intentions
  kan trigga moderator-flagga som lärs in vid trust-scoring; värt att
  testa tidigt.
- Subject-modellen: subjects existerar inte som DB-rader. `subject_id`
  är `UUID5(tenant_id, external_subject_id)`. Vi får IDt via
  `POST /v1/subjects` med `external_subject_id` (Carl-string).

---

## Locked design (kan re-litigeras med pushback)

### Path A vs Path B

**Path A (vald för v1):** selvra-app POST:ar direkt till generisk
`/v1/subjects/{id}/events` med nytt `event_type`.

**Path B (deferred):** Lägg till convenience-route
`/v1/subjects/{id}/intentions` likt `memories.py`. Renare URL men kräver
protokoll-PR. Kommer senare; Path A levererar dogfood nu.

### Event-form

```jsonc
// POST /v1/subjects/{subject_id}/events
{
  "category": "data_ingested",
  "event_type": "selvra.intention.declared",
  "source_ai_id": "selvra-app",
  "payload": {
    "intent_type": "self_directed",       // eller "delivery_rhythm"
    "text": "Träna fyra gånger i veckan", // för self_directed
    "value": null,                        // för delivery_rhythm: structured
    "temporal_validity": {
      "valid_from": "2026-05-11T08:00:00Z",
      "valid_until": null                 // null = "fortfarande aktiv"
    },
    "declared_at": "2026-05-11T08:00:00Z"
  }
}
```

För `intent_type: "delivery_rhythm"`, `text` är null och `value` är
strukturerat:

```jsonc
{
  "intent_type": "delivery_rhythm",
  "text": null,
  "value": {
    "rhythm": "sunday_morning",   // | "friday_afternoon" | "before_events" | "custom"
    "custom_description": null    // string när rhythm == "custom"
  },
  "temporal_validity": { ... },
  "declared_at": "..."
}
```

### Namespace

`event_type` använder `"selvra"`-prefix (inte `"selvra_app"`) eftersom
intentioner är användar-deklarerade, inte selvra-app-specifika. Andra
konsumenter av protokollet (framtida vertikal-skal) kan posta samma
`selvra.intention.declared` när de hjälper användaren deklarera.

---

## Implementation-checklist (för nästa session)

### Protokoll-sidan (`~/selvra/`) — MINIMAL ändring

Eftersom generisk endpoint redan finns och inga per-typ-registreringar
behövs, är protokoll-sidans arbete kraftigt mindre än ursprungligen
estimerat. **~1–2 timmar arbete**, kanske inget alls om vi accepterar
att payloaden är `dict[str, Any]` utan strikt validation tills v2.

- [ ] **(Valfritt v1)** Lägg till Pydantic-payload-schema för
      `selvra.intention.declared` i `src/selvra/representation/events.py`
      (efter `ProfileUpdatedPayload`). Två varianter (Union):
      `IntentionSelfDirectedPayload` och `IntentionDeliveryRhythmPayload`.
      Endast för dokumentation + opt-in validering. Inte krävs av
      ingest_event-pathen som accepterar `dict`.
- [ ] **(Valfritt v1)** Lägg till ValidationDetector för
      `selvra.intention.declared` i `validation/detectors/`. Verifierar
      att `intent_type` är en av de två giltiga, `text` finns för
      self_directed, `value.rhythm` finns för delivery_rhythm.
- [ ] **Inget annat protokoll-side krävs för minimal slice.** Generisk
      endpoint accepterar nya event_types out-of-the-box. ProfileFacts
      projiceras generiskt.

### selvra-app-sidan — HUVUDARBETET

- [ ] **Steg A — Get JWT för Carl.** Två vägar:
  - (a) Använda Stillra-readonly-mönstret som referens; skapa en
        ny tenant + JWT manuellt via protokollets admin-väg
  - (b) Tunneln användning av befintligt Stillra-JWT (om scope WRITE)
  - **Verifiera detta först** innan UI byggs. Sannolikt 30 min via
        `~/selvra/`-CLI eller direct DB.
- [ ] **Steg B — `src/lib/protocol/client.ts`:**
  ```ts
  // Server-side helper, läs config från env
  const config = {
    baseUrl: process.env.SELVRA_PROTOCOL_URL!,
    jwt: process.env.SELVRA_PROTOCOL_JWT!,
    subjectId: process.env.SELVRA_SUBJECT_ID!,  // Carl's UUID5
  }

  export async function declareIntention(payload: IntentionPayload) {
    const res = await fetch(`${config.baseUrl}/v1/subjects/${config.subjectId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'data_ingested',
        event_type: 'selvra.intention.declared',
        source_ai_id: 'selvra-app',
        payload,
      }),
    })
    if (!res.ok) throw new Error(`Protocol error: ${res.status}`)
    return res.json()
  }

  export async function listIntentions() {
    // Via snapshot — projektion genererar ProfileFacts som vi filtrerar
    const res = await fetch(`${config.baseUrl}/v1/subjects/${config.subjectId}/snapshot`, {
      headers: { 'Authorization': `Bearer ${config.jwt}` },
    })
    const snapshot = await res.json()
    return snapshot.items.filter((f: any) => f.key?.startsWith('intention.'))
  }
  ```
- [ ] **Steg C — Route `app/onboarding/intentions/page.tsx`** (Client
      Component). Form med:
  - Upp till 5 textfält för self_directed-intentioner
  - 4 radio-options för delivery_rhythm (söndag morgon / fredag em /
    inför events / annan rytm med textfält)
  - Submit-knapp → server action → declareIntention per rad
- [ ] **Steg D — Route `app/onboarding/intentions/confirm/page.tsx`**
      som GETtar och visar tillbaka intentionerna. Round-trip done.
- [ ] **Steg E — Uppdatera landing-sidans `Börja`-knapp** att peka mot
      `/onboarding/intentions` (just nu pekar den till `/onboarding`
      som inte finns).

### Tester / verification (manuell)

- [ ] Carl går till `localhost:3000`, klickar `Börja`
- [ ] Fyller i 3 intentioner + en delivery_rhythm
- [ ] Submit → ser confirm-sidan med samma intentioner tillbaka
- [ ] Kollar `~/selvra/`-DB direkt (eller via curl mot snapshot) att
      events persisterades med rätt struktur

---

## Öppna beslut för nästa session

1. **JWT-acquisition path** för Carl-som-tenant. Lättast: kolla
   `~/selvra/scripts/` för create-tenant-script eller motsvarande.
   Alternativ: använd Stillras existerande JWT om det har WRITE-scope
   mot ett Carl-subject.
2. **Path A vs convenience-route (Path B):** stannar i Path A för v1.
   Om dogfood visar att URL:en `/events` med string-event_type är
   svårjobbad → add `/intentions`-convenience i v2.
3. **delivery_rhythm payload-format:** locked som ovan (`value.rhythm`
   som enum-string + `custom_description` när custom). Kan ändras vid
   implementation om något känns fel.
4. **Validering av temporal_validity:** ska protokollet refusa events
   där `valid_until < valid_from`? Sannolikt ja, men detector kommer
   senare. För v1: trust the writer (selvra-app).
5. **Multiple intent-history:** nya `selvra.intention.declared`-events
   med samma `intent_type` ersätter inte gamla — de blir nya events i
   loggen. ProfileFact-projektionen behöver veta hur "current
   self_directed-list" derived från event-history. Defer till efter
   round-trip funkar; för UI v1 visar vi senaste 5.
6. **Auth-failure-UX:** vad händer om JWT är ogiltigt? Just nu: 500.
   Ska ha snyggt felmeddelande i Steg D, men inte blockande.

---

## Vad detta INTE inkluderar (medvetet)

- Edit / delete / multi-version-hantering av intentioner
- Magic-link auth (kvarstår hardcoded subject_id)
- Onboarding-Steg 1 (landing — done), Steg 4 (källor), Steg 5 (signal)
- Terra-integration
- Synthesis-pipeline (kommer i separat slice)
- Reflektions-rendering
- Convenience-route `/v1/subjects/{id}/intentions` (Path B, deferred)
- Pydantic-validation på protokoll-sidan (frivilligt, low-prio)
