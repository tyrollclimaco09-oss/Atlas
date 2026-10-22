import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freezeNBA} from './prospective-nba-reference.mjs';
const observed='2026-10-22T18:00:00.000Z';
const now='2026-10-22T18:01:00.000Z';
const start='2026-10-22T23:00:00.000Z';
const digest='a'.repeat(64);
function fixture(){const source='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261022';return {
 event:{sport:'NBA',league:'NBA',event_key:'NBA:ESPN_UNOFFICIAL:401811001',source_event_id:'401811001',home:{id:'20',name:'Philadelphia'},away:{id:'5',name:'Cleveland'},start_at_utc:start,status_at_retrieval:'STATUS_SCHEDULED',observed_at:observed,source_url:source},
 meta:{source_url:source,observed_at_utc:observed,upstream_sha256:digest,normalizer_sha256:digest}};}
test('NBA real schedule contract produces only an unpriced 50/50 reference',()=>{const x=fixture(),r=freezeNBA(x.event,x.meta,now);assert.match(r.packet_sha256,/^[a-f0-9]{64}$/);assert.equal(r.packet.forecast.estimated_probability,.5);assert.equal(r.packet.forecast.model_validated,false);assert.equal(r.packet.market_price,null);assert.equal(r.packet.calibrator_eligible,false);});
test('rejects started, near-tip and time-travel observations',()=>{const x=fixture();x.event.start_at_utc='2026-10-22T18:10:00.000Z';assert.throws(()=>freezeNBA(x.event,x.meta,now),/NBA_FREEZE_NOT_BEFORE_TIP/);const z=fixture();z.event.observed_at='2026-10-22T19:00:00.000Z';z.meta.observed_at_utc=z.event.observed_at;assert.throws(()=>freezeNBA(z.event,z.meta,now),/NBA_FREEZE_NOT_BEFORE_TIP/);});
test('rejects wrong source, identities and already in-progress games',()=>{const x=fixture();x.meta.source_url='https://untrusted.example/sports';assert.throws(()=>freezeNBA(x.event,x.meta,now),/NBA_PROVENANCE_INVALID/);const y=fixture();y.event.home.id=y.event.away.id;assert.throws(()=>freezeNBA(y.event,y.meta,now),/NBA_FIXTURE_NOT_SCHEDULED/);const z=fixture();z.event.status_at_retrieval='STATUS_IN_PROGRESS';assert.throws(()=>freezeNBA(z.event,z.meta,now),/NBA_FIXTURE_NOT_SCHEDULED/);});
test('no player prop, bookmaker or autonomous wagering authority',()=>{const x=fixture(),p=freezeNBA(x.event,x.meta,now).packet;assert.equal(p.team_or_player_prop_probability,null);assert.equal(p.executable_price_verified,false);assert.equal(p.official_lineup_verified,false);assert.equal(p.bet_authorized,false);assert.equal(p.production_authority,false);});
