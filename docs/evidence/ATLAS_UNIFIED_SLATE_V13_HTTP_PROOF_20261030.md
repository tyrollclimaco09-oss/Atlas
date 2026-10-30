# ATLAS Unified Slate — Live v13 backend acceptance (October 30, 2026)

## Scope
One read-only source envelope for the existing **Run the Slate** workflow. All paid-provider polling and betting authority are out of scope. Source branch `review/unified-slate-source-bridge-2026-10-30` is stacked on DraftKings-first PR #17 and PR #18 Flaim's optional research contract.

## Verified live deployment
- Existing Supabase Edge Function `atlas-site-runtime` **version 13**, `ACTIVE`, `verify_jwt=true`. Existing auth code, `board`, `dk_odds`, `slate2` and other modes preserved.
- New protected GET mode `?mode=slate_sources&league=NBA&slate_date=YYYY-MM-DD`.
- The handler reads pre-existing `events`, `atlas_slate_run_v2_1_refined_surface` and `atlas_site_research_reports_v1` only. It does **not** call Odds API, connect Flaim, create candidate IDs or write to production.
- **Real HTTP acceptance** with temporary authenticated site credential:
  - `league=NBA&slate_date=2026-10-29`: **HTTP 200**, 3 canonical events, 0 native NBA candidates, `draftkings=STALE_REFERENCE`; DK quote payload **suppressed**; `flaim=NO_SNAPSHOT`.
  - `league=NBA&slate_date=2026-10-30`: **HTTP 200**, 0 registered canonical events, 0 native NBA candidates, `draftkings=NO_SNAPSHOT`, `flaim=NO_SNAPSHOT`, no prices.
  - Existing `?mode=board`: HTTP 200.
  - Existing `?mode=dk_odds`: HTTP 200 with `STALE_REFERENCE` (no live DK prices).
  - Anon/public-key-only read of `slate_sources`: HTTP 401.
  - Invalid date `2026-02-30`: HTTP 400 `INVALID_SLATE_SCOPE`.
  - Temporary test credential stored hashed in the existing credentials table, revoked at end, then the revoked credential yielded **HTTP 401**. Test sandbox stopped.
- `execution_authority:false`, `paid_api_requests:0`, `production_writes:0` in each read. No sportsbook orders, no new source datasets.
- Precise provider/source chronology: prior DK quote snapshot from Oct 29 is no longer fresh; it is NOT treated as actionable current odds.

## Offline / CI evidence
- New slate source adapter/assembler tests plus inherited DraftKings adapter tests: **82/82 passed**, 0 failed, in GitHub Actions workflow `ATLAS Unified Slate source bridge`, run **41018616387**, job **123940534071**; verified from raw logs.
- Earlier isolated Vercel suite ran 81/81 before final explicit empty-slate test.
- Node client adapter returns `EMPTY_SLATE` with 0 events rather than pretending research readiness.

## Important boundaries
- **This proves integration of existing source READ surfaces into ATLAS's backend**, not a populated daily NBA prediction slate.
- Floot's connected Shadow Command Center and GitHub PR #6's recovered original site snapshot are NOT verified authoring control of the real ChatGPT Sites Command Center. The original site's Run the Slate button is **not** wired to this endpoint.
- The provider quota-gated Vercel refresh code in PR #17 remains review-only; recurring refresh has not been activated due deployment access and release gates.
- Flaim account was previously verified at 0 connected leagues, so there are **zero real fantasy leads**. No background Flaim ingestion is configured.
- The official sports schedule/injury/lineup + independent probability model are not automatically verified by this mode. Human Final Gate stays mandatory.

## Next release gates
1. Recover editable authoring control of original ATLAS ChatGPT Sites deployment and wire `readUnifiedSlate` to Run the Slate with existing private operator session.
2. Review and enable the secure, quota-controlled DK refresh worker separate from the page read; prove provider event discovery, timestamp retention and daily/weekly budget ceiling.
3. Connect a Flaim fantasy league if desired; run a real league-scoped read and independently verify any relevant professional claims. Keep Flaim optional.
4. Authorize integration of official NBA/NFL reports and validated projections as distinct evidence layers; test held-out models before any EV promotion.
