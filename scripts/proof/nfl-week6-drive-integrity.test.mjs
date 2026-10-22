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

test('all drive plays without team IDs are ineligible for event-to-team feature training',()=>{
 const x=fixture();
 for(const d of x.drives.previous)for(const p of d.plays)delete p.team;
 const result=auditDriveEvents(x);
 assert.equal(result.internal_identity_gate,true);
 assert.equal(result.missing_team_attribution,3);
 assert.equal(result.event_team_attribution_ready,false);
 assert.equal(result.usable_player_volume_from_drive_plays,false);
});

test('only ordinary unpenalized matching-team plays become source-consistent candidates',()=>{
 const f=fixture(),plays=f.drives.previous.flatMap(d=>d.plays);
 f.drives.previous[0].team={id:'30'};
 f.drives.previous[1].team={id:'30'};
 plays[0].type.text='Pass Reception';plays[0].start={team:{id:'30'}};
 plays[1].type.text='Kickoff';plays[1].start={team:{id:'34'}};
 plays[2].type.text='Rush';plays[2].start={team:{id:'30'}};
 const r=auditDriveEvents(f);
 assert.equal(r.offensive_team_candidates_source_consistent,2);
 assert.equal(r.candidate_rejections.TYPE_OUTSIDE_ALLOWLIST,1);
 assert.equal(r.candidate_authority,'SOURCE_CONSISTENT_NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(r.event_team_attribution_ready,true);
 assert.equal(r.usable_player_volume_from_drive_plays,false);
});
test('turnovers, penalties and mismatched source team IDs never qualify',()=>{
 const f=fixture(),plays=f.drives.previous.flatMap(d=>d.plays);
 f.drives.previous[0].team={id:'30'};f.drives.previous[1].team={id:'30'};
 for(const p of plays){p.type.text='Rush';p.start={team:{id:'30'}}}
 plays[0].isPenalty=true;plays[1].isTurnover=true;plays[2].start.team.id='34';
 const r=auditDriveEvents(f);
 assert.equal(r.offensive_team_candidates_source_consistent,0);
 assert.equal(r.candidate_rejections.PENALTY_OR_TURNOVER,2);
 assert.equal(r.candidate_rejections.TEAM_IDENTITY_NOT_CONSISTENT,1);
 assert.equal(r.complete_play_coverage_verified,false);
});
