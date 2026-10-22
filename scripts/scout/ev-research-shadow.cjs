'use strict';

// ATLAS integration with EXISTING canonical Command Center pricing and HM-01.
// Offline demonstration ONLY. Input quotes + probability assumptions MUST be synthetic.
// Explicitly not an independent forecast, a real EV signal, or wagering advice.
const { mirror } = require('./house-mirror-shadow.cjs');
const { calculatePrice } = require('../../command-center/pricing.js');
const VERSION = 'atlas.ev-research-shadow.v1';
const KEYS = ['schema_version','synthetic','research_only','mirror_input','target_book_id',
  'target_side','probability_scenarios'];
const SCENARIOS = ['low','center','high'];
const exact = (x, keys) => x && typeof x === 'object' && !Array.isArray(x) &&
  Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
const requireTrue = (ok, reason) => { if (!ok) throw Error(reason); };
const finiteProbability = x => typeof x === 'number' && Number.isFinite(x) && x > 0 && x < 1;
function frozen(x) { if (x && typeof x === 'object') { Object.values(x).forEach(frozen); Object.freeze(x); } return x; }

function evaluate(input) {
  requireTrue(exact(input, KEYS) && input.schema_version === VERSION &&
    input.synthetic === true && input.research_only === true &&
    typeof input.target_book_id === 'string' &&
    ['a', 'b'].includes(input.target_side) &&
    exact(input.probability_scenarios, SCENARIOS), 'EV_SHADOW_CONTRACT');
  const ps = input.probability_scenarios;
  requireTrue(SCENARIOS.every(k => finiteProbability(ps[k])) &&
    ps.low <= ps.center && ps.center <= ps.high, 'EV_SHADOW_SCENARIOS');

  // HM-01 independently enforces synthetic-origin, clock, identity, overround
  // and provider-family controls. Do NOT weaken HM-01 to accept live inputs.
  const market = mirror(input.mirror_input);
  const quote = market.accepted.find(x => x.book_id === input.target_book_id);
  requireTrue(Boolean(quote), 'EV_SHADOW_NO_VERIFIED_QUOTE');
  requireTrue(market.descriptive_median_no_vig_a !== null, 'EV_SHADOW_NO_MARKET_BENCHMARK');
  const odds = input.target_side === 'a' ? quote.american_a : quote.american_b;
  const benchmark = input.target_side === 'a' ?
    market.descriptive_median_no_vig_a : 1 - market.descriptive_median_no_vig_a;
  const output = Object.fromEntries(SCENARIOS.map(k => {
    // Reuse the actual Command Center formula, don't shadow-copy EV math.
    const result = calculatePrice(String(odds), String(ps[k] * 100));
    return [k, { hypothetical_probability: ps[k],
      expected_roi_at_quote: result.expected,
      assumed_probability_minus_market_no_vig: ps[k] - benchmark }];
  }));
  const price = calculatePrice(String(odds));
  requireTrue(output.low.expected_roi_at_quote <= output.center.expected_roi_at_quote &&
    output.center.expected_roi_at_quote <= output.high.expected_roi_at_quote, 'EV_SHADOW_ORDER');
  return frozen({
    schema_version: VERSION,
    synthetic: true,
    research_only: true,
    classification: 'CONDITIONAL_HYPOTHETICAL_MATH_ONLY',
    event_id: input.mirror_input.event_id,
    market_id: market.market_identity.market_id,
    target_book_id: input.target_book_id,
    target_side: input.target_side,
    target_american_odds: odds,
    decimal_odds: price.decimal,
    break_even_probability: price.breakEven,
    market_family_count: market.quoted_provider_families,
    provider_independence: 'UNVERIFIED',
    descriptive_market_no_vig_probability: benchmark,
    scenarios: output,
    independent_fair_probability: null,
    verified_ev: null,
    recommended_selection: null,
    warnings: [
      'SCENARIOS_ARE_ASSUMPTIONS_NOT_CALIBRATED_FORECASTS',
      'MARKET_NO_VIG_IS_NOT_AN_INDEPENDENT_PROBABILITY',
      'PROBABILITY_ADVANTAGE_IS_NOT_EXPECTED_ROI',
      'NO_LIVE_OR_EXECUTABLE_QUOTES',
    ],
    execution_authority: false,
    human_final_gate_required: true,
    api_calls: 0,
  });
}
module.exports = Object.freeze({ VERSION, evaluate });
