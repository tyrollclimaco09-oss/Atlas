import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ARCHIVE='docs/prospective/ATLAS_NHL_20261022_2026020154_UNPRICED_FREEZE.json';
const URI='https://api-web.nhle.com/v1/gamecenter/2026020154/landing';
const sha256=b=>createHash('sha256').update(b).digest('hex');
function guard(c,r){if(!c)throw Error(r);}
export function settleOfficial(artifact,official,observed_at_utc,upstream_sha256){
 guard(artifact?.packet && artifact?.packet_sha256===sha256(JSON.stringify(artifact.packet)),'TAMPERED_FREEZE');
 const p=artifact.packet;
 guard(p.schema==='atlas.prospective.unpriced-baseline.v1'&&
   p.event_key==='NHL:NHL_WEB_API:2026020154'&&p.source_event_id==='2026020154'&&
   p.market_price===null&&p.forecast?.estimated_probability===0.5&&
   p.calibrator_eligible===false&&p.production_authority===false,'FROZEN_BASELINE_CONTRACT');
 const obs=Date.parse(observed_at_utc),start=Date.parse(p.event_starts_at_utc);
 guard(Number.isFinite(obs)&&obs>start&&Date.parse(p.frozen_at_utc)<start,'RESULT_NOT_AFTER_GAME');
 guard(typeof upstream_sha256==='string'&&/^[a-f0-9]{64}$/.test(upstream_sha256),'OFFICIAL_SHA_INVALID');
 const status=official?.gameState,home=official?.homeTeam,away=official?.awayTeam;
 guard(['OFF','FINAL'].includes(status)&&String(official.id)===p.source_event_id&&
   String(home?.id)===p.home.id&&String(away?.id)===p.away.id&&
   Date.parse(official.startTimeUTC)===start,'OFFICIAL_FINAL_IDENTITY_INVALID');
 guard(Number.isSafeInteger(home.score)&&Number.isSafeInteger(away.score)&&
   home.score>=0&&away.score>=0&&home.score!==away.score,'NO_UNAMBIGUOUS_FINAL_RESULT');
 const y=Number(home.score>away.score),prob=p.forecast.estimated_probability;
 return {
  schema:'atlas.nhl.official-result-shadow.v1',
  source:'NHL_WEB_API_GAMECENTER',
  source_url:URI,source_observed_at_utc:observed_at_utc,
  source_sha256:upstream_sha256,
  freeze_sha256:artifact.packet_sha256,
  event_key:p.event_key,home_score:home.score,away_score:away.score,
  home_win:y,baseline_probability_home:prob,
  brier_score:(prob-y)**2,
  log_loss:-(y*Math.log(prob)+(1-y)*Math.log(1-prob)),
  result_confirmed_by_provider_response:true,
  independent_model_validated:false,
  causal_attribution_confirmed:false,
  calibrator_eligible:false,
  betting_ev_evaluated:false,
  profit_loss:null,
  production_authority:false,execution_authority:false,
  classification:'OFFICIAL_RESULT_JOIN_RESEARCH_ONLY'
 };
}
export async function main(){
 const frozen=JSON.parse(readFileSync(ARCHIVE,'utf8'));
 // Single manual call; NO schedule/retry and NO odds provider.
 const r=await fetch(URI,{redirect:'error',signal:AbortSignal.timeout(16000),
   headers:{Accept:'application/json','User-Agent':'ATLAS-FORENSICS-ONE-SHOT/1'}});
 guard(r.ok&&r.url===URI,'OFFICIAL_HTTP_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());
 guard(bytes.length>0&&bytes.length<=2_000_000,'OFFICIAL_RESPONSE_INVALID');
 const observed_at_utc=new Date().toISOString();
 const result=settleOfficial(frozen,JSON.parse(bytes.toString('utf8')),observed_at_utc,sha256(bytes));
 writeFileSync('atlas-nhl-result-2026020154.json',JSON.stringify(result,null,2)+'\n','utf8');
 console.log('ATLAS_NHL_OFFICIAL_RESULT_RESEARCH '+JSON.stringify({event_key:result.event_key,home_win:result.home_win,brier_score:result.brier_score,log_loss:result.log_loss,calibrator_eligible:false,profit_loss:null}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_OFFICIAL_RESULT_BLOCKED '+e.message);process.exitCode=1;});