import test from 'node:test';
import assert from 'node:assert/strict';
import {processFlaimObservation,attachIndependentVerification,flaimIntakeStatus,buildFlaimScoutVerifyPacket,CONTRACT} from './scout-verify.mjs';
const now='2026-10-29T23:45:00Z';
const sample={tool:'get_transactions',kind:'fantasy_add',platform:'yahoo',sport:'basketball',player:'Sample Player',professional_team:'ATL',
source_observed_at:'2026-10-29T23:40:00Z',event_at:'2026-10-29T23:20:00Z',is_hypothetical:false,is_from_connected_league:true,
note:'Fantasy team added this player; professional role change not established.'};
const f=(updates={})=>processFlaimObservation({...sample,...updates},{now});
const session={totalLeaguesFound:1,allLeagues:[{platform:'yahoo'}]};
test('SCOUT lead preserves fantasy-only origin',()=>{
 const x=f();assert.equal(x.contract,CONTRACT);assert.equal(x.status,'FANTASY_SIGNAL_ONLY');
 assert.equal(x.verification.professional_fact_verified,false);assert.equal(x.execution_authority,false);
 assert.equal(x.approved_bet,null);assert.equal(x.expected_value,null);assert.equal(x.independent_fair_probability,null);
});
test('empty Flaim session returns zero invented records',()=>{
 const x=flaimIntakeStatus({totalLeaguesFound:0,allLeagues:[]});
 assert.equal(x.status,'BLOCKED_NO_CONNECTED_LEAGUES');assert.deepEqual(x.signals,[]);
});
test('a connected league only means ready to read',()=>{
 const x=flaimIntakeStatus(session);assert.equal(x.status,'READY_FOR_OPERATOR_SCOPED_READ');assert.equal(x.signals.length,0);
});
test('no tool-backed source rejects hypothetical or unconnected input',()=>{
 assert.equal(f({is_hypothetical:true}).reason,'NOT_ATTESTED_FLAIM_CONNECTED_SOURCE');
 assert.equal(f({is_from_connected_league:false}).reason,'NOT_ATTESTED_FLAIM_CONNECTED_SOURCE');
});
test('private roster/account fields are disallowed',()=>{
 for(const k of ['league_id','team_id','owner_name','credentials','raw_payload'])
 assert.equal(f({[k]:'private'}).reason,'PRIVATE_OR_RAW_FIELDS_FORBIDDEN');
});
test('missing player identity or professional club cannot pass',()=>{
 assert.equal(f({player:''}).reason,'PLAYER_OR_TEAM_UNRESOLVED');
 assert.equal(f({professional_team:''}).reason,'PLAYER_OR_TEAM_UNRESOLVED');
});
test('unsupported tool and pro-injury promotion cannot pass',()=>{
 assert.equal(f({tool:'get_standings'}).reason,'UNSUPPORTED_TOOL_OR_SIGNAL');
 assert.equal(f({kind:'nba_injury_confirmed'}).reason,'UNSUPPORTED_TOOL_OR_SIGNAL');
});
test('reject future and stale observations',()=>{
 assert.equal(f({source_observed_at:'2026-10-29T21:00:00Z'}).status,'FANTASY_SIGNAL_ONLY');
 assert.equal(f({source_observed_at:'2026-10-28T18:00:00Z'}).reason,'STALE_FANTASY_SIGNAL');
 assert.equal(f({source_observed_at:'2026-10-30T03:00:00Z'}).reason,'FUTURE_TIMESTAMP');
});
test('fantasy trades are not professional team trades',()=>{
 const x=f({kind:'fantasy_trade'});assert.equal(x.status,'FANTASY_SIGNAL_ONLY');
 assert(x.verification.do_not_infer.includes('starting_lineup'));
});
test('market ownership must explicitly be platform-wide',()=>{
 const opts={tool:'get_players',kind:'fantasy_market_ownership',value:60.5,ownership_scope:'platform_global'};
 assert.equal(f(opts).observation.value,60.5);
 assert.equal(f({...opts,ownership_scope:'league_local'}).reason,'MARKET_OWNERSHIP_SCOPE_OR_RATE_INVALID');
 assert.equal(f({...opts,value:140}).reason,'MARKET_OWNERSHIP_SCOPE_OR_RATE_INVALID');
});
test('fantasy points are never NBA points or true prop hit probabilities',()=>{
 const opts={tool:'get_matchups',kind:'fantasy_projection',value:21.2,unit:'fantasy_points'};
 assert.equal(f(opts).observation.unit,'fantasy_points');
 assert.equal(f({...opts,unit:'nba_points'}).reason,'FANTASY_PROJECTION_UNIT_INVALID');
});
test('fantasy status designation requires independent professional verification',()=>{
 const x=f({tool:'get_roster',kind:'fantasy_status_flag',status_code:'GTD'});
 assert.equal(x.verification.professional_fact_verified,false);
 assert.equal(x.observation.provider_status,'gtd');
 assert.equal(f({tool:'get_roster',kind:'fantasy_status_flag',status_code:'UNK'}).reason,'STATUS_CODE_NOT_INTERPRETABLE');
});
test('official corroboration from stale sources is not accepted',()=>{
 const x=attachIndependentVerification(f(),{source_system:'OFFICIAL_TEAM',player:'Sample Player',professional_team:'ATL',
 source_url:'https://nba.com/sample',professional_fact:'Player ruled out',observed_at:'2026-10-27T23:00:00Z'},{now});
 assert.equal(x.verification.independent_check,'OFFICIAL_SOURCE_STALE_OR_INVALID');
});
test('official independent claim remains separate pending human check',()=>{
 const x=attachIndependentVerification(f(),{source_system:'OFFICIAL_LEAGUE',player:'Sample Player',professional_team:'ATL',
 source_url:'https://nba.com/sample',professional_fact:'Player ruled out',observed_at:now},{now});
 assert.equal(x.independent_official_fact.verification_status,'REQUIRES_HUMAN_SOURCE_REVIEW');
 assert.equal(x.verification.professional_fact_verified,false);assert.equal(x.execution_authority,false);
});
test('Flaim itself cannot corroborate its own injury flag',()=>{
 const x=attachIndependentVerification(f(),{source_system:'FLAIM_FANTASY',player:'Sample Player',professional_team:'ATL',
 source_url:'https://nba.com/sample',professional_fact:'out',observed_at:now},{now});
 assert.equal(x.verification.independent_check,'NO_OFFICIAL_CORROBORATION');
});
test('wrong player never passes official-source identity',()=>{
 const x=attachIndependentVerification(f(),{source_system:'OFFICIAL_TEAM',player:'Other Player',professional_team:'ATL',
 source_url:'https://nba.com/sample',professional_fact:'out',observed_at:now},{now});
 assert.equal(x.verification.independent_check,'IDENTITY_OR_SOURCE_MISMATCH');
});
test('fantasy free agents are not NBA free agents',()=>{
 const x=f({tool:'get_free_agents',kind:'fantasy_league_availability'});
 assert.equal(x.status,'FANTASY_SIGNAL_ONLY');assert(x.verification.do_not_infer.includes('player_availability'));
});
test('unsafe HTML text cannot cross handoff',()=>{
 assert.equal(f({player:'<script>'}).reason,'PLAYER_OR_TEAM_UNRESOLVED');
 assert.equal(f({note:'<img>'}).reason,'CONCISE_EVIDENCE_NOTE_REQUIRED');
});
test('batch with zero leagues generates no leads even with inputs',()=>{
 const x=buildFlaimScoutVerifyPacket({session:{totalLeaguesFound:0,allLeagues:[]},observations:[sample],now});
 assert.equal(x.status,'BLOCKED_NO_CONNECTED_LEAGUES');assert.equal(x.scout_leads.length,0);
});
test('one operator-reviewed signal makes one WATCH task and zero professional facts',()=>{
 const x=buildFlaimScoutVerifyPacket({session,observations:[sample],now});
 assert.equal(x.scout_leads.length,1);assert.equal(x.verify_queue.length,1);assert.equal(x.verified_professional_facts,0);
 assert.equal(x.production_writes,0);assert.equal(x.betting_actions,0);
});
test('repeat identical signals quarantine the replay',()=>{
 const x=buildFlaimScoutVerifyPacket({session,observations:[sample,sample],now});
 assert.equal(x.scout_leads.length,1);assert.equal(x.rejected[0].reason,'DUPLICATE_FANTASY_SIGNAL');
});