// Consumer lock-validate — constitutional gate-test.
// Skeleton-tester för PHASE_1_SKELETON_SKETCH §3 källa-attribuering +
// §2 anti-manipulation. Mappar konsument-track §2 förbjudna mönster.

import { describe, expect, it } from 'vitest'
import {
  describeViolation,
  validateConsumerOutput,
} from '../src/lib/observability/consumer-lock-validate'

describe('Anti-manipulation — love bombing', () => {
  it.each([
    'Vad fantastiskt att du frågade!',
    'Så imponerande av dig.',
    'Du är otrolig som hör av dig så ofta.',
    'Jag är så glad att vi pratar igen.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('love_bombing')
    }
  })
})

describe('Anti-manipulation — FOMO-krokar', () => {
  it.each([
    'Vi saknar dig.',
    'Du har inte loggat in på tre dagar.',
    'Det är längesen vi pratade.',
    'Glöm inte att kolla in idag.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('fomo_hook')
    }
  })
})

describe('Anti-manipulation — skuld-appeller', () => {
  it.each([
    'Vi har byggt så mycket tillsammans.',
    'Du lovade ju att fortsätta.',
    'Du svika dina egna mål.',
    'Det skulle besvika oss om du gick.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('guilt_appeal')
    }
  })
})

describe('Anti-manipulation — pretend personhood', () => {
  it.each([
    'Jag är din vän, kom igen.',
    'Vi är vänner i detta.',
    'Jag bryr mig om dig på riktigt.',
    'Jag älskar att prata med dig.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('pretend_personhood')
    }
  })
})

describe('Anti-manipulation — sycophantic-validering', () => {
  it.each([
    'Du är så stark.',
    'Vilken stjärna du är.',
    'Bra jobbat idag!',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('sycophantic_validation')
    }
  })
})

describe('Anti-prescriptive — coaching', () => {
  it.each([
    'Du borde sova mer.',
    'Du måste börja träna.',
    'Du ska kontakta läkare.',
    'Kom igen, du klarar detta.',
    'Tänk på att sova ordentligt ikväll.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('prescriptive_coaching')
    }
  })
})

describe('Anti-fake-emotion', () => {
  it.each([
    'Jag är orolig för dig.',
    'Det gör mig glad att höra.',
    'Jag hoppas du mår bra.',
  ])('flaggar: "%s"', (text) => {
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('fake_emotion')
    }
  })
})

describe('Källa-attribuering — observationer kräver källor', () => {
  it('numerisk observation utan källor flaggas', () => {
    const result = validateConsumerOutput(
      'Din tid-i-target var 68% förra veckan.',
      [],
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations[0].rule).toBe('unsourced_observation')
    }
  })

  it('numerisk observation MED källor passerar', () => {
    const result = validateConsumerOutput(
      'Din tid-i-target var 68% förra veckan.',
      [{ source_ai_id: 'dexcom' }],
    )
    expect(result.valid).toBe(true)
  })

  it('mmol-värde utan källor flaggas', () => {
    const result = validateConsumerOutput('Du var på 7.4 mmol/L i måndags.', [])
    expect(result.valid).toBe(false)
  })

  it('sömn-timmar utan källor flaggas', () => {
    const result = validateConsumerOutput(
      'Din sömn var 6 timmar i snitt.',
      [],
    )
    expect(result.valid).toBe(false)
  })

  it('fri-text utan numeriska påståenden passerar utan källor', () => {
    const result = validateConsumerOutput(
      'Jag har inte tillräckligt med data för att se mönster ännu.',
      [],
    )
    expect(result.valid).toBe(true)
  })
})

describe('Fabricated source — LLM nämner källa som inte konsulterades', () => {
  it('"Dexcom visade X" utan Dexcom i sources → flagga', () => {
    const result = validateConsumerOutput(
      'Dexcom visade 7,4 mmol/L i måndags.',
      [{ source_ai_id: 'garmin' }],
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations.some((v) => v.rule === 'fabricated_source')).toBe(true)
    }
  })

  it('"Garmin visade X" MED Garmin i sources → passerar', () => {
    const result = validateConsumerOutput(
      'Garmin visade 6 timmar sömn.',
      [{ source_ai_id: 'garmin' }],
    )
    expect(result.valid).toBe(true)
  })

  it('Apple Health-mention (sammansatt namn) utan i sources → flagga', () => {
    const result = validateConsumerOutput(
      'Apple Health registrerade 8000 steg.',
      [{ source_ai_id: 'dexcom' }],
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations.some((v) => v.rule === 'fabricated_source')).toBe(true)
    }
  })

  it('case-insensitive matchning', () => {
    const result = validateConsumerOutput(
      'DEXCOM visade en topp.',
      [],
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.violations.some((v) => v.rule === 'fabricated_source')).toBe(true)
    }
  })

  it('okänt namn (inte i KNOWN_SOURCE_NAMES) flaggas inte', () => {
    // 'blod' är inte ett känt source-namn — ska inte flaggas
    const result = validateConsumerOutput(
      'Blod visade en förändring.',
      [{ source_ai_id: 'dexcom' }],
    )
    expect(result.valid).toBe(true)
  })

  it('flera fabricated sources flaggas alla', () => {
    const result = validateConsumerOutput(
      'Dexcom och Garmin visade liknande mönster, Apple Health backade det.',
      [{ source_ai_id: 'spotify' }],
    )
    expect(result.valid).toBe(false)
    if (!result.valid) {
      const fabricated = result.violations.filter((v) => v.rule === 'fabricated_source')
      expect(fabricated.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('Korrekt Selvra-output passerar', () => {
  it.each([
    [
      'Dexcom visade 7,4 mmol/L på torsdagen.',
      [{ source_ai_id: 'dexcom' }],
    ],
    [
      'Du nämnde i april att stress kommer från oklara förväntningar.',
      [{ source_ai_id: 'selvra_self_report' }],
    ],
    [
      'Jag har bara tre dagars data — kan inte se mönster ännu.',
      [],
    ],
    [
      'Är länken mellan sömnen och tid-i-target något du vill utforska?',
      [{ source_ai_id: 'garmin' }, { source_ai_id: 'dexcom' }],
    ],
  ] as const)('passerar: "%s"', (text, sources) => {
    const result = validateConsumerOutput(text, sources)
    expect(result.valid).toBe(true)
  })
})

describe('Flera violations samtidigt', () => {
  it('returnerar alla violations, inte bara första', () => {
    const text = 'Du är så otrolig! Du borde sova mer. Vi saknar dig.'
    const result = validateConsumerOutput(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      const rules = result.violations.map((v) => v.rule)
      expect(rules).toContain('sycophantic_validation')
      expect(rules).toContain('prescriptive_coaching')
      expect(rules).toContain('fomo_hook')
    }
  })
})

describe('describeViolation — människo-läsbar', () => {
  it('returnerar sträng som inkluderar rule + match', () => {
    const result = validateConsumerOutput('Du är så stark.')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      const desc = describeViolation(result.violations[0])
      expect(desc).toContain('sycophantic_validation')
      expect(desc).toContain('manipulation')
    }
  })
})
