/** Read-only legacy result diagnostics. Mapping never authenticates a result. */
export const OUTCOME_COMPAT_VERSION='ATLAS_RECORDED_OUTCOME_COMPAT_V1';
const text=v=>typeof v==='string'&&v.trim().length>0;
const time=v=>text(v)&&Number.isFinite(Date.parse(v));

export function auditRecordedOutcomes(records,predictions){
 if(!Array.isArray(records))throw Error('RECORDED_OUTCOMES_INVALID');
 const receiptCounts=new Map();
 for(const r of records)receiptCounts.set(r?.receipt_key,(receiptCounts.get(r?.receipt_key)||0)+1);
 return records.map(r=>{
  const errors=[];
  const original=structuredClone(r);
  const p=predictions.filter(x=>text(r?.candidate_key)&&x?.candidate_key===r.candidate_key&&
   text(r?.event_id)&&x?.event_id===r.event_id);
  if(r?.contract!=='ATLAS_RECORDED_OUTCOME_V1'||!text(r?.receipt_key)||
   !text(r?.evidence_source)||!text(r?.provenance_label))errors.push('RECORDED_RECEIPT_CONTRACT_INVALID');
  if(receiptCounts.get(r?.receipt_key)!==1)errors.push('DUPLICATE_RECORDED_RECEIPT');
  if(p.length!==1)errors.push('RECORDED_PREDICTION_NOT_UNIQUE');
  const f=p.length===1?p[0]:null,b=r?.payload;
  if(!f||b?.event_id!==r.event_id)errors.push('RECORDED_EVENT_ID_MISMATCH');
  if(!f||!text(f.prediction_id)||r.prediction_id!==f.prediction_id||b?.prediction_id!==f.prediction_id)
   errors.push('RECORDED_PREDICTION_ID_MISMATCH');
  if(!time(r?.evidence_observed_at)||!time(f?.event_start_at)||
   Date.parse(r.evidence_observed_at)<=Date.parse(f.event_start_at))errors.push('RECORDED_RESULT_TIME_INVALID');
  // This is the one inspected legacy shape, not a generic winner inference.
  if(!b||b.type!==undefined||!Object.hasOwn(b,'buf_win_binary')||
   (b.buf_win_binary!==0&&b.buf_win_binary!==1))errors.push('UNSUPPORTED_RECORDED_OUTCOME_SCHEMA');
  if(f?.sport!=='NFL'||f?.root_tags?.market_selection!=='BUF_ML'||
   b?.away_team!=='BUF'||b?.home_team!=='MIN')errors.push('UNSUPPORTED_RECORDED_SELECTION');
  return {mapping_version:OUTCOME_COMPAT_VERSION,original,
   mapped:errors.length?null:{candidate_key:r.candidate_key,event_id:r.event_id,
    prediction_id:r.prediction_id,binary_outcome:b.buf_win_binary},
   status:errors.length?'HOLD_UNSUPPORTED_RECORDED_OUTCOME':'RECORDED_RESULT_REQUIRES_ATTESTATION',
   errors:[...new Set(errors)],verified_official_source:false,admitted_for_scoring:false};
 });
}
