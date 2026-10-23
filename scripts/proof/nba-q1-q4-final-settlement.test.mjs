import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadFreeze,settle} from './nba-q1-q4-final-settlement.mjs';
function fixture(){
 const f=loadFreeze();
 const actions=Array.from({length:160},(_,i)=>({actionNumber:i+1,period:i<80?1:i<120?2:i<140?3:4,isFieldGoal:0}));
 let k=0;const totals=new Map();
 for(const p of f.selected_players){
  const q4=p.player_id==='203999'?2:p.player_id==='1627750'?1:p.player_id==='1631114'?0:3;
  totals.set(p.player_id,p.q1_fga+q4);
  for(let n=0;n<p.q1_fga;n++)actions[k++]={actionNumber:k,period:1,
   personId:Number(p.player_id),teamTricode:p.team,isFieldGoal:1};
  for(let n=0;n<q4;n++)actions[140+(k++%15)]={actionNumber:300+k,period:4,
   personId:Number(p.player_id),teamTricode:p.team,isFieldGoal:1};
 }
 // Replace any collisions with stable unique action IDs and retain all 29 simulated FGA.
 const shots=actions.filter(x=>x.isFieldGoal===1);
 const all=Array.from({length:120},(_,i)=>({actionNumber:1000+i,period:i<50?1:i<80?2:i<100?3:4,isFieldGoal:0}));
 for(const shot of shots)all.push({...shot,actionNumber:2000+all.length});
 all.push({actionNumber:9999,period:4,actionType:'period',subType:'end',
 clock:'PT00M00.00S',isFieldGoal:0});
 const makeTeam=team=>({teamTricode:team,players:f.selected_players.filter(p=>p.team===team)
  .map(p=>({personId:Number(p.player_id),statistics:{fieldGoalsAttempted:totals.get(p.player_id)}}))});
 const box={game:{gameId:f.game_id,gameStatus:3,
  homeTeam:makeTeam('OKC'),awayTeam:makeTeam('DEN')}};
 return {f,pbp:{game:{gameId:f.game_id,actions:all}},box};
}
test('original live forecast loads by exact pinned hash',()=>{
 const f=loadFreeze();assert.equal(f.q4_fga_point_reference,23);
});
test('separate final receipt scores selected player Q4 attempts only',()=>{
 const {f,pbp,box}=fixture();
 const x=settle(f,pbp,box);
 assert.equal(x.frozen_point_reference,23);
 assert.equal(x.actual_q4_selected_fga,6);
 assert.equal(x.absolute_error,17);
 assert.equal(x.original_live_freeze_unchanged,true);
});
test('unfinalized game cannot produce a settlement receipt',()=>{
 const {f,pbp,box}=fixture();box.game.gameStatus=2;
 assert.throws(()=>settle(f,pbp,box),/GAME_NOT_FINAL/);
});
test('official final Q1 revisions conflict with the frozen selected counts',()=>{
 const {f,pbp,box}=fixture();
 const changed=pbp.game.actions.find(a=>a.period===1&&String(a.personId)==='203999'&&a.isFieldGoal===1);
 changed.isFieldGoal=0;
 assert.throws(()=>settle(f,pbp,box),/OFFICIAL_PBP_BOX_FGA_INTEGRITY_FAILED|Q1_FROZEN_FEATURE_SOURCE_REVISION/);
});
test('missing final Q4 period end marker is not a final verified match',()=>{
 const {f,pbp,box}=fixture();pbp.game.actions.at(-1).subType='start';
 assert.throws(()=>settle(f,pbp,box),/Q4_OFFICIAL_END_MARKER/);
});
