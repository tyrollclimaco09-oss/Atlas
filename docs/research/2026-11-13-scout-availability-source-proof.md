# ATLAS — SCOUT official availability research gate (November 13, 2026)

**Patch classification:** R&D/SHADOW, additive stacked draft PR on PR #45, itself stacked on PR #44/#43/#37. No production integration. No market quoting, stakes or wagering.

## Why this exists
The first PR #45 Stephen Curry 6+ AST probability freeze preserved a real SCOUT failure: an official team bulletin describing a diagnosed oblique abdominal tear was published on November 12 before the conditional forecast freeze, but was not captured for the forecast until afterward. The November 13 NBA 03:15 ET injury report subsequently explicitly listed Curry **Out**. His previous 24.18% conditional forecast must stay in history as a failed availability discovery/verification case; no DNP-as-zero scoring.

The same report lists Pacers injuries for NYK@IND but does not show a Knicks team section in the reviewed page. That **cannot** be interpreted as Jalen Brunson being confirmed available. The 42.07% 6+ AST research model stays unvalidated and held pending direct player/team/source attestation and a supported minutes distribution.

## Added code
- `integrations/learning/scout-availability-evidence-gate.mjs`: pure, fail-closed SCOUT/FILTER classification of claimed official-publication excerpts and source receipt metadata. Source URL allowlist, source dates, timestamp ordering, SHA256 excerpt integrity, player/team/event scope, duplicate conflicts, OUT/uncertain/absent reporting, and original-forecast replay time boundaries.
- `integrations/learning/scout-availability-evidence-gate.test.mjs`: 28 adversarial unit tests (positive/negative statuses, stale and future captures, original-freeze immutability, URL spoof, source identity drift, contradictory claims).
- `integrations/learning/scout-availability-evidence-gate.fixture.test.mjs`: 4 real-checkpoint regression tests against official-publication review fixture.
- `integrations/learning/fixtures/nov13-scout-official-publication-review-v0.json`: official-publication URL/brief-text review as of 2026-11-13 08:42:58 UTC; source metadata, claims and SHA256 hashes are **normalized excerpts**, not archived original PDF bytes or vendor-signed records.

## Source references and verified context
- Official NBA injury PDF, 2026-11-13 03:15 ET, page 4: https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-11-13_03_15AM.pdf (Curry Out, right oblique tear). Page 1: NYK@IND report has Pacers entries; no Knicks section displayed. A blank/missing team section is **not** proof of player availability.
- Official Warriors medical bulletin published 2026-11-12 8:56 AM PST: https://www.nba.com/warriors/news/stephen-curry-injury-update-11-12-26 (MRI oblique tear, reevaluate in two weeks).
- Official NBA injuries policy: https://official.nba.com/nba-injury-report-2026-27-season/ (submissions and updates can change; reevaluation is required closer to tip).
- Official NBA player profile for Brunson ID 1628973: https://www.nba.com/player/1628973/jalen-brunson . Curry player ID 201939: https://www.nba.com/warriors/player/201939/stephen_curry . These references establish display identity, not a cryptographic identity binding into ATLAS.

## Fail-closed authorization and limits

The module **cannot authenticate its own inputs**. Self-matching excerpt hashes, official-looking URLs and user-reported source status are not trusted proof of vendor origin. Every status, including `AVAILABLE`, remains nonproduction and forecast-ineligible until an independently controlled original-byte attestor, exact canonical player/event binding, source freshness and true participation scenario model exist. An authenticated source alone still cannot prove expected minutes.

The gate intentionally does not edit, retrain, reprice, reinterpret or re-admit PR #45's preexisting numeric forecast. It preserves prefreeze vs postfreeze observations: **published before freeze but captured afterward is a SCOUT discovery failure, not a source receipt that existed at freeze time.**

## Next proof protocol
1. Enhance PR #42's source capture architecture with an allowlisted official NBA injury-report archive, real original PDF SHA256, controlled fetch provenance, parser version and file-by-file freeze time. Never treat `web` search snippets as stored original source bytes.
2. Join official player IDs, canonical event IDs, actual team and game dates with a temporal join. Reject mismatches and stale/conflicting records; distinguish team-omitted, player-not-listed and player-available.
3. Freeze future eligible player-cohort forecasts **before tipoff**, including a well-defined participation distribution, baselines, source receipts, branch SHA and registration timestamp. Preserve all rejected candidates.
4. Independently score completed cases, DNP/void separately, Brier and log loss against same-case baseline. Group by player and date. Use calibration and predictive interval checks only when the sample supports them.
5. Explore margin/payout economics only after forecast validity and exact venue-verified contract equivalence; no production/wager authority is added by this patch.

**Safety:** all drafts unmerged; no database writes, paid provider use, GitHub deployment requests, account changes or wagers.
