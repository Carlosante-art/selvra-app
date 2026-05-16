# Selvra Connect-Flow — master-doc

**Datum:** 2026-05-16
**Status:** v1 byggd i 2 PR:er, väntar på Carl-deploy
**Domän:** mcp.selvra.ai (DNS pending)

## Vad det är

Connect-flödet låter en användare på `selvra.ai` logga in, generera en JWT-token, och ansluta sin Selvra-representation till valfri MCP-kompatibel klient (Claude Desktop, Cursor, ChatGPT Desktop, Claude Code, eller generic). Read-only access. 30-dagars TTL. Revocation tar effekt omedelbart.

**Detta är produktens primära värdeleverans.** Inte demo. Inte landing. Konsumenten konsumerar representationen via sin valda AI-klient — vi bygger inte chat i selvra-app.

## Den konstitutionella positionen

Selvra äger representationen, inte konversationen. Konversation lever utanför Selvra. Konsekvenser:

- Framgång mäts i hur sällan användaren öppnar Selvra, inte hur ofta
- Inga "talk to Selvra"-knappar någonstans
- Selvra ser aldrig samtalet — bara att en query inkom mot `query_representation`-tool
- Audit-loggen visar request-metadata, inte konversation-innehåll

## Arkitektur

```
┌──────────────────────────┐                  ┌──────────────────────────┐
│  selvra-app              │                  │  selvra-protocol         │
│  (Next.js, Vercel)       │                  │  (Python, Railway)       │
│                          │                  │                          │
│  /connect                │                  │  POST /v1/tokens/issue   │
│  /connect/[client]       │  ──────────────► │  (shared-secret-auth)    │
│  /connections            │                  │                          │
│                          │                  │  GET /v1/connections     │
│  Server Actions          │  ◄────────────── │  DELETE /v1/connections/ │
│  ─ issueTokenAction      │                  │    {source_ai_id}        │
│  ─ listConnectionsAction │                  │  GET /v1/connections/    │
│  ─ revokeConnectionAction│                  │    {id}/audit            │
└──────────────────────────┘                  │                          │
            │                                 │  MCP-server              │
            │                                 │  (Streamable HTTP)       │
            │                                 │  /mcp                    │
            ▼                                 └──────────────────────────┘
   Claude Desktop / Cursor / ChatGPT                       ▲
   (klistrar in token-config)                              │
            │                                              │
            └──────────────────────────────────────────────┘
                  MCP-handshake + query_representation
                  (Authorization: Bearer <token>)
```

## Implementations-PR:er

| PR | Repo | Status | Vad |
|---|---|---|---|
| [selvra/#34](https://github.com/Carlosante-art/selvra/pull/34) | selvra-protocol | ⏳ Öppen | 4 endpoints + `mcp/tokens.py` + auth_internal + 24 unit-tester |
| [selvra-app/#35](https://github.com/Carlosante-art/selvra-app/pull/35) | selvra-app | ⏳ Öppen | 3 routes + 5 klienter + Server Actions + 13 nya tester |

PR-beroende: #34 måste mergas + deployas + DNS klart **innan** #35 kan testas end-to-end. Men #35 kan mergas utan #34 eftersom anrop bara kraschar runtime, inte build.

## Endpoints (selvra-protocol)

### POST /v1/tokens/issue

Auth: `X-Selvra-Internal-Secret`-header (shared secret från env).

**Request:**
```json
{
  "tenant_id": "uuid",
  "subject_ids": ["uuid"],
  "client_name": "claude-desktop" | "claude-code" | "cursor" | "chatgpt-desktop" | "generic-mcp",
  "scopes": ["read"],
  "ttl_seconds": 2592000
}
```

**Response (201):**
```json
{
  "token": "eyJ...",
  "fingerprint": "sha256:abc123de…",
  "expires_at": "...",
  "jti": "uuid",
  "source_ai_id": "uuid"
}
```

**Säkerhet:** Read-only v1 (WRITE/ADMIN → 400). Strict whitelist på client_name (anti-typosquat). Auto-grants skapas för alla 3 ResourceType:s (snapshot, divergences, provenance). TTL max 90 dagar.

### GET /v1/connections (JWT-auth)

Returnerar aktiva anslutningar aggregerade per `source_ai_id` med `last_active_at` från MCPAuditLog.

### DELETE /v1/connections/{source_ai_id} (JWT-auth)

Bulk-revoke alla `ConsentGrant`-rader för en source_ai_id. Effekt omedelbar via `check_consent` på nästa MCP-anrop.

### GET /v1/connections/{source_ai_id}/audit?limit=N (JWT-auth)

Senaste N audit-entries för UI-display. Default 20, max 200.

## UI-flöde (selvra-app)

| Route | Auth | Vad |
|---|---|---|
| `/connect` | Required | Klient-val (5 kort, likvärdigt presenterade) |
| `/connect/[client]` | Required | Token-generering + kopierbar config-snippet per klient-format |
| `/connections` | Required | Lista anslutna system med Återkalla-access-knapp |

## Klient-katalog

| Klient | source_ai_id (UUID5) | Config-format | Path |
|---|---|---|---|
| Claude Desktop | `f208ffdb-5445-5d4e-93be-c9bac0030571` | claude-desktop-json | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Code | `ccd910a9-9a99-5beb-a30a-3bab05342e37` | claude-desktop-json | `~/.claude/mcp.json` |
| Cursor | `87d04481-b344-5ea6-b799-ab49a202b07f` | cursor-json | `~/.cursor/mcp.json` |
| ChatGPT Desktop | `d4ad7c9f-b441-55dc-ade3-b641e6151067` | chatgpt-text | Settings → Connectors |
| Annan MCP-klient | `e40b3b8e-4f6b-50b5-b5cf-5fb2d22e0e96` | generic-mcp | Manuell |

UUID5 deriverat från `SELVRA_SOURCE_AI_NAMESPACE = e7a4b8d0-1c5f-4e92-8a67-f3d9c2e4b5a1` (låst, aldrig ändra).

## Konstitutionella checks

- ✅ Read-only v1 (Server Action hardcodar `scopes: ['read']`)
- ✅ Default no-access (auto-grants kräver explicit issue-anrop)
- ✅ Strict klient-whitelist (anti-typosquat, både Python + TS)
- ✅ Token visas EN gång (raw försvinner efter copy)
- ✅ Revocation omedelbar
- ✅ Audit-logg user-synlig (endpoint redo, UI-exponering v2)
- ✅ Inga personality-claims om Claude/Cursor/ChatGPT
- ✅ Inga "powered by" eller varumärkes-promotion
- ✅ Klienter likvärdigt presenterade (ingen "rekommenderad"-prominens)
- ✅ Inga FOMO-formuleringar ("Anslut när du är redo", inte "Anslut nu!")

## Deploy-checklist (Carl)

| # | Steg | Verifiera |
|---|---|---|
| 1 | `psql "$DATABASE_URL" -f drizzle/0005_async_fact_extraction.sql` | `\d conversation_turn \| grep extraction_status` |
| 2 | `psql "$DATABASE_URL" -f drizzle/0006_user_soft_delete.sql` | `\d user \| grep deleted_at` |
| 3 | Merge selvra-protocol PR #34 | Railway auto-deploy → 200 på `/v1/health` |
| 4 | `openssl rand -hex 32` → `SELVRA_TOKEN_ISSUER_SECRET` i Railway env | `curl -X POST /v1/tokens/issue` → 401 (missing header) |
| 5 | DNS: `mcp.selvra.ai` CNAME → Railway-deploy | `dig mcp.selvra.ai +short` |
| 6 | `SELVRA_TOKEN_ISSUER_SECRET` (samma) + `NEXT_PUBLIC_MCP_ENDPOINT=https://mcp.selvra.ai/mcp` i Vercel | `vercel env ls` |
| 7 | Merge selvra-app PR #35 | Auto-deploy → `/connect` → 200 eller 307 |

## End-to-end regression

1. Logga in på selvra-app
2. Gå till `/connect`, välj Claude Desktop
3. "Generera anslutnings-token" → kopiera config
4. Klistra in i `~/Library/Application Support/Claude/claude_desktop_config.json`
5. Omstart Claude Desktop
6. I Claude: "vad vet Selvra om mig?"
7. Verifiera Claude anropar `query_representation` + svarar käll-attribuerat
8. Gå till `/connections` → verifiera Claude Desktop syns som anslutet med `last_active`
9. Klicka "Återkalla access"
10. I Claude: fråga igen → verifiera 401 från MCP

## Vad detta INTE har (medvetna v1-scope-cuts)

| Punkt | Skäl | När |
|---|---|---|
| Test-anslutning-knapp post-token-gen | Kräver audit-poll med timeout-logik | v2 |
| Per-AI-system + per-datatyp granular grant-UI | v1 auto-grants alla ResourceType:s | v2 |
| Auto-rotation av tokens vid age > 25d | Kräver cron + ny endpoint, JTI-tracking | v2 |
| Claude Desktop .dxt-export-fil | JSON-snippet räcker | v2 om värt |
| `npx mcp-remote`-proxy-pattern istället för native streamable-http | Streamable HTTP är MCP-standard nu, mcp-remote är fallback för klienter utan HTTP-stöd | v2 om Claude Desktop kräver |
| Subscription-gating | Allt öppet för inloggad user | Efter market-fit |
| HTTP-integration-tester för nya endpoints | Kräver lokal Postgres-setup | Nästa iteration |

## Relationer

- [Token-spec](selvra-protocol:docs/CONSUMER_CONNECTIONS.md)
- [Demo-doc](.gsd/DEMO_ONBOARDING_2026-05-16.md)
- [Build-plan](.gsd/SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md)
- [Audit](memory:project_selvra_100k_audit_2026-05-16)
- [Väg B-pakten](memory:project_selvra_path_b_decision_2026-05-16)
