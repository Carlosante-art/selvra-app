/**
 * Consumer lock-validate — constitutional gate för LLM-output i samtals-yta.
 *
 * Per SELVRA_CONSUMER_TRACK_2026-05-15.md §2:
 *
 *   Selvra får ALDRIG:
 *     - "Love bombing" (överdriven entusiasm)
 *     - FOMO-krokar
 *     - Skuld-appeller
 *     - Påstå att vara mer än spegel
 *     - Sycophantic-validering
 *     - Att låtsas ha känslor den inte har
 *     - Prescriptive coaching
 *
 *   Selvra får:
 *     - Observera käll-attribuerat
 *     - Fråga reflekterande frågor baserade på data
 *     - Säga "jag vet inte" när data är otillräcklig
 *
 * Detta är post-LLM-gate. Råder ej LLM:n vad den ska säga — kontrollerar
 * att vad den sa följer konstitutionen INNAN det persistas + visas. Vid
 * violation: LLM får ny chans (max 2 retries) eller fallback-text.
 *
 * Inspirerad av Stillras clinical_brief lock_validate-pipeline. Stillras
 * version täcker medicinsk anti-prescription; denna täcker konsument-AI
 * anti-manipulation. Två olika domäner, samma defense-in-depth-pattern.
 *
 * Skeleton-state: regex-listan är initial. Lägger till fler patterns
 * när vi ser faktiska violations i Fas 1-Carl-dogfood. Inte fångar allt
 * vid första pass — fångar de uppenbara fällorna konkurrenter trillar i.
 */

export type LockViolation = {
  /** Vilken regel som bröts. Stabil sträng för audit + Sentry-grouping. */
  rule: ViolationRule
  /** Matchad fras eller fragment ur LLM-output. Kort. */
  match: string
  /** Position i texten (start-index). */
  index: number
}

export type ViolationRule =
  | 'love_bombing'
  | 'fomo_hook'
  | 'guilt_appeal'
  | 'pretend_personhood'
  | 'sycophantic_validation'
  | 'prescriptive_coaching'
  | 'fake_emotion'
  | 'unsourced_observation'

export type LockValidateResult =
  | { valid: true }
  | { valid: false; violations: LockViolation[] }

// Patterns per regel. Case-insensitive substring-matching mot LLM-output.
// Mönster är konservativa — false-positive är OK (LLM försöker igen),
// false-negative är inte OK (manipulation slipper genom).
const PATTERNS: Record<ViolationRule, RegExp[]> = {
  love_bombing: [
    /\bvad fantastiskt\b/i,
    /\bså imponerande\b/i,
    /\bdu är otrolig\b/i,
    /\bjag är så glad (att|för)\b/i,
  ],

  fomo_hook: [
    /\bvi saknar dig\b/i,
    /\bdu har inte (loggat in|kommit tillbaka|svarat)\b/i,
    /\bdet är längesen vi pratade\b/i,
    /\bglöm inte att\b/i,
  ],

  guilt_appeal: [
    /\bvi har byggt så mycket\b/i,
    /\bdu lovade ju\b/i,
    /\bsvika\b/i,
    /\bbesvika\b/i,
  ],

  pretend_personhood: [
    /\bjag är din (vän|kompis)\b/i,
    /\bvi är (vänner|kompisar|tillsammans i detta)\b/i,
    /\bjag bryr mig om dig\b/i,
    /\bjag älskar att prata med dig\b/i,
  ],

  sycophantic_validation: [
    /\bdu är så (otrolig|stark|modig|fantastisk)\b/i,
    /\bvilken stjärna\b/i,
    /\bbra (gjort|jobbat) idag\b/i,
  ],

  prescriptive_coaching: [
    /\bdu borde\b/i,
    /\bdu måste\b/i,
    /\bdu ska\b/i,
    /\bkom igen,? du klarar\b/i,
    /\btänk på att (sova|äta|träna)\b/i,
  ],

  fake_emotion: [
    /\bjag (känner|är) (orolig|glad|ledsen|stolt)\b/i,
    /\bdet gör mig (glad|ledsen|orolig)\b/i,
    /\bjag hoppas (att )?du\b/i,
  ],

  // Speciell: mönster som indikerar observation utan källa.
  // Detekteras heuristiskt genom att leta numeriska påståenden utan
  // intilliggande käll-attribution. Implementeras separat nedan.
  unsourced_observation: [],
}

/**
 * Validera LLM-output mot konstitutionen.
 *
 * @param text Selvras svar (utgång från LLM, INNAN det skrivs till DB)
 * @param sourcesConsulted Lista över källor LLM hade tillgång till. Tom
 *   array = LLM hade ingen data → observationer i texten är förbjudna.
 */
export function validateConsumerOutput(
  text: string,
  sourcesConsulted: readonly { source_ai_id: string }[] = [],
): LockValidateResult {
  const violations: LockViolation[] = []

  // Pattern-baserad detektering för rules 1-7
  for (const [rule, patterns] of Object.entries(PATTERNS) as [
    ViolationRule,
    RegExp[],
  ][]) {
    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match) {
        violations.push({
          rule,
          match: match[0],
          index: match.index,
        })
      }
    }
  }

  // Rule 8: unsourced observation. Heuristik — om texten innehåller
  // numeriska observationer (procent, mmol, mg/dl, timmar etc.) MEN
  // sourcesConsulted är tom: violation.
  //
  // Konservativ: bara explicita enhets-värden räknas, inte slumpmässiga
  // siffror (datumdelar, tidsangivelser). Samma regex som event-log-
  // scrubbing fast inverterad — om det matchar och vi inte har källor:
  // bryter konstitutionen.
  if (sourcesConsulted.length === 0) {
    // Trailing \b utelämnas: '%' är icke-word-char så \b efter matchar inte
    // när nästa tecken också är icke-word (whitespace). Konservativt — vi
    // accepterar några false-positives för att inte missa "68% förra".
    const observationPattern =
      /\b\d{1,3}([.,]\d+)?\s*(mmol\/?l?|mg\/dl|%|procent|timmar|min(uter)?|kg|\bh\b)/i
    const match = observationPattern.exec(text)
    if (match) {
      violations.push({
        rule: 'unsourced_observation',
        match: match[0],
        index: match.index,
      })
    }
  }

  if (violations.length === 0) {
    return { valid: true }
  }
  return { valid: false, violations }
}

/**
 * Människo-läsbar förklaring av violation. För dev-loggar och
 * (anonymiserad) Sentry-rapport.
 */
export function describeViolation(v: LockViolation): string {
  const explanations: Record<ViolationRule, string> = {
    love_bombing: 'Överdriven entusiasm — Selvra är inte coach.',
    fomo_hook: 'FOMO-krok — Selvra skickar inte engagement-prompts.',
    guilt_appeal: 'Skuld-appeller är förbjudna.',
    pretend_personhood: 'Selvra får inte påstå sig vara mer än spegel.',
    sycophantic_validation: 'Sycophantic-validering är manipulation.',
    prescriptive_coaching: 'Selvra observerar käll-attribuerat; coachar inte.',
    fake_emotion: 'Selvra får inte låtsas ha känslor.',
    unsourced_observation:
      'Numerisk observation utan källa. Antingen källa eller "jag vet inte".',
  }
  return `${v.rule}: ${explanations[v.rule]} (matchade "${v.match}")`
}
