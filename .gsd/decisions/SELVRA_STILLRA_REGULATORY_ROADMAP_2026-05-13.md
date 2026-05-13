# Selvra + Stillra — Regulatory + Technical Roadmap (5 stadier)

**Status:** Canonical roadmap låst 2026-05-13. Mappar Selvras evolution
till intelligenslager över sjukvårdssystem, med Stillra som första
vertikal och expansion till andra autoimmuna sjukdomar/CGM-system.

**Bakgrund:** Per north star (institution-i-vardande, 15-30 år) +
canonical-fras 7 (du äger representationen) + Phase 5 (öppen standard).
Stillra är inte slutmål — den är **Stadium 1-2-bevis** att arkitekturen
fungerar för healthcare-domänen.

**Spec-källa:** Mega-review 2026-05-13 av regulatoriska + tekniska +
kliniska krav per stadium.

---

## Ramverk: fem stadier

Inte linear path. Varje stadium har gating-beslut som öppnar/stänger
framtida möjligheter. Bör läsas som mognads-trappa, inte timeline.

| Stadium | Tids-fönster | Slut-mål | Capital | Team |
|---|---|---|---|---|
| **1. Klinisk pilot-redo** | 0-6 månader | 1-3 svenska endokrinolog-piloter | $20-50k | Solo + advisor |
| **2. Första betalande kund** | 6-18 månader | ISO-readiness + första klinik betalar | $100-200k | Solo + co-founder + konsulter |
| **3. Skala + klinisk evidens** | 18-36 månader | ISO-certifieringar + peer-reviewed paper | $500k-1M | 3-5 personer |
| **4. Class IIa + EU AI Act + expansion** | 3-7 år | CE-märkning + AI Act conformity + Norden+EU | $2-5M | 8-15 personer |
| **5. Multi-vertikal + federation** | 7-15 år | EHR-replacement-trajectory + EU-wide | $10-50M | 30+ personer |

**Solo-möjligt:** Stadium 1.
**Med 1 co-founder:** Stadium 1-2.
**Med team 5+:** Stadium 3.
**Med kapital + team 15+:** Stadium 4.
**Med strategic partner + team 30+:** Stadium 5.

Carl står nu i **Stadium 0.5** (pre-pilot, post-arkitektur).

---

## Stadium 1 — Klinisk pilot-redo (0-6 månader)

**Mål:** 2-3 svenska endokrinolog-piloter aktivt testar Stillra v2
clinical-PDF med 10-30 patienter totalt. Gratis pilot. Empirisk
validering + klinisk feedback.

### Regulatoriska krav

| Krav | Status | Arbete | Tidsestimat |
|---|---|---|---|
| EU MDR klass I (self-certification) | ✓ designat för | Documentera technical file | 2 veckor |
| GDPR Article 9 (sensitive health data) | ⚠️ designat, ej dokumenterat | DPIA + explicit consent flow | 3-4 veckor |
| Patientdatalagen (Sverige) | ❌ ej dokumenterat | Compliance-memo | 1 vecka |
| DPIA (Data Protection Impact Assessment) | ❌ saknas | Skriva (8-16 timmar med konsult) | 2-3 veckor |
| Data Processor Agreement-template (per klinik) | ❌ saknas | Juridisk konsult | 1-2 veckor |
| Patient information leaflet | ❌ saknas | Skriva + klinisk granskning | 2 veckor |
| Privacy policy + ToS för clinical use | ❌ saknas | Skriva (juridisk granskning) | 2 veckor |
| IRB/Ethics committee pilot-godkännande | ❌ ej påbörjat | 3-6 månader cykel | parallellt |
| Klinisk pilot-agreement-template | ❌ saknas | Juridisk konsult | 1-2 veckor |

### Tekniska krav

| Krav | Status | Arbete |
|---|---|---|
| Encryption at rest (Postgres) | ✓ Supabase default | Verifiera + dokumentera |
| Encryption in transit (TLS 1.3) | ✓ default | Verifiera + dokumentera |
| Audit-log för all health data access | ✓ event-sourcing | Skriva audit-rapport |
| Patient consent management | ⚠️ delvis | Bygga explicit consent-UI |
| Right to erasure (Article 17) | ✓ soft-delete + hard-delete | Dokumentera process |
| Right to portability (Article 20) | ✓ SREF v1 | Verifiera export-flow |
| Data breach notification process | ❌ saknas | Skriva incident-response-plan |
| Cyber Essentials-baseline | ⚠️ delvis | Self-assessment |

### Kliniska krav

| Krav | Status |
|---|---|
| **Klinisk advisor (endokrinolog)** | ❌ **icke-förhandlingsbar** |
| Outcome-mått pre-registrerade | ❌ design pending |
| Statistiker-konsultation | ❌ |
| Pilot-data-collection-protokoll | ❌ |
| Klinisk pilot-rapport-template | ❌ |

### Kapital + team

**Kapital:** $20-50k (bootstrap-möjligt).
- Regulatorisk konsult (DPIA + juridisk): $10-20k
- Statistiker-konsultation: $3-5k
- IRB/Ethics-avgifter: $1-3k
- Juridisk granskning (privacy/ToS/agreements): $5-10k
- Klinisk konsult: $3-10k

**Team:** Solo + 1-2 advisors. Klinisk advisor är **icke-förhandlingsbar**.

### Gating-beslut Stadium 1 → 2

- **Är klinisk co-founder rekryterad?** Om nej: Stadium 2 är blockerad.
  Du kan inte sälja till kliniker utan klinisk credibility.
- **Levererar pilot-data signaler för klinisk evidens-design?** Om nej:
  iterera Stadium 1, ej avancera.
- **Vill minst 1 pilot-endokrinolog fortsätta post-pilot (betala)?** Om
  nej: produkt-market-fit otillräcklig, iterera produkt.

---

## Stadium 2 — Första betalande kund (6-18 månader)

**Mål:** 1-3 kliniker betalar $200-500/månad. ISO-readiness påbörjad.
Klinisk co-founder ombord. Klinisk evidens-pilot designad.

### Regulatoriska krav (utöver Stadium 1)

| Krav | Status | Arbete | Cost |
|---|---|---|---|
| ISO 27001 readiness (gap analysis) | ❌ | 3-6 månader | $30-60k konsult |
| ISO 13485 readiness (QMS för medical devices) | ❌ | 6-12 månader | $40-80k konsult |
| Patientdatalagen full compliance | ⚠️ | Dokumentera + audit | inkl. ovan |
| Information Security Management System | ❌ | Skriva policies + procedures | inkl. ovan |
| Incident Response Plan (IRP) | ❌ | Skriva + öva | 1-2 veckor |
| Vulnerability management process | ❌ | Verktyg + process | $5-10k/år |
| Penetration test (årlig) | ❌ | Extern firm | $15-30k/år |
| Data Processing Records (Article 30) | ❌ | Dokumentera | 1-2 veckor |
| Sub-processor agreements (Anthropic, Supabase) | ❌ | Juridisk konsult | 1-2 veckor |
| Cross-border data transfer mechanism | ⚠️ | Verifiera EU-only | 1 vecka |
| Patient consent audit-rapport | ❌ | Skriva | 1 vecka |

### Tekniska krav

| Krav | Status | Arbete | Tidsestimat |
|---|---|---|---|
| HSA-ID-autentisering för endokrinologer | ❌ | Integration via BankID + HSA | 3-4 veckor |
| Multi-factor authentication | ❌ | Implementera | 2 veckor |
| Key management (HSM eller motsv) | ❌ | Cloud KMS | 1-2 veckor |
| Disaster recovery + business continuity plan | ❌ | Dokumentera + testa | 3-4 veckor |
| RPO/RTO för healthcare-critical data | ❌ | Definiera + implementera | 2 veckor |
| Multi-region backup (EU-only) | ❌ | Setup | 1-2 veckor |
| API rate-limiting | ⚠️ delvis | Förbättra | 1 vecka |
| Vulnerability scanning (automated) | ❌ | Snyk, Dependabot, Renovate | 1 vecka |
| Static analysis (SAST) | ❌ | SonarQube eller motsv | 1 vecka |
| Healthcare-specific logging (Patientdatalagen) | ❌ | Audit-loggar enligt PDL | 2 veckor |

### Kliniska krav

| Krav | Status | Anmärkning |
|---|---|---|
| **Klinisk co-founder (endokrinolog)** | ❌ | **Icke-förhandlingsbar för Stadium 2+** |
| Clinical Evaluation Report (CER) — initial draft | ❌ | Bygga grund för Stadium 3-certifiering |
| Post-Market Surveillance (PMS) plan | ❌ | MDR-krav |
| Post-Market Clinical Follow-up (PMCF) plan | ❌ | MDR-krav |
| Klinisk pilot-data publicerings-redo | ❌ | För Stadium 3 peer-review |

### Kapital + team

**Kapital:** $100-200k.

Stora poster:
- ISO-konsulter (27001 + 13485): $70-140k
- Penetration test: $15-30k
- Juridisk konsult: $10-20k
- Klinisk konsult: $20-40k
- HSA-ID-integration: $10-20k (engineering-time)

**Team:** 2-3 personer.
- Carl (CEO + founding engineer)
- Klinisk co-founder (endokrinolog, del/heltid)
- Regulatorisk konsult (deltid)
- Klinisk konsult (deltid)

**Funding-modell:** Seed-raise $1-3M senast vecka 18 av build-plan,
ELLER revenue-funded om Stillra v1 (eller v2-early-revenue) räcker.

### Gating-beslut Stadium 2 → 3

- **Seed-raise $1-3M klart?** Om nej: Stadium 3 är blockerad. ISO-
  certifieringar + klinisk studie kräver kapital.
- **ISO 27001 + 13485 gap-analysis komplett + remediation-plan?** Om
  nej: Stadium 3-certifieringar blir 18-24 månader bortom plan.
- **2-3 betalande kliniker som referenser?** Om nej: Stadium 3-sales-
  pipeline är blockerad.

---

## Stadium 3 — Skala + klinisk evidens (18-36 månader)

**Mål:** 10-30 betalande kliniker (Sverige + Norden). ISO 27001 + 13485
certifierade. Peer-reviewed pilot-paper publicerat. HL7 FHIR-server
operativ. ARR $250k-1M.

### Regulatoriska krav (utöver Stadium 2)

| Krav | Status | Arbete | Cost |
|---|---|---|---|
| **ISO 27001 certifiering** (inte readiness) | ❌ | 6-12 månader | $30-50k cert + $15-25k/år revision |
| **ISO 13485 certifiering** | ❌ | 12-18 månader | $40-80k cert + $20-30k/år revision |
| ISO 14971 (Risk Management for Medical Devices) | ❌ | Compliance-arbete | inkl. 13485 |
| IEC 62304 (Medical Device Software Lifecycle) | ❌ | Process-implementation | $20-40k konsult |
| IEC 62366 (Usability Engineering) | ❌ | Usability-testning + dokumentation | $15-30k |
| IEC 82304-1 (Health software product safety) | ❌ | Compliance-arbete | inkl. 13485 |
| Post-Market Surveillance — operativ | ❌ | Bygga monitoring + reporting | 2-3 månader engineering |
| MDR Vigilance reporting | ❌ | Process | 1 vecka per incident |
| Notified body pre-engagement (för Stadium 4 klass IIa) | ⚠️ | Begin diskussion | gratis intro |

### Tekniska krav

| Krav | Status | Arbete | Tidsestimat |
|---|---|---|---|
| **HL7 FHIR R4 server (basic capability)** | ❌ | Stort arbete | 3-6 månader |
| SMART on FHIR app launcher | ❌ | EHR-integration-enabler | 2-3 månader |
| LOINC mapping (lab observations) | ❌ | Terminology-mapping | 1-2 månader |
| SNOMED CT mapping (clinical concepts) | ❌ | Terminology-mapping | 2-3 månader |
| ICD-10 mapping (diagnosis codes) | ❌ | Terminology-mapping | 1-2 månader |
| FHIR profiles (svenska Inera-anpassade) | ❌ | Sverige-specifikt | 2-3 månader |
| Cybersecurity incident detection (SIEM) | ❌ | Verktyg + process | $10-30k/år |
| Threat modeling | ❌ | STRIDE eller motsv | 1 månad |
| Bug bounty program | ❌ | HackerOne eller motsv | $20-50k/år |
| Real-world evidence collection-system | ❌ | Bygga data-collection-pipeline | 2-3 månader |

### Kliniska krav

| Krav | Status | Anmärkning |
|---|---|---|
| **Peer-reviewed pilot-publication** | ❌ | **Kritiskt för Stadium 4** |
| 10+ kliniker i adoption | ❌ | Sales-team behövs |
| Real-world evidence (RWE) — 200-500 patienter | ❌ | Långsiktig insamling |
| Clinical Evidence Dossier — komplett | ❌ | För Stadium 4 CE-mark |
| Specialty society endorsement (svensk endokrinologförening) | ❌ | Klinisk co-founder driver |

### Kapital + team

**Kapital:** $500k-1M.

Stora poster:
- ISO-certifieringar (cert + remediation): $80-130k initial + $50-100k/år
- Klinisk studie (50-100 patienter, 12 månader): $100-300k
- FHIR-engineer (heltid 12 mån): $120-180k
- Regulatorisk consultant (deltid 12 mån): $50-100k
- QA/RA-person (heltid 12 mån): $100-150k
- Sales-resurs (deltid): $50-100k
- Penetration testing (årlig): $15-30k
- SIEM + bug bounty: $30-80k

**Team:** 3-5 personer.
- CEO (Carl)
- Klinisk co-founder
- Senior healthcare-engineer (FHIR + integrations)
- QA/RA-person (regulatorisk + klinisk evidens)
- Klinisk konsult / part-time clinical director

**Funding-modell:** Series A $5-10M.

### Gating-beslut Stadium 3 → 4

- **Klass I → Klass IIa upgrade-beslut.** Att stanna i Class I sparar
  12-24 månaders pappers-arbete men begränsar feature-set (ingen
  dose-suggestion, ingen predictive insulin-effect). Klinisk co-
  founder + advisor måste rekommendera beslut.
- **EU AI Act-classification:** är Stillra "high-risk AI system" per
  Annex III? Sannolikt JA (healthcare + risk assessment). Beslut om
  conformity assessment-pathway.
- **Internationalisering-trigger:** är Norden-marknad mogen för
  Tyskland/Nederländerna-expansion? Sales-pipeline-data driver beslut.

---

## Stadium 4 — Class IIa + EU AI Act + Expansion (3-7 år)

**Mål:** Class IIa CE-märkning. EU AI Act conformity assessment komplett.
Norden + Tyskland + Nederländerna. 100+ kliniker. ARR $5-15M. Första
acquirer-konversationer.

### Regulatoriska krav (utöver Stadium 3)

| Krav | Status | Arbete | Cost |
|---|---|---|---|
| **Class IIa CE-märkning** (upgrade) | ❌ | 12-24 månader | $50-200k notified body fees |
| Notified body certification (TÜV SÜD, BSI, etc) | ❌ | $100-300k initial + $50-100k/år | |
| **EU AI Act conformity assessment** (high-risk) | ❌ | 12-18 månader | $50-150k konsult |
| AI Act technical documentation | ❌ | Substantial work | inkl. ovan |
| AI Act risk management system | ❌ | Operationalisera | inkl. ovan |
| AI Act human oversight controls | ❌ | Implementera | inkl. ovan |
| AI Act accuracy, robustness, cybersecurity | ❌ | Continuous testing | $30-80k/år |
| Post-market monitoring för AI | ❌ | Continuous | $20-50k/år |
| ISO 27701 (Privacy Information Management) | ❌ | $30-60k certifiering | + $15-25k/år revision |
| ISO 27799 (Healthcare information security) | ❌ | Add-on till 27001 | $10-20k |
| ISO 14155 (Clinical investigation) | ❌ | Om utvidgad klinisk studie krävs | $30-80k |
| NIS2 cybersecurity compliance | ❌ | Implementera | $50-100k initial |

### Tekniska krav

| Krav | Status | Arbete |
|---|---|---|
| Federated learning (cross-clinic AI utan centralized data) | ❌ | R&D, 6-12 månader |
| HL7 FHIR R5 capability | ❌ | Uppgradera från R4 |
| CDS Hooks (clinical decision support) | ❌ | Integration |
| eIDAS-compliant identity | ❌ | Cross-border auth |
| Healthcare HL7 integration patterns (Inera-spec) | ❌ | Sverige-specifikt |
| Cosmic FHIR API integration | ❌ | Cambio partnership eller reverse-engineering |
| TakeCare / Melior / NCS Cross-integration | ❌ | Per EHR-system |
| Multi-region EU deployment | ❌ | Cloud-architecture-uppdatering |
| Zero-trust architecture | ❌ | Architectural shift |
| SOC 2 Type II | ❌ | $80-150k cert + årlig revision |

### Kliniska + expansion-krav

| Krav | Status |
|---|---|
| 100+ kliniker (Norden) | ❌ |
| Engelsk version (UK, Tyskland, Nederländerna) | ❌ |
| Expansion: **LADA** (Latent Autoimmune Diabetes in Adults) | ❌ |
| Expansion: **MODY** (Maturity Onset Diabetes of the Young) | ❌ |
| Expansion: Type 2 med insulin-användning | ❌ |
| Expansion: **Hashimoto's** med CGM-relevans | ❌ |
| Expansion: **Graves'** med CGM-relevans | ❌ |
| Specialty society endorsement (EASD, ADA) | ❌ |
| Insurance-payer adoption | ❌ |

### Kapital + team

**Kapital:** $2-5M.

Stora poster:
- CE-märkning + notified body: $150-500k initial + $50-100k/år
- EU AI Act conformity: $100-300k
- ISO 27701 + 27799 + SOC 2: $150-280k
- Klinisk studie utvidgad: $300-800k
- Team-expansion (5-10 fler personer): $1-2M/år löner
- Internationalisering (legal, sales, support): $500k-1M
- Federated learning R&D: $300-500k

**Team:** 8-15 personer.

- CEO (Carl)
- CTO (rekrytera senast Stadium 3)
- Klinisk director (klinisk co-founder, fulltime)
- QA/RA-team (2-3 personer)
- Healthcare-engineers (3-5)
- Clinical operations (1-2)
- Sales + customer success (2-3)
- Compliance/security-specialist (1)

**Funding-modell:** Series B $10-30M.

### Gating-beslut Stadium 4 → 5

- **Acquisition vs IPO vs standards-body.** Olika exit-modeller.
  Bör beslutas senast Stadium 3 för att inte måla in sig i hörn.
- **EHR-integration-strategi:** Cosmic-partnership eller competition?
  Cambio som potentiell partner vs konkurrent.
- **Standards-body-engagement:** HL7? IHE? Bör Selvra bidra till
  öppen standardisering eller bevara proprietär?

---

## Stadium 5 — Multi-vertikal + federation (7-15 år)

**Mål:** EHR-replacement-trajectory. Multi-specialty modules.
EU-wide expansion. ARR $50-200M. Potentiell IPO eller strategic
acquisition.

### Vad detta egentligen är

- **Mental Health Records-vertikal** (analog till Stillra för T1D)
- **Cardiac Records-vertikal** (kardiologisk)
- **Endocrine Records-vertikal** (utöver T1D — Hashimoto, Graves,
  PCOS, etc.)
- **Federation-protokoll** för cross-system integration
- **EHR-replacement-trajectory** (Cosmic-konkurrent eller -partner)
- **EU-wide expansion** (alla EU-medlemsstater)
- **Strategic partnerships** med healthcare networks
- **Standards body engagement** (HL7, IHE)

### Detta är inte Carl-arbete

Stadium 5 kräver:
- 30-50+ personer
- $10-50M kapital
- Strategic acquisition eller IPO för funding
- Standards-body governance
- International healthcare partnerships

Det är **Phase 5 (öppen standard)** från Selvra-protokollet applicerat
på healthcare. Selvra blir då **standards-body**, inte standalone-
företag.

### Möjliga utfall

1. **Strategic acquisition** av Apple Health, Google Health, Amazon
   Care, eller stor healthcare-leverantör. Bracket: $200M-2B.
2. **IPO** som EU-baserad healthcare infrastructure-company. Bracket:
   $1-5B.
3. **Standards-body governance** (öppen standard). Inte exit utan
   evolution till foundation. Selvra-org blir SWIFT/W3C/IETF för
   personal health representation.
4. **Strategic partnership** med svenska/nordiska regioner. Multi-
   region SaaS-deal. Bracket: $500M-2B.

---

## Sammanfattad kostnads + team-trajectory

| Stadium | Capital cumulativt | Capital marginal | Team-size | Tids-fönster |
|---|---|---|---|---|
| 1 | $20-50k | $20-50k | 1-2 | 0-6 mån |
| 2 | $120-250k | $100-200k | 2-3 | 6-18 mån |
| 3 | $620k-1.25M | $500k-1M | 3-5 | 18-36 mån |
| 4 | $2.6-6.25M | $2-5M | 8-15 | 3-7 år |
| 5 | $12-56M | $10-50M | 30-50+ | 7-15 år |

**Funding-events:**
- **Bootstrap → Seed ($1-3M):** Stadium 1-2 transition (månad 6-18)
- **Seed → Series A ($5-10M):** Stadium 2-3 transition (månad 18-36)
- **Series A → Series B ($10-30M):** Stadium 3-4 transition (år 3-5)
- **Series B → Series C / IPO ($30M+):** Stadium 4-5 transition (år 5-10)

---

## Kritiska gating-beslut sammanfattade

**Stadium 1 → 2 (månad 6):**
- Klinisk co-founder rekryterad? *(icke-förhandlingsbar)*
- Pilot-data tillräcklig signal? *(empirisk)*

**Stadium 2 → 3 (månad 18):**
- Seed-raise $1-3M klar? *(kapital-tröskel)*
- ISO-readiness gap-analysis komplett? *(regulatorisk)*

**Stadium 3 → 4 (år 3):**
- Class I → Class IIa upgrade? *(produkt-feature-tröskel)*
- EU AI Act high-risk-classification accepterad? *(regulatorisk)*

**Stadium 4 → 5 (år 7):**
- Exit-modell vald (acquisition/IPO/standards-body)? *(strategisk)*
- EHR-integration-strategi (partner Cosmic eller konkurrera)? *(positionerande)*

---

## Tre regulatoriska clusters Selvra måste behärska

### Cluster A: Data Protection (Stadium 1+)

- GDPR (Article 9 sensitive data)
- Patientdatalagen (Sverige-specifik)
- ISO 27701 (privacy management)
- DPIA + DPO + consent management

**Lead:** DPO eller juridisk konsult.

### Cluster B: Medical Device (Stadium 2+)

- EU MDR (2017/745) klass I → IIa
- ISO 13485 (QMS för medical devices)
- ISO 14971 (risk management)
- IEC 62304 (software lifecycle)
- IEC 62366 (usability engineering)
- IEC 82304-1 (health software safety)
- Clinical Evaluation + Post-Market Surveillance

**Lead:** QA/RA-person eller regulatorisk konsult.

### Cluster C: AI Regulation (Stadium 3+)

- EU AI Act (high-risk system per Annex III)
- AI Act conformity assessment
- Algorithmic accountability
- Bias auditing + fairness
- Human oversight controls
- Post-market monitoring för AI

**Lead:** AI compliance-specialist (uppstår som ny roll 2026-2028).

---

## Vad Carl gör NU (vecka 1-2)

Stadium 0.5 → Stadium 1-execution. Konkret:

### Vecka 1

1. **Skriv DPIA-utkast** för Stillra v2 clinical-context. Använd
   IMY-mallen som grund.
2. **Privacy policy + ToS för clinical use** — börja skriva med
   utgångspunkt från existing Stillra-policys.
3. **Klinisk advisor-outreach:** 5 endokrinologer kontaktade
   (per `STILLRA_V2_ENDOKRINOLOG_OUTREACH.md`).
4. **Patient information leaflet** — börja skriva svensk version.

### Vecka 2

5. **Klinisk konsult-research:** identifiera 2-3 svenska klinisk-
   konsulter med MDR-expertis.
6. **Regulatorisk konsult-research:** identifiera 1-2 ISO 27001/13485-
   experter för Stadium 2-prep (gratis intro-samtal nu, engagement
   senare).
7. **IRB/Ethics-research:** Karolinska/Sahlgrenska/Akademiska — vad
   kräver de för pilot-godkännande?
8. **EU AI Act-position:** är Stillra "high-risk per Annex III"?
   Pre-läsa lagtexten + identifiera classification-konsultation.

### Bootstrap-finansiering Stadium 1

$20-50k. Möjliga källor:
- Carls sparmedel
- Stillra v1 revenue (om finns)
- Vinnova / EU-grants för digital health (Horizon Europe,
  EIT Health, etc.)
- Familjeinvestment (informal, lågkonditional)
- Crowdfunding (om branding fungerar)

**Inte klassisk VC-seed än.** Seed-raise sker Stadium 2 när du har
pilot-data.

---

## Risk-matris

| Risk | Sannolikhet | Påverkan | Mitigation |
|---|---|---|---|
| Klinisk co-founder rekryteras inte | Medel | KRITISK | Tidig outreach (vecka 1-2). Bredda search till diabetessjuksköterskor om endokrinolog svår. |
| Pilot-endokrinolog säger nej post-pilot | Medel | Hög | Iterera produkt baserat på pilot-feedback. Bredda outreach. |
| Seed-raise misslyckas vid Stadium 2 | Medel | KRITISK | Revenue-funded path med Stillra-v1-eller-v2-early-revenue. Bootstrap längre. |
| ISO-certifiering tar längre än 12 månader | Hög | Medel | Realistiskt 18-24 månader. Räkna med marginal. |
| EU AI Act-classification = klass IIa krävs tidigare | Medel | Hög | Stadium 3 förskjuts till Stadium 2-end. Capital-behov ökar. |
| Cambio (Cosmic) blockerar EHR-integration | Hög | Medel-hög | Acquihire-route eller HL7 FHIR Bypass. Partnership-strategi. |
| Klinisk evidens-paper avvisas peer-review | Medel | Medel | Iterera + re-submit. Inte fail-mode utan delay. |
| Stora AI-aktörer (Anthropic/OpenAI/Apple) bygger competing healthcare-products | Hög | Hög | EU-sovereignty + clinical-specialization som moat. Standards-body-position som långsiktig defense. |
| Carl burnar ut | Hög | KRITISK | Klinisk co-founder + seed-raise + team-bygge. Solo-build är 12-månaders-window. |

---

## Re-läs-disciplin

Detta dokument re-läses:
- **Slutet av vecka 6** (Stadium 1 mid-point check)
- **Slutet av vecka 18** (Stadium 1 → 2 gating)
- **Slutet av månad 12** (Stadium 2 progress)
- **Slutet av månad 24** (Stadium 2 → 3 gating)
- **Årligen efter Stadium 3** (gating-beslut + capital-planering)

Justeringar görs baserat på empiri (pilot-data, regulatorisk
landscape-shifts, EU AI Act-evolution). Inte gissning.

---

## Vad detta inte är

- **Inte timeline-garanti.** Stadium-tids-fönster är realistiska men
  beroende av kapital, team, regulatorisk-cykler. Förvänta marginal.
- **Inte uttömmande kostnads-prognos.** Estimater är "ungefär right
  order of magnitude". Verkligt budget kräver bottoms-up-planering
  per stadium.
- **Inte enda väg.** Detta är **default-path** baserat på EU healthcare-
  norm. Alternativa paths (USA-first, standards-body-first) möjliga
  men avvisade per north star (EU-sovereignty).
- **Inte solo-möjligt utöver Stadium 1.** Erkänn behovet av team +
  kapital tidigt.

---

**Lockad:** 2026-05-13.
**Får inte ändras utan:** ny regulatorisk gap-analys + Carl-godkännande.
**Nästa revision:** vecka 6 av Stillra v2 build-plan (mid-juni 2026).
