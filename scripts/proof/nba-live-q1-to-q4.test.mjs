import {test} from 'node:test';import assert from 'node:assert/strict';
import {freezeQ1AgainstFutureQ4,earlyBoundary,gameFromSchedule} from './nba-live-q1-to-q4.mjs';
const target='0022600007';
const board=(period=2,status=2)=>({scoreboard:{games:[{gameId:target,period,gameStatus:status,
 gameClock:'PT04M02.00S',awayTeam:{teamTricode:'DEN'},homeTeam:{teamTricode:'OKC'}}]}});
function pbp(){
 const actions=Array.from({length:100},(_,i)=>({actionNumber:i+1,period:1,isFieldGoal:0}));
 for(let i=0;i<8;i++)actions[i]={actionNumber:i+1,period:1,isFieldGoal:1,
  personId:i%2+(i<4?100:200),teamTricode:i<4?'DEN':'OKC'};
 actions[99]={actionNumber:100,period:1,actionType:'period',subType:'end',
  clock:'PT00M00.00S',isFieldGoal:0};
 actions.push({actionNumber:101,period:2,isFieldGoal:0});
 return {game:{gameId:target,actions}};
}
test('only a live pre-Q4 clock is accepted',()=>{
 assert.equal(earlyBoundary(board()).period,2);
 assert.throws(()=>earlyBoundary(board(4)),/NOT_LIVE_BEFORE_Q4/);
 assert.throws(()=>earlyBoundary(board(2,3)),/NOT_LIVE_BEFORE_Q4/);
});
test('Q1 features invariant when any Q2 or Q3 event changes',()=>{
 const first=pbp(),a=freezeQ1AgainstFutureQ4(board(),first,board());
 first.game.actions.push({actionNumber:102,period:3,isFieldGoal:1,personId:900,
   teamTricode:'OKC'});
 const b=freezeQ1AgainstFutureQ4(board(),first,board());
 assert.equal(a.q1_total_selected_fga,b.q1_total_selected_fga);
 assert.equal(a.feature_sha256,b.feature_sha256);
 assert.equal(a.q4_fga_point_reference,b.q4_fga_point_reference);
 assert.equal(a.betting_authority,false);
});
test('Q1 period end marker cannot be missing or duplicated',()=>{
 const first=pbp();first.game.actions[99].subType='start';
 assert.throws(()=>freezeQ1AgainstFutureQ4(board(),first,board()),/Q1_END_MARKER/);
 const other=pbp();other.game.actions[98]={actionNumber:99,period:1,
  actionType:'period',subType:'end',clock:'PT00M00.00S'};
 assert.throws(()=>freezeQ1AgainstFutureQ4(board(),other,board()),/Q1_END_MARKER/);
});
test('future Q4 events and late second scoreboard both reject',()=>{
 const x=pbp();x.game.actions.push({actionNumber:102,period:4,isFieldGoal:1,
  teamTricode:'OKC',personId:200});
 assert.throws(()=>freezeQ1AgainstFutureQ4(board(),x,board()),/PBP_CONTAINS_Q4/);
 assert.throws(()=>freezeQ1AgainstFutureQ4(board(),pbp(),board(4)),/NOT_LIVE_BEFORE_Q4/);
});
test('schedule identity is exact and game must be uniquely identified',()=>{
 const s={leagueSchedule:{gameDates:[{games:[{gameCode:'20261022/DENOKC',
  gameId:target,homeTeam:{teamTricode:'OKC'},awayTeam:{teamTricode:'DEN'}}]}]}};
 assert.equal(gameFromSchedule(s).game_id,target);
 s.leagueSchedule.gameDates[0].games[0].gameId='wrong';
 assert.throws(()=>gameFromSchedule(s),/SOURCE_IDENTITY_CONFLICT/);
});
