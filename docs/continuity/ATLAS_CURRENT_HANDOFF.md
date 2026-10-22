# ATLAS — CURRENT ENGINEERING HANDOFF (start here)

**Canonical current handoff:** [ATLAS_CURRENT_HANDOFF.json](./ATLAS_CURRENT_HANDOFF.json). The JSON file is a **source-and-evidence checkpoint**, not a mutable claim that all external services are healthy. This handoff supplements, NEVER overwrites, [the October 18 master checkpoint](./ATLAS_MASTER_CHECKPOINT_2026-10-18.json), [Operator Remote V2](./ATLAS_OPERATOR_REMOTE_V2.json), and [Arc III's 15-pass plan](../ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md).

## Resume command for a new conversation

> Continue ATLAS from `tyrollclimaco09-oss/Atlas`, branch `research/odds-api-probe-2026-10-22`. Read `docs/continuity/ATLAS_CURRENT_HANDOFF.json` and `docs/continuity/ATLAS_CURRENT_HANDOFF.md` at the **current branch HEAD**, then verify the latest GitHub CI, live Supabase and Vercel independently. Respect the original Arc III checkpoint and append-only provenance. NBA first, NFL second. Never promote reported research to verified proof, infer live health from stale receipts, spend paid odds credits or authorize betting. Make targeted improvements, test them, and update the handoff before ending.

## Architecture state as of October 22, 2026

| Surface | Verified / present | Unproven / blocked |
| --- | --- | --- |
| GitHub | Research branch and source documentation; historical immutable checkpoints | No main/production promotion |
| NBA | Real player/PBP source proof + 16/16 archived audit contract tests recovered and run | Full 57-game original V3 manifest/replay raw archive inaccessible via current Library permissions; reported metrics unverified |
| NFL | Week 6 ESPN↔nflverse two-stat match, corrected identity | Full plays/drive coverage; future QB prop forecast |
| Supabase | Source and pregame shadow evidence, active RC9 object definitions matched 205/205 previously | Validated live candidate→Final Gate→outcome, authenticated Vercel parity, continuous heartbeat |
| Odds | Paid handlers retired behind JWT; manual credit guard in research branch | Governed production ingest not yet built |
| Release | Human Final Gate remains required | RC9 active runtime HOLD; no autonomous execution |

## Avoid fragmentation

1. **One authoritative project:** code, handoffs, evidence statuses, CI and research notes stay in this GitHub repo. Notion, Library, Drive, Create State and chat are referenced by IDs/links as **secondary/recovery surfaces**, not separately authoritative projects.
2. **Every timeskip ends with a git checkpoint:** source changes + tests + evidence refs + unresolved blockers + current branch HEAD readback. If any mirror cannot be synced, record `UNKNOWN` and do not say Mastersave complete.
3. **Keep true lineage:** historical older checkpoints, correction receipts, and retired R3 remain intact. No overwriting the Arc III 0/15 formal sign-off or relabeling synthetic tests as model efficacy.
4. **No silent regressions:** `node --test scripts/continuity/atlas-handoff-guard.test.cjs` checks the handoff invariants, separate NBA/NFL lanes, and required repo paths. CI runs offline with no credentials.
5. **Unverified metric display:** NBA 57 games, October MAE 7.062 vs 6.456 are marked *reported retrospective* until row-level replay is accessible and reproduced.

## Today's precise recovery

- Retrieved raw bytes of **audit ZIP** `ATLAS_NBA_PBP_V3_AUDIT_SHADOW_20261022.zip` from the personal Library, extracted three files and independently ran **16/16 offline synthetic audit tests**. Their standalone source is still a Library recovery asset; this new handoff locates them.
- Located original `ATLAS_PBP_V3_CHRONOLOGICAL_SHADOW.zip` in Library, but materialization **failed**: current Project permissions did not provide an authorized raw-byte path. No source manifest or prediction rows replayed. This distinction is enforced by checkpoint status.
- The archived audit's date/target/census and anti-leakage safeguards can guide future replay; success of 16 synthetic tests is *not* predictive validation.

## Next earned proof

**NBA:** recover an authorized raw copy of original V3 archive or reconstruct a clearly labeled new version, rerun 57-game independent holdout and compare per-game predictions, source hashes, and clock cutoffs. **Then NFL:** complete nflverse PBP cross-source matching, with missing/canceled plays explicitly counted. **Then backend:** verify canonical research admission, official outcomes and authenticated Vercel↔Supabase runtime, without paid odds queries.

**Doctrine:** knowledge over greed; truth over ego; evidence over confidence; process over outcomes.

## Exact recovered-asset hashes

The [recovery asset registry](./ATLAS_RECOVERED_ASSET_REGISTRY_2026-10-22.json) fixes the **actual recovered audit ZIP** SHA-256 and each extracted file's SHA-256. No identity hash is claimed for the **unreadable primary 57-game V3 archive**. A handoff CI regression asserts that the archive remains blocked rather than converting its reported 57-game results to verified science.

## Engineering Pass 02 — new source-quality boundaries (October 22)

**NBA first:** GitHub real-source [event schema probe 39848546540](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39848546540) fetched 538 PBP events, including 63 substitutions. Shot-type classification found 175 total FGA, matching the two team box-score combined attempts, but **team-by-team** totals do not match: team 1 official 90 vs PBP 89; team 19 official 85 vs PBP 86. All shooters resolved to their correct roster teams, so automatic identity correction did **not** fix the mismatch. The [fail-closed parity check 39848951461](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39848951461) correctly FAILED. Do not construct V3 Q4 targets from this feed without an explained reconciliation and independent per-player evidence.

**NFL second:** The separate [Week 6 drive-integrity CI 39849511946](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39849511946) PASSED 4/4 unit checks and one real-source test: 20 drives, 186 unique play IDs, no duplicates or quarter/clock order violations. **All 186 play rows lack directly attributed team IDs**, so event-to-team training is BLOCKED. Clean order != complete or usable player-level attribution; don't infer the actor from drive possession. Paired ESPN/nflverse player totals (34 Stroud attempts, 15 Marks carries) remain narrowly verified.

The machine-readable [current handoff](./ATLAS_CURRENT_HANDOFF.json) records both quality gates and future acceptance requirements. The original 57-game V3 replay is **still blocked by unavailable raw original archive**. We made no model promotion, no paid odds calls, no Supabase/Vercel deployments in this pass.
