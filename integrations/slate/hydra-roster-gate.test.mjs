import test from 'node:test';
import assert from 'node:assert/strict';
import {checkHydraRoster, CONTRACT} from './hydra-roster-gate.mjs';
const now = '2026-10-30T22:00:00Z';
// SYNTHETIC PRE-EVENT capture timestamps, not claims that real snapshots existed.
const fixture = () => ({contract:CONTRACT,league:'NBA',slate_date:'2026-10-30',freeze_at:now,
  events:[{id:'game-min-lac',home:'MIN',away:'LAC',tip_at:'2026-10-31T00:00:00Z'},
          {id:'game-cha-was',home:'WAS',away:'CHA',tip_at:'2026-10-30T23:00:00Z'}],
  roster_receipts:[{player_id:'nba-lamelo',player_name:'LaMelo Ball',team:'MIN',status:'ACTIVE',
    observed_at:'2026-10-30T21:00:00Z',effective_date:'2026-10-30',
    source_type:'OFFICIAL_NBA_ROSTER_OBSERVATION',source_url:'https://www.nba.com/team/1610612750/roster'}],
  legs:[{id:'paper-lamelo',player_id:'nba-lamelo',player_name:'LaMelo Ball',team:'MIN',event_id:'game-min-lac',market:'AST',comparison:'AT_LEAST',threshold:5}]});
const run = x => checkHydraRoster(x,{now});
test('transferred player passes when current team, event, and asserted receipt agree',()=>{
  const v=run(fixture());assert.equal(v.identity_state,'IDENTITY_READY');
  assert.equal(v.matched_count,1);assert.equal(v.execution_authority,false);assert.equal(v.approved_bet,null);
  assert.equal(v.receipt_truth,'OPERATOR_REPORTED_NEEDS_SOURCE_RECHECK');
});
test('stale old Charlotte team on a Minnesota game fails closed',()=>{
  const x=fixture();x.legs[0].team='CHA';
  assert.deepEqual(run(x).legs[0].reasons,['PLAYER_TEAM_NOT_IN_EVENT','ROSTER_PLAYER_TEAM_MISMATCH']);
});
test('stale Charlotte roster receipt is rejected against Minnesota leg',()=>{
  const x=fixture();x.roster_receipts[0].team='CHA';
  assert(run(x).legs[0].reasons.includes('ROSTER_PLAYER_TEAM_MISMATCH'));
});
test('unknown professional player is HOLD',()=>{
  const x=fixture();x.legs[0].player_id='nba-unknown';
  assert(run(x).legs[0].reasons.includes('MISSING_CURRENT_ROSTER_RECEIPT'));
});
test('do not silently attach a player to another game',()=>{
  const x=fixture();x.legs[0].event_id='game-cha-was';
  assert(run(x).legs[0].reasons.includes('PLAYER_TEAM_NOT_IN_EVENT'));
});
test('missing event holds rather than picking by name',()=>{
  const x=fixture();x.legs[0].event_id='unmatched-event';
  assert(run(x).legs[0].reasons.includes('EVENT_NOT_IN_FROZEN_SLATE'));
});
test('post-tip paper freeze and misdated event refused',()=>{
  const x=fixture();x.freeze_at='2026-10-31T00:20:00Z';
  assert.throws(()=>checkHydraRoster(x,{now:'2026-10-31T01:00:00Z'}),/EVENT_IDENTITY_INVALID/);
});
test('future-dated roster snapshot is not pregame knowledge',()=>{
  const x=fixture();x.roster_receipts[0].observed_at='2026-10-30T23:00:00Z';
  assert.throws(()=>run(x),/ROSTER_RECEIPT_INVALID_OR_STALE/);
});
test('roster receipts older than 48 hours are refused',()=>{
  const x=fixture();x.roster_receipts[0].observed_at='2026-10-27T21:00:00Z';
  assert.throws(()=>run(x),/ROSTER_RECEIPT_INVALID_OR_STALE/);
});
test('questionable player held until official status verified',()=>{
  const x=fixture();x.roster_receipts[0].status='QUESTIONABLE';
  assert(run(x).legs[0].reasons.includes('PLAYER_STATUS_UNRESOLVED'));
});
test('out player held',()=>{
  const x=fixture();x.roster_receipts[0].status='OUT';
  assert(run(x).legs[0].reasons.includes('PLAYER_REPORTED_OUT'));
});
test('duplicate/conflicting player receipt held',()=>{
  const x=fixture();x.roster_receipts.push({...x.roster_receipts[0],team:'CHA'});
  assert(run(x).legs[0].reasons.includes('CONFLICTING_PLAYER_ROSTER_RECEIPTS'));
});
test('duplicate leg rejected',()=>{
  const x=fixture();x.legs.push({...x.legs[0],id:'duplicate-id'});
  assert(run(x).legs[1].reasons.includes('DUPLICATE_EXACT_LEG'));
});
test('duplicate IDs rejected',()=>{
  const x=fixture();x.legs.push({...x.legs[0]});
  assert.throws(()=>run(x),/DUPLICATE_LEG_IDS/);
});
test('unsupported market is not accepted',()=>{
  const x=fixture();x.legs[0].market='DUNKS';
  assert(run(x).legs[0].reasons.includes('LEG_SHAPE_INVALID'));
});
test('incorrect official source URL cannot pass',()=>{
  const x=fixture();x.roster_receipts[0].source_url='https://nba.com.evil.example/roster';
  assert.throws(()=>run(x),/ROSTER_RECEIPT_INVALID_OR_STALE/);
});
test('no market prices or model confidence are fabricated',()=>{
  const v=run(fixture());assert.equal(v.verified_odds,null);assert.equal(v.expected_value,null);
});
