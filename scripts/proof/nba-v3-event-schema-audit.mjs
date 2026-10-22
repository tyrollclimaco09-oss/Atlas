import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const URL='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909834';
const sha=x=>createHash('sha256').update(x).digest('hex');
function check(b,c){if(!b)throw Error(c)}
export function auditSchema(summary){
 const id=summary?.header?.id ?? summary?.header?.competitions?.[0]?.id;
 check(String(id)==='401909834','WRONG_EVENT');
 const p=summary?.plays;
 check(Array.isArray(p)&&p.length>100,'MISSING_PBP');
 const counts={};
 const periods={};
 const sampleByType={};
 const keys={};
 let participants=0,shotsText=0;
 for(const row of p){
  const type=String(row.type?.text??row.type?.id??'UNKNOWN');
  counts[type]=(counts[type]||0)+1;
  const q=String(row.period?.number??'UNKNOWN');
  periods[q]=(periods[q]||0)+1;
  for(const k of Object.keys(row))keys[k]=(keys[k]||0)+1;
  if(Array.isArray(row.participants)&&row.participants.length)participants++;
  if(/shot|layup|dunk|jumper|three.point|three point|3.pt|hook|tip.in/i.test(String(row.text||'')))shotsText++;
  if(!sampleByType[type])sampleByType[type]={field_names:Object.keys(row).sort(),participants_shape:Array.isArray(row.participants)?row.participants.map(x=>Object.keys(x).sort()).slice(0,2):null,has_team:!!row.team,has_athlete:!!row.athlete,has_text:typeof row.text==='string',scoring_play:row.scoringPlay===true};
 }
 const teamStats=(summary?.boxscore?.teams||[]).map(t=>({id:t.team?.id,
  group_names:(t.statistics||[]).map(x=>({name:x.name,label:x.label,abbreviation:x.abbreviation,displayValue:x.displayValue,keys:Object.keys(x).sort()}))}));
 return {event_id:String(id),total_plays:p.length,type_counts:counts,period_counts:periods,
  plays_with_participants:participants,shot_text_matches:shotsText,
  first_per_type_shape:sampleByType,top_level_field_counts:keys,
  team_boxscore_aggregate:teamStats,
  result_authority:false,model_verified:false,source_rights_verified:false};
}
async function main(){
 const res=await fetch(URL,{signal:AbortSignal.timeout(16000),redirect:'error',headers:{Accept:'application/json','User-Agent':'ATLAS-NBA-V3-SCHEMA/1'}});
 check(res.status===200&&res.url===URL,'SOURCE_HTTP_BLOCKED');
 const raw=Buffer.from(await res.arrayBuffer());check(raw.length>0&&raw.length<4_000_000,'PAYLOAD_LIMIT');
 const observed=new Date().toISOString(),report=auditSchema(JSON.parse(raw.toString('utf8')));
 const receipt={schema:'atlas.nba.q4-pbp-schema-diagnostic.v1',classification:'ONE_GAME_RETROSPECTIVE_RESEARCH_ONLY',
  observed_at_utc:observed,url:URL,body_sha256:sha(raw),...report,
  source_publication_time:null,finished_game_only:true,prospective_predictive_test:false,
  sportsbook_calls:0,db_mutations:0,production_authority:false,execution_authority:false};
 writeFileSync('atlas-nba-v3-event-schema-audit.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NBA_V3_SCHEMA_AUDIT '+JSON.stringify({event:receipt.event_id,plays:receipt.total_plays,periods:receipt.period_counts,plays_with_participants:receipt.plays_with_participants,shot_text_matches:receipt.shot_text_matches,type_counts:receipt.type_counts,team_stat_names:receipt.team_boxscore_aggregate.map(x=>({id:x.id,names:x.group_names.map(t=>t.name||t.label)})),source_sha256:receipt.body_sha256}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_V3_SCHEMA_BLOCKED '+e.message);process.exitCode=1});
