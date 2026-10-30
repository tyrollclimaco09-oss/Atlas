# ATLAS Unified Slate — SCOUT / VERIFY / DK / Flaim source bridge

**Status:** read-only integration under review. The source assembly contract is tested; one `slate_sources` runtime mode has been added to the captured existing `atlas-site-runtime` source. Live deployment and original ChatGPT Sites UI parity require separate verification. The full ATLAS canonical pipeline and Human Final Gate remain authoritative.

## One operator interaction, one evidence read

1. Operator selects NBA/NFL and local slate date in the **existing** Run the Slate UI.
2. Existing authorized site session requests `GET /functions/v1/atlas-site-runtime?mode=slate_sources&league=NBA&slate_date=2026-10-30`.
3. The runtime **only reads** the existing `events`, `atlas_slate_run_v2_1_refined_surface` and `atlas_site_research_reports_v1` tables. No Vercel cron, Flaim connector or Odds API request is made on page load.
4. The client `integrations/slate/unified-slate-client.mjs` calls `assembleUnifiedSlate` to create `ATLAS_UNIFIED_SLATE_SOURCES_V1`, preserving canonical event identity, existing candidate blocker codes, DK timestamped price references, Flaim fantasy-only research leads, and individual source status. **The operator sees evidence, not auto-created canonical candidates or bets.**
5. SCOUT → FILTER/VERIFY checks officially sourced schedule, status and role. ORACLE/EDGE THIEF must build an independent forecast; PRICING compares it against DK quotes; later nodes retain their separate gates. Nothing in this bridge approves odds, stakes, trades or parlay legs.

### Source priority

- **DraftKings**: primary **reference pricing** via the already existing The Odds API v4 integration in draft PR #17. The runtime returns a frozen report only if it is under 15 minutes old. A bookmaker market timestamp must also be under 15 minutes old. Duplicated identical selection keys are all quarantined. No screenshot required until the operator's own Final Gate.
- **Flaim Fantasy**: optional connected-user fantasy research via draft PR #18. It is **not** a professional injury confirmation, NBA minutes projection or sportsbook price. The user had **zero connected Flaim leagues** at last verified session; no Flaim data is fabricated or fetched server-side. A sanitized operator-handoff report could later be read when legitimately available, but currently none is stored in ATLAS.
- **Official sports sources**: independent pro status/role/schedule evidence remains a separate manual/automated VERIFICATION requirement. This integration does not claim an official news feed is wired or certified.
- **Historical ATLAS**: existing Slate 2.0 candidate rows are imported **by exact canonical UUID only**; no rebuilding of old candidates or authorizing them.

### Identity and state boundaries

- NBA event date uses America/Chicago local date to match the operator's slate; a source kickoff within 15 minutes of canonical kickoff is allowed, but the difference is not erased.
- Provider-only event = `PROVIDER_UNMAPPED` / `WATCH_IDENTITY`. Canonical event pending != verified lineup, model or betting status.
- Existing candidate rows retain truth, blocker and lifecycle statuses; do not promote an incomplete candidate to pass based on new prices or Flaim.
- Feed state examples: `FRESH_RESEARCH`, `STALE_REFERENCE`, `NO_SNAPSHOT`, `NO_FLAIM_PACKET`. A failed component does not silently fill missing data with synthetic numbers.
- API response: `execution_authority:false`, `approved_bet:null`, `expected_value:null`, `independent_fair_probability:null`, `paid_api_requests:0`.
- The source has a **read-only** envelope; no live games imply an empty slate, not invented opportunities.

### Current bounded reality at implementation time

- `atlas_slate_run_v2_1_refined_surface` returned four total candidates and **zero NBA** in the read-only query.
- The only existing DK site research report was frozen on October 29 and is **not a fresh price** for the current slate.
- Flaim account had **0 connected fantasy leagues**. There is no authenticated server-to-server Flaim feed and no automatic league polling.
- GitHub PR #6 contains a recovered **served-source snapshot** of the original ChatGPT Sites Command Center; its current authoring control remains **unverified**, so this client file is not yet visible in that site's live Run the Slate UI.

## Tests and acceptance

```sh
node --test integrations/slate/*.test.mjs
node --test integrations/odds-api/*.test.mjs
```

- One authorized read must return canonical rows + candidate rows + current-only DK research, and never spend provider credits on page load.
- Negative: anonymous or revoked credential fails 401; unsupported mode/date/league fails 400; malformed report remains `INVALID_SNAPSHOT`; stale prices suppressed.
- Positive: one verified official source and independent forecast may later change VERIFY state, but **not** by this ingestion module.
- **Operational integration is not complete** until the actual original site's Run the Slate control is wired, secure refresh is reviewed/activated separately, and live HTTP end-to-end verification succeeds.

No fresh API keys, login credentials, or fake sportsbook screenshots should be requested.
