import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseClock,compareShotEventSources} from './nba-espn-shot-event-alignment.mjs';
test('clock formats preserve seconds, never infer null as zero',()=>{
 assert.equal(parseClock('PT00M00.00S'),0);
 assert.equal(parseClock('8:29'),509);
 assert.equal(parseClock('0.0'),0);
 assert.equal(parseClock('bad'),null);
});
test('two-source mismatches stay observed rather than patched',()=>{
 const actions=Array.from({length:140},(_,i)=>({actionNumber:i,personId:0,isFieldGoal:0}));
 actions[0]={actionNumber:1,personId:1630700,isFieldGoal:1,period:1,clock:'PT01M02.00S'};
 actions[1]={actionNumber:2,personId:1630591,isFieldGoal:1,period:1,clock:'PT00M00.00S'};
 const plays=Array.from({length:140},(_,i)=>({id:String(i),type:{text:'Timeout'}}));
 plays[0]={id:'101',type:{text:'Jump Shot'},participants:[{athlete:{id:'4869342'}}],period:{number:1},clock:{displayValue:'1:02'}};
 plays[1]={id:'102',type:{text:'Heave Jump Shot'},participants:[{athlete:{id:'4432165'}}],period:{number:1},clock:{displayValue:'0.0'}};
 const r=compareShotEventSources({game:{gameId:'0022600085',actions}},{header:{id:'401909834'},plays});
 assert.equal(r.comparisons[0].unmatched_espn.length,0);
 assert.equal(r.comparisons[1].unmatched_nba.length,0);
 assert.equal(r.model_feature_admitted,false);
});
