#!/usr/bin/env node
/** No network, data writes, market calls or real outcome ingestion. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {stressFrozenOutcomePatterns} from './prospective-outcome-stress.mjs';
const root=new URL('./fixtures/',import.meta.url);
const {snapshot:source,source_git_blob_sha:sourceBlobSha}=readSourceWithBlob(
 fileURLToPath(new URL('nba-connected-prestart-20261111.json',root)));
const cohort=JSON.parse(readFileSync(new URL('nba-prospective-forecast-freeze-20261111.json',root),'utf8'));
const challenger=JSON.parse(readFileSync(new URL('nba-record-challenger-freeze-20261111.json',root),'utf8'));
const result=stressFrozenOutcomePatterns({source,cohort,sourceBlobSha,challenger});
process.stdout.write(JSON.stringify(result,null,2)+'\n');
