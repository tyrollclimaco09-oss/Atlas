'use strict';
// ATLAS V11: independent deterministic score-outcome grader. No provider calls or model refits.
const round=(n,d=2)=>Number(n.toFixed(d));
const validTime=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
const mean=xs=>xs.length?round(xs.reduce((s,x)=>s+x,0)/xs.length,3):null;
function gradeFrozenSlate(freeze,observations){
 if(!freeze||!Array.isArray(freeze.preTipPredictions)||!Array.isArray(observations))throw Error('INVALID_GRADE_INPUT');
 const freezeAt=validTime(freeze.frozenAtUtc);
 if(freezeAt===null)throw Error('NO_PROSPECTIVE_FREEZE');
 const outcomes=new Map();
 for(const g of observations){
  if(!Number.isInteger(g.eventId)||outcomes.has(g.eventId))throw Error('DUPLICATE_RESULT_OR_BAD_ID');
  outcomes.set(g.eventId,g);
 }
 const output=[],unresolved=[],seen=new Set();
 for(const p of freeze.preTipPredictions){
  if(!Number.isInteger(p.eventId)||seen.has(p.eventId))throw Error('DUPLICATE_FORECAST_ID');
  seen.add(p.eventId);
  const tip=validTime(p.startUtc),predAt=validTime(p.forecastFrozenAtUtc),sourceAt=validTime(p.sourceGeneratedAtUtc);
  if(tip===null||predAt===null||sourceAt===null||predAt>freezeAt||sourceAt>predAt||freezeAt>=tip)throw Error('TEMPORAL_LEAKAGE');
  if(!Number.isFinite(p.predictedHome)||!Number.isFinite(p.predictedAway))throw Error('MISSING_SCORE_PROJECTION');
  const g=outcomes.get(p.eventId);
  if(!g||g.status!=='ScoresOfficial'){unresolved.push({eventId:p.eventId,reason:'OFFICIAL_FINAL_MISSING'});continue}
  const observed=validTime(g.observedAtUtc);
  if(observed===null||observed<tip||g.startUtc!==p.startUtc)throw Error('OUTCOME_TIMESTAMP_CONFLICT');
  if(g.away+'@'+g.home!==p.game||!Number.isInteger(g.homeScore)||!Number.isInteger(g.awayScore)||
    g.homeScore<0||g.awayScore<0||g.homeScore===g.awayScore)throw Error('OUTCOME_IDENTITY_OR_SCORE_CONFLICT');
  const modelWinner=p.predictedHome>=p.predictedAway?g.home:g.away;
  const resultWinner=g.homeScore>g.awayScore?g.home:g.away;
  const pm=round(p.predictedHome-p.predictedAway),am=g.homeScore-g.awayScore;
  const pt=round(p.predictedHome+p.predictedAway),at=g.homeScore+g.awayScore;
  output.push({eventId:p.eventId,game:p.game,modelWinner,resultWinner,
   modelWinnerCorrect:modelWinner===resultWinner,homeBaselineCorrect:g.home===resultWinner,
   predictedHome:p.predictedHome,predictedAway:p.predictedAway,actualHome:g.homeScore,actualAway:g.awayScore,
   predictedMargin:pm,actualMargin:am,marginAbsError:round(Math.abs(pm-am)),
   predictedTotal:pt,actualTotal:at,totalAbsError:round(Math.abs(pt-at)),
   homeScoreAbsError:round(Math.abs(p.predictedHome-g.homeScore)),
   awayScoreAbsError:round(Math.abs(p.predictedAway-g.awayScore))});
 }
 return {status:unresolved.length?'PARTIAL_OFFICIAL_GRADING':'OFFICIAL_GRADE_COMPLETE',
  totalForecasts:freeze.preTipPredictions.length,gradedGames:output.length,unresolved,
  results:output,metrics:{winnerHits:output.filter(x=>x.modelWinnerCorrect).length,
   homeBaselineWinnerHits:output.filter(x=>x.homeBaselineCorrect).length,
   marginMAE:mean(output.map(x=>x.marginAbsError)),
   totalMAE:mean(output.map(x=>x.totalAbsError)),
   teamPointsMAE:mean(output.flatMap(x=>[x.homeScoreAbsError,x.awayScoreAbsError])),
   brier:null,logLoss:null,closingLineValue:null,realBetROI:null},
  production_model_validated:false,execution_authority:false,no_frozen_forecast_mutation:true};
}
module.exports={gradeFrozenSlate};
