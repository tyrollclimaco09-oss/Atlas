'use strict';
// Research-only retrospective. Requires separate pregame and postgame source files.
// No forecasting, no odds integration, no bet execution or retrospective winner promotion.
function evaluateMechanisms({pregameScout,pregameGameSense,postgame}){
 const error=s=>{throw Error(s)};
 if(pregameScout?.schema!=='atlas.scout.wide.review.v2'||
    pregameGameSense?.schema!=='atlas.opening-night-full-gamesense-rerun.review.v3'||
    postgame?.schema!=='atlas.nba.20261020.postgame-mechanism-observations.v1'||
    postgame.retrospective_only!==true)error('SOURCE_CONTRACT_INVALID');
 if(pregameScout.created_on_local_date!=='2026-10-19'||
    !/2026-10-19T\d\d:\d\d:\d\d-05:00/.test(pregameGameSense.observed_at_local)||
    postgame.observation_date!=='2026-10-21')error('TEMPORAL_FENCE_UNVERIFIED');
 const matches=new Map(pregameScout.opening_night_games.map(x=>[x.id,x]));
 const det=postgame.games.find(g=>g.id==='BOS@DET'),nyk=postgame.games.find(g=>g.id==='PHI@NYK');
 if(!det||!nyk||postgame.games.length!==2)error('EVENT_COVERAGE_INVALID');
 for(const g of [det,nyk]){
  const e=matches.get(g.id);
  if(!e||!Number.isFinite(Date.parse(e.start_at_utc))||!/^2026-10-20T/.test(e.start_at_utc)||
     !g.source?.startsWith('https://www.nba.com/')||
     !g.summary_url?.startsWith('https://www.nba.com/')||
     !Number.isInteger(g.away_pts)||!Number.isInteger(g.home_pts)||
     !Array.isArray(g.quarter_home)||g.quarter_home.length!==4||
     !Array.isArray(g.quarter_away)||g.quarter_away.length!==4||
     g.quarter_home.reduce((a,b)=>a+b,0)!==g.home_pts||
     g.quarter_away.reduce((a,b)=>a+b,0)!==g.away_pts)error('OFFICIAL_RESULT_TRANSCRIPTION_INCONSISTENT');
 }
 const find=(p,id,player)=>p.market_hypotheses.find(c=>c.id===id&&c.player===player);
 const duncan=find(pregameScout,'BOSDET-04','Duncan Robinson');
 const brunson=find(pregameScout,'PHINYK-01','Jalen Brunson');
 if(!duncan||!duncan.market_exploration.includes('3PM 3+')||
    !brunson||!brunson.market_exploration.includes('points'))error('PREGAME_CLAIMS_MISSING');
 const gdet=pregameGameSense.games.find(g=>g.id==='BOS@DET' || g.event==='BOS@DET');
 const gnyk=pregameGameSense.games.find(g=>g.id==='PHI@NYK' || g.event==='PHI@NYK');
 if(!gdet||!gnyk)error('PREGAME_SCRIPT_COVERAGE');
 if(!gdet.scripts.some(s=>s.markets_helped?.includes('Duncan Robinson 2+ threes')&&/Cade draws ball pressure/.test(s.causal_mechanism)))error('DUNCAN_SCRIPT_MISSING');
 if(!gnyk.scripts.some(s=>s.markets_helped?.includes('Brunson 25+ points')&&/Brunson exploits/.test(s.causal_mechanism)))error('BRUNSON_SCRIPT_MISSING');
 const d=det.players.duncan_robinson,b=nyk.players.jalen_brunson,c=det.players.cade_cunningham;
 if(![d.three_made,d.three_attempts,d.pts,b.pts,b.fgm,b.fga,b.ftm,c.ast].every(Number.isInteger)||
    d.three_made>d.three_attempts||b.fgm>b.fga||b.ftm>b.pts)error('PLAYER_STAT_INTEGRITY');
 const prior=duncan.constructive_case_and_strong_caveat?.match(/(\d+(?:\.\d+)?) 3PM and (\d+(?:\.\d+)?) 3PA/);
 if(!prior)error('HISTORICAL_PRIOR_NOT_PRESENT');
 const oldMakes=Number(prior[1]),oldAttempts=Number(prior[2]),historicShotRate=oldMakes/oldAttempts;
 const nykTeam=nyk.teams?.NYK,phiTeam=nyk.teams?.PHI;
 if(!nykTeam||!phiTeam||[nykTeam,phiTeam].some(t=>t.fgm>t.fga||t.three_made>t.three_attempts||t.fga<=t.three_attempts||t.three_made>t.fgm))error('TEAM_SHOT_INTEGRITY');
 const twoRate=t=>(t.fgm-t.three_made)/(t.fga-t.three_attempts);
 const scoringGap={
  philly_two_point_rate:+twoRate(phiTeam).toFixed(4),
  knicks_two_point_rate:+twoRate(nykTeam).toFixed(4),
  third_quarter_points:{PHI:nyk.quarter_away[2],NYK:nyk.quarter_home[2]},
  knicks_halftime_lead:nyk.quarter_home.slice(0,2).reduce((a,b)=>a+b,0)-nyk.quarter_away.slice(0,2).reduce((a,b)=>a+b,0)
 };
 return {
  schema:'atlas.nba.postgame-causal-grade.shadow.v1',
  run_mode:'POSTGAME_FORENSIC_ONLY',
  source_separation:{pregame_archive:true,postgame_separate:true,quotes_or_execution_proven:false},
  duncan:{
   thesis:'Detroit Cade gravity -> off-ball Duncan opportunity',
   exact_pregame_scout_threshold:3,
   alternate_pregame_script_threshold:2,
   actual_three_made:d.three_made,
   actual_three_attempts:d.three_attempts,
   scout_market_hit:d.three_made>=3,
   baseline_attempts:oldAttempts,
   baseline_makes:oldMakes,
   observed_attempt_delta:+(d.three_attempts-oldAttempts).toFixed(2),
   additional_expected_makes_if_historical_rate_constant:+((d.three_attempts-oldAttempts)*historicShotRate).toFixed(3),
   residual_makes_vs_fixed_prior_efficiency:+(d.three_made-d.three_attempts*historicShotRate).toFixed(3),
   creator_cade_assists:c.ast,
   causal_role_verified:false,
   opportunity_side_consistent:true
  },
  brunson:{
   pregame_script_threshold:25,actual_points:b.pts,
   script_hit:b.pts>=25,
   observed_fga:b.fga,observed_fgm:b.fgm,fg_pct:+(b.fgm/b.fga).toFixed(4),
   opportunity_volume_predicted_correctly:null, // no predeclared attempt distribution
   alternate_20points_was_not_original_offer:true
  },
  game_factors:{
   detroit_largest_deficit:det.max_boston_lead,
   detroit_unanswered_run:det.pistons_unanswered_run,
   detroit_fourth_quarter_points:det.quarter_home[3],
   boston_fourth_quarter_points:det.quarter_away[3],
   detroit_bench_shock_points:det.players.javonte_green.pts,
   tatum_fg_attempts:det.players.jayson_tatum.fga,
   tatum_fg_makes:det.players.jayson_tatum.fgm,
   philly_new_york:scoringGap
  },
  model_edge:null,realized_profit:null,verified_probability:null,
  suggested_validation:'Freeze future opponent/role/attempt and conversion projections separately; independently score event-conditioned opportunities and results before calculating price EV.',
  production_authority:false,betting_authority:false
 };
}
module.exports=Object.freeze({evaluateMechanisms});
