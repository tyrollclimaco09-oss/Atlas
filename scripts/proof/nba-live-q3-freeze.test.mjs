import {test} from 'node:test';import assert from 'node:assert/strict';
import {TARGET,resolveGame,q3Boundary,snapshotLive,seconds} from './nba-live-q3-freeze.mjs';
const sched={leagueSchedule:{gameDates:[{games:[{gameCode:TARGET.code,gameId:TARGET.gameId,
 awayTeam:{teamTricode:'DEN'},homeTeam:{teamTricode:'OKC'}}]}]}};
function board(period=3,gameClock='PT00M00.00S',status=2){
 return {scoreboard:{games:[{gameId:TARGET.gameId,period,gameClock,gameStatus:status,
 homeTeam:{teamTricode:'OKC'},awayTeam:{teamTricode:'DEN'}}]}};
}
function pbp(){
 const actions=Array.from({length:120},(_,i)=>({actionNumber:i+1,period:i<40?1:i<80?2:3,isFieldGoal:0}));
 for(const [i,player,team] of [[0,1,'DEN'],[1,2,'DEN'],[2,3,'OKC'],[3,4,'OKC'],
 [40,1,'DEN'],[41,2,'DEN'],[42,3,'OKC'],[43,4,'OKC']])
  actions[i]={actionNumber:i+1,period:i<40?1:2,isFieldGoal:1,personId:player,teamTricode:team};
 return {game:{gameId:TARGET.gameId,actions}};
}
test('schedule game identity is exact and DEN at OKC, not guessed from current scores',()=>{
 assert.equal(resolveGame(sched).gameId,'0022600007');
 const mutant=structuredClone(sched);mutant.leagueSchedule.gameDates[0].games[0].homeTeam.teamTricode='DEN';
 assert.throws(()=>resolveGame(mutant),/IDENTITY_CONFLICT/);
});
test('no pregame or running-clock snapshot is called a Q3 freeze',()=>{
 assert.throws(()=>q3Boundary(board(0,'PT12M00.00S',1),TARGET),/NOT_LIVE_Q3/);
 assert.throws(()=>q3Boundary(board(3,'PT00M15.00S',2),TARGET),/CLOCK_NOT_AT_ZERO/);
 assert.equal(seconds('PT00M00.00S'),0);
 assert.equal(seconds('PT00M12.50S'),12.5);
});
test('two scoreboard checks must remain at Q3 zero; Q4 is a hard failure',()=>{
 const before=board(),play=pbp();
 assert.equal(snapshotLive(TARGET,before,play,board()).snapshot_state,
  'LIVE_Q3_ZERO_SECOND_SOURCE_DOUBLE_CHECK');
 assert.throws(()=>snapshotLive(TARGET,before,play,board(4,'PT11M59.00S',2)),/NOT_LIVE_Q3/);
});
test('future Q4 events cannot enter a pre-Q4 live snapshot',()=>{
 const x=pbp();x.game.actions.push({actionNumber:121,period:4,isFieldGoal:1,personId:1,teamTricode:'DEN'});
 assert.throws(()=>snapshotLive(TARGET,board(),x,board()),/FUTURE_OR_INVALID_PERIOD/);
});
test('an unverifiable Q3 shooter fails before an official forecast is issued',()=>{
 const x=pbp();x.game.actions[0].teamTricode='XXX';
 assert.throws(()=>snapshotLive(TARGET,board(),x,board()),/UNKNOWN_SOURCE_SHOT_TEAM/);
});
