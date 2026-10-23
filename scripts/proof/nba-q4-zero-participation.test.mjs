import {test} from 'node:test';import assert from 'node:assert/strict';
import {participationDiagnostic} from './nba-q4-zero-participation.mjs';
const f={schema:'atlas.nba.q3_features.strict_v1',feature_sha256:'hash',event_id:'test',
 selected_players:[{player_id:'10',team:'A',pre_q4_fga:8},{player_id:'11',team:'A',pre_q4_fga:6},
 {player_id:'20',team:'B',pre_q4_fga:7},{player_id:'21',team:'B',pre_q4_fga:5}],
 actual_q3_external_freeze_attested:false};
test('zero FGA with observed rebound must not be called benched',()=>{
 const x=participationDiagnostic(f,[{period:4,personId:10,actionType:'rebound',isFieldGoal:0},
 {period:4,personId:11,actionType:'2pt',isFieldGoal:1}]);
 assert.equal(x.zero_q4_shooter_count,3);assert.equal(x.any_q4_actor_events,1);
 assert.equal(x.zero_shot_players[0].ever_directly_referenced_in_q4,true);
 assert.equal(x.zero_shot_players[0].absence_proves_benching,false);
});
test('lack of a player event is an unknown—not proof of no minutes',()=>{
 const x=participationDiagnostic(f,[]);
 assert.equal(x.no_q4_direct_actor_event_observed,4);
 assert.equal(x.benching_causally_verified,false);
 assert.equal(x.q4_participation_minutes_verified,false);
});
