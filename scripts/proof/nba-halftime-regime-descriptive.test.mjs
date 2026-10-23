import {test} from 'node:test';
import assert from 'node:assert/strict';
import {halftimeArithmetic,resolveCases} from './nba-halftime-regime-descriptive.mjs';

test('Cleveland halftime lead and Philadelphia second-half reversal distinguish margin swing from total scoring',()=>{
 const x=halftimeArithmetic({H1:69,H2:37},{H1:45,H2:69});
 assert.equal(x.halftime_leader,'AWAY');
 assert.equal(x.halftime_margin,24);
 assert.equal(x.remaining_trailer_net_points_to_win_regulation,25);
 assert.equal(x.realized_second_half_net_points_for_trailer,32);
 assert.equal(x.final_home_margin,8);
 assert.equal(x.halftime_total,114);
 assert.equal(x.second_half_total,106);
 assert.equal(x.halftime_leader_lost,true);
});
test('Denver leads by four at halftime but Oklahoma City wins by twelve',()=>{
 const x=halftimeArithmetic({H1:48,H2:36},{H1:44,H2:52});
 assert.equal(x.halftime_margin,4);
 assert.equal(x.realized_second_half_net_points_for_trailer,16);
 assert.equal(x.final_home_margin,12);
 assert.equal(x.halftime_leader_lost,true);
});
test('tied or malformed halftime values cannot be called a trailing-team comeback',()=>{
 const tied=halftimeArithmetic({H1:40,H2:42},{H1:40,H2:44});
 assert.equal(tied.halftime_leader,'TIED');
 assert.equal(tied.realized_second_half_net_points_for_trailer,null);
 assert.equal(tied.halftime_leader_lost,false);
 assert.throws(()=>halftimeArithmetic({H1:NaN,H2:40},{H1:40,H2:40}),/INVALID_HALVES/);
});
test('exact official schedule game codes and team directions required',()=>{
 const games=[{gameCode:'20261022/CLEPHI',gameId:'0022600006',awayTeam:{teamTricode:'CLE'},homeTeam:{teamTricode:'PHI'}},
 {gameCode:'20261022/DENOKC',gameId:'0022600007',awayTeam:{teamTricode:'DEN'},homeTeam:{teamTricode:'OKC'}}];
 const x=resolveCases({leagueSchedule:{gameDates:[{games}]}});
 assert.equal(x.length,2);
 assert.equal(x[1].gameId,'0022600007');
 assert.throws(()=>resolveCases({leagueSchedule:{gameDates:[{games:[games[0],games[0],games[1]]}]}}),/GAME_NOT_UNIQUE/);
 assert.throws(()=>resolveCases({leagueSchedule:{gameDates:[{games:[games[0]]}]}}),/GAME_NOT_UNIQUE/);
});
