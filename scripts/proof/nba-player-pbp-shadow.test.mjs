import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeNbaGame} from './nba-player-pbp-shadow.mjs';
function fixture(){
 const labels=['MIN','FG','3PT','FT','OREB','DREB','REB','AST','STL','BLK','TO','PF','+/-','PTS'];
 const teams=[{id:'1',homeAway:'home'},{id:'2',homeAway:'away'}];
 const group=(tid)=>({team:{id:tid},statistics:[{labels,athletes:Array.from({length:8},(_,i)=>({
  athlete:{id:String((Number(tid)*100)+i+1),displayName:'Synthetic Player '+i},
  stats:['21:30','4-7','2-4','3-4','1','4','5','3','1','0','1','2','4','13'] }))}]});
 return {event:{id:'401800000',status:{type:{completed:true}},competitions:[{competitors:teams.map(t=>({homeAway:t.homeAway,team:{id:t.id}}))}]},
 summary:{header:{id:'401800000'},boxscore:{players:[group('1'),group('2')]},
 plays:[{id:'10',period:{number:1}},{id:'11',period:{number:2}}]}};
}
test('NBA postgame parser reads actual labels without fabricating missing data',()=>{
 const {event,summary}=fixture(),r=normalizeNbaGame(summary,event);
 assert.equal(r.player_rows,16);assert.equal(r.minutes_populated,16);
 assert.equal(r.three_attempts_populated,16);assert.equal(r.sample_players[0].minutes,21.5);
 assert.equal(r.sample_players[0].three_point_made,2);assert.equal(r.pbp_distinct_plays,2);
 assert.equal(r.execution_authority,false);
});
test('NBA identity mismatch and unfinalized games rejected',()=>{
 let {event,summary}=fixture();event.status.type.completed=false;assert.throws(()=>normalizeNbaGame(summary,event),/NOT_FINAL/);
 ({event,summary}=fixture());summary.header.id='not-our-game';assert.throws(()=>normalizeNbaGame(summary,event),/IDENTITY_MISMATCH/);
});
test('missing PBP stays missing; no made-up zero or prop edge',()=>{
 let {event,summary}=fixture();delete summary.plays;
 const r=normalizeNbaGame(summary,event);assert.equal(r.pbp_present,false);
 assert.equal(r.zero_imputation,false);assert.equal(r.live_betting_ev,null);assert.equal(r.calibrator_eligible,false);
});
