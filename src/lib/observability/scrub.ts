// ─────────────────────────────────────────────────────────────────────────
// PII-scrubbing — rekursiv nyckel-baserad redaktion innan logs/events
// lämnar processen.
//
// Port av samma princip från frida-app/lib/scrub.ts + selvra-Python
// observability/scrub.py. Multi-domän: Selvra-ekosystemet hanterar
// flera vertikaler, så pattern-listan är bred.
//
// Använd som:
//   - logger meta-scrub (lib/logging/index.ts auto-applicerar via scrubObject)
//   - framtida Sentry beforeSend (steg 5 i selvra-paket)
//
// Doktrinärt: kontraktet är att caller lägger värden i strukturerad meta,
// inte i message-strängen. scrubMessage() är skyddsnätet, inte huvudvägen.
// ─────────────────────────────────────────────────────────────────────────

// Case-insensitive substring-matching. Bredare än Stillras eftersom Selvra
// är multi-domän — Stillra (T1: glucose/mmol/brief), Motiq (kreativ:
// user_words/quote/lyrics), generiska auth/secret-mönster.
export const SENSITIVE_KEY_PATTERN =
  /(e-?mail|notes?|brief|glucose|mmol|reading|value_mmol|user_words|quote|lyrics|secret|password|token|access_token|refresh_token|api_?key|authorization)/i;

const REDACTED = '[redacted]';
const MAX_DEPTH = 8;

// Värde-mönster i fri-text-message. Konservativt: bara explicita enheter.
// 'API tog 7.4 ms' passerar, 'blod 7.4 mmol' blir '[redacted]'.
const MESSAGE_VALUE_PATTERNS: RegExp[] = [
  /\b\d{1,2}[.,]\d+\s*mmol\/?l?\b/gi,
  /\b\d{2,3}\s*mg\/dl\b/gi,
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,
];

/**
 * Returnerar en kopia av `input` där alla värden under känsliga nycklar är
 * ersatta med "[redacted]". Rör inte input. Säker mot cykler via djup-gräns.
 */
export function scrubObject<T>(input: T, depth = 0): T {
  if (input == null || depth > MAX_DEPTH) return input;

  if (Array.isArray(input)) {
    return input.map((v) => scrubObject(v, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED
        : scrubObject(value, depth + 1);
    }
    return out as T;
  }

  return input;
}

/**
 * Scrubba uppenbara värde-mönster i en fri-text-message (mmol/mg-dl/e-post).
 * Kompletterar scrubObject — kallaren ska normalt lägga värden i meta, inte
 * i message, men detta är skyddsnät.
 */
export function scrubMessage(message: string): string {
  let out = message;
  for (const re of MESSAGE_VALUE_PATTERNS) {
    out = out.replace(re, REDACTED);
  }
  return out;
}
