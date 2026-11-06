'use strict';
/* ATLAS Slate/Duo V10: deterministic evidence gates. NO model fitting, no wagering authority. */
const CANON=Object.freeze([
 'SCOUT','FILTER_VERIFY','EDGE_THIEF','ORACLE','PRICING','KAIROS',
 'SENTINEL','TACTICIAN','HUMAN_FINAL_GATE','LEDGER','FORENSICS','CALIBRATOR'
]);
const AFTER_GAME=new Set(['LEDGER','FORENSICS','CALIBRATOR']);
const RESOLVED=new Set(['CLEARED','RESOLVED','NO_OBJECTION']);
const STATUS=new Set(['WATCH','BLOCKED','RESEARCH_ONLY','POSTGAME_PENDING','EXPIRED']);
function validTime(s){const t=Date.parse(s);return Number.isFinite(t)?t:null}
function getSlateCoverage(run,receipts){
 if(!run||run.real_betting_authority!==false||run.production_authority!==false ||
 !Array.isArray(run.event_manifest)||run.event_count!==run.event_manifest.length)
   return {state:'INVALID_SLATE',missing:CANON,valid:false,execution_authority:false};
 if(!Array.isArray(receipts))return {state:'INVALID_RECEIPTS',missing:CANON,valid:false,execution_authority:false};
 const seen=new Map();
 for(const r of [...receipts].sort((a,b)=>(validTime(b.created_at)??0)-(validTime(a.created_at)??0))){
  if(!CANON.includes(r.node_key)||r.run_key!==run.run_key||!STATUS.has(r.state)||
      r.production_authority!==false||r.real_betting_authority!==false)
   return {state:'INVALID_RECEIPTS',missing:CANON,valid:false,execution_authority:false};
  if(!seen.has(r.node_key))seen.set(r.node_key,r);
 }
 const missing=CANON.filter(n=>!seen.has(n));
 const stageStates=Object.fromEntries(CANON.filter(n=>seen.has(n)).map(n=>[n,seen.get(n).state]));
 return {state:missing.length?'NODE_COVERAGE_MISSING':'WATCH_RESEARCH_ONLY',missing,stageStates,
    valid:missing.length===0,duoRecorded:seen.has('ORACLE')&&seen.has('EDGE_THIEF'),
    finalGateBlocked:stageStates.HUMAN_FINAL_GATE!=='RESEARCH_ONLY',execution_authority:false,
    postgamePending:[...AFTER_GAME].filter(n=>stageStates[n]==='POSTGAME_PENDING')};
}
function evaluateDuo({oracle,edge,canonical,now=Date.now()}={}){
 const cutoff=validTime(canonical?.decision_cutoff);
 const blockers=[];
 if(cutoff===null||cutoff<now||canonical?.expires_at&&validTime(canonical.expires_at)<=now)
   blockers.push('TIMING_EXPIRED_OR_UNKNOWN');
 if(canonical?.oracle_independent!==true)blockers.push('ORACLE_INDEPENDENCE_UNPROVEN');
 if(oracle?.proof_status!=='PASS'||!Number.isInteger(oracle?.independent_evidence_groups)||
    oracle.independent_evidence_groups<2||validTime(oracle.decision_cutoff)!==cutoff)
   blockers.push('INDEPENDENT_ORACLE_PROOF_MISSING');
 if(!Array.isArray(edge)||edge.length===0)blockers.push('EDGE_THIEF_MISSING');
 else if(edge.some(x=>!RESOLVED.has(x.challenge_status)||
    x.state_version!==canonical?.state_version||
    validTime(x.evidence_cutoff)===null||validTime(x.evidence_cutoff)>cutoff))
   blockers.push('EDGE_THIEF_UNRESOLVED_OR_STALE');
 return {status:blockers.length?'WATCH':'RESEARCH_DUO_ATTESTED',blockers,execution_authority:false};
}
function evaluateFinalGate({duo,canonical,gate,now=Date.now()}={}){
 const blockers=[];
 if(duo?.status!=='RESEARCH_DUO_ATTESTED')blockers.push('DUO_NOT_ATTESTED');
 if(canonical?.state_valid!==true||canonical?.provenance_valid!==true||canonical?.sentinel_valid!==true)
   blockers.push('CANONICAL_STATE_OR_SENTINEL_UNVERIFIED');
 if(!gate||gate.gate_status!=='READY_FOR_OPERATOR')blockers.push('NATIVE_FINAL_GATE_NOT_READY');
 if(gate?.executable_price_verified!==true||gate?.invariant_status!=='PASS')blockers.push('ACCOUNT_QUOTE_PROOF_MISSING');
 const checked=validTime(gate?.checked_at);
 if(checked===null||checked>now||now-checked>300000)blockers.push('FINAL_GATE_STALE');
 const cutoff=validTime(canonical?.decision_cutoff);
 if(cutoff===null||cutoff<now||canonical?.expires_at&&validTime(canonical.expires_at)<=now)
   blockers.push('CANDIDATE_EXPIRED');
 return {status:blockers.length?'BLOCKED':'READY_FOR_OPERATOR_REVIEW',blockers,
    human_final_gate_required:true,execution_authority:false,approved_bet:null};
}
function validateQuote(quote,now=Date.now()){
 const age=now-(validTime(quote?.retrieved_at)??NaN);
 return !!quote&&quote.execution_grade===true&&
  ['USER_SPORTSBOOK_SCREENSHOT','CONNECTED_SPORTSBOOK'].includes(quote.execution_source)&&
  typeof quote.execution_evidence_hash==='string'&&quote.execution_evidence_hash.trim().length>0&&
  !!quote.execution_evidence_snapshot_id&&quote.quote_health==='HEALTHY'&&
  quote.rules_match_state==='MATCH'&&['OPEN','ACTIVE'].includes(quote.market_status)&&
  quote.price_integrity_status==='ELIGIBLE_FOR_REFERENCE_RESEARCH'&&
  Number.isFinite(age)&&age>=-30000&&age<=300000;
}
module.exports={CANON,AFTER_GAME,getSlateCoverage,evaluateDuo,evaluateFinalGate,validateQuote};