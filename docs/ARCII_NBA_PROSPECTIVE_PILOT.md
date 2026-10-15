# Arc II — prospective NBA evidence pilot

**Status: NOT STARTED / NOT ADMITTED.** This is a review specification, not a
collection run, accepted forecast, publication authorization or deployment plan.
All 18 inherited external release gates remain **BLOCKED**. Their authoritative
names and individual requirements were not supplied; recover that registry
before any release review. Human Final Gate remains mandatory, singles-only and
without automated execution authority.

## Scope and existing owners

One NBA cohort, one preregistered player-opportunity target, one fixed evaluation
window, one frozen model and one frozen baseline. Choose the exact target,
threshold if binary, and unit before collection. Do not invent a probability to
fill an empty field. A missing defensible forecast requires a recorded abstention.

Reuse SCOUT's existing case/event/player/team identities and Game Sense research
context. `scripts/scout/opportunity-shadow.cjs` supplies `freezeEvaluation` and
`evaluateFrozen`; it already checks exact identity, target/unit, chronological
cutoffs, model versions, explicit abstentions, missing predictions/outcomes and
game-balanced comparisons. Its content hashes establish local integrity only.
Its nonsynthetic output explicitly remains unverified provenance.

The existing Command Center owns browser drafts and operator review; the
canonical candidate bridge remains disabled pending authenticated integration.
No new canonical node, database, state owner, collector or external dependency is
proposed. Do not infer a Supabase schema or map research IDs to canonical records
until the actual contract, `state_version` domain and operator authorization are
verified. This document grants no backend writes.

## Preregister before obtaining evaluation outcomes or market quotes

Preserve a versioned protocol using the existing review/evidence workflow:

1. Fix the future collection window, exact NBA event IDs and start times, player
   and team IDs, eligibility rules, complete census source, discovery cutoff,
   exclusions, target definition, unit and any threshold. Record identity
   crosswalk provenance. Unknown or ambiguous identities are ineligible.
2. Fix model/baseline identifiers and code/input versions, training cutoff,
   holdout bounds, forecast cutoff per case, evaluation-as-of policy and scoring
   rule. Define DNP, cancellation, push, void and official correction treatment
   before labels arrive. Do not use the observed outcomes to select a baseline,
   threshold, cohort or reporting window.
3. Confirm permitted source use and preserve original bytes, hashes, source
   family, publication, observation and receipt timestamps with timezones.
   Unknown rights, missing chronology or evidence arriving after cutoff means
   abstention/exclusion, not a reconstructed pregame fact. A current download
   cannot establish what was available historically.
4. Establish a separately controlled witness with independently reviewed public
   key custody, clock and receipt process. Before the relevant cutoff/event,
   the witness must bind the complete census, decisions, model/baseline versions,
   input hashes, forecasts or explicit abstentions, and freeze digest. A local
   signature, self-asserted boolean or later timestamp does not satisfy this.

If any prerequisite is unavailable, retain the rejection reason and leave the
pilot **NOT ADMITTED**. Do not create credentials, infrastructure or data to make
the checklist appear complete.

## Freeze, observe and evaluate

- Preserve every eligible candidate and screened-out decision, including WATCH,
  PASS and ABSTAIN, with reasons. Keep census, shortlisted, forecasting and
  labeled denominators distinct. Do not count nonscoring decisions as forecasts
  or let their events inflate the number of scored independent events.
- Bind the existing evaluation manifest's `case_id`, `event_id`, `player_id`,
  `team_id`, `game_group` and `forecast_cutoff` exactly. `game_group` equals the
  event identity. Register the target, unit and model IDs once. For each registered
  model/case, freeze a prediction or `prediction: null` with a nonempty
  `abstention_reason`; a forecast cannot also be an abstention. Freeze the
  manifest before the holdout and each forecast by its preregistered cutoff.
- Preserve both the local frozen envelope and the independent witness receipt.
  Never overwrite freezes, fill historical probabilities after an event, or
  relabel research as a prospective prediction. Late news creates a separately
  identified revision; it cannot alter the originally evaluated forecast.
- After each game is officially final, retain permitted official outcome bytes,
  final-event evidence, publication/receipt times, identity mapping and correction
  lineage. Join only the exact frozen event/player/target/unit. The existing
  evaluator's after-cutoff check alone does not prove a game was final: that fact
  needs independent evidence. Preserve unknown outcomes as missing; do not turn
  DNP/void/push into a binary loss or zero workload without the preregistered rule.
- Call `evaluateFrozen` only on the admitted immutable research inputs and later
  labels. Report missing model and baseline predictions separately, explicit
  abstentions, missing/void/corrected labels, matched-pair coverage and distinct
  scored event counts. Preserve candidates lacking a paired forecast in the
  denominator. Report event-balanced descriptive loss versus the frozen baseline;
  a tiny cohort establishes neither calibration, predictive improvement nor edge.

Independent review must assess sample size, event dependence, selection and
missing-label sensitivity before any broader statistical claim. Local mechanical
coverage success never authorizes scoring publication or promotion.

## Keep market evidence separate

The pilot's forecasts are price-independent. Bookmaker prices, OU features and
market-implied probabilities must not enter their inputs or baseline after the
fact. Only after freezing, a separately approved operational review could examine
exact book/event/player/selection/line/odds, source and receipt clocks, expiration,
and venue-specific settlement-rule versions. A stored quote is not proof of
availability or execution quality. No quote acquisition, sportsbook automation,
stake calculation, signoff reuse or betting execution is authorized here.

## Completion evidence and stop conditions

An eventual review packet must contain the preregistered protocol/version, source
rights and custody evidence, independently witnessed census/freeze receipts,
immutable inputs, official label/correction receipts, coverage/rejection report,
replay commands/results and unresolved limitations. Exclude credentials and
sensitive records. Source/deployment parity, operator authentication and canonical
state-version semantics remain separate blockers; the pilot cannot clear them.

For this batch: **no live pilot was run, no data was acquired, no forecasts were
generated, and no release gate was cleared.** Proceed only with separately
reviewed evidence and authorized existing workflows. Production remains NO-GO.
