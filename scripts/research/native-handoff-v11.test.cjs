'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {TEAM_NAMES,normalizeScheduledGame,auditNativeHandoff}=require('./native-handoff-v11.cjs');
const frozen=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/fixtures/ATLAS_NOV06_V10_ORACLE_EDGE_THIEF_FROZEN_PAPER.json'),'utf8'));
const schedule=frozen.scenarios;
const makeRows=()=>schedule.map((s,i)=>({source_event_id:String(s.event_id),away_team:s.away,home_team:s.home,start_at:s.start,
 canonical_event_id:'00000000-0000-0000-0000-'+String(i+1).padStart(12,'0'),
 native_candidate_count:0,independent_oracle_proof_count:0,resolved_edge_thief_count:0,
 fresh_execution_grade_quote_count:0,native_ready_gate_count:0,
 evidence_gaps:['NATIVE_MARKET_CANDIDATE_MISSING','INDEPENDENT_ORACLE_PROOF_MISSING','FRESH_EXECUTION_GRADE_QUOTE_MISSING'],
 execution_authority:false,model_production_authority:false,human_final_gate_required:true}));
test('all nine frozen source games retained',()=>assert.equal(schedule.length,9));
test('team-map contains 18 unique franchises',()=>assert.equal(Object.keys(TEAM_NAMES).length,18));
test('canonical NBA key aligned to existing repository identity',()=>assert.equal(normalizeScheduledGame(schedule[0]).canonical_key,'NBA:2026-11-06:WAS@ATL'));
test('full-name away identity retained',()=>assert.equal(normalizeScheduledGame(schedule[0]).away_team,'Washington Wizards'));
test('full-name home identity retained',()=>assert.equal(normalizeScheduledGame(schedule[0]).home_team,'Atlanta Hawks'));
test('canonical identity based on exact schedule date',()=>assert.equal(normalizeScheduledGame(schedule[0]).event_date,'2026-11-06'));
test('all nine have unique canonical keys',()=>assert.equal(new Set(schedule.map(s=>normalizeScheduledGame(s).canonical_key)).size,9));
test('unknown team code rejected',()=>assert.throws(()=>normalizeScheduledGame({...schedule[0],away:'XXX'}),/INVALID_GAME_IDENTITY/));
test('same team rejected',()=>assert.throws(()=>normalizeScheduledGame({...schedule[0],away:schedule[0].home}),/INVALID_GAME_IDENTITY/));
test('unknown event identifier rejected',()=>assert.throws(()=>normalizeScheduledGame({...schedule[0],event_id:NaN,source_event_id:null}),/INVALID_GAME_IDENTITY/));
test('invalid UTC timestamp rejected',()=>assert.throws(()=>normalizeScheduledGame({...schedule[0],start:'2026-11-07 00:00'}),/INVALID_GAME_IDENTITY/));
test('date far outside slate rejected',()=>assert.throws(()=>normalizeScheduledGame({...schedule[0],start:'2027-01-01T00:00:00Z'}),/EVENT_DATE_MISMATCH/));
test('all nine canonical events reported',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).canonical_events,9));
test('candidate counts correctly zero',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).native_candidates,0));
test('outcome explicitly pending, not green Final Gate',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).state,'NATIVE_INTAKE_INCOMPLETE'));
test('nine matchup-specific blocker sets preserved',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).blockers.length,9));
test('no modeled wager inserted by audit',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).approved_bets.length,0));
test('execution authority always false',()=>assert.equal(auditNativeHandoff(makeRows(),schedule).execution_authority,false));
test('missing row rejected',()=>assert.throws(()=>auditNativeHandoff(makeRows().slice(1),schedule),/INCOMPLETE_OR_DUPLICATE/));
test('duplicate row rejected',()=>{const x=makeRows();x[1]={...x[0]};assert.throws(()=>auditNativeHandoff(x,schedule),/HANDOFF_EVENT_IDENTITY_MISMATCH/)});
test('incorrect game mapping rejected',()=>{const x=makeRows();x[0].away_team='ATL';assert.throws(()=>auditNativeHandoff(x,schedule),/HANDOFF_EVENT_IDENTITY_MISMATCH/)});
test('bad event start rejected',()=>{const x=makeRows();x[0].start_at='2026-11-07T02:00:00Z';assert.throws(()=>auditNativeHandoff(x,schedule),/HANDOFF_EVENT_IDENTITY_MISMATCH/)});
test('claims of execution authority rejected',()=>{const x=makeRows();x[0].execution_authority=true;assert.throws(()=>auditNativeHandoff(x,schedule),/UNAUTHORIZED_HANDOFF_CLAIM/)});
test('claims of model production authority rejected',()=>{const x=makeRows();x[0].model_production_authority=true;assert.throws(()=>auditNativeHandoff(x,schedule),/UNAUTHORIZED_HANDOFF_CLAIM/)});
test('negative count rejected',()=>{const x=makeRows();x[0].fresh_execution_grade_quote_count=-1;assert.throws(()=>auditNativeHandoff(x,schedule),/HANDOFF_COUNTS_INVALID/)});
test('missing evidence array rejected',()=>{const x=makeRows();x[0].evidence_gaps=null;assert.throws(()=>auditNativeHandoff(x,schedule),/HANDOFF_GAP_CONTRACT_INVALID/)});
test('even populated counters never authorize execution',()=>{const x=makeRows();x.forEach(z=>{z.native_candidate_count=1;z.independent_oracle_proof_count=1;z.fresh_execution_grade_quote_count=1;z.native_ready_gate_count=1;z.evidence_gaps=[]});const a=auditNativeHandoff(x,schedule);assert.equal(a.state,'PROOF_REVIEW_REQUIRED');assert.equal(a.execution_authority,false)});
test('V11 view uses security-invoker and denies ordinary public grants',()=>{
const sql=fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261106080213_atlas_v11_slate_native_handoff_read_only.sql'),'utf8');
assert(sql.includes('security_invoker=true'));assert(sql.includes('revoke all on public.atlas_slate_native_handoff_v11 from public,anon,authenticated'));});
test('V11 identity normalization has canonical key',()=>{
const sql=fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261106080442_atlas_v11_handoff_canonical_key_normalization.sql'),'utf8');
assert(sql.includes('ev.canonical_key'));assert(!sql.includes('lower(ev.home_team) = lower'));});
test('Edge route remains authenticated GET-only',()=>{
const src=fs.readFileSync(path.resolve(__dirname,'../../supabase/functions/atlas-slate-duo-v10/index.ts'),'utf8');
assert(src.includes('if(mode==="handoff")'));assert(src.includes('READ_ONLY_GET_REQUIRED'));assert(src.includes('NO_BET_AUTHORITY_FROM_HANDOFF'));
});
