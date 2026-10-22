import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditPlayerFga} from './nba-v3-player-fga-difference.mjs';
function mock(){
 const labels=['MIN','FG','PTS'];
 const mk=(team,id)=>({team:{id:String(team)},statistics:[{labels,athletes:[{athlete:{id:String(id)},stats:['10:00','1-2','3']}]}]});
 const plays=Array.from({length:100},(_,i)=>i<4?({id:String(i),team:{id:String(i<2?1:2)},type:{text:'Jump Shot'},scoringPlay:i%2===0,participants:[{athlete:{id:String(i<2?101:201)}}],period:{number:1}}):({id:String(i),type:{text:'Timeout'},period:{number:1}}));
 return {plays,boxscore:{teams:[{team:{id:'1'},statistics:[{name:'fieldGoalsMade-fieldGoalsAttempted',displayValue:'1-2'}]},{team:{id:'2'},statistics:[{name:'fieldGoalsMade-fieldGoalsAttempted',displayValue:'1-2'}]}],players:[mk(1,101),mk(2,201)]}};
}
test('player FGA agrees when shot identities and official FG columns match',()=>{const r=auditPlayerFga(mock());assert.equal(r.player_differences.length,0);assert.equal(r.individually_reconciled,true);assert.equal(r.q4_model_feature_admissible,false);});
test('per-player mismatches never become model feature proof',()=>{const x=mock();x.boxscore.players[0].statistics[0].athletes[0].stats[1]='1-3';const r=auditPlayerFga(x);assert.equal(r.player_differences.length,1);assert.equal(r.individually_reconciled,false);assert.equal(r.q4_model_feature_admissible,false);});
