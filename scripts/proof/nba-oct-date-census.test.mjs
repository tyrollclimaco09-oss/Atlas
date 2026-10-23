import {test} from 'node:test';import assert from 'node:assert/strict';
import {getCensus,DATES} from './nba-oct-date-census.mjs';
function fixtures(){
 const good=['20261020/NYKBOS','20261021/ATLORL','20261021/GSWLAL',
  '20261021/CHABKN','20261021/NYKBOS','20261021/SACPOR',
  '20261021/PHIMIA','20261021/HOUDAL','20261021/UTAIND',
  '20261021/SASDEN','20261021/MILCHI','20261021/PHXTOR'];
 const games=good.map((c,i)=>({gameCode:c,gameId:'00226000'+String(i).padStart(2,'0'),
 homeTeam:{teamTricode:'AAA'},awayTeam:{teamTricode:'BBB'}}));
 games.push({gameCode:'20261022/ABCDEF',gameId:'0022600020',homeTeam:{teamTricode:'AAA'},awayTeam:{teamTricode:'BBB'}});
 return {leagueSchedule:{gameDates:[{games}]}};
}
test('fixed date-based cohort retains all 12 and excludes other dates',()=>{
 assert.deepEqual(DATES,['20261020','20261021']);
 const result=getCensus(fixtures());
 assert.equal(result.length,12);assert.equal(result.some(x=>x.code.startsWith('20261022')),false);
});
test('result labels and favorites never define the census',()=>{
 const x=fixtures();const before=getCensus(x).map(g=>g.gameId);
 for(const g of x.leagueSchedule.gameDates[0].games){g.winner='AAA';g.favorite=true;g.points=199}
 assert.deepEqual(getCensus(x).map(g=>g.gameId),before);
});
test('duplicate games fail loudly instead of inflating the sample',()=>{
 const x=fixtures();x.leagueSchedule.gameDates[0].games.push(x.leagueSchedule.gameDates[0].games[1]);
 assert.throws(()=>getCensus(x),/DUPLICATED_GAMES/);
});
