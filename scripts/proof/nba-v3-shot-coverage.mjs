import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const URL='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909834';
const digest=x=>createHash('sha256').update(x).digest('hex');
const ok=(x,s)=>{if(!x)throw Error(s)};
export function isFieldGoalType(s){
 return typeof s==='string'&&/\b(?:shot|layup|dunk)\b/i.test(s)&&!/free throw/i.test(s);
}
function boxFga(team){
 const raw=team.statistics?.find(x=>x.name==='fieldGoalsMade-fieldGoalsAttempted')?.displayValue;
 const m=String(raw??'').match(/^(\d+)-(\d+)$/);
 return m?{made:+m[1],attempts:+m[2]}:null;
}
export function assessCoverage(summary){
 const p=summary.plays;ok(Array.isArray(p)&&p.length>=100,'NO_PLAY_BY_PLAY');
 const teams=summary.boxscore?.teams;
 ok(Array.isArray(teams)&&teams.length===2,'NO_TEAM_BOX_SCORE');
 const attempts={};const made={};const noTeam=[];let participantMissing=0,invalidPeriod=0;
 const sampled=[];
 for(const r of p){
  const t=r.type?.text;
  if(!isFieldGoalType(t))continue;
  const tid=String(r.team?.id??'');
  if(!/^\d+$/.test(tid)){noTeam.push({type:t,period:r.period?.number});continue;}
  attempts[tid]=(attempts[tid]||0)+1;
  if(r.scoringPlay===true)made[tid]=(made[tid]||0)+1;
  if(!Array.isArray(r.participants)||r.participants.length<1)participantMissing++;
  if(!Number.isInteger(r.period?.number)||r.period.number<1||r.period.number>4)invalidPeriod++;
  if(sampled.length<8)sampled.push({
    type:t,team_id:tid,period:r.period?.number,
    participants:(r.participants||[]).slice(0,2).map(x=>({
      keys:Object.keys(x),athlete_id:x.athlete?.id??null,
      alternate_id:x.id??null
    }))
  });
 }
 const counts=teams.map(t=>{
  const tid=String(t.team?.id??'');const official=boxFga(t);
  return {team_id:tid,official,extracted_attempts:attempts[tid]||0,
    extracted_made:made[tid]||0,
    attempt_delta:official?(attempts[tid]||0)-official.attempts:null,
    made_delta:official?(made[tid]||0)-official.made:null};
 });
 return {total_plays:p.length,team_comparisons:counts,
  candidate_shot_types:p.filter(x=>isFieldGoalType(x.type?.text)).length,
  no_team_events:noTeam.length,participant_missing:participantMissing,
  invalid_period:invalidPeriod,sampled_participant_shapes:sampled,
  fga_reconciliation_verified:counts.every(x=>x.official&&x.attempt_delta===0),
  makes_reconciliation_verified:counts.every(x=>x.official&&x.made_delta===0)};
}
export async function main(){
 const r=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(16000),headers:{Accept:'application/json','User-Agent':'ATLAS-Q4-COVERAGE-AUDIT/1'}});
 ok(r.status===200&&r.url===URL,'NBA_UPSTREAM_FAILED');
 const b=Buffer.from(await r.arrayBuffer());
 ok(b.length>0&&b.length<4_000_000,'NBA_PAYLOAD_OVERSIZED');
 const report=assessCoverage(JSON.parse(b.toString('utf8')));
 const packet={schema:'atlas.nba.field-goal-coverage.audit.v1',
  classification:'POSTGAME_PLAYER_PBP_COVERAGE_RESEARCH',source_url:URL,
  source_observed_at_utc:new Date().toISOString(),source_sha256:digest(b),
  ...report,upstream_published_at:null,calibrator_eligible:false,
  production_authority:false,execution_authority:false,api_credits:0};
 writeFileSync('atlas-nba-shot-coverage.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NBA_SHOT_COVERAGE '+JSON.stringify({
  total_plays:packet.total_plays,candidate_shot_types:packet.candidate_shot_types,
  by_team:packet.team_comparisons,no_team:packet.no_team_events,
  participant_missing:packet.participant_missing,invalid_period:packet.invalid_period,
  samples:packet.sampled_participant_shapes,
  fga_reconciliation:packet.fga_reconciliation_verified,
  makes_reconciliation:packet.makes_reconciliation_verified,source_sha256:packet.source_sha256
 }));
 // fail closed: do not call this sufficient proof when official FGA totals disagree.
 ok(packet.fga_reconciliation_verified,'SHOT_COUNT_MISMATCH');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_SHOT_BLOCKED '+e.message);process.exitCode=1});
