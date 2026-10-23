import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const PATH='docs/prospective/ATLAS_NBA_DENOKC_Q1_Q4_SHADOW_FREEZE_20261022_V1.json';
const ORIGINAL_ARTIFACT_SHA256='17b0e41790953c386669316b13956681c2c64cac3d8da747541a0114bab4702c';
const bytes=readFileSync(PATH),p=JSON.parse(bytes);
test('pinned frozen JSON matches original GitHub CI artifact byte-for-byte digest',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),ORIGINAL_ARTIFACT_SHA256);
 assert.equal(p.github_run_id,'39891028392');
 assert.equal(p.github_source_sha,'a4963e1f9a3f0501694cfd347c21d4f437087256');
});
test('NBA Q1-only four-player point forecast is immutable and arithmetic agrees',()=>{
 assert.equal(p.schema,'atlas.nba.live_q1_to_q4.priceblind.untrained.v1');
 assert.deepEqual(p.selected_players.map(x=>[x.player_id,x.team,x.q1_fga]),[
  ['203999','DEN',8],['1627750','DEN',6],['1631114','OKC',5],['1628392','OKC',4]]);
 assert.equal(p.q1_total_selected_fga,23);
 assert.equal(p.q4_fga_point_reference,23);
 assert.equal(p.intended_target,'SUM_Q4_FGA_OF_SAME_FOUR_Q1_SELECTED_PLAYERS_EXCLUDE_OVERTIME');
 assert.equal(p.feature_sha256,'bca69729f4a004e8f1f8c98c0432e85fd65cd29d2933f8b7412c6e01bbb9a4c6');
});
test('freeze timing is real pre-Q4 and source observations chronologically ordered',()=>{
 const t=s=>new Date(s).getTime();
 assert(t(p.observation_started_at_utc)<=t(p.source_read_time.schedule));
 assert(t(p.source_read_time.schedule)<=t(p.source_read_time.before));
 assert(t(p.source_read_time.before)<=t(p.source_read_time.pbp));
 assert(t(p.source_read_time.pbp)<=t(p.source_read_time.after));
 assert(t(p.source_read_time.after)<=t(p.created_at_utc));
 assert.deepEqual([p.input_observed_during.before.period,p.input_observed_during.after.period],[2,2]);
 assert.equal(p.no_q4_events_seen,true);
 assert.equal(p.source_q1_period_end_confirmed,true);
});
test('research prediction is not a production or betting authority claim',()=>{
 for(const x of ['model_validated','production_authority','calibrator_eligible',
 'betting_authority','strict_q3_complete_forecast','official_settlement_done',
 'q4_outcomes_recorded_in_packet']) assert.equal(p[x],false,x);
 assert.equal(p.odds_calls,0);
});
