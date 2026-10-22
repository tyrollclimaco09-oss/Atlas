import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildRequest,normalizeResponse} from '../scout/free-source-core/multisport-core.mjs';

const sha256=b=>createHash('sha256').update(b).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const SOURCE='https://api-web.nhle.com/v1/score/';
function check(x,msg){if(!x)throw Error(msg);}
export function freezeBaseline(event,source) {
 check(event && source && event.sport==='NHL' && event.status_at_retrieval==='FUT' &&
  /^NHL:NHL_WEB_API:[0-9]+$/.test(event.event_key) &&
  event.home?.id && event.away?.id && event.home.id!==event.away.id &&
  typeof event.start_at_utc==='string' && typeof event.observed_at==='string', 'FIXTURE_NOT_ELIGIBLE');
 check(SHA.test(source.upstream_sha256) && SHA.test(source.normalizer_sha256)&&
   source.source_url===event.source_url && source.source_url.startsWith(SOURCE) &&
   source.observed_at_utc===event.observed_at, 'SOURCE_PROVENANCE_INVALID');
 const start=Date.parse(event.start_at_utc),observed=Date.parse(event.observed_at);
 const freezeAt=new Date().toISOString(),freezeTime=Date.parse(freezeAt);
 check(Number.isFinite(start)&&Number.isFinite(observed)&&observed<=freezeTime&&
   freezeTime+90*60*1000<start,'NOT_SAFELY_PREGAME');
 const packet={
   schema:'atlas.prospective.unpriced-baseline.v1',
   classification:'REAL_EVENT_UNVALIDATED_UNPRICED_BASELINE',
   sport:'NHL',league:'NHL',
   event_key:event.event_key,source_event_id:String(event.source_event_id),
   home:{id:String(event.home.id),name:event.home.name},
   away:{id:String(event.away.id),name:event.away.name},
   event_starts_at_utc:event.start_at_utc,
   source_url:source.source_url,
   source_observed_at_utc:source.observed_at_utc,
   source_published_at_utc:null,
   source_response_sha256:source.upstream_sha256,
   normalizer_sha256:source.normalizer_sha256,
   source_normalized_state:event.status_at_retrieval,
   frozen_at_utc:freezeAt,
   forecast:{model_key:'UNIFORM_HOME_WIN_REFERENCE_BASELINE',model_version:'0.1.0',
     selection_side:'HOME',selection_id:String(event.home.id),
     estimated_probability:0.5,origin:'DELIBERATELY_UNINFORMED_BASELINE',
     model_trained:false,model_validated:false},
   market_price:null,executable_price_verified:false,
   sportsbook_offer:null,profitability_claim:false,
   external_timing_verified:false,
   benchmark_only:true,calibrator_eligible:false,
   database_persisted:false,production_authority:false,
   execution_authority:false,bet_authorized:false
 };
 return {packet,packet_sha256:sha256(JSON.stringify(packet))};
}
async function fetchOne(date){
 const spec=buildRequest({sport:'NHL',date});
 const r=await fetch(spec.source_url,{redirect:'error',signal:AbortSignal.timeout(16000),
   headers:{Accept:'application/json','User-Agent':'ATLAS-NONBETTING-PROSPECTIVE-V1'}});
 check(r.ok && r.url===spec.source_url,'SOURCE_HTTP_CONTRACT');
 const buf=Buffer.from(await r.arrayBuffer());
 check(buf.length>0&&buf.length<=2_000_000,'SOURCE_SIZE');
 const observed=new Date().toISOString();
 const parsed=JSON.parse(buf.toString('utf8'));
 const events=normalizeResponse(parsed,spec,{observed_at:observed});
 return {events,meta:{source_url:spec.source_url,observed_at_utc:observed,
   upstream_sha256:sha256(buf),normalizer_sha256:sha256((await import('node:fs')).readFileSync(new URL('../scout/free-source-core/multisport-core.mjs',import.meta.url))) }};
}
export async function main(){
 const dates=['2026-10-22','2026-10-23'];
 let chosen=null;let fetched=null;
 for(const date of dates){
  const out=await fetchOne(date);
  const eligible=out.events.filter(e=>e.status_at_retrieval==='FUT' &&
    Date.parse(e.start_at_utc)-Date.now()>90*60*1000);
  if(eligible.length){chosen=eligible[0];fetched=out;break;}
 }
 check(chosen&&fetched,'NO_FUTURE_ELIGIBLE_NHL_EVENT');
 const result=freezeBaseline(chosen,fetched.meta);
 writeFileSync('atlas-prospective-nhl-baseline.json',JSON.stringify(result,null,2)+'\n','utf8');
 console.log('ATLAS_REAL_PROSPECTIVE_BASELINE_FREEZE '+JSON.stringify({
   packet_sha256:result.packet_sha256,game:result.packet.event_key,
   starts_at:result.packet.event_starts_at_utc,frozen_at:result.packet.frozen_at_utc,
   source_response_sha256:result.packet.source_response_sha256,
   forecast_p_home:0.5,model_validated:false,market_price:null,production_authority:false
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_PROOF_BLOCKED: '+e.message);process.exitCode=1;});