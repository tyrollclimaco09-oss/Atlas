'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildSlate}=require('./nba-integrated-100worlds.shadow.cjs');
test('integrated slate has eleven full-game cards and five market comparisons',()=>{
 const s=buildSlate();
 assert.equal(s.games,11);
 assert.equal(s.simulated_game_worlds,132000);
 assert.equal(s.representative_game_worlds,1100);
 assert.equal(s.simulated_player_worlds,80000);
 assert.equal(s.game_cards.length,11);
 assert.equal(s.market_tournament.length,5);
});
test('every market has model and book benchmark but absolutely no betting authority',()=>{
 const s=buildSlate();
 assert.equal(s.controls.selected_bet,null);
 assert.equal(s.controls.betting_authority,false);
 assert.equal(s.controls.price_identity_account_authenticated,false);
 assert.equal(s.controls.pricing_model_independently_calibrated,false);
 assert.equal(s.controls.social_as_probability_weight,0);
 assert.equal(s.controls.human_final_gate_required,true);
 for(const r of s.market_tournament){
 assert.equal(r.production_authority,false);
 assert.ok(r.model_frequency>=0&&r.model_frequency<=1);
 assert.ok(r.implied_break_even>0&&r.implied_break_even<1);
 assert.equal(r.approval,'INVESTIGATE_OR_PASS');
 }
});
test('lead is locked to explicit hypothesis but NOT a wager',()=>{
 const x=buildSlate().primary_thesis;
 assert.equal(x.key,'NBA_20261021_DAYRON_SHARPE_REBOUNDS_8_5');
 assert.equal(x.bet_qualified,false);
 assert.equal(x.state,'WATCH_VERIFY_MINUTES_AND_PRICE');
 assert.ok(x.observed_external_conflict.length>=2);
});
test('scene model is deterministic on pinned evidence',()=>{
 const a=buildSlate(),b=buildSlate();
 assert.deepEqual(a.game_cards,b.game_cards);
 assert.deepEqual(a.market_tournament,b.market_tournament);
});

test('Sharpe rebound scenario envelope changes with minutes and preserves PASS',()=>{
 const out=buildSlate();
 assert.equal(out.coupled_rebound_stress.cases.length,4);
 assert.equal(out.coupled_rebound_stress.game,'CHA@BKN');
 const arr=Object.fromEntries(out.coupled_rebound_stress.cases.map(c=>[c.scenario,c]));
 assert.ok(arr.STARTER.reb9_frequency>arr.RESTRICTED.reb9_frequency);
 assert.ok(arr.COMPETITION.reb9_frequency<arr.STARTER.reb9_frequency);
 assert.ok(out.primary_thesis.coupled_rebound_range.worst<out.primary_thesis.coupled_rebound_range.reference_break_even);
 assert.equal(out.primary_thesis.coupled_rebound_range.all_plausible_worlds_profitable,false);
 assert.equal(out.controls.selected_bet,null);
 assert.equal(out.controls.betting_authority,false);
});

test('lead now exposes conservative scenario-price uncertainty without betting approval',()=>{
 const slate=buildSlate();
 const lead=slate.primary_thesis;
 const envelope=lead.conditional_market_price_envelope;
 assert.ok(envelope);
 assert.equal(envelope.schema,'atlas.nba.scenario-price-envelope.shadow.v1');
 assert.equal(envelope.shadow_outcome,'DISAGREEMENT_ACROSS_SCENARIOS');
 assert.equal(envelope.epistemic_envelope.min,lead.coupled_rebound_range.worst);
 assert.equal(envelope.epistemic_envelope.max,lead.coupled_rebound_range.best);
 assert.equal(envelope.epistemic_envelope.zero_margin_american_odds_worst_assumed_scenario,184);
 assert.equal(envelope.approved_bet,null);
 assert.equal(envelope.expected_value,null);
 assert.equal(envelope.reference_quote.price_executable,false);
 assert.equal(slate.controls.selected_bet,null);
});
