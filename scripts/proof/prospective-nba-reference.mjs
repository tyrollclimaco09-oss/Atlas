import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {buildRequest,normalizeResponse} from '../scout/free-source-core/multisport-core.mjs';

// One-shot, no API key, no sportsbook call, no database mutation.
// ESPN scoreboard is an UNOFFICIAL public endpoint. This is only a 50/50 reference baseline.
const sha256=x=>createHash('sha256').update(x).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const START_MARGIN_MS=90*60*1000;
function guard(ok,why){if(!ok)throw Error(why);}
export function freezeNBA(event,meta,now=new Date().toISOString()){
 guard(event?.sport==='NBA'&&event.league==='NBA'&&
   /^NBA:ESPN_UNOFFICIAL:[A-Za-z0-9_.:-]+$/.test(event.event_key)&&
   event.home?.id&&event.away?.id&&event.home.id!==event.away.id &&
   ['STATUS_SCHEDULED','Scheduled','STATUS_PRE'].includes(event.status_at_retrieval),
   'NBA_FIXTURE_NOT_SCHEDULED');
 guard(meta&&meta.source_url===event.source_url &&
   /^https:\/\/site\.api\.espn\.com\/apis\/site\/v2\/sports\/basketball\/nba\/scoreboard\?dates=20261022$/.test(meta.source_url)&&
   meta.observed_at_utc===event.observed_at &&
   SHA.test(meta.upstream_sha256)&&SHA.test(meta.normalizer_sha256),
   'NBA_PROVENANCE_INVALID');
 const start=Date.parse(event.start_at_utc),observed=Date.parse(event.observed_at),frozen=Date.parse(now);
 guard(Number.isFinite(start)&&Number.isFinite(observed)&&Number.isFinite(frozen)&&
   observed<=frozen && start>frozen+START_MARGIN_MS && new Date(start).toISOString().slice(0,10)==='2026-10-22',
   'NBA_FREEZE_NOT_BEFORE_TIP');
 const packet={
   schema:'atlas.prospective.unpriced-nba-baseline.v1',
   classification:'REAL_NBA_EVENT_UNVALIDATED_REFERENCE_ONLY',
   sport:'NBA',league:'NBA',
   event_key:event.event_key,source_event_id:String(event.source_event_id),
   home:{id:String(event.home.id),name:event.home.name},
   away:{id:String(event.away.id),name:event.away.name},
   event_starts_at_utc:event.start_at_utc,
   source_provider:'ESPN_UNOFFICIAL',
   source_trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT',
   source_url:meta.source_url,
   source_observed_at_utc:meta.observed_at_utc,
   source_published_at_utc:null,
   source_response_sha256:meta.upstream_sha256,
   normalizer_sha256:meta.normalizer_sha256,
   source_normalized_state:event.status_at_retrieval,
   frozen_at_utc:now,
   forecast:{model_key:'NBA_UNIFORM_HOME_WIN_REFERENCE',model_version:'0.1.0',
     selection:'HOME',team_id:String(event.home.id),estimated_probability:0.5,
     origin:'UNINFORMED_REFERENCE_BASELINE',
     model_trained:false,model_validated:false},
   quote:null,market_price:null,team_or_player_prop_probability:null,
   executable_price_verified:false,official_lineup_verified:false,
   external_timing_verified:false,calibrator_eligible:false,
   production_authority:false,execution_authority:false,bet_authorized:false,
   source_authority:'UNVERIFIED_UNOFFICIAL'
 };
 return {packet,packet_sha256:sha256(JSON.stringify(packet))};
}
export async function main(){
 const spec=buildRequest({sport:'NBA',date:'2026-10-22'});
 const r=await fetch(spec.source_url,{redirect:'error',signal:AbortSignal.timeout(18000),
   headers:{Accept:'application/json','User-Agent':'ATLAS-NBA-PREGAME-PROOF/1'}});
 guard(r.status===200 && r.url===spec.source_url,'NBA_UNOFFICIAL_HTTP_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());
 guard(bytes.length>0&&bytes.length<=2_000_000,'NBA_HTTP_PAYLOAD_INVALID');
 const observed=new Date().toISOString();
 const games=normalizeResponse(JSON.parse(bytes.toString('utf8')),spec,{observed_at:observed});
 const chosen=games.find(x=>['STATUS_SCHEDULED','Scheduled','STATUS_PRE'].includes(x.status_at_retrieval)&&
   Date.parse(x.start_at_utc)>Date.now()+START_MARGIN_MS);
 guard(chosen,'NO_ELIGIBLE_PREGAME_NBA_FIXTURE');
 const meta={source_url:spec.source_url,observed_at_utc:observed,
   upstream_sha256:sha256(bytes),normalizer_sha256:sha256(readFileSync(new URL('../scout/free-source-core/multisport-core.mjs',import.meta.url)))};
 const receipt=freezeNBA(chosen,meta);
 writeFileSync('atlas-nba-20261022-first-freeze.json',JSON.stringify(receipt,null,2)+'\n','utf8');
 console.log('ATLAS_REAL_NBA_PREGAME_FREEZE '+JSON.stringify({
   event_key:receipt.packet.event_key,away:receipt.packet.away.name,
   home:receipt.packet.home.name,starts_at:receipt.packet.event_starts_at_utc,
   frozen_at:receipt.packet.frozen_at_utc,
   packet_sha256:receipt.packet_sha256,upstream_sha256:meta.upstream_sha256,
   forecast_home:0.5,model_validated:false,market_price:null,
   execution_authority:false,api_credits_used:0
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_FREEZE_BLOCKED '+e.message);process.exitCode=1;});
