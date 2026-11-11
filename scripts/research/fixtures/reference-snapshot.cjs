'use strict';
// Synthetic offline fixture. No sportsbook, event or available price is claimed.
const {createHash}=require('node:crypto');
const digest=s=>createHash('sha256').update(s).digest('hex');
function packet(){
 const books=['draftkings','reference_a','reference_b','reference_c'];
 const quotes=books.map((book,i)=>({observationId:'synthetic-'+i,sourceId:'synthetic_fixture',book,
  product:'sportsbook',sport:'NBA',eventId:'SYNTHETIC_NBA_EVENT',eventStartUtc:'2026-11-11T19:00:00Z',
  homeTeamId:'TEAM:B',awayTeamId:'TEAM:A',market:'moneyline',period:'full_game',overtimeRule:'included',
  settlementRuleId:'nba_ml_ot_fixture_v1',sourceObservedAtUtc:'2026-11-11T17:59:30Z',
  fetchedAtUtc:'2026-11-11T17:59:35Z',marketStatus:'OPEN',
  outcomes:[{participantId:'TEAM:A',side:'win',line:null,americanOdds:i===0?105:-120},
   {participantId:'TEAM:B',side:'win',line:null,americanOdds:i===0?-125:100}]}));
 const p={contract:'ATLAS_OFFLINE_REFERENCE_SCAN_V1',asOfUtc:'2026-11-11T18:00:00Z',
  cohortId:'SYNTHETIC_DEMONSTRATION_ONLY',decisionSlot:'PRE_GAME_60M',targetBook:'draftkings',
  ingestion:{status:'ok',errors:[]},priorDecisionIds:[],
  sourceRegistry:[{sourceId:'synthetic_fixture',status:'approved',sourceClass:'FIXTURE',
   products:['sportsbook'],capabilities:['two_sided_prices'],usageReview:'approved',
   timestampSemantics:'market_last_seen',approvedForOfflineResearch:true,bookIds:books}],
  rulesRegistry:[{rulesId:'nba_ml_ot_fixture_v1',product:'sportsbook',sport:'NBA',market:'moneyline',
   period:'full_game',overtimeRule:'included',settlement:'win_loss_no_push'}],
  policy:{version:'nba_moneyline_reference_v1',minReferences:3,minEV:.03,maxSourceAgeSeconds:300,
   maxFetchAgeSeconds:60,maxCrossBookSeconds:60,referenceBooks:['reference_a','reference_b','reference_c']},
  snapshots:[]};
 return replaceQuotes(p,quotes);
}
function replaceQuotes(p,quotes){
 const rawBody=JSON.stringify({contract:'ATLAS_NORMALIZED_ODDS_SNAPSHOT_V1',observations:quotes});
 p.snapshots=[{snapshotId:'synthetic_snapshot',sourceId:'synthetic_fixture',syntheticFixture:true,
  fetchedAtUtc:'2026-11-11T17:59:35Z',rawBody,rawSha256:digest(rawBody)}];
 return p;
}
const quotes=p=>JSON.parse(p.snapshots[0].rawBody).observations;
module.exports={packet,replaceQuotes,quotes,digest};
