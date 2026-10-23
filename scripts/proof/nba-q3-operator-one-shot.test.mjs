import {test} from 'node:test';import assert from 'node:assert/strict';
import {validate} from './nba-q3-operator-one-shot.mjs';
const c={schema:'atlas.nba.operator_q3_control.v1',event_id:'0022600007',
 event_code:'20261022/DENOKC',mode:'preflight',
 intent:'VALIDATE_SINGLE_INVOCATION_PATH_WITHOUT_FREEZE',
 never_poll:true,production_authority:false,odds_calls:0};
test('preflight never claims actual live Q3 forecast',()=>{
 assert.equal(validate(c),'preflight');
});
test('capture requires distinct explicitly named intent',()=>{
 const x={...c,mode:'capture'};
 assert.throws(()=>validate(x),/INVALID_CAPTURE_INTENT/);
 assert.equal(validate({...x,intent:'CAPTURE_ONLY_IF_STRICT_LIVE_Q3_CLOCK_ZERO'}),'capture');
});
test('mode, identity, and ability to poll or wager are fixed',()=>{
 for(const change of [{mode:'auto'},{event_id:'bad'},{never_poll:false},
  {production_authority:true},{odds_calls:1}]){
  assert.throws(()=>validate({...c,...change}));
 }
});
