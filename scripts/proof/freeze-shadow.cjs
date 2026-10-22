'use strict';
const {createHash}=require('node:crypto');
const VERSION='atlas.proof.freeze-shadow.v1';
function assert(x,m){if(!x)throw Error(m);}
function exact(x,keys){return x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));}
function utc(s){assert(typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s),'TIMESTAMP_FORMAT');const x=Date.parse(s);assert(Number.isFinite(x)&&new Date(x).toISOString()===s.replace('Z','.000Z'),'TIMESTAMP_INVALID');return x;}
function canonical(o){if(o===null||typeof o==='string'||typeof o==='boolean')return JSON.stringify(o);if(typeof o==='number'){assert(Number.isFinite(o),'NONFINITE');return JSON.stringify(o);}if(Array.isArray(o))return '['+o.map(canonical).join(',')+']';assert(o&&Object.getPrototypeOf(o)===Object.prototype,'NOT_PLAIN_JSON');return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';}
const hash=o=>createHash('sha256').update(canonical(o)).digest('hex');
const hashOK=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function validate(d){
 assert(exact(d,['version','synthetic','research_only','event','forecast','quote','sources','frozen_at'])&&d.version===VERSION&&typeof d.synthetic==='boolean'&&d.research_only===true,'FREEZE_SCHEMA');
 const e=d.event,f=d.forecast,q=d.quote;
 assert(exact(e,['id','league','home','away','starts_at'])&&typeof e.id==='string'&&e.id.length>0&&['NBA','WNBA'].includes(e.league)&&e.home!==e.away,'EVENT_SCHEMA');
 assert(exact(f,['model_version','selection','probability','cutoff','feature_hash'])&&
 [e.home,e.away].includes(f.selection)&&typeof f.model_version==='string'&&f.model_version.length>0&&
 Number.isFinite(f.probability)&&f.probability>0&&f.probability<1&&hashOK(f.feature_hash),'FORECAST_SCHEMA');
 assert(exact(q,['provider','book','market','selection','decimal','retrieved_at','source_at','source_hash'])&&
 q.market==='h2h'&&q.selection===f.selection&&typeof q.provider==='string'&&q.provider.length>0&&
 Number.isFinite(q.decimal)&&q.decimal>1&&q.decimal<100&&hashOK(q.source_hash),'QUOTE_SCHEMA');
 const cutoff=utc(f.cutoff),start=utc(e.starts_at);
 assert(cutoff<=utc(d.frozen_at)&&utc(d.frozen_at)<start&&utc(q.source_at)<=utc(q.retrieved_at)&&utc(q.retrieved_at)<=cutoff,'FREEZE_CHRONOLOGY');
 assert(Array.isArray(d.sources)&&d.sources.length>0&&d.sources.length<=20,'SOURCES_SCHEMA');
 const ids=new Set();
 for(const s of d.sources){assert(exact(s,['provider','id','sha256','published_at','observed_at'])&&
 typeof s.provider==='string'&&s.provider.length>0&&typeof s.id==='string'&&s.id.length>0&&hashOK(s.sha256),'SOURCE_SCHEMA');
 assert(s.provider!==q.provider,'SOURCE_PRICE_LEAKAGE');
 const id=s.provider+':'+s.id;assert(!ids.has(id),'SOURCE_DUPLICATE');ids.add(id);
 assert(utc(s.published_at)<=utc(s.observed_at)&&utc(s.observed_at)<=cutoff,'SOURCE_FUTURE_LEAKAGE');}
 return true;
}
function freeze(d){validate(d);const payload=JSON.parse(canonical(d));return {schema:VERSION,payload,hash_sha256:hash(payload),status:'UNATTESTED_RESEARCH',external_timestamp_verified:false,calibrator_eligible:false};}
function verify(r){assert(exact(r,['schema','payload','hash_sha256','status','external_timestamp_verified','calibrator_eligible'])&&r.schema===VERSION&&r.status==='UNATTESTED_RESEARCH'&&r.external_timestamp_verified===false&&r.calibrator_eligible===false,'RECEIPT_SCHEMA');validate(r.payload);assert(hash(r.payload)===r.hash_sha256,'TAMPERED');return r.payload;}
function outcome(r,o){const d=verify(r);
 assert(exact(o,['event_id','winner','source','sha256','published_at','observed_at'])&&
 o.event_id===d.event.id&&[d.event.home,d.event.away].includes(o.winner)&&
 typeof o.source==='string'&&o.source.length>0&&hashOK(o.sha256),'RESULT_IDENTITY');
 assert(utc(o.published_at)>=utc(d.event.starts_at)&&utc(o.published_at)<=utc(o.observed_at),'RESULT_CHRONOLOGY');
 const p=d.forecast.probability,y=Number(o.winner===d.forecast.selection);
 return {freeze_sha256:r.hash_sha256,result_sha256:hash(o),observed_win:y,
 brier_score:Math.pow(p-y,2),log_loss:-(y*Math.log(p)+(1-y)*Math.log(1-p)),
 conditional_expected_roi:p*d.quote.decimal-1,realized_return:y?(d.quote.decimal-1):-1,
 proof_status:d.synthetic?'SYNTHETIC_ONLY':'REAL_UNATTESTED',
 external_timing_verified:false,model_validated:false,calibrator_eligible:false,execution_authority:false};
}
module.exports=Object.freeze({VERSION,freeze,verify,outcome});