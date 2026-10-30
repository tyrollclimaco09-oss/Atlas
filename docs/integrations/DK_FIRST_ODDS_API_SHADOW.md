# ATLAS — The Odds API / DraftKings-first shadow integration

> **Deployment update (2026-10-29):** The existing `atlas-site-runtime` has now been extended to **v12** with authenticated `?mode=dk_odds`. A three-event/18-quote `RESEARCH_ONLY` snapshot is present in the existing research-report table; a real authorized HTTP 200 readback succeeded, the existing board route also returned HTTP 200, and an ephemeral site credential was revoked and rejected afterward. The original Command Center UI source is still missing, so this feature is **backend-live, UI-not-yet-wired**, with no automatic feed refresh or real-money authority. Full evidence: `docs/evidence/ATLAS_DK_LIVE_SITE_BACKEND_PROOF_20261029.md`.

**Status:** DK-first research adapter in draft PR; existing authenticated site backend read mode **deployed v12**; frontend UI not yet wired; zero betting authority. See deployment update above.

## Reuses existing ATLAS infrastructure

- The Odds API v4 is already registered in ATLAS as provider `The Odds API`, adapter `the_odds_api_v4`.
- The working credential already exists privately in Supabase Vault as `THE_ODDS_API_KEY`. Never store its value in the repository or browser.
- The former production `atlas-odds-ingest` endpoint intentionally returns 410. This review branch does **not** reactivate it.
- Canonical market tables currently have stale last-ingested evidence and no mapping for sampled October 29 provider event IDs. This integration deliberately does not insert unverified event UUIDs.
- GitHub issue #8 documents missing authoritative original Command Center frontend source. This proposal does not claim to modify the live frontend.

## Research flow

SCOUT → The Odds API v4, DraftKings primary → PRICING (timestamp and price comparison) → EDGE THIEF (duplicates, staleness, deviations) → SHADOW research output.

Priority: DraftKings primary, BetMGM secondary, FanDuel reference-only. Missing DraftKings is DK_UNAVAILABLE. No substitution.

The featured NBA call fetches DraftKings/BetMGM/FanDuel moneylines, spreads, totals. At most one upcoming DK event receives a second **DraftKings-only** request for alternate points and threes. The quota ceiling is **5 credits** total per explicit run; the runner checks provider headers and retains at least 100 credits before the second call. Historical and high-cost endpoints are never requested.

## Offline test and one-shot commands

```bash
node --test integrations/odds-api/dk-first.test.mjs
node integrations/odds-api/dk-first-live.mjs
# Only from an authorized PRIVATE server with the existing Vault key securely injected:
node integrations/odds-api/dk-first-live.mjs --live --output /private/atlas-dk-snapshot.json
```

Do not pass the API key on the command line or in GitHub Actions. The third command is an example for a private operator runtime only and **is not** automatically enabled.

## Contract

- `ATLAS_DK_FIRST_SHADOW_V1`; no database writes, betting actions, approved bets, independent fair probabilities or validated EV.
- The provider's market-level `last_update` is required; never replace it with the deprecated bookmaker timestamp. Capture separate `observed_at`. Stale, future and missing-time quotes are quarantined.
- Market identity includes provider event, book, market, player, selection, and point. Repeated keys are **all quarantined**, not silently repaired. This guards the previously observed FanDuel alternate points conflicts.
- Compare odds only for identical market/selection/line/participant/event. A book-price gap is **not** positive EV.
- `canonical_event_id:null` until a verified identity match; evidence remains reference-only and `executable_price_verified:false`. Operator Final Gate retains sole authority.
- Output can be frozen privately in a new file with mode 0600 and an SHA-256 fingerprint of provider payloads.

## Before integrating into the live Command Center

1. Verify private server-to-Vault secret handoff without exposing the key to the browser.
2. Integrate with already-authorized ATLAS SCOUT intake; do **not** add a publicly callable quota-spending endpoint.
3. Reconcile provider event IDs against canonical event IDs and test one read-only server round-trip.
4. Retain raw response in authorized private evidence storage only after acceptance of ingestion/storage and source-rights contracts.
5. Release-gate any automated scheduling separately, with quotas and a kill switch. No real-money execution.
