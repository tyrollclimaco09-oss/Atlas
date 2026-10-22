import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveCohort,auditGame,COHORT} from './nba-three-game-fga-cohort.mjs';
test('fixed list accepts three identities only and rejects duplicate schedule IDs',()=>{
 const games=COHORT.map((x,i)=>({gameCode:x.code,gameId:'002260000'+i,
  homeTeam:{teamTricode:x.home},awayTeam:{teamTricode:x.away}}));
 const src={leagueSchedule:{gameDates:[{games}]}};
 assert.equal(resolveCohort(src).length,3);
 src.leagueSchedule.gameDates[0].games.push(games[0]);
 assert.throws(()=>resolveCohort(src),/NOT_UNIQUE/);
});
function game(){
 const cfg={...COHORT[0],gameId:'0022600009'};
 const home={teamTricode:'ORL',players:[{personId:1,statistics:{fieldGoalsAttempted:1}}]};
 const away={teamTricode:'ATL',players:[{personId:2,statistics:{fieldGoalsAttempted:1}}]};
 const actions=Array.from({length:130},(_,i)=>({actionNumber:i+1,isFieldGoal:0}));
 actions[0]={actionNumber:1,personId:1,isFieldGoal:1,teamTricode:'ORL'};
 actions[1]={actionNumber:2,personId:2,isFieldGoal:1,teamTricode:'ATL'};
 return {cfg,box:{game:{gameId:cfg.gameId,homeTeam:home,awayTeam:away}},
  pbp:{game:{gameId:cfg.gameId,actions}}};
}
test('player and team reconciliation accepts complete, non-duplicate synthetic actions',()=>{
 const x=game(),r=auditGame(x.pbp,x.box,x.cfg);
 assert.equal(r.eligible_source_integrity_for_this_game,true);
 assert.equal(r.model_proven,false);
});
test('a single wrong shooter or team remains untrusted despite matching game totals',()=>{
 const x=game();x.pbp.game.actions[1].personId=1;
 let r=auditGame(x.pbp,x.box,x.cfg);assert.equal(r.eligible_source_integrity_for_this_game,false);
 assert.equal(r.players_with_fga_discrepancy,2);
 x.pbp.game.actions[1].personId=2;x.pbp.game.actions[1].teamTricode='XXX';
 r=auditGame(x.pbp,x.box,x.cfg);assert.equal(r.eligible_source_integrity_for_this_game,false);
});
test('duplicate action numbers are not silently accepted',()=>{
 const x=game();x.pbp.game.actions[3].actionNumber=1;
 assert.equal(auditGame(x.pbp,x.box,x.cfg).eligible_source_integrity_for_this_game,false);
});
