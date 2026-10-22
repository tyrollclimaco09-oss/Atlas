# ATLAS / Source-to-Proof Reconciliation — 2026-10-22
Status: initial read-only audit, followed by verified targeted Supabase security deployments and two shadow evidence writes. No paid sportsbook calls, no betting execution, no production release promotion. Details in later sections.

## Grounded state
- Supabase: 258 tables and 442 views. Nine ACTIVE functions. A healthy database is not an operating data pipeline.
- Legacy odds lane: 1 ingestion run and 11 ingestion records; 532 market snapshots, most recent Aug 10 UTC.
- Parallel automation research lane: 316 runs, 313 PERSISTED_VERIFIED with production_authority=false; 624 source claims. TEMPORAL_DATA_LOG generated 285 runs / 524 claims, Opening Brief 23 runs / 78 claims. These are persisted research summaries/claims, NOT proven independent real statistics feeds.
- Feed liveness: 0 atlas_feed_heartbeats_v1 rows and empty atlas_feed_health_v1. Operational state MANUAL_ONLY.
- Oracle: 3 verified datasets, 5 validation rows on HOLD, 0 validated models.
- Calibrator: 21 bets/21 outcomes in older tables, but 0 oracle independence proofs and 0 calibration memberships; stage WAIT_FIRST_CAUSAL_OUTCOME.
- Existing execution ingress health: eight receipts, five matched and three partial (two missing identity, one pending canonicalization).
- Historical RETIRED release R3: 12 pass, 5 fail, 4 await genuine samples, with 9 function definition mismatches. R3 was retired September 21; these are archival results, NOT the active release gate. Active RC9 separately passes 205/205 manifest matches with zero drift; runtime HOLD persists.
- Vercel: atlas_x_vercel has configured production Supabase env keys and GitHub-triggered READY previews; Vercel->Supabase authenticated runtime response NOT verified. The private-status project also has READY deployment.
- Original cost/security risk (since fixed): old odds smoke and ingest routes could request paid provider markets. Both have now been retired with JWT gating and zero upstream fetch code, as has the old TheRundown smoke. The replacement ingestion path is NOT built.
- Supabase advisers: 81 RLS-on/no-policy notices, 20 unindexed FKs, 211 unused indexes (INFO); no bulk grants or deletes.

## Required chain, without creating a second ATLAS
SCOUT source observation and publisher time -> FILTER/VERIFY identity and provenance -> price-blind ORACLE features/model version -> externally timestamped pregame FREEZE + DK quote -> later independent OFFICIAL OUTCOME -> FORENSICS Brier/log-loss -> CALIBRATOR only when separately admitted. Odds/no-vig pricing alone cannot establish a predictive edge.

## Proof campaign (order matters)
1. P0 Protect quota: review, restrict or disable legacy odds smoke/ingest endpoints before any next paid request. Preserve manual-only quota discipline.
2. P0 Reconcile two partial execution identities and one pending canonicalization; prove one source claim against an original external upstream record and canonical event ID, do not fabricate missing provenance.
3. P0 Prove a single FREE, noncritical feed heartbeat with hash, observed time, TTL, auth and a negative/failure case using existing atlas_feed_heartbeats_v1; UNKNOWN is not HEALTHY.
4. P0 Create THREE real prospective non-wagering forecast packets: independent sports stats, frozen probability/model+feature manifest and timestamped price/screenshot BEFORE tipoff, externally attested commit or append-only DB receipt, official result join AFTER game, plus one rejected stale case. Three only establish pipeline, not profitability.
5. P1 Train an independent price-blind baseline with chronological holdout and compare Brier/log-loss with naive and market benchmarks. No future features or model promotions.
6. P1 Adjudicate nine function definition drifts and five release failures, then reevaluate frozen baseline with human approval; do not rubber-stamp green.
7. P1 Verify protected Vercel preview endpoint -> Supabase least-privilege read with 200 authorized / 401-403 unauthorized, exact deployment SHA and correct preview env. READY is not runtime parity.

## Offline code delivered
scripts/proof/freeze-shadow.cjs requires event IDs, two-outcome NBA/WNBA moneyline, independent source hashes and timestamps, quote timestamp, forecast cutoff, pregame frozen time, and correct outcome chronology. Produces immutable content SHA-256 and Brier/log loss with theoretical quote ROI. Always states UNATTESTED, model UNVALIDATED, calibrator INELIGIBLE, execution DISABLED. Hash is not a trusted creation-time receipt. Synthetic tests must never be claimed to demonstrate real profitable EV.

Authority: no main/review-branch changes; isolated odds research branch only.

## Verified P0 engineering pass: deployed October 22, 2026

Three existing cost-bearing Supabase functions were intentionally **retired/fail-closed**, not replaced with a production odds ingestion service:

| Edge Function | Previous version / JWT | Current version / JWT | Readback |
| --- | --- | --- | --- |
| `atlas-odds-smoke` | v18 / verify_jwt=false | **v19 / true** | exact tested source match; no fetch or secret handling |
| `atlas-odds-ingest` | v19 / true | **v20 / true** | exact tested source match; no fetch or secret handling |
| `atlas-therundown-smoke` | v13 / false | **v14 / true** | exact tested source match; no fetch or secret handling |

All respond 410 to an authorized POST rather than spending paid API credits, and have no external network request in their deployed code. Unauthorized runtime requests were **not** tested end-to-end; precise management readback of verify_jwt=true is verified. This intentionally disables the former MLB bookmaker ingestion endpoint. Restore only from independently verified, reviewed code after quota controls and a rollback plan exist. Prior deployed source versions are not represented as locally verified rollback artifacts.

**Health guard:** `atlas-core-health` v18 -> **v19** (verify_jwt=true unchanged). Deployed source matches `scripts/runtime/supabase/atlas-core-health/index.ts`. It now maps invalid, future, and unknown market freshness or invalid DB metrics to non-green state. It retains single-database-read behavior. This is a code/readback verification, not a successful authenticated runtime HTTP integration test.

Source of truth: `scripts/runtime/supabase/` on this research branch. Tests: CI 39824578968 (34/34 PASS); CI 39825088498 (35/35 PASS after TheRundown guard). No live odds calls or database mutations were used to test the guards. Supabase projects and Edge Functions were modified; GitHub main/review release branches were not.

**Post-deployment checks:** R3 remains RED/BLOCKED with 5 failed and 4 awaiting real samples; schema drift guard still FAIL with 9 critical differences; calibration still WAIT_FIRST_CAUSAL_OUTCOME and zero admissible outcomes. No forced green, hash re-baselining or autonomous execution.

**Drift provenance:** `atlas_century_nov_plus_calibration_r3_schema_drift_audit_v1` compares current definitions with immutable `atlas_release_object_manifest_v1` release `ATLAS_CENTURY_NOV_PLUS_CALIBRATION_R3_2026_09_18`. The changed nine are existing public guard FUNCTION bodies; do not assume they are regressions or restore the old definitions without side-by-side semantic/security review. Current function security attributes show the nine queried guards use security_invoker and pinned search paths. The five failing R3 assertions are: `R305_SCHEMA`, `R306_HEALTH`, `R309_HUMAN_AUTHORITY`, `R312_CURRENT_READINESS`, `R314_R3_LIFECYCLE_STATE`. Some are downstream consequences; investigate cause rather than treating them as independent patches.

**Vercel cost caveat:** `atlas_x_vercel` auto-created READY **preview** deployments for these research commits (e.g. dpl_3Aa3oBcNWicTW4J73ZVxcoLX1aDT and dpl_GgLbNim21Fes8zpHPcA1GSrD2P2e). No production promotion was performed. Scope/ignore preview builds from backend-only research commits in a separate, reviewed Vercel configuration pass; don't change production policy blindly.

**Remaining priority:** one actual non-paid source -> timestamped normalizer -> permitted existing Supabase evidence record -> verified readback + heartbeat -> prospective externally timestamped model forecast -> independent official result -> statistically honest Forensics admission. Vercel-to-Supabase authenticated runtime parity is still UNKNOWN. Provider spend remains locked until approval and a tested, capped replacement.


## Reconciliation after actual provider, release and prospective readbacks — 2026-10-22

### Active release reality (supersedes stale R3-release claims)
- `atlas_system_releases` confirms only **ATLAS_RC9_PRODUCTION_PROOF_2026_09_21** ACTIVE. R3 and earlier revisions are RETIRED. R3's five failures and nine old-definition differences are historical and must not be "fixed" by tampering with retired baselines.
- RC9 frozen manifest: **205/205 MATCH, 0 DRIFT, 0 MISSING** (read via `atlas_object_definition_hash_v1`). Its registry class is **PRODUCTION_PROOF_RC**, not production bet execution.
- Active `atlas_red_release_guard_v10`: `HOLD_NO_ACTIVE_RUNTIME_CANDIDATE`, with zero complete runtime traces, zero valid Final Gates, zero performance-eligible bets, 12 terminal expired candidates, 1 stale provider. `atlas_operator_control_plane_v16` next actions: `INGEST_FRESH_ACTIVE_CANDIDATE` and `VALIDATE_NATIVE_BASELINES`. Autonomous betting execution DISABLED.
- **Do not alter** provider `The Odds API` status merely to make the stale warning disappear. Its old adapter still says active with a `OPEN_STALE` circuit and fallback `REFERENCE_ONLY_BLOCK_EXECUTION`; the upstream ingestion function has deliberately been retired and has no paid-calling code. The stale warning is legitimate until a governed replacement feed has real health evidence.

### Real no-key source proof
- GitHub run [39827326081](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39827326081) successfully fetched actual nflverse, MLB and NHL data, normalized NFL 14 Week 7 games, MLB 1 Oct 19 game and NHL 4 Oct 19 games; verified anonymous denial of existing free-scout Edge functions.
- Byte-for-byte comparison of `scripts/scout/free-source-core/nfl-core.mjs` and `multisport-core.mjs` with deployed Supabase Edge Function `core.mjs` sources was MATCH.
- Saved an immutable one-shot `SHADOW_RESEARCH` receipt in existing `public.evidence_snapshots`: id `e6b1d158-bcac-47a2-b16a-5c4e3370aac5`. It retains the NFL upstream SHA-256, normalizer SHA-256, 14 identities and GitHub run. Readback matched. This is not a continuously healthy feed.
- Fixed response observation clock in `scripts/scout/free-source-live-parity.mjs`: capture `observed_at` AFTER HTTP response instead of before. Added restricted-source receipt validation and artifact preservation. CI run [39828497580](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39828497580): PASS. The source receipt artifact expires after seven days; durable research records must be independently maintained.

### First actual prospective pregame forecast
- NHL game `NHL:NHL_WEB_API:2026020154`: Nashville (NSH) at Boston (BOS), scheduled **2026-10-22T23:00:00Z**.
- External NHL schedule observed **2026-10-22T18:10:58.313Z**; a deliberately uninformed **home-win p=0.50 benchmark** frozen by GitHub at **2026-10-22T18:10:58.569Z** (4.817 hours ahead of scheduled start).
- External GitHub Actions run [39829074596](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39829074596), artifact `12447547815` created at **18:10:59Z**, packet SHA-256 `d5b66d9a42314f2ab6f5ed83f8ccf5e6fa0d2fe78d4504bd32d0ffc179380e62`. The original downloaded bytes were independently hashed and matched.
- Persisted immutable **noncanonical** research receipt to existing Supabase `public.evidence_snapshots`: id `3c9df21b-1ca2-4439-aaf2-cb40742a36dc` created **18:13:11.288085Z**, strictly before scheduled start. SQL readback matched key facts.
- Full original packet is now permanently archived in `docs/prospective/ATLAS_NHL_20261022_2026020154_UNPRICED_FREEZE.json`. Offline integrity regression [39829817192](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39829817192) PASS. This is a true pregame reference baseline, but **NOT** a validated predictive model, priced EV, independent book comparison, or canonical calibration sample.
- Postgame verifier `scripts/proof/nhl-official-result-shadow.mjs` is implemented and tested against synthetic official result fixtures, [39830076509](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39830076509) 4/4 PASS. It requires official final game status, exact game/team IDs, official score, after-tipoff observation and hash. NO actual game result has been fetched or settled by ATLAS in this session.

### Live safety HTTP proof
- Four deployed Supabase functions (`atlas-odds-smoke`, `atlas-odds-ingest`, `atlas-therundown-smoke`, `atlas-core-health`) now reject unauthenticated HTTP POST with **401**. GitHub live run [39830258530](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39830258530) PASS; absolutely no credentials, paid odds calls or database mutations in that test.
- This proves the anonymous gate ONLY. Authenticated Vercel → Supabase runtime parity remains UNKNOWN, and disabled paid-provider functions are intentionally not available for authorized ingestion.

### Honest remaining gates
1. Record independent official final NHL result later and test the exact pregame freeze→result join. No future background settlement is scheduled.
2. Earn at least one **canonical** runtime candidate with authenticated source ingestion, stable event and selection IDs, complete decision trace and separate Final Gate validation. Today's source and NHL baseline receipts are shadow research, NOT a canonical candidate.
3. Verify protected Vercel → Supabase runtime readback with correctly scoped preview secrets and 401/403 denial cases. GitHub Vercel previews currently deploy on research commits; skip/deployment settings must be reviewed separately.
4. Replace the retired paid odds path only with explicit one-credit approval, quota preflight and source-timestamped receipts. No reactivation by tweaking provider `active` flags.
5. Bring the MLB research model validations out of `HOLD` through independent baseline review; three VERIFIED_LAB datasets have retrospective metrics, but all five model validation records are on HOLD and not operator approved.
6. Do not claim profit, automatic betting authority, or production readiness while RC9 says HOLD.

## Two sequential sport-specific data passes (NBA → NFL) — October 22

- **NBA first:** real Oct 21 game 401909834, 19 usable player stat rows and 538 distinct PBP IDs, no prices. Github run 39834900969 PASS; Supabase immutable shadow `74af21a2-b637-4ab4-834c-6110b52a5fb8`. The pre-existing 57-game NBA V3 Q4 field-goal-attempt experiment is separate research and was not replayed/promoted. Details: `docs/prospective/ATLAS_NBA_20261021_PLAYER_PBP_SOURCE_PROOF.md`.
- **NFL second:** Oct 18 game 401872996 is **Week 6**, correcting earlier mislabeled Week 7 references. Corrected GitHub run 39837577620 PASS, 22 player rows, 186 play IDs in 20 drives. Independently paired NFLverse and ESPN Week 6 samples matched C.J. Stroud 34 passing attempts and Woody Marks 15 carries (run 39836988809). The nflverse release did NOT have Week 7 rows. Supabase additive immutable correction `e5e3f656-ffc6-4c67-9391-ad7b8e299a99` preserves mistaken original rather than editing historical evidence. Details: `docs/prospective/ATLAS_NFL_20261018_WEEK6_PLAYER_PBP_CROSSSOURCE_PROOF.md`.
- Both pipelines are **retrospective source validation only**; no automatically graded forecasts, no odds API usage, no claims of profit, no canonical production promotion.

## Source-quality gate audit — NBA first, NFL second (Oct 22, 2026)

**NBA:** Retrieved the completed Oct 21 `401909834` PBP source to test whether the V3 Q4 FGA target can be extracted through the existing no-key ESPN lane. [Schema audit 39848546540](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39848546540) passed: 538 events in Q1=132, Q2=132, Q3=146, Q4=128; 63 substitutions. The [shot parity test 39848951461](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39848951461) deliberately failed: candidate 175 field-goal attempts matches combined official 175, and made shots match by team, but team ID 1 official 90 vs parsed 89 and ID 19 official 85 vs parsed 86. Roster shooter-ID mapping also reproduces the 89/86 split, with 0 unknown shooters or roster-team conflicts. **No explanation of discrepancy verified. Status PARTIAL/BLOCKED for per-player Q4 feature admission; no imputation, no V3 original 57-game reproduction.** The failed CI is retained as evidence of a correctly rejected boundary, not as a regression to hide.

**NFL:** [Week 6 drive-quality CI 39849511946](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39849511946) passed: 4 offline tests and the actual `401872996` ESPN summary. 20 completed drives, 186 unique play IDs, zero missing IDs/periods, zero clock/period order violations; all 186 play events lack a direct `play.team.id`. As such **internal drive ordering PASS; event-team identity BLOCKED; complete-play coverage UNKNOWN**. Do not automatically inherit offense team onto sacks/turnovers/defensive return plays. Pinned summary-response SHA-256 from run: `93e6e3b2ff70fb07e327a64569410f925d1fec803bf5a20a7880cedb2c3f99e2`. Existing Week 6 QB/RB count corroboration remains independent and narrow.

Both audits are retrospective and source-license status remains unverified for ESPN unofficial. No bets, Supabase state or paid odds API calls in this pass. The canonical continuity handoff now records the two fail-closed gates explicitly.

## Source reconciliation Pass 05 — 2026-10-22 (NBA first, NFL second)

**NBA:** independent NBA CDN PBP + box score validated ATL@ORL NBA game `0022600085` versus ESPN `401909834`, 629 NBA actions / 175 `isFieldGoal=1`. **Dyson Daniels:** NBA official 13 vs ESPN 12, missing ESPN witness NBA action `606` at Q3 0.1 sec; **Jalen Suggs:** NBA official 8 vs ESPN 9, extra ESPN heave `401909834198` Q1 0.0 sec. Other player shots align within one-second-class clock matching. Correct diagnostic evidence, not a verified shot-rule decision or replay of the original 57 games. [NBA paired-source run](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39855261687), [report](prospective/ATLAS_NBA_20261022_OFFICIAL_SHOT_RECONCILIATION_05.md).

**NFL:** October 18 `401872996` = Week 6 **Houston at Jacksonville**; old docs calling New England home are wrong. ESPN IDs: JAX 30 / HOU 34, independently aligned with nflverse `2026_06_HOU_JAX`. nflverse 178 unique PBP events (75 pass attempts, 52 rush attempts, 3 QB scrambles, 18 no_play), ESPN 186 drive/event records. No exact event pairing or 8 missing-snaps claim. [Final paired-source run](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39855261656), [NFL correction](prospective/ATLAS_NFL_20261022_WEEK6_NFLVERSE_PBP_CROSSCHECK_05.md). The old independent two-player aggregate comparison retains only its narrow 34 C.J. Stroud attempts/15 Woody Marks carries claim, not a play-level validation.

These new findings are pinned in `docs/continuity/ATLAS_CURRENT_HANDOFF.json` with fail-closed regression guards; **RC9 remains HOLD**, no betting execution, no paid Odds API calls, no change to Supabase/Vercel.
