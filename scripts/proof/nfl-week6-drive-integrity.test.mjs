import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditDriveEvents} from './nfl-week6-drive-integrity.mjs';
function fixture(){return {drives:{previous:[
 {id:'a',plays:[{id:'1',period:{number:1},clock:{displayValue:'15:00'},team:{id:'30'},type:{text:'Kickoff'}},{id:'2',period:{number:1},clock:{displayValue:'14:50'},team:{id:'34'},type:{text:'Rush'}}]},
 {id:'b',plays:[{id:'3',period:{number:2},clock:{displayValue:'15:00'},team:{id:'30'},type:{text:'Pass'}}]}
 ]}}}
test('identities and quarter chronology valid without declaring independent snap completeness',()=>{const x=auditDriveEvents(fixture());assert.equal(x.unique_play_ids,3);assert.equal(x.duplicate_ids,0);assert.equal(x.internal_identity_gate,true);assert.equal(x.complete_play_coverage_verified,false);});
test('duplicate plays and reversed quarters fail internal integrity',()=>{const f=fixture();f.drives.previous[1].plays[0].id='2';let x=auditDriveEvents(f);assert.equal(x.duplicate_ids,1);assert.equal(x.internal_identity_gate,false);f.drives.previous[1].plays[0].id='3';f.drives.previous[1].plays[0].period.number=0;assert.equal(auditDriveEvents(f).missing_periods,1);});
test('clock regression tracked as quality boundary',()=>{const f=fixture();f.drives.previous[0].plays[1].clock.displayValue='15:30';const x=auditDriveEvents(f);assert.equal(x.clock_order_violations,1);assert.equal(x.complete_play_coverage_verified,false);});
