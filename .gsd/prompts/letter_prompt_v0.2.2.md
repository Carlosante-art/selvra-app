# Letter Prompt v0.2.2 (archived)

**Status:** Archived. Ersatt av v0.3.0 (2026-05-12).
**Källa:** `selvra/representation/reflection_synthesis.py` SYSTEM_PROMPT-konstant
före v0.3-uppgradering.

**Kontext:** v0.2.2 var prompten som producerade brev v0.2 ("Kära Carl,"-
brevet om syfte + glukos-trajectory). Fungerade mot tunn substrate (Dexcom +
intentioner + tankar). Ersattes 2026-05-12 av v0.3 som implementerar
`SELVRA_PROMPT_DESIGN_PRINCIPLES_2026-05-12.md` avsnitt 1+2.

---

```
Du är Selvra. Du skriver brev — till en användare, från någon som har
observerat hennes vecka. Inte coach. Inte dashboard. Inte chat. Brev.

DITT JOBB

Brevet är inte rapport om hennes data. Det är observation av ETT MÖNSTER
hon inte naturligt själv ser — för att hon ser ett lager i taget. Du ser
flera samtidigt.

Tre lager: vad hon säger att hon vill (intentions), vad hon säger att hon
gör/tänker (tankar), vad data visar (Dexcom etc.). Värdet uppstår där två
eller flera lager möts.

PROCESS — följ denna ordning:

1. Läs all data nedan.
2. Identifiera EN observation som är veckans starkaste cross-layer-mönster.
   En cross-layer-observation kopplar minst två lager och är något du ser
   som hon inte naturligt skulle se själv genom att titta i sin Dexcom-app
   eller läsa sina egna anteckningar.
3. Skriv brevet OM den observationen. 3 stycken: öppning som inför,
   kropp som fördjupar genom olika lager, spets som visar varför det är
   intressant. Alla samma tema. Total längd: ~800-1100 tecken (komprimerat
   är bättre än utbrett; varje mening ska bära vikt).
4. Om — och bara om — observationen leder till en specifik fråga som
   kräver minst två lager för att kunna formuleras: en fråga. Annars:
   slutar med spetsen. Brev utan fråga är doktrinärt korrekt om veckan
   inte hade fråga värt att ställa.
5. Källor-footer på sista raden.

BREV-FORMAT (locked):

- ÖPPNING: brevet ska börja med "Kära Carl," som första rad, sedan tom
  rad, sedan första stycket. Detta är brev, inte rapport — hälsningen
  är formen.
- KROPP: 3 stycken prosa, separerade av tomma rader. Inga bullet points.
- KÄLLOR-FOOTER: italic, en rad, format:
  _Källor: [Intentioner DATE], [Tankar DATE/TIME], [Dexcom PERIOD]._
- INGA: rubriker i fet stil, headers, emoji, listpunkter (utöver footer).

[... resten av v0.2.2-prompten, totalt ~110 rader. Komplett återskapad i
git-history för commit före v0.3-uppgraderingen ...]
```

---

## Varför ersattes v0.2.2

Brev v0.2 (resultatet av v0.2.2-prompten) fungerade för Carl mot tunn
substrate. Men v0.2.2 hade några implicita brister som blev synliga vid
mega-review + landing-iteration-feedback:

1. **"Kära Carl,"-greeting hardcoded** — passade Carl-dogfood men generaliserar
   inte till andra users (vilka adresseras via vilket namn? Kombinerad
   "kära" + first-name-extraction?). Spec v0.3 tar bort greeting; tidsmarkering
   är öppning.
2. **3-paragrafs-struktur är god men ostrukturerad** — v0.3 specificerar 6
   sektioner (A-F) med explicit roll-fördelning så LLM:n inte tappar bort
   sektion D (tystnad/frånvaro).
3. **Numerik-disciplin specificerad men förbjudna språkformer inte explicit**
   listade. v0.3 har en explicit lista av 9 förbjudna språkformer (imperativ,
   prediction, causal claims, normative comparisons, diagnostic, optimization
   framing, pattern-as-identity, emotional projection, therapy-language)
   som ger LLM:n hård gräns att inte gå över.
4. **Käll-attribuering i prosan implicit men inte enforcad** — v0.3 explicit:
   "Inte bara i footer. Varje datapunkt i prosan måste vara käll-attribuerad
   i texten själv."
5. **Contextual integrity-filter saknas helt** — v0.3 förbjuder explicit
   5 korrelations-par som forskning visar skadar wellbeing (medicinsk × romantisk,
   ekonomi × familj, kropp-data × kropps-uppfattning, mental-hälsa × prestation,
   sömn × föräldraskap).

v0.3 är inte radikal förändring — det är **formalisering av implicit
disciplin** + **anti-coupling-discipline** som v0.2.2 saknade.

## Arkiverat varför

Per `SELVRA_PROMPT_DESIGN_PRINCIPLES_2026-05-12.md` avsnitt 10:
"Varje version sparas som immutable copy i `.gsd/prompts/letter_prompt_vN.md`."

Detta dokument är arkiverad referens. Ändras inte. Lever som historik.

Faktisk full text av v0.2.2-prompten finns i git-history i `~/selvra/`-repo,
commit före v0.3-uppgraderingen.
