import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isFieldGoalType,assessCoverage} from './nba-v3-shot-coverage.mjs';
test('shot classification includes dunks/layups but not FTs/fouls',()=>{
 for(const t of ['Jump Shot','Running Alley Oop Dunk Shot','Layup Driving Reverse','Tip Shot','Heave Jump Shot'])assert.equal(isFieldGoalType(t),true,t);
 for(const t of ['Free Throw - 1 of 2','Shooting Foul','Full Timeout','Substitution','Turnover'])assert.equal(isFieldGoalType(t),false,t);
});
function mock(){
 const plays=Array.from({length:102},(_,i)=>({id:String(i),type:{text:i<2?'Jump Shot':'Full Timeout'},team:{id:String(i%2+1)},scoringPlay:i<2,participants:[{athlete:{id:'100'}}],period:{number:1}}));
 return {plays,boxscore:{teams:[{team:{id:'1'},statistics:[{name:'fieldGoalsMade-fieldGoalsAttempted',displayValue:'1-1'}]},{team:{id:'2'},statistics:[{name:'fieldGoalsMade-fieldGoalsAttempted',displayValue:'1-1'}]}]}};
}
test('team-level totals reconciled only when both box scores match',()=>{
 const x=mock(),v=assessCoverage(x);assert.equal(v.fga_reconciliation_verified,true);assert.equal(v.makes_reconciliation_verified,true);
 x.boxscore.teams[0].statistics[0].displayValue='1-2';assert.equal(assessCoverage(x).fga_reconciliation_verified,false);
});
