'use strict';
// ATLAS INTEGRATION ARENA v8: research-only, no network, no wager execution, no side effects.
const market=require('./market-intelligence.cjs');
const gate=require('./pivot-gate.cjs');
const features=require('./feature-lab.cjs');
const value=require('./value-cortex.cjs');
const edge=require('./edge-dna.cjs');
const discovery=require('./discovery-guard.cjs');

const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const round=(x,n=3)=>Number(x.toFixed(n));
function assertValidHistory(history, forecastUtc, schedule){
  if(!history||!Array.isArray(history.games)||!Array.isArray(schedule)||!Number.isFinite(Date.parse(forecastUtc)))throw Error('INVALID_INPUT');
  const ids=new Set(),games=[];
  for(const row of history.games){
    if(!Array.isArray(row)||row.length!==6)throw Error('INVALID_GAME_ROW');
    const [id,start,home,homeScore,away,awayScore]=row;
    if(!Number.isInteger(id)||ids.has(id)||!Number.isFinite(Date.parse(start))||
      Date.parse(start)>=Date.parse(forecastUtc)||!home||!away||home===away||
      !Number.isInteger(homeScore)||!Number.isInteger(awayScore)||homeScore<0||awayScore<0)throw Error('BAD_OR_DUPLICATE_HISTORICAL_GAME');
    ids.add(id);games.push({id,start,home,homeScore,away,awayScore});
  }
  if(!history.sourceGeneratedAtUtc||Date.parse(history.sourceGeneratedAtUtc)>Date.parse(forecastUtc))throw Error('FUTURE_SOURCE_CAPTURE');
  const eventIds=new Set();
  for(const s of schedule){if(!Number.isInteger(s.eventId)||eventIds.has(s.eventId)||!s.home||!s.away||s.home===s.away||
      !Number.isFinite(Date.parse(s.startUtc))||Date.parse(s.startUtc)<=Date.parse(forecastUtc))throw Error('NON_PROSPECTIVE_SCHEDULE');
    eventIds.add(s.eventId);}
  return games.sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
}
function teamScores(games,team){return games.filter(x=>x.home===team||x.away===team).map(x=>({at:x.start,for:x.home===team?x.homeScore:x.awayScore,against:x.home===team?x.awayScore:x.homeScore}));}
function predictUpcoming(history,schedule,forecastUtc,{lastN=5}={}){
  const games=assertValidHistory(history,forecastUtc,schedule);
  if(!Number.isSafeInteger(lastN)||lastN<2||lastN>50)throw Error('INVALID_LOOKBACK');
  return schedule.map(s=>{
    const home=teamScores(games,s.home).slice(-lastN),away=teamScores(games,s.away).slice(-lastN);
    if(home.length<lastN||away.length<lastN) return {eventId:s.eventId,game:`${s.away}@${s.home}`,status:'INSUFFICIENT_HISTORY',homeSamples:home.length,awaySamples:away.length};
    // Completely odds-free mechanical baseline. No home factor or injury estimate; uncalibrated.
    const predictedHome=round((mean(home.map(x=>x.for))+mean(away.map(x=>x.against)))/2,2);
    const predictedAway=round((mean(away.map(x=>x.for))+mean(home.map(x=>x.against)))/2,2);
    return {eventId:s.eventId,game:`${s.away}@${s.home}`,startUtc:s.startUtc,
      status:'SHADOW_BASELINE_UNCALIBRATED',forecastFrozenAtUtc:forecastUtc,sourceGeneratedAtUtc:history.sourceGeneratedAtUtc,
      model:'LAST_5_OFFENSE_DEFENSE_EQUAL_WEIGHT_NO_HOME_ADVANTAGE',
      historicalTeamGames:{home:home.length,away:away.length},predictedHome, predictedAway,
      projectedHomeMargin:round(predictedHome-predictedAway,2),projectedTotal:round(predictedHome+predictedAway,2),
      calibratedHomeWinProbability:null,oddsInput:null,injuryAdjusted:false,sourceMarketAlreadyVisibleInConversation:true,
      executable:false,approved:false};
  });
}
function gradeOldReceipt(report){
  if(!report||report.schema!=='ATLAS_NOV04_POSTGAME_CALIBRATION_APPEND_ONLY_V1'||report.games?.length!==14)throw Error('BAD_PRIOR_EVIDENCE');
  const games=report.games;
  const brier=mean(games.map(g=>(g.home_win_prob_frozen-(g.actual_home_margin>0?1:0))**2));
  const marginMae=mean(games.map(g=>Math.abs(g.actual_home_margin-g.home_margin_frozen)));
  const totalMae=mean(games.map(g=>Math.abs(g.actual_total-g.total_frozen)));
  const forecastCorrect=games.filter(g=>g.winner_frozen_correct).length;
  const slips=report.paper_batches.flatMap(b=>b.cards);
  const hit=slips.filter(s=>s.result==='HIT'||s.full_card_result==='HIT').length;
  const marketCards=report.paper_batches.find(b=>b.label==='Game-market SHADOW')?.cards||[];
  const gradeMarketCards=marketCards.map(c=>{
    const grades=c.legs.map(leg=>{
      const game=games.find(g=>g.game===leg.game);if(!game)throw Error('UNKNOWN_REAL_GAME');
      return gate.gradePaperLeg({eventId:game.game,market:leg.selection.includes('100+ points')?'team_points_at_least':'moneyline',
        selection:leg.selection.split(' ')[0],line:leg.selection.includes('100+ points')?100:null},
        {home:game.home,homeScore:game.home_score,away:game.game.split('@')[0],awayScore:game.away_score});
    });
    return {id:c.id,hits:grades.filter(x=>x==='HIT').length,result:gate.gradePaperCard(grades),legs:grades.length};
  });
  const rootInput=marketCards.map(c=>({id:c.id,legs:c.legs.map(l=>({rootId:`${l.game}|${l.selection}`,result:l.result}))}));
  // The Nov4 prior report stores moneyline/proxy result for every leg.
  const roots=edge.paperRootMap(rootInput);
  const record={games:games.length,forecastCorrect,brier:round(brier,6),marginMae:round(marginMae,3),totalMae:round(totalMae,3),paperCards:slips.length,paperFullHits:hit,marketCardGrades:gradeMarketCards,failedRoots:roots.roots.filter(r=>r.failedCards>0),
    sourceFreezeSHA256:report.original_freeze.forecast_sha256,retrospectiveFixtureNotNewHoldout:true};
  return record;
}
function auditRealReceipts(report){
  const real=report.real_dk;
  const a=features.ledgerSlice([
    {book:'DraftKings',market:'moneyline',result:'LOSS',stake:real.CLE_ML.stake,returned:0},
    {book:'DraftKings',market:'spread',result:'WIN',stake:real.BKN_plus_3_5.stake,returned:real.BKN_plus_3_5.payout},
    {book:'DraftKings',market:'parlay',result:'LOSS',stake:real.CLE_x_BKN_parlay.stake,returned:0}
  ]);
  const risk=gate.exposureReport([
    {state:'PLACED',stake:2,legs:[{eventId:'CLE@OKC',market:'moneyline',selection:'CLE'}]},
    {state:'PLACED',stake:1.5,legs:[{eventId:'CHA@BKN',market:'spread',selection:'BKN',line:3.5}]},
    {state:'PLACED',stake:0.7,legs:[{eventId:'CLE@OKC',market:'moneyline',selection:'CLE'},{eventId:'CHA@BKN',market:'spread',selection:'BKN',line:3.5}]}
  ],{bankroll:real.opening_balance});
  const receipts={verifiedBetFields:'OPERATOR_SCREENSHOT_PLUS_OPERATOR_STAKE_CLARIFICATION',missingParlayCombinedPrice:true,
     ledger:a,sharedExposure:risk,priceMovementNotKnown:true,accountReadbackNotConnected:true};
  if(Math.abs(real.opening_balance+a.net-real.ending_balance)>0.01)throw Error('BANKROLL_MISMATCH');
  return receipts;
}
function auditUpcomingGate(forecasts,observedAtUtc,atUtc){
  return forecasts.map(f=>{
    if(f.status==='INSUFFICIENT_HISTORY')return {eventId:f.eventId,status:'INSUFFICIENT_HISTORY'};
    const side=f.projectedHomeMargin>=0?f.game.split('@')[1]:f.game.split('@')[0];
    const candidate={eventId:f.eventId,market:'moneyline',selection:side,evidenceObservedAtUtc:observedAtUtc,
      forecastFrozenAtUtc:f.forecastFrozenAtUtc,playerStatus:'UNKNOWN',independentProbability:null,modelValidated:false,quote:null};
    const g=gate.evaluateCandidate(candidate,{decisionAtUtc:atUtc});
    const priceScreen=market.screenQuotes([],{nowUtc:atUtc});
    const comparative=value.consensusStress([],{cutoffUTC:atUtc});
    return {eventId:f.eventId,game:f.game,conditionalHypothesisOnly:side,gateStatus:g.status,gateReasons:g.reasons,
      accountPrices:priceScreen.ranked.length,consensusStatus:comparative.status,
      executable:false,approved:false,finalGate:'CLOSED'};
  });
}
module.exports={predictUpcoming,gradeOldReceipt,auditRealReceipts,auditUpcomingGate,assertValidHistory};