/**
 * ATLAS experiment -> reusable forecasting knowledge gate (SHADOW ONLY).
 * Pure, deterministic evaluation. No providers, DB writes, wagers, model weight
 * updates, production authority or automatic promotion.
 *
 * Do not interpret REVIEW_ELIGIBLE as a certified financial edge.
 */
export const CONTRACT = 'ATLAS_EXPERIMENT_EVIDENCE_GATE_V1';
const allowedSports = new Set(['NBA', 'NFL']);
const isTime = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
const validProbability = p => typeof p === 'number' && Number.isFinite(p) && p > 0 && p < 1;
const round = (v, places = 5) => Number(v.toFixed(places));
const loss = (p, y) => (p - y) ** 2;
const logLoss = (p, y) => -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
const quantile = (xs, p) => { const a = [...xs].sort((x, y) => x - y); return a[Math.floor((a.length - 1) * p)]; };

// One block = one prospectively declared causal root, not each parlay repeat.
// Deterministic bootstrap across roots. This is exploratory, not a guarantee.
function rootBootstrap(records, valueFn, iterations = 1200) {
  const map = new Map();
  for (const r of records) {
    if (!map.has(r.root_key)) map.set(r.root_key, []);
    map.get(r.root_key).push(r);
  }
  const groups = [...map.values()];
  if (groups.length < 10) return null;
  let state = 0x41c6ce57;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const values = [];
  for (let j = 0; j < iterations; j++) {
    const drawn = [];
    for (let i = 0; i < groups.length; i++) drawn.push(...groups[Math.floor(random() * groups.length)]);
    values.push(valueFn(drawn));
  }
  return { lower_95: round(quantile(values, 0.025)), upper_95: round(quantile(values, 0.975)), bootstrap_roots: groups.length };
}

export function evaluateExperimentEvidence(packet, { minCases = 120, minDays = 21 } = {}) {
  if (!packet || packet.contract !== CONTRACT || !packet.experiment_key || !Array.isArray(packet.cases))
    throw Error('EVIDENCE_PACKET_INVALID');
  if (!Number.isInteger(minCases) || minCases < 10 || !Number.isInteger(minDays) || minDays < 1)
    throw Error('EVALUATION_POLICY_INVALID');
  const blockers = [];
  const reasons = new Set();
  if (!packet.hypothesis || !packet.model_version || !packet.frozen_cohort_id || !packet.baseline_id)
    blockers.push('MISSING_PREREGISTERED_HYPOTHESIS_OR_BASELINE');
  if (!packet.out_of_time_holdout || !isTime(packet.training_cutoff) || !isTime(packet.holdout_start) ||
      Date.parse(packet.training_cutoff) >= Date.parse(packet.holdout_start))
    blockers.push('NO_CHRONOLOGICAL_HOLDOUT');
  if (packet.model_uses_bookmaker_odds || !packet.independent_model_inputs_verified)
    blockers.push('NO_VERIFIED_PRICE_INDEPENDENCE');
  if (!Number.isInteger(packet.frozen_case_count) || packet.frozen_case_count !== packet.cases.length)
    blockers.push('FROZEN_COHORT_NOT_RECONCILED');
  if (packet.cases.length === 0) blockers.push('EMPTY_CASES');

  const ids = new Set();
  const valid = [];
  const rejected = [];
  for (const r of packet.cases) {
    const bad = [];
    if (!r || !r.case_key || ids.has(r.case_key)) bad.push('DUPLICATE_OR_MISSING_CASE_ID');
    if (r?.case_key) ids.add(r.case_key);
    if (!allowedSports.has(r?.sport) || !r?.event_id || !r?.market_id || !r?.root_key)
      bad.push('INCOMPLETE_OFFICIAL_MARKET_IDENTITY');
    if (!r?.current_team_verified || !r?.event_teams_verified || !r?.settlement_rules_verified)
      bad.push('SOURCE_IDENTITY_OR_SETTLEMENT_NOT_VERIFIED');
    if (!isTime(r?.frozen_at) || !isTime(r?.event_start_at) ||
        Date.parse(r.frozen_at) >= Date.parse(r.event_start_at) ||
        (isTime(packet.holdout_start) && Date.parse(r.event_start_at) < Date.parse(packet.holdout_start)))
      bad.push('FORECAST_NOT_FROZEN_BEFORE_EVENT_OR_HOLDOUT');
    if (!isTime(r?.features_observed_at) || !isTime(r?.frozen_at) || Date.parse(r.features_observed_at) > Date.parse(r.frozen_at))
      bad.push('LEAKED_FUTURE_FEATURES');
    if (!validProbability(r?.model_probability) || !validProbability(r?.baseline_probability))
      bad.push('MISSING_INDEPENDENT_PAIRED_PROBABILITIES');
    if (r?.outcome !== 0 && r?.outcome !== 1)
      bad.push('OUTCOME_NOT_BINARY_OR_NOT_SETTLED');
    if (!r?.official_outcome_verified || !isTime(r?.outcome_observed_at) ||
        !isTime(r?.event_start_at) || Date.parse(r.outcome_observed_at) <= Date.parse(r.event_start_at))
      bad.push('OFFICIAL_OUTCOME_SOURCE_OR_TIME_NOT_VERIFIED');
    if (r?.invalid_market || r?.void_or_push)
      bad.push('INVALID_VOID_OR_PUSH_NOT_BINARY_SCORE');
    if (bad.length) { rejected.push({ case_key: r?.case_key || null, reasons: bad }); for(const b of bad) reasons.add(b); }
    else valid.push(r);
  }

  // Return blockers rather than drop non-eligible cases from denominator silently.
  if (rejected.length) blockers.push('NON_ELIGIBLE_CASES_REQUIRE_EXPLICIT_COHORT_REVIEW');
  const independent_roots = new Set(valid.map(r => r.root_key)).size;
  const observed_days = new Set(valid.map(r => r.event_start_at.slice(0, 10))).size;
  const unique_root_ratio = valid.length ? independent_roots / valid.length : 0;
  if (independent_roots < minCases || observed_days < minDays) blockers.push('INSUFFICIENT_PROSPECTIVE_SAMPLE');
  if (unique_root_ratio < 1) blockers.push('CORRELATED_ROOTS_NOT_ONE_INDEPENDENT_SAMPLE_EACH');

  let forecast = null;
  if (valid.length) {
    const modelBrier = mean(valid.map(r => loss(r.model_probability, r.outcome)));
    const baselineBrier = mean(valid.map(r => loss(r.baseline_probability, r.outcome)));
    const modelLogLoss = mean(valid.map(r => logLoss(r.model_probability, r.outcome)));
    const baselineLogLoss = mean(valid.map(r => logLoss(r.baseline_probability, r.outcome)));
    const improvement = baselineBrier - modelBrier;
    const confidence = rootBootstrap(valid, rec => mean(rec.map(r => loss(r.baseline_probability, r.outcome) - loss(r.model_probability, r.outcome))));
    forecast = {
      model_brier: round(modelBrier), baseline_brier: round(baselineBrier),
      brier_improvement: round(improvement), model_log_loss: round(modelLogLoss), baseline_log_loss: round(baselineLogLoss),
      paired_brier_gain_95: confidence, unique_event_root_count: independent_roots, observed_days,
      improves_brier_and_log_loss: improvement > 0 && modelLogLoss < baselineLogLoss,
    };
    if (!forecast.improves_brier_and_log_loss || !confidence || confidence.lower_95 <= 0)
      blockers.push('NO_RELIABLE_HELDOUT_FORECAST_LIFT');
  }
  const validPrices = valid.filter(r => r.exact_book_quote_verified && r.book && r.book_market_id &&
    r.price_observed_at && isTime(r.price_observed_at) &&
    Date.parse(r.price_observed_at) > Date.parse(r.frozen_at) &&
    Date.parse(r.price_observed_at) < Date.parse(r.event_start_at) &&
    Number.isFinite(r.odds_decimal) && r.odds_decimal > 1 &&
    Number.isFinite(r.virtual_stake) && r.virtual_stake > 0 && !r.synthetic_multi_leg_quote);
  let pricing = null;
  if (validPrices.length) {
    const pnl = rows => rows.reduce((s, r) => s + r.virtual_stake * (r.outcome ? r.odds_decimal - 1 : -1), 0);
    const staked = rows => rows.reduce((s, r) => s + r.virtual_stake, 0);
    const roi = rows => pnl(rows) / staked(rows);
    const confidence = rootBootstrap(validPrices, roi);
    pricing = { exact_book_quoted_cases: validPrices.length, total_stake: round(staked(validPrices), 2),
      net_paper_pnl: round(pnl(validPrices), 2), net_roi: round(roi(validPrices)),
      net_roi_95: confidence, excludes_synthetic_products: true };
  }
  if (validPrices.length !== valid.length) blockers.push('PRICING_INCOMPLETE_OR_SYNTHETIC');
  if (!pricing || !pricing.net_roi_95 || pricing.net_roi_95.lower_95 <= 0)
    blockers.push('NO_ROBUST_POSITIVE_PRICE_ADJUSTED_RETURN');
  const review_eligible = blockers.length === 0;
  return {
    contract: CONTRACT, experiment_key: packet.experiment_key,
    disposition: review_eligible ? 'HUMAN_REVIEW_ELIGIBLE_SHADOW_ONLY' : 'HOLD_COLLECT_OR_REPAIR_EVIDENCE',
    blockers: [...new Set(blockers)], rejected_cases: rejected,
    cohort: { frozen: packet.frozen_case_count, submitted: packet.cases.length, valid: valid.length,
      rejected: rejected.length, independent_roots, observed_days },
    forecast, pricing,
    uses_real_money: false, model_weights_changed: false, production_authority: false,
    note: 'Eligibility is not a profit guarantee and never authorizes bets or automatic model promotion.',
  };
}
