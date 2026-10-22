import {test} from 'node:test';import assert from 'node:assert/strict';
import {deriveQ3Opportunity} from './nba-q3-opportunity-shadow.mjs';
const cfg={code:'synthetic',home:'AAA',away:'BBB',gameId:'0022600009'};
function fixture(){
 const teams=['AAA','BBB'];
 const players=teams.map((team,ix)=>({teamTricode:team,players:[1,2,3].map((v)=>({
   personId:100*ix+v,statistics:{fieldGoalsAttempted:3}}))}));
 const actions=Array.from({length:110},(_,i)=>({actionNumber:i+1,period:1,isFieldGoal:0}));
 let n=0;
 for(let ix=0;ix<2;ix++)for(let p=1;p<=3;p++){
  const id=100*ix+p;for(const period of [1,2,4]){
   actions[n++]={actionNumber:n,period,isFieldGoal:1,personId:id,teamTricode:teams[ix]};
  }
 }
 return {pbp:{game:{gameId:cfg.gameId,actions}},box:{game:{gameId:cfg.gameId,homeTeam:players[0],awayTeam:players[1]}}};
}
test('selects two per team deterministically with q4 excluded from rankings',()=>{
 const f=fixture(),r=deriveQ3Opportunity(f.pbp,f.box,cfg);
 assert.deepEqual(r.selected_players.map(x=>x.player_id),['1','2','101','102']);
 assert.equal(r.all_pre_q4_fga,12);assert.equal(r.all_q4_fga,6);
 assert.equal(r.observed_q4_selected_fga,4);
 assert.equal(r.actual_real_time_freeze,false);
});
test('changing Q4 outcomes cannot change Q1-Q3 player selection or features',()=>{
 const f=fixture(),before=deriveQ3Opportunity(f.pbp,f.box,cfg);
 f.pbp.game.actions[2].period=5; // overtime counts do not join Q4
 f.pbp.game.actions[2].period=1;
 const first=f.pbp.game.actions.find(x=>x.period===4&&x.personId===101);
 first.personId=103;first.teamTricode='BBB';
 const changed=deriveQ3Opportunity(f.pbp,f.box,cfg);
 assert.deepEqual(changed.selected_players.map(x=>[x.player_id,x.pre_q4_fga]),
  before.selected_players.map(x=>[x.player_id,x.pre_q4_fga]));
});
test('unknown FGA shooter cannot poison Q4 feature calculation',()=>{
 const f=fixture();f.pbp.game.actions[0].personId=99999;
 assert.throws(()=>deriveQ3Opportunity(f.pbp,f.box,cfg),/GAME_FGA_INTEGRITY_NOT_VERIFIED/);
});
test('Q5 events are deliberately excluded from Q4 target',()=>{
 const f=fixture(),id=1;
 const p=f.box.game.homeTeam.players[0];p.statistics.fieldGoalsAttempted=4;
 f.pbp.game.actions[90]={actionNumber:91,period:5,personId:id,teamTricode:'AAA',isFieldGoal:1};
 const r=deriveQ3Opportunity(f.pbp,f.box,cfg);assert.equal(r.overtime_fga_excluded,1);
 assert.equal(r.observed_q4_selected_fga,4);
});
