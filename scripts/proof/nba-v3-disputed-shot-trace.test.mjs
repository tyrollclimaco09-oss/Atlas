import {test} from 'node:test';import assert from 'node:assert/strict';
import {traceDisputedShooters} from './nba-v3-disputed-shot-trace.mjs';
function synthetic(){
 const plays=Array.from({length:104},(_,i)=>({
  id:String(i+1),type:{text:i<103?'Jump Shot':'Coach Challenge (Overturned)'},
  period:{number:Math.floor(i/26)+1},clock:{displayValue:'12:00'},
  participants:[{athlete:{id:i%2?'4869342':'4432165'}}],
  team:{id:i%2?'1':'19'},scoringPlay:false,text:'example event'
 }));
 return {plays};
}
test('trace records only candidate shots and leaves causal reason unknown',()=>{
 const r=traceDisputedShooters(synthetic());
 assert.equal(r.candidate_shots,103);assert.equal(r.selected_players['4869342'].events.length,51);
 assert.equal(r.selected_players['4432165'].events.length,52);
 assert.equal(r.reviewed_event_count,1);assert.equal(r.per_player_fga_reconciled,false);
 assert.equal(r.suspected_cause,'NOT_DETERMINED');
});
test('nonshot challenge is not added to shot count',()=>{
 const f=synthetic(),r=traceDisputedShooters(f);
 assert.equal(r.candidate_shots,103);assert.equal(r.review_events[0].type,'Coach Challenge (Overturned)');
 assert.equal(r.execution_authority,false);
});
