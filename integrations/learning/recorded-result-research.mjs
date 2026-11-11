/**
 * SHADOW-only observation of a recorded result, never an official settlement.
 * This gives FORENSICS an arithmetic diagnostic without promoting an
 * operator/source-linked recording into an authenticated model-validation case.
 * No network, persistence, sportsbook, or model-weight writes.
 */
export const RECORDED_DIAGNOSTIC_CONTRACT='ATLAS_RECORDED_RESULT_RESEARCH_DIAGNOSTIC_V1';
const isText=x=>typeof x==='string'&&x.trim().length>0;
const ms=x=>isText(x)?Date.parse(x):NaN;
const probability=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<1;
const same=(a,b)=>isText(a)&&a===b;
const arr=x=>Array.isArray(x)?x:[];
const unique=x=>[...new Set(x)];
const keyOf=a=>JSON.stringify([a?.candidate_key,a?.event_id]);

export function diagnoseRecordedResultResearch(input, auditedRecords) {
  if(!input||!Array.isArray(input.observations)||!Array.isArray(input.predictions)||
     !Array.isArray(auditedRecords))throw Error('RECORDED_RESEARCH_INPUT_INVALID');
  const duplicates=new Map();
  for(const a of auditedRecords) {
    const k=keyOf(a?.mapped??a?.original);
    duplicates.set(k,(duplicates.get(k)||0)+1);
  }
  return auditedRecords.map(a=>{
    const mapped=a?.mapped;
    const original=a?.original;
    const k=keyOf(mapped??original);
    const errors=[];
    if(a?.status!=='RECORDED_RESULT_REQUIRES_ATTESTATION'||!mapped)
      errors.push('RECORDED_RESULT_NOT_COMPATIBLE');
    if(duplicates.get(k)!==1)errors.push('AMBIGUOUS_RECORDED_RESULT_FOR_CASE');
    const preds=arr(input.predictions).filter(p=>same(p?.candidate_key,mapped?.candidate_key)&&
      same(p?.event_id,mapped?.event_id)&&same(p?.prediction_id,mapped?.prediction_id));
    const observations=arr(input.observations).filter(o=>
      same(o?.candidate_key,mapped?.candidate_key)&&same(o?.event_id,mapped?.event_id)&&
      same(o?.experiment_id,input?.experiment?.experiment_id));
    if(preds.length!==1)errors.push('FORECAST_RECEIPT_NOT_UNIQUE');
    if(observations.length!==1)errors.push('BASELINE_OBSERVATION_NOT_UNIQUE');
    const p=preds.length===1?preds[0]:null;
    const b=observations.length===1?observations[0]?.baseline_output:null;
    if(!probability(p?.predicted_probability)||!isText(p?.model_key)||
       !p?.independent_inputs_verified||!isText(p?.root_tags?.root_key)||
       !Number.isFinite(ms(p?.frozen_at))||!Number.isFinite(ms(p?.features_observed_at))||
       !Number.isFinite(ms(p?.event_start_at))||
       !(ms(p?.features_observed_at)<=ms(p?.frozen_at)&&ms(p?.frozen_at)<ms(p?.event_start_at)))
       errors.push('PRESTART_INDEPENDENT_FORECAST_NOT_PROVEN');
    if(!probability(b?.predicted_probability)||!isText(b?.model_version)||
       !Number.isFinite(ms(b?.frozen_at))||
       !(ms(b?.frozen_at)<=ms(p?.frozen_at)))
       errors.push('PRESTART_NUMERIC_BASELINE_NOT_PROVEN');
    if(!original||!Number.isFinite(ms(original.evidence_observed_at))||
       !(ms(original.evidence_observed_at)>ms(p?.event_start_at))||
       !(mapped?.binary_outcome===0||mapped?.binary_outcome===1))
       errors.push('POSTGAME_RECORDED_RESULT_NOT_PROVEN');
    const ready=errors.length===0;
    const y=ready?mapped.binary_outcome:null;
    const modelBrier=ready?(p.predicted_probability-y)**2:null;
    const baselineBrier=ready?(b.predicted_probability-y)**2:null;
    return {
      contract:RECORDED_DIAGNOSTIC_CONTRACT,
      case_key:mapped?.candidate_key??original?.candidate_key??null,
      event_id:mapped?.event_id??original?.event_id??null,
      recorded_receipt_key:original?.receipt_key??null,
      status:ready?'RESEARCH_ONLY_UNVERIFIED_RECORDED_BRIER':'HOLD_RECORDED_DIAGNOSTIC',
      blockers:unique(errors),
      observed_recorded_binary:ready?y:null,
      provisional_model_brier:modelBrier,
      provisional_baseline_brier:baselineBrier,
      provisional_brier_improvement:ready?baselineBrier-modelBrier:null,
      independently_authenticated_outcome:false,
      verified_identity_or_settlement:false,
      forecast_scoring_eligible:false,
      pricing_roi_eligible:false,
      calibration_sample_count:0,
      production_authority:false,
      annotation:'Descriptive arithmetic on an unverified recorded result; excluded from official scoring and all profitability claims.'
    };
  });
}
