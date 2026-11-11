#!/usr/bin/env node
/**
 * Optional evidence-only NBA official-origin reachability probe.
 * Stores raw bytes only when an exact www.nba.com or cdn.nba.com HTTPS
 * endpoint responds, but NEVER promotes that payload as a final/verified
 * result without validated JSON schema, event identity and timing.
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const date=process.argv.find(x=>x.startsWith('--date='))?.slice(7);
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!out)throw Error('NBA_PROBE_ARGS_INVALID');
const endpoints=[
 {key:'official-games-page',url:'https://www.nba.com/games?date='+date},
 {key:'official-today-scoreboard',url:'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json'}
];
const path=resolve(out);mkdirSync(path,{recursive:true});
const observed=[];
for(const e of endpoints){
 const row={endpoint:e.key,host:new URL(e.url).hostname,url:e.url,
  observed_at:new Date().toISOString(),http_status:null,
  sha256:null,bytes:null,payload_schema_authenticated:false,
  official_result_admitted:false};
 try {
  const response=await fetch(e.url,{redirect:'error',cache:'no-store',
   headers:{Accept:'text/html,application/json','User-Agent':'ATLAS-Research-Origin-Probe/1.0'},
   signal:AbortSignal.timeout(10000)});
  row.http_status=response.status;
  if(response.status===200){
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length>0&&bytes.length<=8_000_000){
    row.sha256=createHash('sha256').update(bytes).digest('hex');
    row.bytes=bytes.length;
    writeFileSync(join(path,e.key+'.raw'),bytes,{flag:'wx'});
    row.content_type=response.headers.get('content-type')||null;
   }else row.error='PAYLOAD_SIZE_INVALID';
  }else row.error='OFFICIAL_HTTP_'+response.status;
 }catch(error){row.error=/timeout|abort/i.test(String(error))?'OFFICIAL_TIMEOUT':'OFFICIAL_CONNECTION_UNAVAILABLE';}
 observed.push(row);
}
writeFileSync(join(path,'official-origin-probe.json'),JSON.stringify({
 contract:'ATLAS_NBA_OFFICIAL_ORIGIN_PROBE_V1',date,results:observed,
 evidence_category:'TRANSPORT_REACHABILITY_ONLY_NOT_SCORE_VERIFICATION',
 any_game_result_admitted:false,production_authority:false,
 note:'NBA.com responses are not scored or trusted as final outcome without explicit schema/event/source matching; 403 stays blocked.'},null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({probe:observed.map(x=>({endpoint:x.endpoint,http_status:x.http_status,
 bytes:x.bytes,sha256:x.sha256,error:x.error||null})),authority:false})+'\n');
