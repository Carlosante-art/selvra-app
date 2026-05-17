# iOS-appens primära jobb

**Datum:** 2026-05-17
**Status:** Strategisk avgränsning. Låst innan implementation.
**Trigger:** iOS-appen är planerad och flera designdokument finns (HealthKit-sync, Apple Sign-in coexistens, Bearer-JWT). Detta dokument låser *vad appen är* innan teknisk arkitektur designas vidare. Allt teknik-arbete granskas mot denna avgränsning.

---

## 1. Appens primära jobb

**iOS-appens enda primära jobb är att gå från "person med iPhone" till "person vars LLM-assistent vet om hen" på under tre minuter.**

Allt annat — datavisualisering, mönsterredovisning, samtal med Selvra själv, vackra animationer — är distraktioner från det primära jobbet om de adderar tid till första-gångs-flödet.

---

## 2. Vad appen är

- **Onboarding-ramp till protokollet** — vägen in för icke-tekniska användare
- **Källkoppling-verktyg** — primärt HealthKit, sekundärt andra
- **Token-utfärdare till AI-klienter** — Claude, ChatGPT, Cursor, Goose, etc.
- **Översikts-vy över aktiva anslutningar** — vad är kopplat just nu, vem har access
- **Kontrollpanel för revocation och radering** — användarens kontrollyta för sin representation

Det är fem konkreta jobb. Var och en motiverat av att användaren behöver göra det och ingen annan plats är rimligare.

---

## 3. Vad appen inte är

- **Inte chat-yta** — konversation lever utanför Selvra. iOS-appen har ingen samtalsfunktion mot Selvra själv. Allt samtal sker i Claude/ChatGPT/Cursor/Goose.
- **Inte mönster-visualiserings-dashboard** — kan finnas som sekundär funktion, men är inte appens primärjobb. Användaren ska kunna se vad Selvra ser, men inte tvingas till det.
- **Inte coaching eller insikts-produkt** — insikt är användarens (ontologi-rad 5). Selvra observerar, användaren tolkar.
- **Inte primär plats för dagligt-användande** — om vi måste mäta DAU för att rättfärdiga arbetet, är vi i fel produkt.
- **Inte konkurrent till Claude/ChatGPT** — vi är infrastruktur som gör dem mer användbara, inte ersättning.

Detta är konsistent med tidigare beslut: konversation lever utanför Selvra. iOS-appen är *infrastruktur-yta*, inte *innehålls-yta*.

---

## 4. Success-metrik för iOS-app

### Inte mätbart för framgång

- Tid i appen
- Dagliga aktiva användare (DAU)
- Sessioner per vecka
- Engagement-score
- Notification-CTR
- Retention-cohorts på 7/30/90 dagar

Dessa är konventionella app-metrics och oss ovidkommande. Att mäta dem skulle dra produkten i fel riktning.

### Mätbart för framgång

- **Antal användare som verifierat AI-anslutning inom 7 dagar efter install** — primärt mått, eftersom det är appens enda jobb
- **Antal aktiva anslutningar per användare över tid** — växer = representationen blir mer värdefull
- **Frekvens av revocation** — lågt = trust hög, högt = trust låg. Båda är signaler om hur väl konceptet landar
- **Audit-log-aktivitet från anslutna AI-system** — det är där värdet faktiskt skapas, i AI-konversationerna utanför appen

Mätningen reflekterar produktens position: **framgång är hur ofta användaren *slipper* använda Selvra-appen efter setup.**

---

## 5. Post-onboarding-upplevelse

Efter första-gångs-flöde är klart, vad gör användaren i appen?

### Prioriteringsordning

1. **Kolla att anslutningar fortfarande är aktiva** (gå till `/connections`)
2. **Lägga till nya källor när livet förändras** (gå till käll-koppling)
3. **Återkalla access om hen får dålig känsla**
4. **Eventuellt: kolla "vad ser Claude när den läser min representation just nu"** — transparens-funktion (designas i v2, inte krav för v1)

### Cadence

Användaren ska *inte* behöva öppna Selvra dagligen. Inte heller veckovis. Månadsvis är mer realistiskt. Appen är *passiv infrastruktur*, inte *aktiv produkt*.

Detta är medvetet mot konvention. De flesta appar mäter framgång i DAU/MAU. Selvra mäter framgång i *värde levererat utanför appen*. När användaren har glömt att Selvra finns men ChatGPT fortfarande svarar med kontext om hennes sömn och träning — då lyckas Selvra.

---

## Referenser

- [`FRICTION_MINIMIZATION_PRINCIPLE_2026-05-17.md`](FRICTION_MINIMIZATION_PRINCIPLE_2026-05-17.md) — huvudprincip om friktion som arkitektonisk constraint
- [`FRICTION_MAP_2026-05-17.md`](FRICTION_MAP_2026-05-17.md) — konkret kartläggning per friktionspunkt
- [`SELVRA_APP_ROLE_2026-05-17.md`](SELVRA_APP_ROLE_2026-05-17.md) — parallell formulering på klient-rollen
- [`SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md`](SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md) — implementations-plan (granskas mot detta dokument)
- [`IOS_HEALTHKIT_SYNC_DESIGN_2026-05-17.md`](IOS_HEALTHKIT_SYNC_DESIGN_2026-05-17.md) — primär käll-koppling
- [`IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md`](IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md) — Apple Sign-in
- [`IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md`](IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md) — token för iOS-klient
- selvra-protocol `docs/SELVRA_ONTOLOGY.md` — sju-rads ontologi (rad 6 om konversation utanför Selvra ramar denna avgränsning)
