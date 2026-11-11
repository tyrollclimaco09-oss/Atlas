#!/usr/bin/env node
/**
 * Offline-only research postgame evaluator. No network, DB, provider, or file
 * writes. The source and both pregame model arms are read from frozen repo
 * artifacts; stdin is only new *postgame* source observations.
 * Usage: printf '{"observations":[]}' | node integrations/learning/score-prospective-nba-cli.mjs
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {evaluateProspectivePostgame} from './prospective-postgame-evaluator.mjs';
try{
 const raw=readFileSync(0,'utf8');
 if(raw.length>2_000_000)throw Error('POSTGAME_INPUT_TOO_LARGE');
 const input=raw.trim()?JSON.parse(raw):{observations:[]};
 if(!input||!Array.isArray(input.observations))throw Error('POSTGAME_INPUT_CONTRACT_INVALID');
 const root=new URL('./fixtures/',import.meta.url);
 const sourcePath=fileURLToPath(new URL('nba-connected-prestart-20261111.json',root));
 const cohortPath=fileURLToPath(new URL('nba-prospective-forecast-freeze-20261111.json',root));
 const challengerPath=fileURLToPath(new URL('nba-record-challenger-freeze-20261111.json',root));
 const {snapshot:source,source_git_blob_sha:sourceBlobSha}=readSourceWithBlob(sourcePath);
 const cohort=JSON.parse(readFileSync(cohortPath,'utf8'));
 const challenger=JSON.parse(readFileSync(challengerPath,'utf8'));
 const result=evaluateProspectivePostgame({source,cohort,sourceBlobSha,challenger,observations:input.observations});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch(error){
 const reason=error instanceof SyntaxError?'POSTGAME_JSON_INVALID':
  /^[A-Z_]+$/.test(error?.message||'')?error.message:'POSTGAME_EVALUATION_FAILED';
 process.stderr.write('ATLAS_POSTGAME_READONLY_ERROR: '+reason+'\n');
 process.exitCode=2;
}
