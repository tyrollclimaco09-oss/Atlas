'use strict';
// ATLAS research-only gate. No sportsbook, network, account, or execution operations.

function oddsBreakEven(american) {
  if (!Number.isFinite(american) || american === 0 || Math.abs(american) < 100) return null;
  return american > 0 ? 100 / (100 + american) : -american / (100 - american);
}
function validUTC(v) { return typeof v === 'string' && /Z$/.test(v) && Number.isFinite(Date.parse(v)); }
function minutesBetween(a, b) { return (Date.parse(b) - Date.parse(a)) / 60000; }
function legKey(leg) { return [leg.eventId, leg.market, leg.selection, leg.line ?? ''].join('|'); }

/** Diagnostic statuses only. Never returns approved/placed; human Final Gate remains mandatory. */
function evaluateCandidate(c, {decisionAtUtc, book='DraftKings', maxQuoteAgeMinutes=15}={}) {
  const reasons=[];
  if (!c || !c.eventId || !c.market || !c.selection) reasons.push('MISSING_MARKET_IDENTITY');
  if (c?.market === 'total' && !['OVER','UNDER'].includes(c?.selection)) reasons.push('MISSING_TOTAL_SIDE');
  if (c?.playerStatus === 'OUT' || c?.playerStatus === 'DNP') reasons.push('PLAYER_UNAVAILABLE');
  else if (c?.playerStatus === 'UNKNOWN' || c?.playerStatus === 'QUESTIONABLE') reasons.push('ROSTER_UNCONFIRMED');
  const dataGood=validUTC(c?.evidenceObservedAtUtc) && validUTC(decisionAtUtc) &&
    minutesBetween(c.evidenceObservedAtUtc, decisionAtUtc) >= 0;
  if (!dataGood) reasons.push('NO_POINT_IN_TIME_RECEIPT');
  const q=c?.quote;
  if (!q || q.accountConfirmed!==true || q.book!==book || q.eventId!==c?.eventId ||
      q.market!==c?.market || q.selection!==c?.selection ||
      (q.line??null)!==(c?.line??null) || oddsBreakEven(q.american)==null) {
    reasons.push('NO_MATCHING_EXECUTABLE_BOOK_QUOTE');
  } else {
    if (!validUTC(q.observedAtUtc) || !validUTC(decisionAtUtc) ||
        minutesBetween(q.observedAtUtc, decisionAtUtc) < 0 ||
        minutesBetween(q.observedAtUtc, decisionAtUtc) > maxQuoteAgeMinutes) reasons.push('STALE_OR_POSTCUTOFF_QUOTE');
  }
  if (!Number.isFinite(c?.independentProbability) || c.independentProbability <= 0 || c.independentProbability >= 1 || c.modelValidated !== true) {
    reasons.push('NO_VALIDATED_INDEPENDENT_FAIR_PROBABILITY');
  }
  if (!validUTC(c?.forecastFrozenAtUtc) || !validUTC(c?.quote?.observedAtUtc) ||
      minutesBetween(c.forecastFrozenAtUtc,c.quote.observedAtUtc) < 0) reasons.push('FORECAST_NOT_FROZEN_BEFORE_PRICE');
  const structural=['MISSING_MARKET_IDENTITY','MISSING_TOTAL_SIDE','PLAYER_UNAVAILABLE','NO_POINT_IN_TIME_RECEIPT'];
  const status=reasons.some(r=>structural.includes(r))?'RESEARCH_INVALID':reasons.length?'WATCH':'READY_FOR_HUMAN_FINAL_GATE';
  return {status, reasons, executable:false, approved:false, modelEdgeClaimAllowed:status==='READY_FOR_HUMAN_FINAL_GATE'};
}

function gradePaperLeg(leg, gameFinal, playerFinal) {
  if (!leg || !leg.eventId || !leg.market || !leg.selection) return 'UNGRADABLE';
  if (leg.market==='total' && !['OVER','UNDER'].includes(leg.selection)) return 'UNGRADABLE';
  if (leg.playerStatus==='OUT' || leg.playerStatus==='DNP' || playerFinal?.minutes===0) return 'DNP_REVIEW';
  if (leg.market==='moneyline') {
    if (!gameFinal || !Number.isFinite(gameFinal.homeScore) || !Number.isFinite(gameFinal.awayScore)) return 'UNVERIFIED';
    if (gameFinal.homeScore===gameFinal.awayScore) return 'UNVERIFIED';
    return (leg.selection===(gameFinal.homeScore>gameFinal.awayScore?gameFinal.home:gameFinal.away))?'HIT':'MISS';
  }
  if (leg.market==='team_points_at_least') {
    if (!gameFinal || !Number.isFinite(leg.line)) return 'UNVERIFIED';
    const score=leg.selection===gameFinal.home?gameFinal.homeScore:leg.selection===gameFinal.away?gameFinal.awayScore:null;
    return score==null?'UNGRADABLE':score>=leg.line?'HIT':'MISS';
  }
  if (leg.market==='total') {
    if (!gameFinal || !Number.isFinite(gameFinal.homeScore) || !Number.isFinite(gameFinal.awayScore) || !Number.isFinite(leg.line)) return 'UNVERIFIED';
    const actual=gameFinal.homeScore+gameFinal.awayScore;
    if(actual===leg.line) return 'PUSH_REVIEW';
    return (leg.selection==='OVER'?actual>leg.line:actual<leg.line)?'HIT':'MISS';
  }
  if (leg.market==='player_threshold') {
    if (!playerFinal || !Number.isFinite(playerFinal[leg.stat]) || !Number.isFinite(leg.line)) return 'UNVERIFIED';
    return playerFinal[leg.stat]>=leg.line?'HIT':'MISS';
  }
  return 'UNVERIFIED';
}
function gradePaperCard(grades) {
  if (!Array.isArray(grades) || grades.length===0) return 'UNGRADABLE';
  if(grades.includes('MISS')) return 'MISS';
  if(grades.every(g=>g==='HIT')) return 'HIT';
  return 'INDETERMINATE';
}
/** Shared actual exposure counts a parlay stake in *every* contingent leg, not just once. */
function exposureReport(tickets, {bankroll, slateWarnFraction=.20, legWarnFraction=.15}={}) {
  const valid=(tickets||[]).filter(t=>t?.state==='PLACED' && Number.isFinite(t.stake) && t.stake>0 && Array.isArray(t.legs));
  const byLeg={},byEvent={};let total=0;
  for(const t of valid) {
    total+=t.stake;
    for(const leg of t.legs) {
      const key=legKey(leg);byLeg[key]=(byLeg[key]||0)+t.stake;
      const event=String(leg.eventId);byEvent[event]=(byEvent[event]||0)+t.stake;
    }
  }
  const warnings=[];
  if(Number.isFinite(bankroll)&&bankroll>0){
    if(total/bankroll>slateWarnFraction) warnings.push('SLATE_EXPOSURE_CONCENTRATED');
    if(Object.values(byLeg).some(n=>n/bankroll>legWarnFraction)) warnings.push('REPEATED_SELECTION_EXPOSURE_CONCENTRATED');
  }
  return {totalStaked:Number(total.toFixed(2)),byLeg,byEvent,warnings,approval:'HUMAN_FINAL_GATE_REQUIRED'};
}
module.exports={oddsBreakEven,evaluateCandidate,gradePaperLeg,gradePaperCard,exposureReport};
