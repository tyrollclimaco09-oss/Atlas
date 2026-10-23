import {test} from 'node:test';import assert from 'node:assert/strict';
import {preQ4Feature,q4Settlement,splitSource} from './nba-q3-feature-firewall.mjs';
const game={code:'synthetic',gameId:'0022600009',home:'AAA',away:'BBB'};
function action(id,period,player,team){return {actionNumber:id,period,personId:player,teamTricode:team,isFieldGoal:1}}
function fake(){
 const a=Array.from({length:120},(_,i)=>({
  actionNumber:i+1,period:i<40?1:i<80?2:3,isFieldGoal:0
 }));
 a[0]=action(1,1,11,'AAA');a[1]=action(2,1,12,'AAA');
 a[2]=action(3,1,21,'BBB');a[3]=action(4,1,22,'BBB');
 a[40]=action(41,2,11,'AAA');a[41]=action(42,2,21,'BBB');
 a[80]=action(81,3,12,'AAA');a[81]=action(82,3,22,'BBB');
 return a;
}
test('Q4 events injected into the feature interface are rejected',()=>{
 const s=fake();s.push(action(121,4,11,'AAA'));
 assert.throws(()=>preQ4Feature(game,s),/FUTURE_PERIOD/);
});
test('strict feature SHA is invariant to any changed future outcome',()=>{
 const pre=fake(),a=preQ4Feature(game,pre);
 const future1=[action(121,4,11,'AAA')],future2=[action(121,4,22,'BBB'),action(122,4,22,'BBB')];
 assert.equal(preQ4Feature(game,pre).feature_sha256,a.feature_sha256);
 assert.notDeepEqual(q4Settlement(a,future1),q4Settlement(a,future2));
 assert.equal(a.actual_q3_external_freeze_attested,false);
 assert.equal(a.selected_pre_q4_fga,8);
});
test('Q4 settlement rejects Q3 data and excludes overtime',()=>{
 const a=preQ4Feature(game,fake());
 assert.throws(()=>q4Settlement(a,[action(121,3,11,'AAA')]),/PRE_Q4_DATA/);
 const out=q4Settlement(a,[action(121,4,11,'AAA'),action(122,5,21,'BBB')]);
 assert.equal(out.selected_q4_fga,1);assert.equal(out.q5plus_fga_excluded,1);
});
test('quarter coverage and source shooter team mismatches fail closed',()=>{
 const x=fake();x[80].period=0;
 assert.throws(()=>preQ4Feature(game,x),/FUTURE_PERIOD/);
 const y=fake();y[41].teamTricode='AAA';
 assert.throws(()=>preQ4Feature(game,y),/SHOOTER_SWITCHED_TEAMS/);
});
test('only pre Q4 events enter source split before label',()=>{
 const x=fake();x.push(action(125,4,21,'BBB'));
 const s=splitSource(x);
 assert.equal(s.pre.length,120);assert.equal(s.after.length,1);
 assert.equal(preQ4Feature(game,s.pre).actual_q3_external_freeze_attested,false);
});
