'use strict';
// Reads supplied offline snapshots only. No provider, database or account calls.
const {devigTwoWay,valueAt,quoteKey}=require('./market-intelligence.cjs');
const {utc,hash,validateSnapshot,validateMoneylineObservation}=require('./source-record-gate.cjs');
const filled=v=>typeof v==='string'&&v.trim().length>0;
const median=xs=>{const a=[...xs].sort((x,y)=>x-y),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
function policyOf(p={}){
 const r={version:p.version??'nba_moneyline_reference_v1',minReferences:p.minReferences??3,minEV:p.minEV??.03,
  maxSourceAgeSeconds:p.maxSourceAgeSeconds??300,maxFetchAgeSeconds:p.maxFetchAgeSeconds??60,
  maxCrossBookSeconds:p.maxCrossBookSeconds??60,referenceBooks:p.referenceBooks??null};
 if(!filled(r.version)||!Number.isInteger(r.minReferences)||r.minReferences<3||
  !Number.isFinite(r.minEV)||r.minEV<0||r.minEV>=1||
  ['maxSourceAgeSeconds','maxFetchAgeSeconds','maxCrossBookSeconds'].some(k=>!Number.isFinite(r[k])||r[k]<=0)||
  r.referenceBooks!==null&&(!Array.isArray(r.referenceBooks)||r.referenceBooks.some(x=>!filled(x))||new Set(r.referenceBooks).size!==r.referenceBooks.length))
  throw Error('REFERENCE_POLICY_INVALID');
 return r;
}
function scanOfflineReferencePacket(p){
 if(!p||p.contract!=='ATLAS_OFFLINE_REFERENCE_SCAN_V1'||utc(p.asOfUtc)===null||
  !filled(p.cohortId)||!filled(p.decisionSlot)||!['draftkings','betmgm'].includes(p.targetBook)||
  !Array.isArray(p.snapshots)||!Array.isArray(p.sourceRegistry)||!Array.isArray(p.rulesRegistry)||
  p.priorDecisionIds!==undefined&&!Array.isArray(p.priorDecisionIds))throw Error('REFERENCE_SCAN_PACKET_INVALID');
 const policy=policyOf(p.policy),prior=new Set(p.priorDecisionIds??[]);
 const out={contract:p.contract,as_of:p.asOfUtc,policy,policy_hash:hash(JSON.stringify(policy)),
  status:null,ingestion_errors:[],snapshot_errors:[],rejected_observations:[],review_observations:[],
  observations:[],reference_holds:[],comparisons:[],signals:[],duplicate_decisions:[],validation_receipts:[],
  network_requests:0,paid_credits_consumed:0,real_money_staked:0,production_authority:false,
  execution_authority:false,paper_ledger_mutated:false};
 if(p.ingestion?.status!=='ok'||!Array.isArray(p.ingestion.errors)||p.ingestion.errors.length){
  out.status='INGESTION_ERROR';
  // Provider exception text may contain an API-key URL. Return error codes only.
  out.ingestion_errors=Array.isArray(p.ingestion?.errors)&&p.ingestion.errors.length?
   p.ingestion.errors.map(e=>typeof e==='string'&&/^[A-Z][A-Z0-9_]{0,99}$/.test(e)?e:'UPSTREAM_INGESTION_ERROR'):
   ['INGESTION_NOT_CONFIRMED'];return out;
 }
 const receipt=(stage,snapshot,q,errors,warnings=[])=>{
  const payload={type:'atlas_source_validation_v1',stage,policy_version:policy.version,policy_hash:out.policy_hash,
   checked_at:p.asOfUtc,snapshot_id:snapshot?.snapshotId??null,raw_sha256:snapshot?.rawSha256??null,
   observation_id:q?.observationId??null,source_id:snapshot?.sourceId??null,
   disposition:errors.length?'REJECTED':warnings.length?'HOLD_FOR_REVIEW':'PASSED_STRUCTURE',errors,warnings,
   venue_verified:false,source_authenticated:false,empirical_performance_eligible:false};
  out.validation_receipts.push({receipt_key:hash(JSON.stringify(payload)),append_only:true,
   storage_status:'NOT_PERSISTED',node_key:'FILTER_VERIFY',state:'RESEARCH_ONLY',payload});
 };
 const valid=[],lifecycle=[],snapshotIds=new Map();
 for(const snapshot of p.snapshots)snapshotIds.set(snapshot?.snapshotId,(snapshotIds.get(snapshot?.snapshotId)||0)+1);
 for(const snapshot of p.snapshots){
  const checked=validateSnapshot(snapshot);
  if(snapshotIds.get(snapshot?.snapshotId)!==1)checked.errors.push('DUPLICATE_SNAPSHOT_ID');
  receipt('snapshot',snapshot,null,checked.errors);
  if(checked.errors.length){out.snapshot_errors.push({snapshot_id:snapshot?.snapshotId??null,errors:checked.errors});continue;}
  for(const raw of checked.payload.observations){
   const q={...raw,rawSnapshotId:snapshot.snapshotId};
   const v=validateMoneylineObservation(q,{snapshot,sourceRegistry:p.sourceRegistry,rulesRegistry:p.rulesRegistry,asOfUtc:p.asOfUtc,policy});
   receipt('record',snapshot,q,v.errors,v.warnings);
   const audit={observation_id:q.observationId??null,snapshot_id:snapshot.snapshotId,book:q.book??null,
    errors:v.errors,warnings:v.warnings};
   if(v.lifecycle_usable)lifecycle.push({q,synthetic:v.synthetic_fixture,usable:v.passed&&v.warnings.length===0});
   if(!v.passed){out.rejected_observations.push(audit);continue;}
   if(v.warnings.length){out.review_observations.push(audit);continue;}
   valid.push({q,synthetic:v.synthetic_fixture});
   out.observations.push({observation_id:q.observationId,book:q.book,event_id:q.eventId,
    source_observed_at:q.sourceObservedAtUtc,fetched_at:q.fetchedAtUtc,
    snapshot_id:snapshot.snapshotId,raw_sha256:snapshot.rawSha256,synthetic_fixture:v.synthetic_fixture});
  }
 }
 const groups=new Map();
 for(const item of lifecycle){
  const q=item.q;
  const key=JSON.stringify([q.product,q.sport,q.eventId,q.eventStartUtc,q.homeTeamId,q.awayTeamId,
   q.market,q.period,q.overtimeRule,q.settlementRuleId]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
 }
 let complete=0,targetCount=0,insufficient=0;
 for(const items of groups.values()){
  const byBook=new Map(),ambiguous=new Set();
  for(const item of items){
   const old=byBook.get(item.q.book),a=utc(item.q.sourceObservedAtUtc),b=old?utc(old.q.sourceObservedAtUtc):-Infinity;
   if(a>b){byBook.set(item.q.book,item);ambiguous.delete(item.q.book);}
   else if(a===b&&JSON.stringify([item.q.marketStatus,item.q.outcomes])!==
    JSON.stringify([old.q.marketStatus,old.q.outcomes]))ambiguous.add(item.q.book);
  }
  for(const book of ambiguous){byBook.delete(book);out.reference_holds.push({book,reason:'AMBIGUOUS_BOOK_QUOTE'});}
  for(const [book,item]of byBook)if(!item.usable){
   byBook.delete(book);out.reference_holds.push({book,observation_id:item.q.observationId,reason:'LATEST_OBSERVATION_NOT_USABLE'});
  }
  const target=byBook.get(p.targetBook);if(!target)continue;targetCount++;
  const refs=[...byBook.values()].filter(x=>x.q.book!==p.targetBook&&
   (policy.referenceBooks===null||policy.referenceBooks.includes(x.q.book)));
  if(refs.length<policy.minReferences){insufficient++;out.reference_holds.push({event_id:target.q.eventId,
   reason:'INSUFFICIENT_DISTINCT_REFERENCES',references:refs.map(x=>x.q.book)});continue;}
  const times=[target,...refs].map(x=>utc(x.q.sourceObservedAtUtc));
  if(Math.max(...times)-Math.min(...times)>policy.maxCrossBookSeconds*1000){
   out.reference_holds.push({event_id:target.q.eventId,reason:'ASYNCHRONOUS_REFERENCES'});continue;
  }
  complete++;
  for(const selection of target.q.outcomes){
   const estimates=refs.map(({q})=>{
    const side=q.outcomes.find(x=>x.participantId===selection.participantId),other=q.outcomes.find(x=>x!==side);
    return devigTwoWay(side.americanOdds,other.americanOdds).for;
   });
   const reference=median(estimates),ev=valueAt(reference,selection.americanOdds);
   const marketKey=quoteKey({...target.q,...selection});
   const decisionId=hash(JSON.stringify([p.cohortId,p.decisionSlot,p.targetBook,marketKey,out.policy_hash]));
   const s={decision_id:decisionId,market_key:marketKey,event_id:target.q.eventId,participant_id:selection.participantId,
    target_book:p.targetBook,offered_american_odds:selection.americanOdds,
    reference_probability:reference,reference_min:Math.min(...estimates),reference_max:Math.max(...estimates),
    reference_books:refs.map(x=>x.q.book).sort(),reference_observation_ids:refs.map(x=>x.q.observationId),
    target_observation_id:target.q.observationId,margin_removal:'proportional_two_way_then_median',
    valuation_kind:'market-reference EV',market_reference_ev:ev,independent_model_probability:null,
    venue_verified:false,synthetic_fixture:[target,...refs].some(x=>x.synthetic),
    empirical_performance_eligible:false,paper_entry_created:false,paper_stake:null,
    status:'CANDIDATE_UNVERIFIED',production_authority:false};
   out.comparisons.push(s);
   if(ev<policy.minEV)continue;
   if(prior.has(decisionId))out.duplicate_decisions.push({...s,status:'EXISTING_DECISION_NEW_OBSERVATION'});
   else{out.signals.push(s);prior.add(decisionId);}
  }
 }
 out.counts={valid_observations:valid.length,target_markets:targetCount,complete_reference_markets:complete,
  rejected_observations:out.rejected_observations.length,review_observations:out.review_observations.length};
 const partial=out.snapshot_errors.length+out.rejected_observations.length+out.review_observations.length+out.reference_holds.length>0;
 out.run_quality=partial?'PARTIAL':'COMPLETE';
 out.status=out.signals.length?'SIGNALS_FOUND':out.duplicate_decisions.length?'DUPLICATE_DECISIONS_ONLY':
  complete?(partial?'PARTIAL_ZERO_SIGNALS':'COMPLETE_ZERO_SIGNALS'):insufficient?'INSUFFICIENT_REFERENCES':
  out.snapshot_errors.length||out.rejected_observations.length?'VALIDATION_FAILED':
  out.reference_holds.length||out.review_observations.length?'REVIEW_REQUIRED':valid.length?'TARGET_UNAVAILABLE':'EMPTY_OBSERVATIONS';
 return out;
}
module.exports={scanOfflineReferencePacket};
