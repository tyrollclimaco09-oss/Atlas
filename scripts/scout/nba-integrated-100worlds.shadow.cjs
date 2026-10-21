'use strict';
// ATLAS 100 Worlds integrated shadow slate. No network calls, no account prices,
// no canonical betting writes, no wagering authority. All source inputs pinned.
const fs=require('node:fs'),path=require('node:path');
const {simulateSlate}=require('./nba-100-worlds-hybrid.shadow.cjs');
const {simulatePlayerProps}=require('./nba-causal-props.shadow.cjs');
const {evaluate}=require('./nba-rolling-calibration.shadow.cjs');
const {simulateCoupledRebounds}=require('./nba-rebound-opportunity-coupled.shadow.cjs');
const {auditEnvelope}=require('./nba-scenario-price-envelope.shadow.cjs');
const root=path.resolve(__dirname,'../..');
const evFile=name=>JSON.parse(fs.readFileSync(path.join(root,'docs/evidence',name),'utf8'));
const slugs=['dayron-sharpe','bam-adebayo','jalen-johnson','scottie-barnes'];
function buildSlate(){
 const gs=simulateSlate({gamelog:evFile('luka-2025-26-game-log-reference.json'),
  teams:evFile('nba-2025-26-team-ratings-reference.json'),
  market:evFile('nba-20261021-reference-market-snapshot.json')},
  {samples:12000,seed:20261021,focusGame:'CHA-BKN'});
 const logs=Object.fromEntries(slugs.map(slug=>[slug,evFile('nba-2025-26-'+slug+'-gamelog.json')]));
 const players=simulatePlayerProps({logs},{n:20000,seed:20261021});
 const cv=evaluate(logs);
 const matchup=gs.results.find(g=>g.away==='CHA'&&g.home==='BKN');
 if(!matchup?.full_worlds||matchup.full_worlds.length!==12000)throw Error('MISSING_COULED_GAME_STATE');
 const coupledInputs={fullWorlds:matchup.full_worlds,
   teamHistory:evFile('nba-2025-26-bkn-cha-shot-rebound-reference.json'),
   playerLog:logs['dayron-sharpe']};
 const cases=['RESTRICTED','MIXED','STARTER','COMPETITION'].map(scenario=>{
   const x=simulateCoupledRebounds(coupledInputs,{scenario,seed:20261021});
   return {scenario,reb9_frequency:x.result.reb_over8_5,
     model_mean_reb:x.result.reb_mean,average_minutes:x.result.means.minutes,
     benchmark_american_odds:+113,benchmark_is_executable:false,
     joint_truth_counts:x.result.fourTruth,
     alt_rebound_ladder:scenario==='MIXED'?x.modeled_threshold_ladders.rebounds:undefined};
 });
 const worst=Math.min(...cases.map(c=>c.reb9_frequency)),
   best=Math.max(...cases.map(c=>c.reb9_frequency));
 const priceEnvelope=auditEnvelope({
  identity:{event_id:'20261021-CHA-BKN',player_key:'dayron-sharpe',starts_at:'2026-10-21T23:30:00Z'},
  market:{stat:'rebounds',operator:'AT_LEAST',threshold:9,units:'COUNT',settlement:'NO_PUSH'},
  scenarios:cases.map(c=>({name:c.scenario,n:12000,hit_frequency:c.reb9_frequency,
   calibrated:false,probability_source:'SCENARIO_ASSUMPTION'})),
  quote:{source:'THIRD_PARTY_REFERENCE',status:'REFERENCE_ONLY',
   provider:'Archived third-party DK research board',
   event_id:'20261021-CHA-BKN',player_key:'dayron-sharpe',stat:'rebounds',
   operator:'AT_LEAST',threshold:9,settlement:'NO_PUSH',american_odds:113,
   captured_at:'2026-10-21T18:00:00Z'},
  as_of:'2026-10-21T18:05:00Z'
 });
 const priceBound=c=>c>0?100/(100+c):-c/(100-c);
 const results=players.reports.map(r=>({
  name:r.player,market:r.market,reference_price:r.reference_american_odds,
  model_frequency:r.model.frequency,implied_break_even:r.implied_probability,
  forecast_delta_pp:+(100*(r.model.frequency-r.implied_probability)).toFixed(2),
  hypothetical_profit_on_one_dollar:r.model.hypothetical_roi,
  note:'Uncalibrated scenario prior; third-party quote, not authenticated executable',
  approval:'INVESTIGATE_OR_PASS',production_authority:false
 }));
 const luka=gs.results.find(g=>g.home==='LAL'&&g.away==='GSW');
 if(!luka)throw Error('LUKA_GAME_MISSING');
 const lukaQuote=-101;
 results.push({name:'luka-doncic',market:'PRA 50+',reference_price:lukaQuote,
  model_frequency:luka.luka.simulated_pra50_frequency,
  implied_break_even:+priceBound(lukaQuote).toFixed(4),
  forecast_delta_pp:+(100*(luka.luka.simulated_pra50_frequency-priceBound(lukaQuote))).toFixed(2),
  note:'Uncalibrated scenario prior; public quote, not executable',approval:'INVESTIGATE_OR_PASS',production_authority:false});
 const controls={
  pricing_model_independently_calibrated:false,
  full_starting_lineups_verified:false,
  price_identity_account_authenticated:false,
  social_as_probability_weight:0,
  betting_authority:false,
  human_final_gate_required:true,
  no_automatic_bets:true,
  no_automatic_stakes:true,
  selected_bet:null
 };
 const gameCards=gs.results.map(g=>({id:g.game_id,game:g.away+' @ '+g.home,
  median_total:g.simulated.total.p50,p10_total:g.simulated.total.p10,p90_total:g.simulated.total.p90,
  home_win_frequency:g.simulated.home_win_rate,blowout_rate:g.simulated.blowout_16_rate,
  script_counts_100:g.worlds100.script_counts,bet_ready:false}));
 return {
  schema:'atlas.nba.integrated_100worlds.slate.shadow.v1',
  event_date:'2026-10-21',phase:'PREGAME_RESEARCH_ONLY',result_authority:'NONE',
  games:11,simulated_game_worlds:132000,representative_game_worlds:1100,simulated_player_worlds:80000,
  game_cards:gameCards,market_tournament:results,
  primary_thesis:{key:'NBA_20261021_DAYRON_SHARPE_REBOUNDS_8_5',
    hypothesis:'Sharpe can reach 9+ rebounds if his new starting-center role produces ~30 minutes without a material rebound-share decline',
    downside:'Independent 26-minute projection, Randle/Porter rebound competition, foul trouble, blowout',
    observed_external_conflict:['Action Network ~30 minutes','NBA Fantasy Edge 26 minutes'],
    default_simulation_frequency:players.reports.find(x=>x.player==='dayron-sharpe').model.frequency,
    minutes_30_scenario_requires_new_readback:true,
    coupled_rebound_range:{worst,best,reference_break_even:100/213,all_plausible_worlds_profitable:false},
    conditional_market_price_envelope:priceEnvelope,
    state:'WATCH_VERIFY_MINUTES_AND_PRICE',bet_qualified:false},
  coupled_rebound_stress:{game:'CHA@BKN',mode:'SHADOW_ONLY',cases},
  calibration:cv.reports.map(r=>({name:r.player,holdout_games:r.holdout_games,brier:r.brier})),
  controls
 };
}
if(require.main===module)process.stdout.write(JSON.stringify(buildSlate()));
module.exports={buildSlate};
