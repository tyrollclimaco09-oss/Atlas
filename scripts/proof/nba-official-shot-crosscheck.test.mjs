import {test} from 'node:test';import assert from 'node:assert/strict';
import {pickGame,auditIndependentNBA} from './nba-official-shot-crosscheck.mjs';
const gameId='0022600009';
test('schedule identity must have exact game code, sides, and one game ID',()=>{
 const fixture={leagueSchedule:{gameDates:[{games:[{gameCode:'20261021/ATLORL',gameId,homeTeam:{teamTricode:'ORL'},awayTeam:{teamTricode:'ATL'}}]}]}};
 assert.equal(pickGame(fixture),gameId);fixture.leagueSchedule.gameDates[0].games.push(fixture.leagueSchedule.gameDates[0].games[0]);
 assert.throws(()=>pickGame(fixture),/NOT_UNIQUE/);
});
test('independent shooter ID and FGA match, but no automatic ESPN ID linkage',()=>{
 const p=(id,n1,n2,attempts)=>({personId:id,firstName:n1,familyName:n2,statistics:{fieldGoalsAttempted:attempts}});
 const box={game:{gameId,homeTeam:{teamTricode:'ORL',players:[p(22,'Jalen','Suggs',1)]},awayTeam:{teamTricode:'ATL',players:[p(23,'Dyson','Daniels',1)]}}};
 const actions=Array.from({length:160},(_,i)=>({actionNumber:i,personId:999,isFieldGoal:0}));
 actions[0]={personId:22,isFieldGoal:1,period:1,clock:'PT00M00.00S',actionNumber:1};
 actions[1]={personId:23,isFieldGoal:1,period:2,clock:'PT05M00.00S',actionNumber:2};
 const r=auditIndependentNBA({game:{gameId,actions}},box,gameId);
 assert.equal(r.independent_stat_consistency,true);
 assert.equal(r.espn_player_id_link_independently_verified,false);
 assert.equal(r.espn_fga_anomaly_resolved,false);
});
test('fail closed on wrong source game IDs',()=>{
 assert.throws(()=>auditIndependentNBA({game:{gameId:'different',actions:[]}},{game:{gameId}},gameId),/GAME_ID_CONFLICT/);
});
