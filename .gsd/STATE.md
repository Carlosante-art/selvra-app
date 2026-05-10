# STATE.md — selvra-app

## Where I am

Repo scaffold:at 2026-05-10. Next.js 16 + TypeScript + Tailwind v4. Inget
publikt deployment än. DESIGN.md låst.

## Last session, I...

- Lockat full produktdoktrin + reflektions-format + self-report-arkitektur
  + onboarding-flow + source-adapter-arkitektur i konversation
- Skapat repo med design-doc + landing-page-skiss
- Pushat första commit till `Carlosante-art/selvra-app`

## Next up

- [ ] Bygga Steg 2–5 av onboarding-flödet (identitet, intentioner, källor,
      signal+klart)
- [ ] Definiera adapter-interfacet (`src/lib/adapters/interface.ts`)
- [ ] Skissa TerraAdapter (placeholder, ej kopplad)
- [ ] Skissa protokoll-klient (`src/lib/protocol/client.ts`) mot
      `selvra-production.up.railway.app`
- [ ] Magic-link auth (val mellan Auth.js / egen / Supabase)
- [ ] Reflektions-vy (statisk render av exempel-reflektion först)

## Blockers

- Auth-implementation — val mellan Auth.js, egen magic-link via Resend, eller
  Supabase Auth. Inget brådskande beslut.
- Terra-API-konto — behöver registreras för riktig integration. För scaffold-
  fas räcker mockad adapter.

## Notes for future-me

- Selvra-protokollets HTTP-fasad ligger på Railway. Stillra har redan en
  readonly-roll mot protokollet — selvra-app behöver egen roll/auth-mekanism
  som bestäms när protokoll-integrationen påbörjas.
- "kör bara" = explicit verkställan-trigger från Carl. Default är advisor-
  mode. Se feedback-memory `feedback_selvra_app_advisor_mode.md`.
- Vertikalerna är *inte* aktivt i denna repo. Stillra/Motiq/Elefant har egna
  app-strukturer. selvra-app är reflektions-väljar-ytan.
