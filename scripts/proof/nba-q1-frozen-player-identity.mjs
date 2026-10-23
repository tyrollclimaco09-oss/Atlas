import fs from 'node:fs';
import {createHash} from 'node:crypto';
const fPath='docs/prospective/ATLAS_NBA_DENOKC_Q1_Q4_SHADOW_FREEZE_20261022_V1.json';
const src='https://cdn.nba.com/static/json/liveData/boxscore/boxscore_0022600007.json';
const SHA=b=>createHash('sha256').update(b).digest('hex');
const MUST='17b0e41790953c386669316b13956681c2c64cac3d8da747541a0114bab4702c';
const check=(x,code)=>{if(!x)throw Error(code)};
export function compare(f,box){
 check(f?.game_id==='0022600007'&&f.selected_players?.length===4,'FREEZE_SOURCE_NOT_PINNED');
 check(box?.game?.gameId==='0022600007'&&box.game.homeTeam?.teamTricode==='OKC'&&
  box.game.awayTeam?.teamTricode==='DEN','NBA_ROSTER_SOURCE_GAME_CONFLICT');
 const rosters=[...box.game.homeTeam.players.map(x=>({...x,team:'OKC'})),
  ...box.game.awayTeam.players.map(x=>({...x,team:'DEN'}))];
 const found=[];
 for(const p of f.selected_players){
  const matches=rosters.filter(x=>String(x.personId)===p.player_id);
  check(matches.length===1,'PLAYER_NOT_UNIQUE_ON_BOTH_LIVE_ROSTERS:'+p.player_id);
  const q=matches[0];
  check(q.team===p.team,'FROZEN_PLAYER_TEAM_CONFLICT:'+p.player_id);
  const observed=q.statistics?.fieldGoalsAttempted;
  check(Number.isInteger(observed)&&observed>=p.q1_fga,
   'LIVE_ROSTER_BOX_FGA_BELOW_FROZEN_Q1:'+p.player_id);
  found.push({nba_id:p.player_id,team:p.team,
   name:[q.firstName,q.familyName].filter(Boolean).join(' '),
   frozen_q1_fga:p.q1_fga,box_fga_at_observation:observed});
 }
 return {schema:'atlas.nba.frozen_q1_selection.live_box_identity.shadow.v1',
  players:found,source_rostered_players:rosters.length,
  matched_four_player_identities:found.length===4,
  exact_name_and_team_in_same_nba_provider:true,
  independent_cross_provider_identity_verified:false,
  q4_actual_outcome_verified:false,
  original_prediction_unchanged:true,
  license_cleared:false,model_validated:false,production_authority:false};
}
async function main(){
 const rawFreeze=fs.readFileSync(fPath);
 check(SHA(rawFreeze)===MUST,'FROZEN_BYTES_CHANGED');
 const response=await fetch(src,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{
  Accept:'application/json',Referer:'https://www.nba.com/','User-Agent':'ATLAS-FROZEN-PLAYER-IDENTITY/1'}});
 check(response.status===200&&response.url===src,'LIVE_BOX_HTTP_'+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 check(bytes.length>0&&bytes.length<3_000_000,'LIVE_BOX_SIZE_BOUND');
 const result=compare(JSON.parse(rawFreeze),JSON.parse(bytes.toString('utf8')));
 const report={...result,observed_at_utc:new Date().toISOString(),
  frozen_packet_sha256:MUST,live_box_sha256:SHA(bytes),
  github_run_id:process.env.GITHUB_RUN_ID||null,betting_authority:false,odds_calls:0};
 fs.writeFileSync('atlas-nba-q1-frozen-player-identity.json',JSON.stringify(report,null,2)+'\n');
 console.log('ATLAS_NBA_PLAYER_IDENTITY_CHECK '+JSON.stringify(report));
}
main().catch(e=>{console.error('ATLAS_NBA_PLAYER_IDENTITY_BLOCKED '+e.message);process.exitCode=1});
