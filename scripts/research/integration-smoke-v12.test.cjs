'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const db=JSON.parse(load('docs/fixtures/ATLAS_V12_LIVE_INTEGRATION_DB_SNAPSHOT.json'));
const handoff=JSON.parse(load('docs/fixtures/ATLAS_NOV06_V11_NATIVE_HANDOFF_PUBLIC.json'));
const freeze=JSON.parse(load('docs/fixtures/ATLAS_NOV06_V10_ORACLE_EDGE_THIEF_FROZEN_PAPER.json'));
const grade=JSON.parse(load('docs/fixtures/ATLAS_NOV05_V8_POSTGAME_OFFICIAL_GRADE.json'));
const sql=load('supabase/migrations/20261106083810_atlas_v12_candidate_coherence_readonly.sql');
const edge=load('supabase/functions/atlas-slate-duo-v10/index.ts');
const canonical=require('./slate-duo-v10.cjs').CANON;
test('live database snapshot was explicitly frozen',()=>assert.equal(db.schema,'ATLAS_V12_INTEGRATION_DB_SNAPSHOT'));
test('exact Friday slate run identity',()=>assert.equal(db.run_key,'ATLAS-NBA-20261106-V10-RESEARCH-R1'));
test('nine scheduled games present in database',()=>assert.equal(db.counts.schedule_games,9));
test('nine canonical NBA events registered',()=>assert.equal(db.counts.canonical_events,9));
test('all twelve ATLAS nodes persisted',()=>assert.equal(db.counts.canonical_nodes,12));
test('all canonical nodes uniquely represented',()=>assert.deepEqual(new Set(Object.keys(db.node_states)),new Set(canonical)));
test('eight legacy and new subnodes registered',()=>assert.equal(db.counts.registered_subnodes,8));
test('research ORACLE branch not silently omitted',()=>assert.equal(db.node_states.ORACLE,'RESEARCH_ONLY'));
test('adversarial EDGE THIEF branch not silently omitted',()=>assert.equal(db.node_states.EDGE_THIEF,'RESEARCH_ONLY'));
test('human Final Gate correctly blocked',()=>assert.equal(db.node_states.HUMAN_FINAL_GATE,'BLOCKED'));
test('postgame FORENSICS remains pending on future slate',()=>assert.equal(db.node_states.FORENSICS,'POSTGAME_PENDING'));
test('calibration remains pending on future slate',()=>assert.equal(db.node_states.CALIBRATOR,'POSTGAME_PENDING'));
test('native market candidates are not fabricated',()=>assert.equal(db.counts.coherent_duo_games,0));
test('no operator-ready candidate claimed without proof',()=>assert.equal(db.counts.ready_for_operator,0));
test('no invented executable sportsbook prices',()=>assert.equal(db.counts.execution_grade_quotes,0));
test('original November five postgame evidence preserved',()=>assert.equal(db.counts.postgame_proof,1));
test('original forecast fixture still contains nine uncalibrated entries',()=>assert.equal(freeze.scenarios.length,9));
test('original handoff fixture contains exactly nine canonical events',()=>assert.equal(handoff.canonical_event_registered,9));
test('official November five grade preserves both outcomes',()=>assert.equal(grade.metrics.samples,2));
test('no ROI fabricated for research grading',()=>assert.equal(grade.metrics.actualBetROI,null));
test('operator account setup is not silently assumed',()=>assert.equal(db.auth_configuration.operator_eligible_users,0));
test('site credentials are not silently assumed',()=>assert.equal(db.auth_configuration.site_reader_credentials,0));
test('no authentic user request claimed',()=>assert.equal(db.auth_configuration.operator_request_verified,false));
test('candidate aligned Oracle key, event and state',()=>{
 assert.match(sql,/op\.candidate_key=t\.candidate_key/);assert.match(sql,/op\.event_id=t\.event_id/);
 assert.match(sql,/op\.state_version=t\.state_version/);
});
test('Edge Thief alignment and unresolved objection veto',()=>{
 assert.match(sql,/et\.candidate_key=t\.candidate_key/);
 assert.match(sql,/not exists \(/);assert.match(sql,/et\.challenge_status not in/);
});
test('Sentinel and Tactician require same candidate and state',()=>{
 assert.match(sql,/sp\.candidate_key=t\.candidate_key/);
 assert.match(sql,/tr\.candidate_key=t\.candidate_key/);
 assert.match(sql,/sp\.state_version=t\.state_version/);
});
test('KAIROS bound to same candidate',()=>assert.match(sql,/kr\.candidate_key=t\.candidate_key/));
test('quote must use native binding and price verification function',()=>{
 assert.match(sql,/epb\.candidate_key=t\.candidate_key/);
 assert.match(sql,/atlas_final_gate_quote_is_verified_v10\(epb\.id,now\(\)\)/);
});
test('Final Gate tied to candidate native Final Gate ID',()=>{
 assert.match(sql,/fg\.id=t\.final_gate_id/);
 assert.match(sql,/fg\.event_id=t\.event_id/);
 assert.match(sql,/fg\.state_version=t\.state_version/);
});
test('operator review cannot be fully proven without both duo and risk and price and gate',()=>assert.match(sql,/q\.duo_ok and q\.risk_ok and q\.price_ok and q\.gate_ok/));
test('new view is security invoker with no anon or authenticated read grants',()=>{
 assert.match(sql,/security_invoker=true/);
 assert.match(sql,/revoke all on public\.atlas_slate_candidate_coherence_v12 from public,anon,authenticated/);
});
test('integrated API route exists',()=>assert.match(edge,/if\(mode==="integration"\)/));
test('integrated API reads actual canonical status and evidence tables',()=>{
 for(const name of ['atlas_slate_research_runs_v10','atlas_slate_node_receipts_v10','atlas_slate_candidate_coherence_v12','atlas_cortex_feature_bindings_v1','atlas_cortex_release_receipts_v1'])
  assert(edge.includes(name));
});
test('API rejects incomplete canonical event or empty module registry',()=>{assert.match(edge,/games\.some\(g=>!g\.canonical_event_id\)/);assert.match(edge,/modules\.length===0/)});
test('API fails shut for missing or inconsistent stages',()=>{
 assert.match(edge,/INTEGRATION_COVERAGE_INCOMPLETE/);assert.match(edge,/UNAUTHORIZED_INTEGRATION_AUTHORITY_CLAIM/);
});
test('API never performs betting operations',()=>{
 assert.match(edge,/execution_authority:false/);
 assert.match(edge,/human_final_gate_required:true/);
 assert.match(edge,/READ_ONLY_GET_REQUIRED/);
 assert.doesNotMatch(edge,/placeBet\(|executeBet\(|\.from\("bets"\)\.insert\(/);
});
test('output state explicitly research-only, not wager approval',()=>assert.match(edge,/RESEARCH_BACKBONE_LINKED_NOT_EXECUTABLE/));
test('system has no human authentication configured, reported as blocker',()=>assert.equal(db.proof_boundary.live_authenticated_operator_path,false));
