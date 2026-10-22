/*
ATLAS REVIEW-ONLY LIVE INPUT / EXACT NORMALIZER SNAPSHOT TEST
nfl-core.mjs mirrors deployed atlas-nfl-free-scout v1 (Supabase snapshot as read 2026-10-19).
multisport-core.mjs mirrors deployed atlas-free-sports-scout v2.
These mirrors do NOT invoke the deployed Edge endpoints or establish freshness/production truth.
No authentication; no database mutations; no wagering.
*/
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {validateSourceProof} from './public-source-receipt.mjs';
import {createHash} from 'node:crypto';
import {SOURCE_URL, normalizeSchedule} from './free-source-core/nfl-core.mjs';
import {buildRequest,normalizeResponse} from './free-source-core/multisport-core.mjs';

const checksum=(data)=>createHash('sha256').update(data).digest('hex');
const sourceDigest=(path)=>checksum(readFileSync(new URL(path,import.meta.url)));

async function getSource(url) {
  const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:'application/json,text/csv','User-Agent':'ATLAS-REVIEW-SOURCE-CORE-PARITY/1'}});
  assert.equal(res.status,200,'HTTP_FAIL '+url);
  assert.equal(new URL(res.url).host,new URL(url).host,'UNEXPECTED_REDIRECT_HOST');
  const bytes=Buffer.from(await res.arrayBuffer());
  assert.ok(bytes.length>0&&bytes.length<=4000000,'SOURCE_EMPTY_OR_OVERSIZE');
  // Observation is recorded AFTER the complete response arrived, never before request.
  return {text:bytes.toString('utf8'),sha256:checksum(bytes),size:bytes.length,
    observed_at_utc:new Date().toISOString(),source_url:url};
}
const observations=[];
const print=(entry)=>{observations.push(entry);console.log('ATLAS_SOURCE_CORE_PROOF '+JSON.stringify(entry));};
const nfl=await getSource(SOURCE_URL);
const nflRows=normalizeSchedule(nfl.text,{season:2026,week:7,retrievedAt:nfl.observed_at_utc});
assert.ok(nflRows.length>0 && nflRows.length<=18,'NFL_WEEK_INVALID');
assert.equal(new Set(nflRows.map(r=>r.game_id)).size,nflRows.length,'NFL_DUPLICATE');
assert.ok(nflRows.every(r=>r.truth_label==='SCOUT_REFERENCE_ONLY'&&r.production_authority===false&&r.model_probability===null&&r.sportsbook_offer===null&&r.independent_schedule_verified===false),'NFL_AUTHORITY_CROSSOVER');
print({sport:'NFL',week:7,records:nflRows.length,example_id:nflRows[0].game_id,source_url:nfl.source_url,observed_at_utc:nfl.observed_at_utc,upstream_sha256:nfl.sha256,normalizer_sha256:sourceDigest('./free-source-core/nfl-core.mjs'),upstream_published_at:null,proof_scope:'REAL_INPUT_TO_DEPLOYED_CODE_SNAPSHOT_NOT_EDGE_INVOCATION'});
for (const sport of ['MLB','NHL']) {
  const c=buildRequest({sport,date:'2026-10-19'});
  const response=await getSource(c.source_url);
  const data=JSON.parse(response.text);
  const rows=normalizeResponse(data,c,{observed_at:response.observed_at_utc});
  assert.ok(rows.length>0 && rows.length<=200,'NO_GAMES_OR_TOO_MANY_'+sport);
  assert.equal(new Set(rows.map(r=>r.event_key)).size,rows.length,'DUPLICATE_EVENT_'+sport);
  assert.ok(rows.every(r=>r.truth_label==='SCOUT_REFERENCE_ONLY'&&r.production_authority===false&&r.model_probability===null&&r.market_price===null&&r.independent_schedule_verified===false),'AUTHORITY_CROSSOVER_'+sport);
  print({sport,date:c.date,records:rows.length,example_id:rows[0].event_key,source_url:response.source_url,observed_at_utc:response.observed_at_utc,upstream_sha256:response.sha256,normalizer_sha256:sourceDigest('./free-source-core/multisport-core.mjs'),upstream_published_at:null,proof_scope:'REAL_INPUT_TO_DEPLOYED_CODE_SNAPSHOT_NOT_EDGE_INVOCATION'});
}
const artifact=validateSourceProof({schema:'atlas.public-source-proof.v1',scope:'PUBLIC_UPSTREAM_ONLY_NOT_DEPLOYED_EDGE',
  run_id:process.env.GITHUB_RUN_ID||null,observations,production_authority:false,
  external_edge_invoked:false,database_written:false,paid_odds_requests:0});
writeFileSync('atlas-public-source-proof.json',JSON.stringify(artifact,null,2)+'\n','utf8');
console.log('ATLAS_PROOF_ARTIFACT_WRITTEN | hash receipt + actual response observation times');
console.log('ATLAS_EXACT_NORMALIZER_REAL_SOURCE_TEST=PASS | PUBLIC_SOURCE_ONLY | SHADOW');
