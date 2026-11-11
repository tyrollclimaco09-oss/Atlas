# P1 source evidence capture and two-day shadow cohort — 2026-11-11

## Problem reproduced, without overclaiming proof

- Previous PRs #39–#41 tested logic and froze a genuine 10-game prestart November 11 NBA research slate, but the live Supabase `atlas_prospective_prediction_freeze_v1` table still had **0 November 11 freezes** as of 16:24 UTC. GitHub review files were not a deployed learning pipeline.
- Browser-mediated access to direct `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json` returned 403. This is an **access limitation of that client path**, not proof the official NBA source is permanently down. This patch directly probes from a GitHub-hosted runner and preserves the returned HTTP status/evidence.
- ATLAS previously accepted unverified *source claims* in offline postgame tests. A copied URL or self-declared SHA did not establish that response bytes were fetched from the asserted origin. Now the collector fetches actual bytes from a fixed HTTPS host, hashes them and keeps them together with the separately reconstructed research result. It still **cannot manufacture a vendor signature, guarantee media-source independence, or certify a retrospective pregame market binding**.

## What has been built in this branch

- `direct-source-capture.mjs`: HTTPS allowlist of three hard-coded, free/public endpoints (NBA CDN JSON, NBA.com official game-page HTML, ESPN JSON), no dynamic fetch URL, no secrets, no redirects, Node TLS validation, response-size/time/JSON/MIME/status checks. It records fetched bytes, SHA256 digest, content type, full URL, observation timestamp, origin domain, and explicit `provider_signature_verified:false`. Raw responses are archived, not just their URL.
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

## Actual hosted proofs and time semantics — completed November 11

**Direct provider capture actually executed from GitHub:** The official NBA CDN JSON endpoint consistently returned HTTP **403**, but the NBA's public `https://www.nba.com/games?date=...` page returned HTTP **200** and usable embedded `__NEXT_DATA__` structured game cards. ESPN's date-scoped scoreboard endpoint returned HTTP **200**. The collector now archives actual HTML/JSON response bytes and source-specific SHA256 manifests; the NBA web parser checks the exact embedded query date and game feed schema, not simply a domain-matching URL. For HTML, the original bytes are kept; a supplementary NBA endpoint probe may timeout even when the primary page collector succeeds.

**Actual retrospective cross-domain control:** The hosted collector separately fetched November 10 NBA official page and ESPN JSON and exactly matched **six completed NBA games**, each with the same away/home identity and final score: BOS 123–101 PHI, LAC 110–133 PHX, MIA 115–109 UTA, MIL 85–117 NYK, OKC 103–123 POR, ORL 107–100 SAC. The real raw files and capture reports are in the GitHub Actions artifact; they are **not fixture scores** and do not confer historical forecasting skill.

**Current prospective identity coverage:** [GitHub Actions run 43063271120](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43063271120) captured source bytes from NBA.com/ESPN for both **November 11 (10/10)** and **November 12 (4/4)** matchups, joining exact teams, tipoff ±15 minutes, original DK competition ID, NBA official game ID and ESPN event ID. Run output explicitly reported `identity_before_tip_count=10` and `4`, but `identity_before_original_forecast_count=0` on **both** cohorts. This means identity confirmation was **after the original probabilities were frozen but before each game started**. Never rewrite the original freeze time or claim the official event IDs were independently verified at forecast generation.

**Real final-result eligibility remains zero:** The same run found **0 actual admissible finals across 14 pending November 11–12 games**, with all cases appropriately held. The after-final collector can compare each finished game to the original three frozen forecast arms and neutral baseline, but no real predictive-skill, ROI, CLV or calibration conclusion is yet established.

**Verified offline and source tests:** [Offline run 43063271020](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43063271020) passed **355/355 regression tests, 0 failures/skips, and 3,000 synthetic fault/invariance checks**. The hosted source-capture job [43063271120](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43063271120) also passed and produced actual retained raw-byte artifacts and source-identity reports. Early failing regression runs exposed date-path/fixture mismatches and were corrected before this proof; passing offline tests do not authenticate a provider's unobserved or future data.

**Immutable observed three-provider receipt:** The November 11 append-only identity crosscheck is `integrations/learning/fixtures/nba-three-provider-prestart-event-links-20261111.json`, referencing raw capture archive `43061944653`, SHA256 of the NBA.com HTML `0f6f4f1bd9565ecd7815dce378b7e42757d1f1a8840d6d739668f4f6fb87d385`, and ESPN JSON `549105633c81145dc781a09ff22e0871546f247d6903f04197d3c5fd17832641`. November 12 identity receipts are in the later hosted job artifact as a separate `pregame-identity-report.json` per date. GitHub artifact retention is **30 days**, not a permanent append-only archive. The raw bytes are audit material, not a digitally signed source guarantee.

**Original November 12 source-label caveat:** The frozen November 12 cohort contains a schedule-review label. Its source snapshot itself says `provider_schedule_independently_crosschecked_in_docs=false`; the actual NBA.com/ESPN crosscheck only occurred **after** the probabilities were frozen. Keep these facts separate and do not silently reinterpret that label as official pre-freeze validation.

**Operating boundary:** The new GitHub workflow contains a daily schedule definition, but remains in stacked **draft PR #42**, **not merged to `main`**. GitHub scheduled workflows do not run from this review branch; consequently no daily source collector is active in production. The existing ATLAS Postgame Forensics automation was updated with the November 11/12 source-ID bridge and a 6:30 AM CT November 12 planned check, but future run success and delivery are not yet verified. Production Supabase had **zero November 11 native forecast freezes at last inspection**, and no database write or deployment was performed.

**Overall verdict:** Source-to-event identity evidence and raw capture are genuinely verified in a hosted SHADOW workflow, with explicit after-forecast timing and no invented vendor signature. The remaining hard gaps are trusted final postgame joins, durable archival beyond artifact retention, original-time sportsbook identity/settlement proof and prospective multi-day calibration before model promotion. No paid API calls, wagers, settled paper returns or real cash changes occurred.
