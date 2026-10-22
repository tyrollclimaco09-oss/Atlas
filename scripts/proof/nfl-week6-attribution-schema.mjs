import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const URL='https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872996';
const sha=b=>createHash('sha256').update(b).digest('hex');
const validId=x=>/^\d{1,20}$/.test(String(x??''));
export function inspectAttribution(summary){
 const ds=summary?.drives?.previous;
 if(!Array.isArray(ds)||ds.length===0)throw Error('NO_COMPLETED_DRIVES');
 const evidence={schema:'atlas.nfl.week6.play-actor-source-map.v1',
  game_id:'401872996',drive_count:ds.length,play_count:0,
  candidate_paths:{'play.team.id':0,'play.start.team.id':0,'play.end.team.id':0,'play.athletes[]':0,
    'play.participants[]':0,'play.scoringPlay':0,'drive.team.id':0,'drive.start.team.id':0},
  distinct_drive_team_ids:[],
  play_key_frequency:{},drive_key_frequency:{},play_type_frequency:{},
  samples:[],team_inheritance_safe:false,canonical_offense_attribution_verified:false,
  canonical_defense_attribution_verified:false,player_target_model_eligible:false,
  execution_authority:false,production_authority:false};
 const driveTeams=new Set();
 for(const d of ds){
  for(const key of Object.keys(d))evidence.drive_key_frequency[key]=(evidence.drive_key_frequency[key]||0)+1;
  if(validId(d.team?.id)){evidence.candidate_paths['drive.team.id']++;driveTeams.add(String(d.team.id))}
  if(validId(d.start?.team?.id))evidence.candidate_paths['drive.start.team.id']++;
  const plays=d.plays;
  if(!Array.isArray(plays))throw Error('DRIVE_PLAYS_SCHEMA');
  for(const p of plays){
   evidence.play_count++;
   for(const key of Object.keys(p))evidence.play_key_frequency[key]=(evidence.play_key_frequency[key]||0)+1;
   if(validId(p.team?.id))evidence.candidate_paths['play.team.id']++;
   if(validId(p.start?.team?.id))evidence.candidate_paths['play.start.team.id']++;
   if(validId(p.end?.team?.id))evidence.candidate_paths['play.end.team.id']++;
   if(Array.isArray(p.athletes)&&p.athletes.length)evidence.candidate_paths['play.athletes[]']++;
   if(Array.isArray(p.participants)&&p.participants.length)evidence.candidate_paths['play.participants[]']++;
   if(typeof p.scoringPlay==='boolean')evidence.candidate_paths['play.scoringPlay']++;
   const typ=String(p.type?.text??p.type?.id??'UNKNOWN');
   evidence.play_type_frequency[typ]=(evidence.play_type_frequency[typ]||0)+1;
   if(evidence.samples.length<12)evidence.samples.push({
    id:String(p.id??''),period:p.period?.number??null,clock:p.clock?.displayValue??null,
    play_keys:Object.keys(p).sort(),drive_keys:Object.keys(d).sort(),
    drive_team_id:validId(d.team?.id)?String(d.team.id):null,
    play_team_id:validId(p.team?.id)?String(p.team.id):null,
    start_team_id:validId(p.start?.team?.id)?String(p.start.team.id):null,
    end_team_id:validId(p.end?.team?.id)?String(p.end.team.id):null,
    type:typ,has_text:typeof p.text==='string'
   });
  }
 }
 evidence.distinct_drive_team_ids=[...driveTeams].sort();
 if(evidence.play_count<80)throw Error('SOURCE_COVERAGE_LOW');
 return evidence;
}
async function main(){
 const res=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(16000),headers:{Accept:'application/json','User-Agent':'ATLAS-NFL-SCHEMA-FORENSICS/1'}});
 if(res.status!==200||res.url!==URL)throw Error('SOURCE_UNAVAILABLE');
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length===0||bytes.length>4_000_000)throw Error('SOURCE_SIZE');
 const report=inspectAttribution(JSON.parse(bytes.toString('utf8')));
 const r={...report,source_url:URL,source_sha256:sha(bytes),observed_at_utc:new Date().toISOString(),odds_credits:0};
 writeFileSync('atlas-nfl-week6-actor-schema.json',JSON.stringify(r,null,2)+'\n');
 console.log('ATLAS_NFL_ACTOR_SCHEMA '+JSON.stringify({
  drives:r.drive_count,plays:r.play_count,candidate_paths:r.candidate_paths,
  drive_team_ids:r.distinct_drive_team_ids,
  drive_keys:r.drive_key_frequency,play_keys:r.play_key_frequency,
  samples:r.samples.slice(0,4),actor_attribution_verified:false,
  source_sha256:r.source_sha256
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NFL_ACTOR_SCHEMA_BLOCKED '+e.message);process.exitCode=1});
