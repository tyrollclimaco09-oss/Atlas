'use strict';

// ATLAS MasterSave v1. Offline deterministic integrity and cross-copy drift checks.
// No network, credentials, deployment, sportsbook actions, or production authority.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const VERSION = 'atlas.mastersave.snapshot.v1';
const HEX40 = /^[a-f0-9]{40}$/;
const EXACT = (v, fields) => v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const fail = (code) => { throw new Error(code); };

function verifyShape(manifest) {
  const fields = ['schema', 'checkpoint_id', 'authority', 'branch', 'anchor_commit_sha',
    'arc_iii', 'artifacts', 'evidence_run', 'projections', 'next_action'];
  if (!EXACT(manifest, fields) || manifest.schema !== VERSION ||
      typeof manifest.checkpoint_id !== 'string' ||
      !/^ATLAS-[A-Z0-9-]{4,80}$/.test(manifest.checkpoint_id) ||
      manifest.authority !== 'GITHUB_REVIEW_SNAPSHOT' ||
      manifest.branch !== 'review/pass0-slate-regression-2026-10-16' ||
      !HEX40.test(manifest.anchor_commit_sha) ||
      !EXACT(manifest.arc_iii, ['planned', 'formally_closed', 'status', 'floot']) ||
      manifest.arc_iii.planned !== 15 || manifest.arc_iii.formally_closed !== 0 ||
      manifest.arc_iii.status !== 'PAUSED_NO_PRODUCTION_PROMOTION' ||
      manifest.arc_iii.floot !== 'PARKED' ||
      !Array.isArray(manifest.artifacts) || manifest.artifacts.length < 2 ||
      manifest.artifacts.length > 24 ||
      !EXACT(manifest.evidence_run, ['run_id', 'head_sha', 'conclusion', 'scope']) ||
      !Number.isSafeInteger(manifest.evidence_run.run_id) ||
      manifest.evidence_run.run_id < 1 ||
      manifest.evidence_run.head_sha !== manifest.anchor_commit_sha ||
      manifest.evidence_run.conclusion !== 'success' ||
      manifest.evidence_run.scope !== 'REVIEW_SYNTHETIC_AND_UI_ONLY' ||
      !EXACT(manifest.projections, ['notion', 'create_state', 'drive']) ||
      manifest.next_action !== 'ARC_III_PASS_1_ONLY_ON_OPERATOR_REQUEST') fail('SNAPSHOT_SCHEMA');

  const seen = new Set(), roles = [];
  for (const item of manifest.artifacts) {
    if (!EXACT(item, ['path', 'role', 'git_blob_sha']) ||
        typeof item.path !== 'string' ||
        !/^docs\/[A-Za-z0-9_./-]+\.md$/.test(item.path) ||
        item.path.includes('..') || item.path.includes('//') ||
        !['PRIMARY_HANDOFF', 'HISTORICAL_HANDOFF', 'ARCHITECTURE_INDEX'].includes(item.role) ||
        !HEX40.test(item.git_blob_sha) || seen.has(item.path)) fail('SNAPSHOT_ARTIFACT');
    roles.push(item.role); seen.add(item.path);
  }
  for (const role of ['PRIMARY_HANDOFF', 'HISTORICAL_HANDOFF', 'ARCHITECTURE_INDEX'])
    if (roles.filter(r => r === role).length !== 1) fail('SNAPSHOT_ROLE_CONFLICT');

  if (!EXACT(manifest.projections.notion, ['page_id', 'required_state']) ||
      !/^[0-9a-f-]{36}$/.test(manifest.projections.notion.page_id) ||
      manifest.projections.notion.required_state !== 'POINTER_NOT_AUTHORITY' ||
      !EXACT(manifest.projections.create_state, ['model_id', 'required_state']) ||
      !/^[0-9a-f-]{36}$/.test(manifest.projections.create_state.model_id) ||
      manifest.projections.create_state.required_state !== 'INDEX_NOT_AUTHORITY' ||
      !EXACT(manifest.projections.drive, ['required_state']) ||
      manifest.projections.drive.required_state !== 'INDEPENDENT_RECOVERY_COPY')
    fail('SNAPSHOT_PROJECTIONS');
  return manifest;
}

function gitBlob(buffer) {
  return createHash('sha1').update('blob ' + buffer.length + '\0').update(buffer).digest('hex');
}

function verifyArtifacts(manifest, root) {
  verifyShape(manifest);
  const results = [];
  for (const entry of manifest.artifacts) {
    const full = path.resolve(root, entry.path), prefix = path.resolve(root, 'docs') + path.sep;
    if (!full.startsWith(prefix)) fail('SNAPSHOT_PATH_ESCAPE');
    let bytes;
    try {
      if (fs.lstatSync(full).isSymbolicLink()) fail('SNAPSHOT_SYMLINK');
      bytes = fs.readFileSync(full);
    } catch (err) {
      if (err.message === 'SNAPSHOT_SYMLINK') throw err;
      results.push({path: entry.path, role: entry.role, status: 'MISSING'});
      continue;
    }
    const actual = gitBlob(bytes);
    results.push({path: entry.path, role: entry.role,
      status: actual === entry.git_blob_sha ? 'MATCH' : 'CONFLICT',
      expected_git_blob_sha: entry.git_blob_sha, observed_git_blob_sha: actual});
  }
  const byRole = Object.fromEntries(results.map(item => [item.role, item]));
  if (byRole.PRIMARY_HANDOFF.status === 'MATCH' && byRole.HISTORICAL_HANDOFF.status === 'MATCH') {
    const primary = fs.readFileSync(path.resolve(root, byRole.PRIMARY_HANDOFF.path), 'utf8');
    const historic = fs.readFileSync(path.resolve(root, byRole.HISTORICAL_HANDOFF.path), 'utf8');
    const primaryGood = primary.includes('15 planned. Formal Arc III sign-offs: 0/15') &&
      primary.includes('Floot') && primary.includes('Do not automatically start Pass 1');
    const historicGood = historic.includes('15 planned conceptual passes') &&
      historic.includes('Formally closed Arc III passes:') &&
      historic.includes('Floot is parked');
    if (!primaryGood || !historicGood)
      return {status:'CONFLICT', artifacts:results, campaign:'CONFLICT'};
  }
  const passed = results.every(item => item.status === 'MATCH');
  return {status:passed?'MATCH': 'CONFLICT', artifacts:results,
    campaign:passed?'RECONCILED_15_PLANNED_ZERO_CLOSED':'UNKNOWN'};
}

// For real connector results, only the caller can obtain them from authenticated
// provider readbacks. Do not use a hand-authored "verified:true" flag as proof.
function projectionCheck(manifest, provider, observedText) {
  verifyShape(manifest);
  if (!['notion', 'create_state', 'drive'].includes(provider)) fail('PROJECTION_PROVIDER');
  if (observedText === undefined || observedText === null) return {provider,status:'UNKNOWN'};
  if (typeof observedText !== 'string' || observedText.length > 1_000_000)
    fail('PROJECTION_PAYLOAD');
  const primary = manifest.artifacts.find(x => x.role === 'PRIMARY_HANDOFF');
  const anchor = manifest.anchor_commit_sha;
  const pathOk = observedText.includes(primary.path);
  const anchorOk = observedText.includes(anchor);
  const idOk = observedText.includes(manifest.checkpoint_id);
  if (!(pathOk && anchorOk && idOk)) return {
    provider, status:'CONFLICT',
    missing: ['primary_path', 'anchor_commit_sha', 'checkpoint_id']
      .filter((v, i) => ![pathOk, anchorOk, idOk][i])
  };
  return {provider,status:'POINTER_MATCH_ONLY'};
}

function audit(manifest, root, readbacks = {}) {
  const local = verifyArtifacts(manifest, root);
  const keys = ['notion','create_state','drive'];
  const projections = keys.map(key=>projectionCheck(manifest,key,readbacks[key]));
  // A text pointer can match yet be unauthenticated, corrupted, expired or stale.
  // This does not upgrade to cross-provider integrity success by itself.
  const conflict = local.status !== 'MATCH' || projections.some(x=>x.status==='CONFLICT');
  return {schema:'atlas.mastersave.audit.v1',checkpoint_id:manifest.checkpoint_id,
    status:conflict?'CONFLICT':'LOCAL_VERIFIED_EXTERNAL_NOT_PROVEN',
    local,projections,ci_live_verified:false,
    production_approved:false,automatic_betting:false,
    arc_iii_passes_formally_closed:0};
}

if (require.main === module) {
  const manifestFile = process.argv[2];
  if (!manifestFile) { process.stderr.write('Usage: node verify-checkpoint.cjs <manifest.json>\n'); process.exitCode=2; }
  else {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestFile,'utf8'));
      const repoRoot = path.resolve(__dirname,'../..');
      const result = audit(manifest,repoRoot);
      process.stdout.write(JSON.stringify(result,null,2)+'\n');
      if (result.local.status !== 'MATCH') process.exitCode=1;
    } catch(err) { process.stderr.write('CHECKPOINT_INVALID: '+err.message+'\n'); process.exitCode=1; }
  }
}
module.exports=Object.freeze({VERSION,verifyShape,gitBlob,verifyArtifacts,projectionCheck,audit});
