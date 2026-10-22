import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const f=JSON.parse(readFileSync('docs/prospective/ATLAS_NBA_20261022_CLE_PHI_UNPRICED_FREEZE.json','utf8'));
test('original NBA artifact is byte-equivalent under original JSON.stringify hash contract',()=>{
 const h=createHash('sha256').update(JSON.stringify(f.packet)).digest('hex');
 assert.equal(h,f.packet_sha256);
 assert.equal(h,'6b8a4cc4d50a2b8d3306bc89801054d87e4acf39889e4221f6b938d15411f9c4');
});
test('point-in-time schedule observation and freeze precede tip',()=>{
 const p=f.packet,observe=Date.parse(p.source_observed_at_utc),freeze=Date.parse(p.frozen_at_utc),start=Date.parse(p.event_starts_at_utc);
 assert.ok(observe<=freeze&&freeze+90*60*1000<start);
 assert.equal(p.event_key,'NBA:ESPN_UNOFFICIAL:401909093');
 assert.equal(p.source_normalized_state,'STATUS_SCHEDULED');
});
test('frozen NBA record is unpriced, unofficial and ineligible for calibration',()=>{
 const p=f.packet;
 assert.equal(p.source_provider,'ESPN_UNOFFICIAL');
 assert.equal(p.forecast.estimated_probability,0.5);
 assert.equal(p.forecast.model_validated,false);
 assert.equal(p.forecast.model_trained,false);
 for(const k of ['market_price','quote','team_or_player_prop_probability']) assert.equal(p[k],null);
 for(const k of ['calibrator_eligible','external_timing_verified','production_authority','execution_authority','bet_authorized']) assert.equal(p[k],false);
});