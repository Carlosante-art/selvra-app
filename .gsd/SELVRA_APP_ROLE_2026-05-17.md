# Selvra-apps roll

**Datum:** 2026-05-17
**Status:** Kanonisk roll-formulering. Parallell till Selvra-protokollets `SELVRA_POSITION_2026-05-17.md`.

---

Selvra-app är konsument-klient för Selvra-protokollet. Den är inte protokollet själv och inte en självständig produkt.

Auth, källkoppling, token-issuance, audit, export. Detta är dess omfång. Allt annat bör granskas mot frågan: hör det hemma här eller i protokollet?

Se Selvra-protokollets [`docs/SELVRA_POSITION_2026-05-17.md`](https://github.com/Carlosante-art/selvra/blob/main/docs/SELVRA_POSITION_2026-05-17.md) för kanonisk position.

---

## Relaterade beslut som operationaliserar denna roll

- [`.gsd/CHAT_PIPELINE_DEPRECATION_2026-05-16.md`](CHAT_PIPELINE_DEPRECATION_2026-05-16.md) — chat-pipelinen är DEPRECATED INTERNAL, avvecklas vid iOS-port (chat-yta hör inte hemma i klienten)
- [`.gsd/DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md`](DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md) — selvra-apps lokala fact-extraction-pipeline avvecklas mot protokollets moderator-pipeline (extraction hör inte hemma i klienten)
