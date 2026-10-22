import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {isFieldGoalType} from './nba-v3-shot-coverage.mjs';
const NBA_URL='https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_0022600085.json';
const ESPN_URL='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909834';
const pairs=[
 {name:'Dyson Daniels',team:'ATL',espn:'4869342',nba:'1630700',official_box_fga:13},
 {name:'Jalen Suggs',team:'ORL',espn:'4432165',nba:'1630591',official_box_fga:8}
];
const sha256=b=>createHash('sha256').update(b).digest('hex');
function need(v,e){if(!v)throw Error(e)}
export function parseClock(clock){
 const s=String(clock??'');
 let m=s.match(/^PT(\d+)M(\d+(?:\.\d+)?)S$/);
 if(m)return Number(m[1])*60+Number(m[2]);
 m=s.match(/^(\d+):(\d+(?:\.\d+)?)$/);
 if(m)return Number(m[1])*60+Number(m[2]);
 m=s.match(/^(\d+(?:\.\d+)?)$/);
 return m?Number(m[1]):null;
}
function compareTimes(es,nba){
 const unmatchedE=[...es],unmatchedN=[...nba];
 for(let i=unmatchedE.length-1;i>=0;i--){
  const p=unmatchedE[i];const t=parseClock(p.clock);
  if(t===null)continue;
  let index=-1,best=Infinity;
  for(let j=0;j<unmatchedN.length;j++){
   const b=unmatchedN[j],other=parseClock(b.clock);
   if(p.period!==b.period||other===null)continue;
   const d=Math.abs(t-other);
   if(d<=1.05&&d<best){best=d;index=j}
  }
  if(index!==-1){unmatchedE.splice(i,1);unmatchedN.splice(index,1)}
 }
 return {unmatched_espn:unmatchedE,unmatched_nba:unmatchedN};
}
export function compareShotEventSources(nba,espn){
 need(nba?.game?.gameId==='0022600085'&&espn?.header?.id==='401909834','GAME_IDENTITY_MISMATCH');
 const nActions=nba.game.actions,ePlays=espn.plays;
 need(Array.isArray(nActions)&&nActions.length>100&&Array.isArray(ePlays)&&ePlays.length>100,'PBP_UNAVAILABLE');
 const result=pairs.map(p=>{
  const es=ePlays.filter(a=>isFieldGoalType(a.type?.text)&&String(a.participants?.[0]?.athlete?.id)===p.espn)
    .map(a=>({id:String(a.id),period:a.period?.number??null,clock:a.clock?.displayValue??null,
      type:a.type?.text??null,text:String(a.text??'').slice(0,170)}));
  const ns=nActions.filter(a=>(a.isFieldGoal===1||a.isFieldGoal===true)&&String(a.personId)===p.nba)
    .map(a=>({id:String(a.actionNumber),period:a.period??null,clock:a.clock??null,
      type:String(a.actionType??'')+'/'+String(a.subType??''),text:String(a.description??'').slice(0,170)}));
  const diff=compareTimes(es,ns);
  return {name:p.name,team:p.team,espn_player_id:p.espn,nba_player_id:p.nba,
    espn_shots:es.length,nba_shots:ns.length,official_box_fga:p.official_box_fga,
    nba_consistent:ns.length===p.official_box_fga,
    ...diff};
 });
 return {schema:'atlas.nba.crosssource.shot-event-timing.v1',
  nba_game_id:'0022600085',espn_game_id:'401909834',
  clock_tolerance_seconds:1.05,
  comparisons:result,all_official_counts_reconciled:result.every(x=>x.nba_consistent),
  exact_event_alignment_confirmed:result.every(x=>!x.unmatched_espn.length&&!x.unmatched_nba.length),
  auto_correct_espn_source:false,model_feature_admitted:false,
  production_authority:false,execution_authority:false};
}
async function source(url,limit){
 const headers={Accept:'application/json','User-Agent':'ATLAS-TWO-SOURCE-EVENT-CLOCK-DIAGNOSTIC/1'};
 if(url===NBA_URL)headers.Referer='https://www.nba.com/';
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),headers});
 need(r.status===200&&r.url===url,'UPSTREAM_HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 need(b.length>0&&b.length<=limit,'PAYLOAD_TOO_LARGE');
 return {json:JSON.parse(b.toString('utf8')),sha256:sha256(b),observed_at_utc:new Date().toISOString(),url};
}
export async function main(){
 const [nba,espn]=await Promise.all([source(NBA_URL,5_000_000),source(ESPN_URL,4_000_000)]);
 const proof=compareShotEventSources(nba.json,espn.json);
 const receipt={...proof,sources:[nba,espn].map(x=>({url:x.url,sha256:x.sha256,observed_at_utc:x.observed_at_utc})),
  classification:'RETROSPECTIVE_TWO_PROVIDER_DIAGNOSTIC',
  calibrator_eligible:false,odds_api_credits:0};
 writeFileSync('atlas-nba-official-espn-event-differences.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NBA_TWO_SOURCE_SHOT_TIMES '+JSON.stringify({
  ...Object.fromEntries(proof.comparisons.map(x=>[x.name,{espn:x.espn_shots,nba:x.nba_shots,
    unmatched_espn:x.unmatched_espn,unmatched_nba:x.unmatched_nba}])),
  official_counts_reconciled:proof.all_official_counts_reconciled,
  exact_alignment_confirmed:proof.exact_event_alignment_confirmed,
  hashes:receipt.sources.map(x=>x.sha256)
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_TWO_SOURCE_BLOCKED '+e.message);process.exitCode=1});
