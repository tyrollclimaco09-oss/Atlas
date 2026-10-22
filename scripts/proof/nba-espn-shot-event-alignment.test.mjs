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

test('opposite one-shot deltas remain separate and cannot be silently cancelled',()=>{
 const actions=Array.from({length:120},(_,i)=>({actionNumber:i+900,personId:0,isFieldGoal:0}));
 actions[0]={actionNumber:606,personId:1630700,isFieldGoal:1,period:3,clock:'PT00M00.10S',description:'Missed hook'};
 actions[1]={actionNumber:607,personId:1630591,isFieldGoal:1,period:2,clock:'PT02M30.00S'};
 const plays=Array.from({length:125},(_,i)=>({id:String(i),type:{text:'Timeout'}}));
 plays[0]={id:'401909834198',period:{number:1},clock:{displayValue:'0.0'},type:{text:'Heave Jump Shot'},participants:[{athlete:{id:'4432165'}}]};
 plays[1]={id:'401909834641',period:{number:2},clock:{displayValue:'2:30'},type:{text:'Jump Shot'},participants:[{athlete:{id:'4432165'}}]};
 const proof=compareShotEventSources({game:{gameId:'0022600085',actions}},{header:{id:'401909834'},plays});
 const daniels=proof.comparisons.find(x=>x.name==='Dyson Daniels');
 const suggs=proof.comparisons.find(x=>x.name==='Jalen Suggs');
 assert.equal(daniels.unmatched_nba[0].id,'606');
 assert.equal(suggs.unmatched_espn[0].id,'401909834198');
 assert.equal(proof.exact_event_alignment_confirmed,false);
 assert.equal(proof.auto_correct_espn_source,false);
 assert.equal(proof.model_feature_admitted,false);
});
