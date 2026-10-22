import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const f=JSON.parse(readFileSync('docs/prospective/ATLAS_NHL_20261022_2026020154_UNPRICED_FREEZE.json','utf8'));
test('archived original packet hash matches the signed-off GitHub artifact reference',()=>{
 const actual=createHash('sha256').update(JSON.stringify(f.packet)).digest('hex');
 assert.equal(actual,f.packet_sha256);
 assert.equal(actual,'d5b66d9a42314f2ab6f5ed83f8ccf5e6fa0d2fe78d4504bd32d0ffc179380e62');
});
test('real source observation and freeze were both strictly before kickoff',()=>{
 const p=f.packet,o=Date.parse(p.source_observed_at_utc),t=Date.parse(p.frozen_at_utc),start=Date.parse(p.event_starts_at_utc);
 assert.ok(o<=t && t+90*60*1000<start);
 assert.equal(p.event_key,'NHL:NHL_WEB_API:2026020154');
 assert.equal(p.source_normalized_state,'FUT');
 assert.equal(p.source_published_at_utc,null);
});
test('archive grants zero authority and no model validity',()=>{
 const p=f.packet;
 assert.equal(p.forecast.estimated_probability,.5);
 for(const key of ['market_price','sportsbook_offer'])assert.equal(p[key],null);
 for(const key of ['production_authority','execution_authority','calibrator_eligible','bet_authorized','profitability_claim','external_timing_verified'])assert.equal(p[key],false);
 assert.equal(p.forecast.model_validated,false);
 assert.equal(p.forecast.model_trained,false);
});