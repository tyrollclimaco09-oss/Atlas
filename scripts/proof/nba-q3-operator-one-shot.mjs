import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const FILE='docs/prospective/ATLAS_NBA_Q3_OPERATOR_CONTROL_20261022.json';
export function validate(c){
 if(c?.schema!=='atlas.nba.operator_q3_control.v1')throw Error('UNKNOWN_CONTROL_SCHEMA');
 if(c.event_id!=='0022600007'||c.event_code!=='20261022/DENOKC')throw Error('OPERATOR_GAME_IDENTITY_CONFLICT');
 if(!['preflight','capture','q1_capture','settle_q1'].includes(c.mode))throw Error('INVALID_OPERATOR_MODE');
 if(c.never_poll!==true||c.production_authority!==false||c.odds_calls!==0)throw Error('UNAUTHORIZED_CONTROL_ELEVATION');
 if(c.mode==='preflight'&&c.intent!=='VALIDATE_SINGLE_INVOCATION_PATH_WITHOUT_FREEZE')throw Error('INVALID_PREFLIGHT_INTENT');
 if(c.mode==='capture'&&c.intent!=='CAPTURE_ONLY_IF_STRICT_LIVE_Q3_CLOCK_ZERO')throw Error('INVALID_CAPTURE_INTENT');
 if(c.mode==='q1_capture'&&c.intent!=='CAPTURE_Q1_ONLY_FOR_FUTURE_Q4_BEFORE_Q4')throw Error('INVALID_Q1_CAPTURE_INTENT');
 if(c.mode==='settle_q1'&&c.intent!=='SETTLE_Q1_SHADOW_ONLY_AFTER_OFFICIAL_FINAL')throw Error('INVALID_SETTLEMENT_INTENT');
 return c.mode;
}
function main(){
 const control=JSON.parse(fs.readFileSync(FILE,'utf8'));
 const mode=validate(control);
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REF!=='refs/heads/research/odds-api-probe-2026-10-22')
  throw Error('RESEARCH_GITHUB_ACTIONS_ONLY');
 const args=mode==='preflight'?['scripts/proof/nba-live-source-diagnostic.mjs']:
   mode==='q1_capture'?['scripts/proof/nba-live-q1-to-q4.mjs']:
   mode==='settle_q1'?['scripts/proof/nba-q1-q4-final-settlement.mjs']:
   ['scripts/proof/nba-live-q3-freeze.mjs'];
 console.log('ATLAS_NBA_ONE_SHOT_OPERATOR '+JSON.stringify({mode,game:control.event_id,automatic_polling:false,betting_authority:false}));
 execFileSync(process.execPath,args,{stdio:'inherit',timeout:45000});
 if(mode==='preflight')console.log('ATLAS_NBA_OPERATOR_PREFLIGHT_ONLY_NO_Q3_FREEZE');
 else console.log('ATLAS_NBA_OPERATOR_CAPTURE_MODE_COMPLETED_CHECK_ARTIFACT_AND_TIMESTAMPS');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main();
