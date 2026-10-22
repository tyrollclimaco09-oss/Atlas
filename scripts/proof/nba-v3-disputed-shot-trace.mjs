import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {isFieldGoalType} from './nba-v3-shot-coverage.mjs';
const URL='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909834';
const IDS=new Set(['4869342','4432165']);
const hash=b=>createHash('sha256').update(b).digest('hex');
function demand(v,s){if(!v)throw Error(s);}
export function traceDisputedShooters(summary){
 const plays=summary?.plays;
 demand(Array.isArray(plays)&&plays.length>=100,'MISSING_REAL_PLAY_LIST');
 const targets={4869342:[],4432165:[]};
 let malformed=0,disputedNonShotParticipation=0;
 const reviews=[],shots=[],teamCount={};
 for(let i=0;i<plays.length;i++){
  const play=plays[i],people=(play.participants??[]).map(p=>String(p?.athlete?.id??'')).filter(Boolean);
  const type=String(play.type?.text??'');
  const record={
   index:i,id:String(play.id??''),period:play.period?.number??null,
   clock:play.clock?.displayValue??null,
   type,team_id:String(play.team?.id??''),
   participant_ids:people,scoring_play:play.scoringPlay===true,
   score_home:play.homeScore??null,score_away:play.awayScore??null,
   text:typeof play.text==='string'?play.text.slice(0,240):null
  };
  if(/challenge|review|overturn|no basket|basket interference/i.test(type+' '+(record.text||'')))reviews.push(record);
  if(!isFieldGoalType(type)){
   if(people.some(x=>IDS.has(x)))disputedNonShotParticipation++;
   continue;
  }
  if(!people.length)malformed++;
  shots.push(record);
  teamCount[record.team_id]=(teamCount[record.team_id]??0)+1;
  for(const id of IDS)if(people[0]===id)targets[id].push(record);
 }
 demand(shots.length>=100,'FGA_SAMPLE_TOO_SMALL');
 return {
  protocol:'atlas.nba.fga-player-anomaly-trace.v1',
  event_id:'401909834',play_count:plays.length,candidate_shots:shots.length,
  team_event_counts:teamCount,malformed_shot_participants:malformed,
  selected_players:{
   '4869342':{official_fga:13,pbp_fga:targets['4869342'].length,team_id:'1',events:targets['4869342']},
   '4432165':{official_fga:8,pbp_fga:targets['4432165'].length,team_id:'19',events:targets['4432165']}
  },
  reviewed_event_count:reviews.length,review_events:reviews.slice(0,30),
  disputed_nonshot_participations:disputedNonShotParticipation,
  per_player_fga_reconciled:false,
  suspected_cause:'NOT_DETERMINED',
  production_authority:false,calibrator_eligible:false,execution_authority:false
 };
}
async function main(){
 const res=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(16000),headers:{Accept:'application/json','User-Agent':'ATLAS-NBA-FORENSIC-TRACE/1'}});
 demand(res.status===200&&res.url===URL,'SOURCE_DENIED');
 const raw=Buffer.from(await res.arrayBuffer());demand(raw.length>0&&raw.length<=4_000_000,'SOURCE_SIZE');
 const r=traceDisputedShooters(JSON.parse(raw.toString('utf8')));
 const receipt={...r,source_url:URL,source_observed_at_utc:new Date().toISOString(),response_sha256:hash(raw),paid_odds_requests:0};
 writeFileSync('atlas-nba-player-shot-anomaly-trace.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NBA_FGA_TRACE '+JSON.stringify({
   game:r.event_id,source_hash:receipt.response_sha256,
   shots:r.candidate_shots,
   player_rows:Object.fromEntries(Object.entries(r.selected_players).map(([id,x])=>[id,{official:x.official_fga,extracted:x.pbp_fga,plays:x.events.map(p=>({id:p.id,period:p.period,clock:p.clock,type:p.type,scoring:p.scoring_play,text:p.text}))}])),
   reviews:r.review_events.map(x=>({id:x.id,period:x.period,clock:x.clock,type:x.type,text:x.text})),
   result:'ATTRIBUTION_NOT_YET_PROVEN'
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_FGA_TRACE_BLOCKED '+e.message);process.exitCode=1});
