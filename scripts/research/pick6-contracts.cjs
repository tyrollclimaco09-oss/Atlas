'use strict';
// Structural contracts only. No Pick6 board feed, rule authenticator, joint model
// or payout engine is implemented here. A structural pass grants no price authority.
const {utc}=require('./source-record-gate.cjs');
const text=v=>typeof v==='string'&&v.trim().length>0;
function validatePick6Selection(record,{allowedRulesIds=[],asOfUtc}={}){
 const errors=[];
 if(!record||record.product!=='draftkings_pick6')errors.push('PICK6_PRODUCT_REQUIRED');
 for(const key of ['selectionId','pickGroupId','eventId','playerId','statistic','period','rulesId','sourceId','rawSnapshotId'])
  if(!text(record?.[key]))errors.push('MISSING_'+key.toUpperCase());
 if(!Array.isArray(allowedRulesIds)||!allowedRulesIds.includes(record?.rulesId))errors.push('PICK6_RULES_NOT_REGISTERED');
 if(!Number.isFinite(record?.threshold)||record.threshold<0)errors.push('PICK6_THRESHOLD_INVALID');
 if(!['more','less'].includes(record?.direction))errors.push('PICK6_DIRECTION_INVALID');
 if(typeof record?.rawSha256!=='string'||!/^[a-f0-9]{64}$/i.test(record.rawSha256))errors.push('PICK6_EVIDENCE_HASH_INVALID');
 const now=utc(asOfUtc),observed=utc(record?.sourceObservedAtUtc),fetched=utc(record?.fetchedAtUtc),start=utc(record?.eventStartUtc);
 if([now,observed,fetched,start].some(x=>x===null)||observed>fetched||fetched>now||now>=start)
  errors.push('PICK6_SELECTION_TIME_INVALID');
 return {contract:'ATLAS_PICK6_SELECTION_CONTRACT_V1',structure_passed:errors.length===0,
  errors,status:errors.length?'HOLD_SELECTION_STRUCTURE':'SELECTION_STRUCTURE_READY_FOR_SOURCE_VALIDATION',
  source_authenticated:false,venue_verified:false,entry_valuation_supported:false,entry_ev:null};
}
function validatePick6Entry(entry,context={}){
 const errors=[];
 if(!entry||entry.product!=='draftkings_pick6')errors.push('PICK6_PRODUCT_REQUIRED');
 if(!text(entry?.entryId)||!text(entry?.pickGroupId))errors.push('PICK6_ENTRY_IDENTITY_MISSING');
 if(!Number.isFinite(entry?.entryFee)||entry.entryFee<=0)errors.push('PICK6_ENTRY_FEE_INVALID');
 if(!Array.isArray(entry?.selections)||entry.selections.length<2)errors.push('PICK6_SELECTIONS_MISSING');
 const results=(Array.isArray(entry?.selections)?entry.selections:[]).map(r=>validatePick6Selection(r,context));
 if(results.some(r=>!r.structure_passed))errors.push('PICK6_SELECTION_STRUCTURE_FAILED');
 const picks=Array.isArray(entry?.selections)?entry.selections:[];
 if(new Set(picks.map(r=>r?.selectionId)).size!==picks.length||
  new Set(picks.map(r=>r?.playerId)).size!==picks.length)errors.push('PICK6_DUPLICATE_SELECTION_OR_PLAYER');
 if(picks.some(r=>r?.pickGroupId!==entry?.pickGroupId))errors.push('PICK6_GROUP_MISMATCH');
 if(!entry?.payoutSnapshot)errors.push('EXACT_ENTRY_PAYOUT_UNAVAILABLE');
 if(!entry?.jointOutcomeModel)errors.push('JOINT_OUTCOME_MODEL_UNAVAILABLE');
 // Presence of a payout object or marginal probabilities cannot authenticate a
 // contest's rules or resolve peer-pool payouts. Those adapters are not built.
 errors.push('PICK6_SOURCE_RULES_AND_JOINT_PAYOUT_ADAPTER_NOT_IMPLEMENTED');
 return {contract:'ATLAS_PICK6_ENTRY_CONTRACT_V1',status:'HOLD_ENTRY_VALUATION',
  selection_results:results,blockers:[...new Set(errors)],entry_valuation_supported:false,
  entry_ev:null,paper_entry_created:false,production_authority:false,
  message:'Selection research contract available; entry EV unavailable pending payout and joint-model verification.'};
}
module.exports={validatePick6Selection,validatePick6Entry};
