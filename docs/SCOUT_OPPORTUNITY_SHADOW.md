# SCOUT Opportunity Intelligence — isolated SHADOW research

This batch consolidates the eight requested research dimensions into an offline
research contract and deterministic safety harness. It introduces no production
node, predictor, canonical store, browser adapter or execution authority.

Review baseline: `a3385107598b54fa62722c50e9cf0db8ba0c0b6e`.
Working branch: `review/scout-opportunity-shadow-2026-10-12`.
The recovered frontend predates the **user-reported** newer ChatGPT Sites v9
revision `1c2c032`; current Sites parity is not established. Neither snapshot nor
Sites deployment is changed by this research scope.

## Existing responsibilities and safeguards

Preserve the canonical pipeline:

SCOUT → FILTER/VERIFY → EDGE THIEF ↔ ORACLE → PRICING → KAIROS → SENTINEL →
TACTICIAN → HUMAN FINAL GATE → LEDGER → FORENSICS → CALIBRATOR.

| Research dimension | Existing responsibility; bounded research output |
| --- | --- |
| Hidden opportunity | SCOUT gathers role/workload evidence; FILTER/VERIFY checks provenance; ORACLE receives a hypothesis; EDGE THIEF challenges selection bias. |
| Team-wide transfer, including negatives | SCOUT supplies roster context; ORACLE considers gains, losses and unallocated workload; EDGE THIEF rejects automatic inheritance by a backup. |
| Role persistence and reversion | SCOUT records status changes; VERIFY preserves chronology; ORACLE separates temporary and persistent assumptions; EDGE THIEF tests return/reversion alternatives. |
| Predictive and source uncertainty | VERIFY retains missingness and source conflicts; ORACLE distinguishes predictive uncertainty; EDGE THIEF challenges unwarranted confidence. |
| Causal alternatives and counterfactuals | EDGE THIEF records competing explanations and confounders against ORACLE hypotheses. Synthetic checks do not estimate causal effects. |
| Signal-family redundancy and incremental value | VERIFY groups shared origins; EDGE THIEF challenges duplicated evidence; frozen external estimates support matched-case comparisons. |
| Game-script and tactical interactions | SCOUT supplies context; ORACLE holds conditional hypotheses; EDGE THIEF tests alternative scenarios. No joint model or SGP authorization follows. |
| Event-triggered reassessment and retrospective regimes | New SCOUT evidence marks assumptions for research reassessment; VERIFY applies the cutoff; EDGE THIEF distinguishes isolated extremes from sufficient retrospective evidence. No scheduled job is added. |

FORENSICS and CALIBRATOR consume preserved research/evaluation evidence; they
receive no new approval or execution power.

Reusable safeguards are already present in
[the baseline](ATLAS_CANONICAL_BASELINE.md),
[the source ownership record](../command-center/DEVELOPMENT.md), and
[the local engine](../command-center/slate-engine.js): independent research
before prices, frozen snapshots, atomic intake, exact run/revision bindings,
freshness/conflict checks, explicit manual review, singles-only eligibility and
approval receipts with `placed:false`. The existing private draft and canonical
read bridge remain untouched. The harness applies these principles to separate
research fixtures; it does not turn local frontend safeguards into backend proof.

## Versioned research input contract

Only explicitly synthetic, versioned fixtures belong to this batch. They retain:

- Exact research case, event, player and team identities, plus shared-game
  grouping. These are synthetic research identities, never canonical
  `candidate_key` values or invented `state_version` values.
- Source origin and snapshot reference; common report/feature families;
  source-definition version and unit; raw values before any interpretation.
- Observation time, publication time when known, and forecast cutoff, with
  explicit timezones. Later evidence cannot enter an earlier frozen forecast.
- Role context, material status changes, competing explanations, predictive and
  source uncertainty, and an eligible population fixed before seeing results.
- Explicit nulls for unknown values. Missing publication times remain null and
  their evidence is unresolved/excluded from usable pre-cutoff evidence; they
  are never replaced with observation time. Unknown is not zero.

Identity conflicts, future/stale evidence, changed definitions/units and missing
required provenance remain unresolved. Repeated reports from one origin do not
become independent confirmations. Excluding unusable feature evidence does not
silently remove declared eligible cases from the evaluation denominator.

Raw fixtures and frozen research are immutable inputs. Content hashes detect
changes/consistency; they do not authenticate a source, establish independence or
prove that a real forecast existed at its claimed time. Replay uses supplied
cutoffs and fixed inputs rather than wall-clock time, live providers or randomness.

The executable contract is
[`opportunity-shadow.cjs`](../scripts/scout/opportunity-shadow.cjs), with independent
literal examples in
[`opportunity-shadow.fixtures.cjs`](../scripts/scout/opportunity-shadow.fixtures.cjs).
All records reject extra fields. This is a research schema, not an invented
Supabase or browser schema. Its public seams are:

| Entry point | Exact input and result |
| --- | --- |
| `freezeResearch(input)` | `schema_version: "atlas.scout.opportunity-shadow.v1"`, `synthetic: true`, `research_only: true`, `study_id`, `phase: "PHASE1_PRICE_INDEPENDENT"`, `forecast_cutoff`, `frozen_at`, `population`, `target_case_id`, `policy`, `uncertainty`, `challenges`, `observations`. Returns a deep-frozen `{sha256, input}` receipt. |
| `inspectResearch(receipt)` | Verifies the supplied digest, validates the research contract and returns exclusions, source/family groups, observed team deltas, role/regime hypotheses and reassessment warnings. It generates no predictions. |
| `freezeEvaluation(manifest, forecasts)` | Returns a deep-frozen `{sha256, input: {manifest, forecasts}}`; forecasts are supplied externally, not generated or trained here. |
| `evaluateFrozen(receipt, outcomes)` | Verifies the frozen content and exact joins; outcomes stay separate from forecast inputs. Returns descriptive metrics, eligible denominators and matched/grouped comparisons. |

Research population entries have `case_id`, `event_id`, `player_id`, `team_id`,
`game_group`; the group must equal the event. Synthetic identities use the
`synthetic-` prefix. A target must already belong to that declared population.
This tests a declared cohort, not the completeness of a real team roster.
There is no workload-conservation assumption or automatic redistribution.

Each raw observation has `observation_id`, exact case/event/player/team identity,
`sample_event_id`, `source_id`, `source_origin` (`fixture://` only), `report_group`,
`observed_at`, explicitly nullable `published_at`, `role_context` and
`feature: {name, family, definition, unit, value}`. `FEATURES` fixes the accepted
names, definitions, units and types; provider changes are quarantined rather
than silently normalized. Role context is `baseline`, `expanded`, `returned` or
`unknown`. Known categorical prices and all explicit pricing fields are rejected.
This does not prove that an external author never anchored a forecast to odds.

Timestamps are valid UTC ISO strings with seconds, optional three-digit
milliseconds and `Z`. Publications must not follow observation, freeze or
cutoff; observations must not follow freeze/cutoff. Missing publication time
stays null and unresolved. The frozen policy explicitly supplies
`max_age_minutes`, `min_role_games`, `min_regime_games` and `regime_delta`;
the two game-count thresholds must be at least three. These are experimental
rules, not estimated or validated scientific thresholds. `uncertainty` preserves
source status (`unverified`, `conflicting`, `reported`) and predictive status
(`unestimated`). Challenges retain hypothesis, alternative and counterfactual.

Raw type mismatches remain raw and excluded; they do not become zero. Shared
reports are deduplicated, conflicting facts quarantined, and workload averages
weight unique sample games. Foul trouble is player-specific; overtime affects
all declared players with the same sample game. Persistence requires increases
in at least the preregistered number of distinct games; one extreme game cannot
establish persistence or a multi-game regime warning. The latest admissible
publication controls return status; tied incompatible/unknown statuses remain
unresolved. All deltas and regimes are descriptive hypotheses, never causal
effects or approval signals.

## Evaluation contract

Accept externally supplied frozen predictions and corresponding outcomes; do
not train a model or generate predictions. Match exact research identities and
target definitions. Reject chronology, identity or shared-game grouping leakage.
Outcome evidence belongs to evaluation and cannot re-enter forecast features.

Report the fixed eligible denominator, forecast coverage, declared abstentions,
missing predictions, missing outcomes, matched-case errors and grouped errors.
Abstention is explicit; a missing prediction is not silently renamed abstention.
Compare models on the same matched cases and show coverage differences instead
of ranking a selective model as the winner. A low error on a small selected
subset cannot establish overall skill.

MAE/MSE are appropriate only for supplied compatible continuous targets; Brier
score only for supplied binary outcomes and valid external probabilities.
Missing outcomes yield unavailable metrics, not invented scores; incompatible
identity, target, unit or chronology contracts are rejected.
Synthetic metric examples establish arithmetic/contract behavior only. No ROI,
profitability, calibration improvement or forecasting advantage is claimed.

Evaluation manifest version is `atlas.scout.opportunity-evaluation.v1`. Exact
fields: `schema_version`, `synthetic` (boolean), `research_only`, `phase`,
`study_id`, `frozen_at`, `holdout: {start,end}`, `evaluation_as_of`,
`target: {name,kind,unit}`, `models`, and `population`. Evaluation population
entries add `forecast_cutoff` to the research case fields. The population/model
registry freezes before holdout start; every cutoff lies within the holdout.

Forecast fields: `model_id`, `case_id`, `event_id`, `player_id`, `target`, `unit`,
`frozen_at`, `inputs_sha256`, `prediction`, `abstention_reason`. A null prediction
requires an explicit pre-cutoff reason; a missing entry is counted separately.
Outcome fields: `case_id`, `event_id`, `player_id`, `target`, `unit`, `value`,
`observed_at`. Null/absent outcomes are unscored. Every outcome must be available
after **all** forecast cutoffs for its shared game and by `evaluation_as_of`.
Duplicates, mismatched identities/units and out-of-window records fail closed.

Metrics use ordinary double precision; nonfinite or underflowed arithmetic is
rejected instead of displaying a false zero. Continuous primary comparisons
use MAE; binary comparisons use Brier, with probabilities in [0,1] and outcomes
0/1. Case-weighted and equal-game-weighted results are separate. Empty scored
or matched sets have null metrics; no winner or significance claim is emitted.
Non-synthetic offline evaluation is explicitly labeled unverified provenance;
no such dataset was supplied or evaluated in this batch. Fixture input hashes
are synthetic placeholders; receipt hashes prove only supplied-content integrity.

## Required synthetic failure cases

The deterministic suite exercises all twelve requested hazards: late injury
leakage; starter return; backup noninheritance; foul-trouble minutes; overtime;
multiple-injury confounding; repeated reports; provider definition/unit change;
stale/missing evidence; one extreme game's false drift alarm; selective
abstention; and frozen-research/price-independent Phase 1 violations. Additional
checks should cover exact identity, chronology, shared-game grouping, input
immutability and deterministic replay. There are 16 research fixtures and five
evaluation fixtures. Fixture demonstration separates 14 accepted research
examples, two expected integrity/Phase 1 denials and five synthetic evaluations.

## Future prospective experiment — no promotion

Pre-register the targets, eligible population, units, source rules, forecast
cutoffs, abstention policy, hyperparameters and evaluation choices before seeing
holdout outcomes. Compare A baseline; B opportunity transfer; C role stability;
D Game Sense/uncertainty; E regime warnings. Use chronological holdouts and keep
all players/cases from one game in the same split. Preserve rejected/abstained
cases and report uncertainty and subgroup coverage.

Use negative controls and feature-family ablations on the same cases to test
incremental information, confounding, report duplication and dependence on one
extreme game. Do not anchor Phase 1 to sportsbook odds. Reassessment warnings are
research findings, not permission to act or retroactively edit a forecast.
Real prospective, point-in-time player-level observations and externally frozen
estimates are prerequisites for measuring predictive value or robustness.

## Source viability and gate report

The supplied assignment names completed five-timeskip research but does not
include its underlying datasets, experiment receipts or frozen predictions and
outcomes. Targeted repository inspection found prior research classifications,
not a separate five-timeskip research artifact. This is an evidence/access gap,
not a claim that the historical research never happened.

Existing free-scout functions provide schedule-reference discovery, not verified
player-level opportunity data. The dated
[capability audit](CAPABILITY_AUDIT_2026-10-11.md) records missing adapter,
provenance and replay contracts. Source inspection is not authenticated live
integration. No provider claim is newly verified and no live data is ingested.

| Gate | Current evidence classification |
| --- | --- |
| Source viability | **BLOCKED** for real prospective player-level data; no live provider/integration proof. |
| Fixture safety | **PASS**: 55/55 native tests; all twelve hazards plus adversarial contract checks. |
| Reproducibility | **PASS**: immutable inputs, permutation replay, clock/random/network rejection checks and identical standalone CLI replay. |
| Predictive value | **NOT ESTABLISHED**; no fitted predictor or prospective skill evidence. |
| Robustness | Synthetic software checks only; empirical model robustness **NOT ESTABLISHED**. |
| Human promotion | **NOT REQUESTED**; fresh explicit approval required before promotion. |

## Executed evidence and focused diff

Node `v24.19.0`; no installation or new dependency needed. Exact commands:

```sh
node scripts/scout/opportunity-shadow.cjs fixtures
node --test --test-reporter=tap scripts/scout/opportunity-shadow.test.cjs
node --test --test-reporter=tap command-center/tests/*.test.cjs
```

Results: SHADOW **55/55 PASS**, existing frontend **100/100 PASS**, zero failures,
skips or cancellations; exit 0 for both suites. The CLI passes separately and
must distinguish expected denials from unexpected failures. Standalone replay
hashes and source fingerprints are recorded in
[the sanitized receipt](evidence/2026-10-12-scout-opportunity-shadow.json).

The initial absent-module check failed as expected. Seven later adversarial
tests failed against the first implementation and passed after fixing
categorical price checking, shared-game chronology, numeric underflow, sparse
JSON, latest role status, team-wide overtime and CLI fixture handling. A separate
extreme-game persistence regression also failed before its correction. Two
initial test assumptions were aligned to explicit raw-data quarantine rules;
conflicting facts are excluded, not averaged, and raw mismatched scalar values
are retained but excluded, not coerced.

Added files are the module, fixture builders, test suite, this report and its
receipt. No existing tracked file changes. Work remains **local and uncommitted**
on the isolated review branch; HEAD remains `a338510`. There is no new remote
commit or PR, and PR #6 is not modified. This does not claim GitHub preservation
of the new batch. Existing source, local drafts and canonical read configuration
remain unchanged.

No main merge, deployment, Sites edit, Supabase write/migration, browser draft or
schema change, paid API, automation, inference or betting execution is authorized
by this batch. Stop after the focused SHADOW review; retain every existing
authority boundary and require fresh approval for any promotion.
