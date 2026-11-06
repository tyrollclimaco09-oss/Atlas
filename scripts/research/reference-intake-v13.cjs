'use strict';
// ATLAS V13: manual PUBLIC reference quote adapter. Not a sportsbook price executor.
function time(s){const v=Date.parse(s);return Number.isFinite(v)?v:null}
function americanImplied(odds){
 if(!Number.isInteger(odds)||!(odds<=-100||odds>=100))throw Error('INVALID_AMERICAN_ODDS');
 return odds>0?100/(odds+100):(-odds)/((-odds)+100);
}
function normalizeReference(x){
 if(!x||!/^https:\/\//.test(x.source_url??'')||x.source_kind!=='PUBLIC_THIRD_PARTY_AGGREGATOR'||
 x.league!=='NBA'||x.market!=='moneyline'||x.selection!=='Washington Wizards'||
 x.sportsbook_displayed!=='DraftKings'||x.event_key!=='NBA:2026-11-06:WAS@ATL')throw Error('REFERENCE_IDENTITY_INVALID');
 const at=time(x.source_quote_at),read=time(x.observed_at),tip=time(x.event_start_at);
 if(at===null||read===null||tip===null||at>read||read>=tip||at>=tip||tip-read>2*86400000)throw Error('REFERENCE_TIME_INVALID');
 const odds=x.odds_american,ip=americanImplied(odds);
 return Object.freeze({
  event_key:x.event_key,market:x.market,selection:x.selection,book_displayed:x.sportsbook_displayed,
  american_odds:odds,market_implied_probability:Number(ip.toFixed(8)),
  source_url:x.source_url,source_quote_at:x.source_quote_at,observed_at:x.observed_at,
  source_age_seconds:Math.floor((read-at)/1000),
  source_kind:x.source_kind,independence_group:'PUBLIC_ODDSAPI_AGGREGATION',
  correlation_status:'CORRELATED',contribution_status:'UNCOUNTED',independence_weight:0,
  research_status:'WATCH',execution_grade:false,account_quote_verified:false,
  settlement_verified:false,independent_fair_probability:null,expected_value:null,
  final_gate_authorized:false,bet_placed:false
 });
}
function diagnoseGate(candidate,quote){
 const reasons=[];
 if(candidate?.truth_label!=='POINT_IN_TIME_VERIFIED')reasons.push('CANONICAL_TRUTH_NOT_VERIFIED');
 if(candidate?.oracle_independent!==true)reasons.push('INDEPENDENT_ORACLE_NOT_PROVEN');
 if(candidate?.sentinel_valid!==true)reasons.push('SENTINEL_NOT_VERIFIED');
 if(!candidate?.tactician_id)reasons.push('TACTICIAN_PROOF_MISSING');
 if(quote?.execution_grade!==true||quote?.account_quote_verified!==true)reasons.push('NO_ACCOUNT_EXECUTABLE_QUOTE');
 return {status:reasons.length?'BLOCKED':'REQUIRES_NATIVE_FINAL_GATE',reasons,
  execution_authority:false,approved_bet:null};
}
module.exports={americanImplied,normalizeReference,diagnoseGate};