'use strict';
// ATLAS native handoff V11: original read-only identity and proof audit.
// No sportsbook calls, no market fabrication, no native candidate writes.
const TEAM_NAMES=Object.freeze({
 WAS:'Washington Wizards',ATL:'Atlanta Hawks',BOS:'Boston Celtics',CHA:'Charlotte Hornets',
 PHI:'Philadelphia 76ers',CLE:'Cleveland Cavaliers',MIN:'Minnesota Timberwolves',
 NOP:'New Orleans Pelicans',UTA:'Utah Jazz',DAL:'Dallas Mavericks',TOR:'Toronto Raptors',
 MIL:'Milwaukee Bucks',OKC:'Oklahoma City Thunder',MEM:'Memphis Grizzlies',
 POR:'Portland Trail Blazers',LAL:'Los Angeles Lakers',SAS:'San Antonio Spurs',
 SAC:'Sacramento Kings'
});
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
function normalizeScheduledGame(row,slateDate='2026-11-06'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(slateDate)||!row||typeof row!=='object')throw Error('INVALID_GAME_IDENTITY');
 const id=String(row.source_event_id??row.event_id??'');
 const away=row.away,home=row.home,start=row.start_utc??row.start;
 if(!/^\d{6,12}$/.test(id)||!TEAM_NAMES[away]||!TEAM_NAMES[home]||away===home||
 typeof start!=='string'||!ISO.test(start)||!Number.isFinite(Date.parse(start)))
  throw Error('INVALID_GAME_IDENTITY');
 if(Math.abs(Date.parse(start)-Date.parse(slateDate+'T00:00:00Z'))>48*3600000)
  throw Error('EVENT_DATE_MISMATCH');
 return Object.freeze({source_event_id:id,canonical_key:'NBA:'+slateDate+':'+away+'@'+home,
  sport:'basketball',league:'NBA',event_date:slateDate,start_time:start,
  away_team:TEAM_NAMES[away],home_team:TEAM_NAMES[home]});
}
function auditNativeHandoff(rows,scheduled,slateDate='2026-11-06'){
 if(!Array.isArray(rows)||!Array.isArray(scheduled)||scheduled.length===0)
  throw Error('HANDOFF_INPUT_INVALID');
 const expected=new Map(scheduled.map(e=>{
  const v=normalizeScheduledGame(e,slateDate);return [v.source_event_id,v];
 }));
 if(expected.size!==scheduled.length||rows.length!==expected.size)throw Error('INCOMPLETE_OR_DUPLICATE_HANDOFF');
 const actual=new Set(),blockers=[];
 let canonical=0,candidate=0,duo=0,priced=0,gates=0;
 for(const row of rows){
  const id=String(row?.source_event_id??''),ref=expected.get(id);
  if(!ref||actual.has(id))throw Error('HANDOFF_EVENT_IDENTITY_MISMATCH');
  actual.add(id);
  if(row.away_team!==ref.canonical_key.split(':')[2].split('@')[0]||
     row.home_team!==ref.canonical_key.split('@')[1]||
     Date.parse(row.start_at)!==Date.parse(ref.start_time))throw Error('HANDOFF_EVENT_IDENTITY_MISMATCH');
  if(row.execution_authority!==false||row.model_production_authority!==false||
    row.human_final_gate_required!==true)throw Error('UNAUTHORIZED_HANDOFF_CLAIM');
  const countNames=['native_candidate_count','independent_oracle_proof_count','resolved_edge_thief_count',
   'fresh_execution_grade_quote_count','native_ready_gate_count'];
  if(countNames.some(k=>!Number.isInteger(row[k])||row[k]<0))throw Error('HANDOFF_COUNTS_INVALID');
  if(!Array.isArray(row.evidence_gaps)||row.evidence_gaps.some(x=>typeof x!=='string'))
   throw Error('HANDOFF_GAP_CONTRACT_INVALID');
  if(row.canonical_event_id)canonical++;
  candidate+=row.native_candidate_count;
  duo+=row.independent_oracle_proof_count;
  priced+=row.fresh_execution_grade_quote_count;
  gates+=row.native_ready_gate_count;
  if(row.evidence_gaps.length)blockers.push({event_id:id,gaps:[...row.evidence_gaps]});
 }
 return Object.freeze({state:blockers.length?'NATIVE_INTAKE_INCOMPLETE':'PROOF_REVIEW_REQUIRED',
  total_games:scheduled.length,canonical_events:canonical,native_candidates:candidate,
  independent_oracle_proofs:duo,fresh_execution_grade_quotes:priced,native_ready_gates:gates,
  blocked_matchups:blockers.length,blockers,execution_authority:false,
  human_final_gate_required:true,approved_bets:[],paper_slips_created:0});
}
module.exports={TEAM_NAMES,normalizeScheduledGame,auditNativeHandoff};
