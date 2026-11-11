# P1 source evidence capture and two-day shadow cohort — 2026-11-11

## Problem reproduced, without overclaiming proof

- Previous PRs #39–#41 tested logic and froze a genuine 10-game prestart November 11 NBA research slate, but the live Supabase `atlas_prospective_prediction_freeze_v1` table still had **0 November 11 freezes** as of 16:24 UTC. GitHub review files were not a deployed learning pipeline.
- Browser-mediated access to direct `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json` returned 403. This is an **access limitation of that client path**, not proof the official NBA source is permanently down. This patch directly probes from a GitHub-hosted runner and preserves the returned HTTP status/evidence.
- ATLAS previously accepted unverified *source claims* in offline postgame tests. A copied URL or self-declared SHA did not establish that response bytes were fetched from the asserted origin. Now the collector fetches actual bytes from a fixed HTTPS host, hashes them and keeps them together with the separately reconstructed research result. It still **cannot manufacture a vendor signature, guarantee media-source independence, or certify a retrospective pregame market binding**.

## What has been built in this branch

- `direct-source-capture.mjs`: HTTPS allowlist of two hard-coded, free/public endpoints, no dynamic fetch URL, no secrets, no redirects, Node TLS validation, response-size/time/JSON/MIME/status checks. It records fetched bytes, SHA256 digest, content type, full URL, observation timestamp, origin domain, and explicit `provider_signature_verified:false`. Raw responses are archived, not just their URL.
- `direct-outcome-join.mjs`: parses NBA official schedule gameCode/date/gameId/home/away/final score and ESPN date-scoped scoreboard ID/home/away/completed status. It joins to the **original immutable connected pregame provider competition/team identity and timestamp** only by matched home/away, date, time window and unique event. Distinct providers' IDs remain distinct namespaces; no `DraftKings ID = NBA ID` claim. One missing provider, an unfinished game, duplicate matching event, different scores, invalid timestamp, wrong team, or missing capture produces per-game `HOLD`.
- `collect-source-evidence.mjs`: resolves registered frozen source/forecast/challenger files, verifies original Git source bytes and formula before any outcome evaluation, fetches two direct sources and emits a self-contained archive: raw NBA/ESPN JSON where fetched, provider-specific capture metadata, SHA256, per-game HOLD/score diagnostics, and an index of errors. On HTTP 403/timeout it archives a named source failure, **not a fake final or zero-score loss**.
- New `.github/workflows/atlas-source-evidence-capture.yml`: read-only PR probe, workflow_dispatch, and daily 14:15 UTC schedule **defined for the default branch after merge**, with no environment secrets or write permissions. The GitHub artifact includes actual captured source bytes for 30 days; it does **not** write to Supabase, patch the model, place any wagers, certify prices or automatically retrain. Scheduling isn't active from an unmerged draft.
- New source and identity tests, and registry of two prospective dated cohorts.

## Second real cohort (not historical reconstruction)

Connected DraftKings `search_games_v1` captured the four **November 12** NBA games at **2026-11-11T16:29:21.8194909Z**. Native game IDs 1025973, 1025972, 1025974 and 1025975; no prices or results. The actual downloaded provider-message metadata is captured, but not provider digitally signed.

- Immutable source file: `fixtures/nba-connected-prestart-20261112.json`. Git blob SHA **`c8c2daf834b58f2870eec18bb82595a5332afa64`**.
- Original pregame 4-game forecast: prepared **2026-11-11T16:29:58.8266926Z**; same fixed exploratory PPG model `sigmoid((home_ppg-away_ppg)/18)` and neutral baseline 50/50.
- Separate record-based challenger: frozen **2026-11-11T16:30:01.7680091Z**, same exploratory half-strength Laplace win-loss log-odds rule.
- All four begin no sooner than **2026-11-13T00:00Z**, so both freezes preceded their first game by over a day.
- This raises **actual saved pregame research forecasts from 10 to 14 across 2 dates**, without turning either model into a calibrated or wagerable probability. The second snapshot is from the same connected-provider service; it does not prove independent source origins.

## Truth and operational status

The source-identity ladder matters:

1. `CONNECTED_TOOL_OBSERVED_NO_VENDOR_SIGNED_PAYLOAD`: connected DraftKings sports-data receipt with request ID and created-at timestamp; no raw vendor-signed response.
2. `DIRECT_HTTPS_ORIGIN_OBSERVED_BYTES_HASH_BOUND`: GitHub runner fetched exact allowed NBA/ESPN HTTPS origins and stored raw response bytes with SHA256—when HTTP succeeds. HTTPS proves the server endpoint's transport identity to that runner, not the business's signature on the underlying game record.
3. `TWO_HTTPS_ORIGINS_AGREE_PROVISIONAL`: exact home/away, final status and independent-domain reported scores agree. This qualifies only as *provisional research scoring*.
4. `PRODUCTION_AUTHENTICATED_MODEL_CALIBRATION`: **NOT ESTABLISHED**. Original provider-identity and market-rule attestations, signed/validated source provenance where relevant, and a larger chronological holdout are still required.
5. `VERIFIED_EXECUTABLE_BOOKMAKER_PRICE`: **NOT ESTABLISHED**. No quote, stake, bankroll action, ROI, CLV or Final Gate occurs.

**Known restrictions:** ESPN's public scoreboard is unofficial and may change; NBA's CDN can reject requests. GitHub scheduled workflows only run when the workflow exists on the default branch. Archive retention is 30 days, not immutable indefinite storage; durable retention/DB integration needs a separate reviewed path. External sources may share upstream data even if domains differ. No credentials or paid provider API calls.

## Reproduction

```bash
node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs
node integrations/learning/collect-source-evidence.mjs --date=2026-11-11 --out=/tmp/atlas-raw-source-proof
# On a hosted, merged scheduler (future only):
node integrations/learning/collect-source-evidence.mjs --all-recent --out=/tmp/atlas-raw-source-proof
```

Inspect `index.json`, `YYYY-MM-DD/report.json`, actual `*.raw.json` and `*.capture.json` files. If only one origin is available, the other is marked missing and the entire affected game remains HOLD. The seeded positive tests exercise source-byte parsing and rule enforcement; **do not interpret mock final scores as real performance**.

At authoring: PR CI and direct network reachability **not yet verified**. Record the exact GitHub Actions runs and source availability before declaring the collector operational. No merge, deployment, provider billing, database write, paper transaction or live bet has occurred.
