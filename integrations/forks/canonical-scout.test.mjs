import test from "node:test";
import assert from "node:assert/strict";
import {ingestCanonicalNBA,CONTRACT} from "./canonical-scout.mjs";

const commit="09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19";
const NOW="2026-06-14T05:00:00Z",OBS="2026-06-14T03:30:00Z";
const M="urn:machina:sports:event:xc71b07217c94d872888d454bf369a05c";
const reference=[{full_name:"San Antonio Spurs",id:1610612759},{full_name:"New York Knicks",id:1610612752}];
function fixture(){return {machina_sports_schema:{
 schema_version:"machina-sports-schema/1",profile:"machina-iptc-profile/1.2",
 rights:{data_class:"open-public",prototype_only:true,commercial_use:false},
 provenance:{provider:{namespace:"sports-skills/espn"},adapter:{name:"sports_skills.canonical.adapters.nba"},
  observed_at:OBS,rights:{prototype_only:true,commercial_use:false},source_refs:[{kind:"endpoint-class",value:"espn/summary"}]},
 provider_ids:[{entity_type:"event",machina_id:M,provider_namespace:"sports-skills/espn",
  resolution_method:"provider-native",provider_id:"401859967"}],
 event_view:{event_id:M,sport:"basketball",status:"closed",temporal_evidence:{kind:"start",precision:"minute",
   lower_inclusive:"2026-06-14T00:30:00Z",upper_exclusive:"2026-06-14T00:31:00Z"},
   participants:[{role:"home",name:"San Antonio Spurs"},{role:"away",name:"New York Knicks"}],
   provider:{raw:{very_large_vendor_payload:"must never leave fork reader"}}},
 capabilities:{present:["event.status","event.play_by_play","provenance"],absent:["event.tracking","event.lineups"]},
}}}
const run=(data=fixture(),opts={})=>ingestCanonicalNBA(data,{forkCommit:commit,observedAt:OBS,now:NOW,teamReference:reference,...opts});
test("real sports-skills NBA schema is admitted to historical SCOUT only",()=>{
 const x=run();
 assert.equal(x.contract,CONTRACT);assert.equal(x.status,"SCOUT_REFERENCE");
 assert.equal(x.source.provider_namespace,"sports-skills/espn");
 assert.equal(x.event.provider_native_id,"401859967");
 assert.equal(x.canonical_event_id,null);assert.equal(x.execution_authority,false);assert.equal(x.approved_bet,null);
 assert.equal(x.expected_value,null);assert.equal(x.independent_fair_probability,null);
});
test("nba_api reference-team IDs are offline matches, not authenticated live rosters",()=>{
 const x=run();assert.equal(x.event.teams[0].nba_static_id,1610612759);
 assert.equal(x.event.teams[1].nba_static_id,1610612752);
 assert.equal(x.evidence_boundary.independent_professional_verification,false);
});
test("source provides bounded minute interval and never fabricates exact tip",()=>{
 const x=run();assert.equal(x.event.start_interval.precision,"minute");
 assert.equal(x.event.start_interval.upper_exclusive,"2026-06-14T00:31:00Z");
 assert.equal(x.evidence_boundary.requires_exact_atlas_event_reconciliation,true);
});
test("raw provider plays, odds and data not copied into ATLAS",()=>{
 const x=run();assert.equal(x.evidence_boundary.raw_provider_payload_copied,false);
 assert.equal(JSON.stringify(x).includes("must never leave fork reader"),false);
 assert.equal(JSON.stringify(x).includes("espn/summary"),false);
});
test("unknown NBA team ID cannot be guessed from a name",()=>{
 const x=run(fixture(),{teamReference:[reference[0]]});
 assert.equal(x.event.teams[1].nba_static_id,null);
 assert.equal(x.event.teams[1].nba_identity_state,"UNRESOLVED");
});
test("duplicate team name mappings cannot be promoted",()=>{
 const x=run(fixture(),{teamReference:[reference[0],reference[0],reference[1]]});
 assert.equal(x.event.teams[0].nba_identity_state,"UNRESOLVED");
});
test("no source commit or clock is blocked",()=>{
 assert.equal(run(fixture(),{forkCommit:"master"}).reason,"SOURCE_PROVENANCE_INVALID");
 assert.equal(run(fixture(),{observedAt:"not-a-time"}).reason,"SOURCE_PROVENANCE_INVALID");
});
test("marketable non-prototype rights are never silently reinterpreted",()=>{
 const d=fixture();d.machina_sports_schema.rights={data_class:"open-public",prototype_only:false,commercial_use:true};
 assert.equal(run(d).reason,"RIGHTS_UNASSERTED_OR_NOT_RESEARCH_ONLY");
});
test("source rights must match provenance rights",()=>{
 const d=fixture();d.machina_sports_schema.provenance.rights.prototype_only=false;
 assert.equal(run(d).reason,"RIGHTS_UNASSERTED_OR_NOT_RESEARCH_ONLY");
});
test("provider namespace mismatch fails closed",()=>{
 const d=fixture();d.machina_sports_schema.provenance.provider.namespace="random-untrusted";
 assert.equal(run(d).reason,"ORIGIN_OR_OBSERVATION_MISMATCH");
});
test("observation time cannot be silently repaired",()=>{
 const d=fixture();d.machina_sports_schema.provenance.observed_at="2026-06-15T03:30:00Z";
 assert.equal(run(d).reason,"ORIGIN_OR_OBSERVATION_MISMATCH");
});
test("unknown Machina event ID and provider event ID rejected",()=>{
 const d=fixture();d.machina_sports_schema.event_view.event_id="not-an-event";
 assert.equal(run(d).reason,"PROVIDER_EVENT_ID_INVALID");
 const x=fixture();x.machina_sports_schema.provider_ids[0].provider_id="";
 assert.equal(run(x).reason,"PROVIDER_EVENT_ID_INVALID");
});
test("minute precision cannot be expressed as a single exact point",()=>{
 const d=fixture();d.machina_sports_schema.event_view.temporal_evidence.upper_exclusive="2026-06-14T00:30:10Z";
 assert.equal(run(d).reason,"TEMPORAL_EVIDENCE_INVALID");
 const x=fixture();x.machina_sports_schema.event_view.temporal_evidence.precision="second";
 assert.equal(run(x).reason,"TEMPORAL_EVIDENCE_INVALID");
});
test("future / unbounded temporal evidence not admitted",()=>{
 const d=fixture();d.machina_sports_schema.event_view.temporal_evidence.lower_inclusive="2026-07-14T00:30:00Z";
 d.machina_sports_schema.event_view.temporal_evidence.upper_exclusive="2026-07-14T00:31:00Z";
 assert.equal(run(d).reason,"TEMPORAL_EVIDENCE_INVALID");
});
test("both home and away must be identifiable",()=>{
 const d=fixture();d.machina_sports_schema.event_view.participants[1].role="home";
 assert.equal(run(d).reason,"PARTICIPANTS_INVALID");
});
test("schema profile must match the tested forked canonical version",()=>{
 const d=fixture();d.machina_sports_schema.profile="future-unknown";
 assert.equal(run(d).reason,"SCHEMA_CONTRACT_INVALID");
});
test("missing capabilities list blocks misleading feature inference",()=>{
 const d=fixture();delete d.machina_sports_schema.capabilities.absent;
 assert.equal(run(d).reason,"CAPABILITY_MATRIX_MISSING");
});
test("incomplete or forged input never receives execution authority",()=>{
 for(const d of [null,{},[],{machina_sports_schema:{}}]){
  const x=run(d);assert.equal(x.status,"QUARANTINED");assert.equal(x.execution_authority,false);
  assert.equal(x.approved_bet,null);
 }
});
