#!/usr/bin/env -S npx tsx
/**
 * import-facts.ts — CLI för manuell injection av käll-attribuerade facts.
 *
 * Användning:
 *   npx tsx scripts/import-facts.ts <path-till-json-fil>
 *   pnpm tsx scripts/import-facts.ts <path-till-json-fil>
 *
 * JSON-format matchar /api/sources/manual-import body:
 *   {
 *     "sourceName": "manual:dexcom",
 *     "facts": [
 *       { "factType": "source_observed", "value": "...", "observedAt": "...", "metadata": {...} }
 *     ]
 *   }
 *
 * Env-vars:
 *   SELVRA_API_URL       — t.ex. https://selvra-app.vercel.app eller http://localhost:3000
 *   SELVRA_SESSION_TOKEN — Auth.js session-cookie-värde (extrahera från browser:s
 *                         devtools → Application → Cookies → authjs.session-token)
 *
 * Exempel:
 *   export SELVRA_API_URL="https://selvra-app.vercel.app"
 *   export SELVRA_SESSION_TOKEN="eyJ..."
 *   npx tsx scripts/import-facts.ts scripts/import-examples/dexcom-week.json
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { exit } from 'node:process'

type ImportFact = {
  factType: 'user_stated' | 'source_observed'
  value: string
  observedAt?: string
  metadata?: Record<string, unknown>
}

type ImportBody = {
  sourceName: string
  facts: ImportFact[]
}

type ImportResponse = {
  imported: number
  factIds: string[]
  threadId: string
  turnId: string
}

type ErrorResponse = {
  error: { code: string; message: string }
}

const ANSI = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

function die(msg: string, code = 1): never {
  console.error(`${ANSI.red}✗${ANSI.reset} ${msg}`)
  exit(code)
}

function info(msg: string): void {
  console.log(`${ANSI.cyan}→${ANSI.reset} ${msg}`)
}

function success(msg: string): void {
  console.log(`${ANSI.green}✓${ANSI.reset} ${msg}`)
}

async function main(): Promise<void> {
  const jsonPath = process.argv[2]
  if (!jsonPath) {
    die(
      'Saknat JSON-fil-argument.\n' +
        'Användning: npx tsx scripts/import-facts.ts <path-till-json>\n' +
        'Exempel: npx tsx scripts/import-facts.ts scripts/import-examples/dexcom-week.json',
    )
  }

  const apiUrl = process.env.SELVRA_API_URL
  const sessionToken = process.env.SELVRA_SESSION_TOKEN
  if (!apiUrl) {
    die(
      'SELVRA_API_URL env-var saknas.\n' +
        'Sätt: export SELVRA_API_URL="https://selvra-app.vercel.app"\n' +
        '(eller http://localhost:3000 för dev)',
    )
  }
  if (!sessionToken) {
    die(
      'SELVRA_SESSION_TOKEN env-var saknas.\n' +
        'Hämta från browser:s devtools → Application → Cookies → authjs.session-token\n' +
        'Sätt: export SELVRA_SESSION_TOKEN="eyJ..."',
    )
  }

  const absPath = resolve(process.cwd(), jsonPath)
  let body: ImportBody
  try {
    const raw = readFileSync(absPath, 'utf-8')
    body = JSON.parse(raw) as ImportBody
  } catch (err) {
    die(`Kunde inte läsa/parsa ${absPath}: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!body.sourceName || !Array.isArray(body.facts)) {
    die('JSON-fil måste ha { sourceName, facts }')
  }

  info(`Importerar ${body.facts.length} facts från ${ANSI.yellow}${body.sourceName}${ANSI.reset}`)
  info(`Target: ${apiUrl}/api/sources/manual-import`)

  let res: Response
  try {
    // Auth.js v5 session-cookie: "authjs.session-token" (dev) eller
    // "__Secure-authjs.session-token" (prod). Vi skickar båda så script
    // fungerar mot båda miljöer utan branch.
    res = await fetch(`${apiUrl}/api/sources/manual-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `authjs.session-token=${sessionToken}; __Secure-authjs.session-token=${sessionToken}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    die(`Network-fel: ${err instanceof Error ? err.message : String(err)}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  let parsed: ImportResponse | ErrorResponse | { raw: string }
  if (contentType.includes('application/json')) {
    parsed = await res.json()
  } else {
    parsed = { raw: await res.text() }
  }

  if (!res.ok) {
    console.error(`${ANSI.red}✗ HTTP ${res.status}${ANSI.reset}`)
    if ('error' in parsed) {
      console.error(`  Code: ${parsed.error.code}`)
      console.error(`  Message: ${parsed.error.message}`)
    } else if ('raw' in parsed) {
      console.error(`  Body: ${parsed.raw.slice(0, 500)}`)
    }
    if (res.status === 401) {
      console.error(
        '\nTips: 401 = session-cookie ogiltig eller utgången. ' +
          'Logga in på nytt + extrahera ny cookie från browser.',
      )
    }
    exit(2)
  }

  if ('imported' in parsed) {
    success(`Importerade ${parsed.imported} facts`)
    success(`Thread: ${parsed.threadId}`)
    success(`Turn: ${parsed.turnId}`)
    console.log(`  Fact-IDs: ${parsed.factIds.slice(0, 5).join(', ')}${parsed.factIds.length > 5 ? '...' : ''}`)
    info(`Verifiera: ${apiUrl}/api/memory/facts?sourceName=${encodeURIComponent(body.sourceName)}`)
  } else {
    console.warn('Oväntad respons-shape:', parsed)
  }
}

main().catch((err) => {
  die(`Oväntat fel: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
})
