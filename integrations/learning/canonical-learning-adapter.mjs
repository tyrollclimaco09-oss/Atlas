/**
 * ATLAS canonical observations -> evidence gate adapter (SHADOW, read-only).
 * Never invent official outcomes, current rosters, model probabilities, prices,
 * missing model IDs, dates or independence attestations.
 *
 * Inputs: already-authorized read-only Supabase result objects. No network,
 * database writes, credentials, bookmaker calls, execution or auto promotion.
 */
export const ADAPTER_CONTRACT = 'ATLAS_CANONICAL_LEARNING_ADAPTER_V1';

const filled = v => typeof v === 'string' && v.trim().length > 0;
const stamp = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const numeric = v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1;
const array = v => Array.isArray(v) ? v : [];
const same = (a, b) => filled(a) && a === b;
const stampMs = v => stamp(v) ? Date.parse(v) : NaN;

/** Does not equate distinct event markets/periods or treat name matches as IDs. */
function byPair(rows, candidateKey, eventId) {
  return array(rows).filter(r => same(r?.candidate_key, candidateKey) &&
    same(r?.event_id, eventId));
}
function reason(list, code) { if (!list.includes(code)) list.push(code); }
function separate(rows, id) {
  const matches = array(rows).filter(r => same(r?.experiment_id, id));
  return matches;
}
export function reconcileCanonicalLearning(inputs, policy = {}) {
  if (!inputs || typeof inputs !== 'object' || !inputs.experiment ||
    !Array.isArray(inputs.observations) || !Array.isArray(inputs.predictions) ||
    !Array.isArray(inputs.official_outcomes) || !Array.isArray(inputs.identities) ||
    !Array.isArray(inputs.quotes)) throw Error('CANONICAL_RECONCILE_INPUT_INVALID');
  const experiment = inputs.experiment;
  const meta = inputs.frozen_cohort || null;
  const notes = [];
  if (!filled(experiment.experiment_key) || !filled(experiment.experiment_id))
    notes.push('NO_CANONICAL_EXPERIMENT_KEY_AND_ID');
  if (!meta || !filled(meta.model_version) || !filled(meta.baseline_id) ||
      !filled(meta.frozen_cohort_id) || !filled(meta.training_cutoff) ||
      !filled(meta.holdout_start) || !filled(meta.hypothesis) ||
      !Number.isInteger(meta.frozen_case_count) || !meta.out_of_time_holdout)
    notes.push('NO_PREREGISTERED_FROZEN_COHORT_MANIFEST');
  const observations = separate(inputs.observations, experiment.experiment_id);
  if (observations.length !== inputs.observations.length)
    notes.push('UNRELATED_EXPERIMENT_OBSERVATIONS_PRESENT');
  const seenObs = new Set();
  const audits = [];
  const prepared = [];
  for (const observation of observations) {
    const errors = [];
    if (!filled(observation?.candidate_key)) reason(errors, 'MISSING_OBSERVATION_CANDIDATE');
    if (!filled(observation?.event_id)) reason(errors, 'MISSING_CANONICAL_EVENT_ID');
    if (!stamp(observation?.observed_at)) reason(errors, 'MISSING_OBSERVATION_TIMESTAMP');
    const key = observation?.candidate_key;
    if (seenObs.has(key)) reason(errors, 'DUPLICATE_OBSERVATION_CANDIDATE');
    seenObs.add(key);
    const event = observation?.event_id;
    const preds = byPair(inputs.predictions, key, event);
    const outs = byPair(inputs.official_outcomes, key, event);
    const ids = byPair(inputs.identities, key, event);
    const quoteRows = byPair(inputs.quotes, key, event);
    if (preds.length !== 1) reason(errors, 'MISSING_OR_AMBIGUOUS_FROZEN_PREDICTION');
    if (outs.length !== 1) reason(errors, 'MISSING_OR_AMBIGUOUS_OFFICIAL_OUTCOME');
    if (ids.length !== 1) reason(errors, 'MISSING_OR_AMBIGUOUS_VERIFIED_IDENTITY');
    if (quoteRows.length > 1) reason(errors, 'AMBIGUOUS_PROVIDER_QUOTE');
    const p = preds.length === 1 ? preds[0] : null;
    const o = outs.length === 1 ? outs[0] : null;
    const identity = ids.length === 1 ? ids[0] : null;
    const price = quoteRows.length === 1 ? quoteRows[0] : null;
    // Require a separately recorded source-authenticated team, event and market join.
    if (!identity?.verified_current_team || !identity?.verified_event_teams ||
        !identity?.verified_market_identity || !identity?.verified_settlement_rules ||
        !filled(identity?.market_id) || !filled(identity?.source_uri) ||
        !stamp(identity?.source_observed_at) ||
        !(stamp(p?.frozen_at) && stampMs(identity?.source_observed_at) <= stampMs(p.frozen_at)))
      reason(errors, 'OFFICIAL_IDENTITY_AND_MARKET_PROOF_MISSING');
    // True independent model-prediction evidence must predate any quoted odds.
    if (!p || !filled(p.model_key) || !numeric(p.predicted_probability) ||
        !stamp(p.frozen_at) || !stamp(p.event_start_at) ||
        stampMs(p.frozen_at) >= stampMs(p.event_start_at) ||
        !p.independent_inputs_verified ||
        !stamp(p.features_observed_at) || stampMs(p.features_observed_at) > stampMs(p.frozen_at))
      reason(errors, 'INDEPENDENT_PRESTART_FORECAST_NOT_PROVEN');
    const base = observation?.baseline_output;
    if (!numeric(base?.predicted_probability) || !stamp(base?.frozen_at) ||
        !(stamp(p?.frozen_at) && stampMs(base.frozen_at) <= stampMs(p.frozen_at)) ||
        !filled(base?.model_version))
      reason(errors, 'NUMERIC_FROZEN_BASELINE_MISSING');
    const root = p?.root_tags && typeof p.root_tags === 'object' && !Array.isArray(p.root_tags)
      ? p.root_tags.root_key : null;
    if (!filled(root)) reason(errors, 'MISSING_SHARED_CAUSAL_ROOT_KEY');
    if (!o || !o.verified_official_source || !filled(o.source_uri) ||
        !stamp(o.observed_at) || !stamp(p?.event_start_at) ||
        stampMs(o.observed_at) <= stampMs(p.event_start_at) ||
        (o.binary_outcome !== 0 && o.binary_outcome !== 1) ||
        !same(o.market_id, identity?.market_id) || o.invalid_market || o.void_or_push)
      reason(errors, 'OFFICIAL_BINARY_RESULT_NOT_ADMISSIBLE');
    let exactQuote = false;
    if (price && p && identity) {
      exactQuote = !!(price.verified_exact_book_quote && filled(price.book) &&
        filled(price.provider_market_id) && filled(price.source_uri) &&
        same(price.market_id, identity.market_id) &&
        stamp(price.observed_at) && stamp(p.frozen_at) &&
        stampMs(price.observed_at) > stampMs(p.frozen_at) &&
        stampMs(price.observed_at) < stampMs(p.event_start_at) &&
        !price.synthetic_combination && Number.isFinite(price.odds_decimal) &&
        price.odds_decimal > 1 && Number.isFinite(price.virtual_stake) &&
        price.virtual_stake > 0);
    }
    if (!exactQuote) reason(errors, 'EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN');
    // Forecast scoring and bookmaker pricing are separate evidence lanes.
    // An unquoted, genuinely pregame forecast may still be scored after an
    // authenticated final result, without inventing any paper return or EV.
    const forecastReady = errors.every(x => x !== 'EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN');
    const eligible = forecastReady && exactQuote;
    audits.push({case_key:key || null,event_id:event || null,
      status:eligible?'EVIDENCE_READY':forecastReady?'FORECAST_READY_PRICE_HOLD':'HOLD',
      forecast_ready:forecastReady, price_ready:exactQuote, reasons:errors,
      matched_predictions:preds.length,matched_outcomes:outs.length,matched_identities:ids.length,matched_quotes:quoteRows.length});
    if (forecastReady) {
      prepared.push({
        case_key:key,sport:p.sport,event_id:event,market_id:identity.market_id,root_key:root,
        current_team_verified:true,event_teams_verified:true,settlement_rules_verified:true,
        frozen_at:p.frozen_at,features_observed_at:p.features_observed_at,event_start_at:p.event_start_at,
        model_probability:p.predicted_probability,baseline_probability:base.predicted_probability,
        outcome:o.binary_outcome,official_outcome_verified:true,outcome_observed_at:o.observed_at,
        invalid_market:false,void_or_push:false,
        exact_book_quote_verified:exactQuote,book:exactQuote?price.book:null,
        book_market_id:exactQuote?price.provider_market_id:null,
        price_observed_at:exactQuote?price.observed_at:null,
        odds_decimal:exactQuote?price.odds_decimal:null,
        virtual_stake:exactQuote?price.virtual_stake:null,
        synthetic_multi_leg_quote:!!price?.synthetic_combination,
      });
    }
  }
  if (observations.length === 0) notes.push('NO_CANONICAL_OBSERVATIONS');
  if (!meta || meta.frozen_case_count !== observations.length) notes.push('FROZEN_CASE_COUNT_MISMATCH');
  if (audits.some(x => !x.forecast_ready)) notes.push('INCOMPLETE_FORECAST_CASE_EVIDENCE');
  // We never silently discard losses, null probabilities, invalid markets or unmatched cases.
  const canCreatePacket = notes.length === 0 && prepared.length === observations.length && prepared.length > 0;
  const packet = canCreatePacket ? {
    contract:'ATLAS_EXPERIMENT_EVIDENCE_GATE_V1',experiment_key:experiment.experiment_key,
    hypothesis:meta.hypothesis,model_version:meta.model_version,baseline_id:meta.baseline_id,
    frozen_cohort_id:meta.frozen_cohort_id,training_cutoff:meta.training_cutoff,
    holdout_start:meta.holdout_start,out_of_time_holdout:true,
    model_uses_bookmaker_odds:false,independent_model_inputs_verified:meta.independent_model_inputs_verified === true,
    frozen_case_count:meta.frozen_case_count,cases:prepared,
  } : null;
  return {contract:ADAPTER_CONTRACT,
    disposition:!canCreatePacket?'HOLD_NO_MODEL_CALIBRATION':
      audits.some(a=>!a.price_ready)?'FORECAST_PACKET_READY_PRICING_HOLD':'PACKET_READY_FOR_SHADOW_EVALUATION',
    experiment_key:experiment.experiment_key||null,
    counts:{raw_observations:observations.length,matched_to_experiment:observations.length,
      with_official_outcome:audits.filter(a=>a.matched_outcomes===1).length,
      with_numeric_eligible_forecast:prepared.length,
      complete_case_evidence:audits.filter(a=>a.status==='EVIDENCE_READY').length,
      held_cases:audits.filter(a=>a.status==='HOLD').length},
    blockers:[...new Set(notes)],
    pricing_blockers:audits.some(a=>a.forecast_ready && !a.price_ready)?['EXACT_BOOK_QUOTE_NOT_PROVEN_FOR_ROI']:[],
    case_audit:audits,packet,
    source_mode:'RECONCILED_READ_ONLY_INPUT',production_authority:false,model_weights_changed:false,
    real_betting_authority:false,virtual_bankroll_affected:false};
}
