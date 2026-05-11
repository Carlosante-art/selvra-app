# Subject-aliasing: cross-tenant identitet för samma fysiska person

**Status:** Öppen arkitektonisk fråga.
**Identifierad:** 2026-05-11 under Source Strategy Pivot-verifiering.
**Inte blocker för v1.** Måste lösas innan synthesis-pipeline byggs.

---

## Problemet

Samma fysiska person (Carl) har **två olika `subject_id` i Selvra**:

| Tenant | subject_id | Härkomst |
|---|---|---|
| Stillra (`7c8e4a3d-...`) | `b3a87256-274c-5c87-a73c-3a4e3229eeac` | `UUID5(STILLRA_TENANT, carls_stillra_user_id)` |
| Selvra App Carl (`312f157b-...`) | `2bfe0414-56c6-5692-8ef3-9c7d3991fe90` | `UUID5(SELVRA_APP_TENANT, "carl")` |

Detta är **byggt in i `derive_subject_id`-funktionen** i
`~/selvra/src/selvra/http/dependencies.py`:

```python
SELVRA_SUBJECT_NAMESPACE = uuid.UUID("0a0e8d54-3f2a-4b7c-9e91-1d3c5fb6a1d8")

def derive_subject_id(tenant_id, external_subject_id):
    composite = f"{tenant_id}:{external_subject_id}"
    return uuid.uuid5(SELVRA_SUBJECT_NAMESPACE, composite)
```

Olika `tenant_id` → olika `subject_id` för samma fysiska person. Det är
en feature (tenant-isolation), inte en bug — men det betyder att
selvra-app-perspektivet och Stillra-perspektivet på Carl är två
separata representations utan inbyggd länk.

---

## Varför det inte är blocker för v1

För intentions-input och tankar-yta i selvra-app behövs ingen
cross-tenant-relation. Carl deklarerar intentioner under selvra-app-subject;
de lever där, isolerade i Selvra-App-tenanten.

Brev-format-rendering, källtoggling i selvra-app, Open Wearables-koppling
till Garmin via selvra-app — allt fungerar med en enda subject_id
(selvra-app:s `2bfe0414-...`).

---

## När det blir blocker

**Synthesis-pipelinen.** När Selvras synthesis ska generera ett brev som
**kombinerar** intention/tanke från selvra-app *och* glukos-data från
Stillra-Supabase, måste den veta:

> "selvra-app:s `2bfe0414-...` och Stillras Carl-data är samma människa."

Path C (cross-DB-read mot Stillra-Supabase) löser detta delvis — synthesis
kan hårdkoda en aliasing-mapping eller använda en separat alias-tabell.
Men frågan är arkitektonisk, inte taktisk: **var i protokollet ska
subject-aliasing leva?**

---

## Möjliga lösningar (att utvärdera senare)

### Alternativ 1 — Subject Alias-tabell i Selvra-protokollet

Ny tabell `subject_aliases (alias_subject_id, primary_subject_id, alias_type)`.
Synthesis och cross-tenant-queries traverserar aliaser explicit.

- Pro: Doktrinärt rent (representation = canonical, aliaser är metadata).
- Pro: Stöder fler-än-två-aliaser för samma person (framtida vertikaler).
- Con: Ny tabell + endpoints + eventuella consent-implikationer.

### Alternativ 2 — Subject-aliasing via SREF

SREF v1 (portable representation export) håller redan all data för en
person. Synthesis tar SREF som input istället för subject_id. Aliasing
sker vid SREF-konstruktion (samla från flera subject_ids).

- Pro: Återanvänder existerande SREF-arkitektur.
- Pro: User-controlled (hen exporterar sin egen samlade representation).
- Con: SREF är tunglast än direkt-query.

### Alternativ 3 — External identity som primär nyckel

Stillras `user_id` och selvra-app:s `external_subject_id` mappas till
en gemensam human-id. Tenant blir scope, inte identity-owner.

- Pro: Stark match mot doktrin ("användaren äger sin representation").
- Con: Bryter existerande `derive_subject_id`-kontrakt. Migration-arbete.

### Alternativ 4 — Hardcoded mapping i synthesis-konfiguration

För Carl-only-dogfood: synthesis-prompt vet "subject `2bfe0414-...` har
Stillra-alias `b3a87256-...`". Inget protokoll-arbete.

- Pro: Trivial att implementera, räcker för dogfood.
- Con: Skalmodell är dålig. Ej acceptabel för multi-user.

---

## Beslut 2026-05-11 (Carl)

**v0: Alternativ 4 — hardcoded mapping.** Låst som accepterad teknisk
skuld för Carl-only-dogfood och första synthesis-pipeline-skissen.

**v1 (innan publik release): Alt 1/2/3 — formell lösning.** Beslutet
mellan alias-tabell, SREF-as-input, eller external-identity-som-primär
tas innan publika användare onboardas.

### ⚠️ Explicit teknisk skuld

Hardcoded subject-mapping är **okej för Carl-only-dogfood** (1 användare,
2 subject_ids, 1 mapping-rad i synthesis-konfiguration). Det är **inte
okej** för 100 användare där varje ny user kräver:

- Nya hardcoded entries i synthesis-koden
- Manuell sync mellan selvra-app-onboarding och Stillra-user-mapping
- Risk för glömda mappings → reflektioner blir tomma utan att fail-loud

**Måste ersättas med Alt 1/2/3 innan första externa användare.** Bevaka
denna doc — uppdatera när formell lösning väljs och implementeras.

---

## Status

- [x] Problemet identifierat (2026-05-11)
- [x] Beskrivet i decisions-katalog (2026-05-11)
- [x] v0-lösning vald: **Alt 4 hardcoded** (2026-05-11, Carl-beslut)
- [x] **v1-lösning vald: Alt 1 — subject_aliases-tabell** (2026-05-11)
- [x] **Alt 1 implementerad** (2026-05-11) — migration 0009, SubjectAlias-model,
      subject_aliasing-helpers, reflection_synthesis wired med fallback för
      transition-säkerhet. Carls alias seedad i prod (b3a87256-... →
      2bfe0414-..., type=stillra, metadata.stillra_user_id=12647887-...).
- [ ] **HTTP admin-route** för programmatisk alias-create (POST
      /v1/subjects/{primary}/aliases) — krävs när onboarding-flödet ska
      provisionera aliaser för nya users. Inte v1-blocker — Carls alias är
      seedad direkt via railway-run-script under v0.
- [ ] **RLS / audit-policy för cross-tenant lookups** — tabellen är medvetet
      ej-RLS-isolerad (designkrav), men service-role-design + audit-logg är
      pending innan publik release.
- [ ] **Ta bort CARL_STILLRA_USER_ID_FALLBACK** i reflection_synthesis när
      alias-rad verifierat stabilt i prod (~efter en veckas dogfood utan
      fallback-warnings).
