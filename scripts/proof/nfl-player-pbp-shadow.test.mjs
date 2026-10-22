import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeNflGame} from './nfl-player-pbp-shadow.mjs';
function synthetic(){
 const competitors=[{homeAway:'home',team:{id:'1'}},{homeAway:'away',team:{id:'2'}}];
 const athlete=(tid,i)=>({athlete:{id:String(tid*100+i),displayName:'Synthetic Player '+i}});
 const section=(name,labels,stats,tid)=>({name,labels,athletes:Array.from({length:9},(_,i)=>({...athlete(tid,i+1),stats}))});
 const player=(tid)=>({team:{id:String(tid)},statistics:[
   section('passing',['C/ATT','YDS','TD'],['21/35','255','2'],tid),
   section('rushing',['CAR','YDS','TD'],['11','44','0'],tid),
   section('receiving',['REC','YDS','TD'],['7','102','1'],tid)]});
 return {event:{id:'401812345',status:{type:{completed:true}},competitions:[{competitors}]},
   summary:{header:{id:'401812345'},boxscore:{players:[player(1),player(2)]},
     plays:[{id:'1',period:{number:1}},{id:'2',period:{number:2}},{id:'3',period:{number:4}}]}};
}
test('NFL passing attempts, rushes and receptions use separate stat groups',()=>{
 const {event,summary}=synthetic(),a=normalizeNflGame(summary,event);
 assert.equal(a.player_rows,18);assert.equal(a.passing_attempts_populated,18);
 assert.equal(a.rushing_attempts_populated,18);assert.equal(a.receptions_populated,18);
 assert.equal(a.targets_populated,0);assert.equal(a.sample_players[0].passing_attempts,35);
 assert.equal(a.sample_players[0].passing_completions,21);assert.equal(a.play_by_play_unique_ids,3);
});
test('NFL no hindsight forecast or unverified targets',()=>{
 const {event,summary}=synthetic();const r=normalizeNflGame(summary,event);
 assert.equal(r.calibrated_probability,null);assert.equal(r.complete_play_coverage_verified,false);
 assert.equal(r.sample_players[0].targets,null);assert.equal(r.execution_authority,false);
});
test('NFL event mismatch and non-final results rejected',()=>{
 let x=synthetic();x.summary.header.id='wrong';assert.throws(()=>normalizeNflGame(x.summary,x.event),/SUMMARY_GAME_IDENTITY/);
 x=synthetic();x.event.status.type.completed=false;assert.throws(()=>normalizeNflGame(x.summary,x.event),/NOT_FINAL/);
});
