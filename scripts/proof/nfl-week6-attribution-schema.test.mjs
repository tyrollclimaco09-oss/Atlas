import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectAttribution} from './nfl-week6-attribution-schema.mjs';
const fixture=()=>({drives:{previous:[
 {id:'a',team:{id:'34'},plays:Array.from({length:90},(_,i)=>({id:String(i),type:{text:'Pass'},period:{number:1},clock:{displayValue:'10:00'},start:{yardLine:23},text:'synthetic'}))}
]}});
test('drive possession does not grant per-play team or actor identity',()=>{
 const r=inspectAttribution(fixture());
 assert.equal(r.candidate_paths['drive.team.id'],1);
 assert.equal(r.candidate_paths['play.team.id'],0);
 assert.equal(r.team_inheritance_safe,false);
 assert.equal(r.player_target_model_eligible,false);
});
test('individual play team and participants presence measured separately',()=>{
 const f=fixture();f.drives.previous[0].plays[0].team={id:'34'};
 f.drives.previous[0].plays[0].participants=[{athlete:{id:'8'}}];
 const r=inspectAttribution(f);
 assert.equal(r.candidate_paths['play.team.id'],1);
 assert.equal(r.candidate_paths['play.participants[]'],1);
 assert.equal(r.canonical_offense_attribution_verified,false);
});

test('teamParticipants structure cannot be reinterpreted as a ballcarrier without player identity',()=>{
 const f=fixture();f.drives.previous[0].plays[0].teamParticipants=[{team:{id:'30'}},{team:{id:'34'}}];
 f.drives.previous[0].plays[0].start={team:{id:'30'}};
 const r=inspectAttribution(f);
 assert.equal(r.team_participant_shapes.ARRAY,1);
 assert.equal(r.start_team_vs_drive_team_differences,1);
 assert.equal(r.canonical_offense_attribution_verified,false);
});
