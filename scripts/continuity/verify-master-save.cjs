'use strict';

// ATLAS MasterSave portable integrity checker, offline and review-only.
// No connectors, API keys, network, deployment actions or execution authority.
// The snapshot is a *point-in-time* branch artifact, not a live-app assertion.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');

const VERSION='atlas.mastersave.snapshot.v1';
const SHA=/^[0-9a-f]{40}$/;
const SAFE_PATH=/^docs\/[A-Za-z0-9_.\/-]+\.md$/;
const keys=(obj,required)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).length===required.length&&required.every(k=>Object.hasOwn(obj,k));
const readonly=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(readonly);Object.freeze(value);}return value;};

function assertManifest(m){
  const root=['schema_version','review_only','snapshot_id','recorded_at_utc','repository',
    'branch','source_commit','files','arc','ci','mirrors','operational_claims'];
  if(!keys(m,root)||m.schema_version!==VERSION||m.review_only!==true||
    m.repository!=='tyrollclimaco09-oss/Atlas'||
    m.branch!=='review/pass0-slate-regression-2026-10-16'||
    !/^atlas-[a-z0-9-]+$/.test(m.snapshot_id)||!SHA.test(m.source_commit)||
    !Number.isFinite(Date.parse(m.recorded_at_utc)))throw Error('MANIFEST_ROOT');
  if(!Array.isArray(m.files)||m.files.length!==2)throw Error('MANIFEST_FILES');
  const paths=new Set();
  for(const item of m.files){
    if(!keys(item,['path','git_blob_sha1'])||!SAFE_PATH.test(item.path)||
      item.path.includes('..')||item.path.includes('//')||paths.has(item.path)||
      !SHA.test(item.git_blob_sha1))throw Error('MANIFEST_FILE_IDENTITY');
    paths.add(item.path);
  }
  for(const must of ['docs/ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md',
    'docs/ATLAS_CONTINUITY_PLUGIN_ARCHITECTURE_2026-10-18.md'])
    if(!paths.has(must))throw Error('MANIFEST_REQUIRED_SOURCE');
  if(!keys(m.arc,['name','passes_planned','formal_passes_closed','floot'])||
    m.arc.name!=='Arc III — The Reality Forge'||m.arc.passes_planned!==15||
    m.arc.formal_passes_closed!==0||m.arc.floot!=='PARKED')throw Error('MANIFEST_ARC');
  if(!keys(m.ci,['recorded_run_id','recorded_head_sha','recorded_conclusion','verification'])||
    !/^\d+$/.test(m.ci.recorded_run_id)||m.ci.recorded_head_sha!==m.source_commit||
    m.ci.recorded_conclusion!=='success'||
    m.ci.verification!=='POINT_IN_TIME_ONLY')throw Error('MANIFEST_CI');
  if(!keys(m.mirrors,['notion','google_drive','create_state'])||
    Object.values(m.mirrors).some(v=>v!=='READBACK_REQUIRED'))throw Error('MANIFEST_MIRRORS');
  if(!keys(m.operational_claims,['production_promoted','verified_predictive_edge','automatic_betting'])||
    Object.values(m.operational_claims).some(x=>x!==false))throw Error('MANIFEST_AUTHORITY');
  return true;
}
function gitBlobSha1(text){
  const buf=Buffer.isBuffer(text)?text:Buffer.from(text,'utf8');
  return createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex');
}
function verifyFiles(manifest,readFile){
  assertManifest(manifest);
  if(typeof readFile!=='function')throw Error('MANIFEST_READER');
  const files=[], failures=[];
  for(const item of manifest.files){
    let bytes;
    try{bytes=readFile(item.path);if(!Buffer.isBuffer(bytes)&&typeof bytes!=='string')throw Error('BAD_BYTES');}
    catch{const issue={path:item.path,status:'MISSING_OR_UNREADABLE',expected_sha:item.git_blob_sha1};files.push(issue);failures.push(issue);continue;}
    const observed=gitBlobSha1(bytes);
    const status=observed===item.git_blob_sha1?'MATCH':'DRIFT';
    const issue={path:item.path,status,expected_sha:item.git_blob_sha1,observed_sha:observed};
    files.push(issue);
    if(status!=='MATCH')failures.push(issue);
  }
  return readonly({
    schema_version:VERSION,review_only:true,
    snapshot_id:manifest.snapshot_id,snapshot_commit:manifest.source_commit,
    status:failures.length?'BLOCKED_DRIFT':'VERIFIED_LOCAL_CONTENT',
    file_count:files.length,matched_files:files.length-failures.length,
    files,failures,
    recorded_ci_run:manifest.ci.recorded_run_id,live_ci_verification:'NOT_CHECKED',
    source_commit_authenticity:'NOT_CHECKED',
    external_mirrors:'NOT_CHECKED',
    production_promotion:false,execution_authority:false
  });
}
// Caller supplies fresh, user-authorized tool readbacks; do not confuse a string
// argument with connector attestation. A mismatch blocks promotion of a mirror.
function compareMirrors(manifest,sources,observed){
  assertManifest(manifest);
  const arc='docs/ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md';
  const graph='docs/ATLAS_CONTINUITY_PLUGIN_ARCHITECTURE_2026-10-18.md';
  if(!keys(sources,['arc','graph'])||typeof sources.arc!=='string'||typeof sources.graph!=='string')
    throw Error('MIRROR_SOURCES');
  if(!observed||typeof observed!=='object'||Array.isArray(observed))
    throw Error('MIRROR_OBSERVATIONS');
  const check=(name,predicates)=>{
    const raw=observed[name];
    if(raw===null||raw===undefined)return {surface:name,status:'NOT_CHECKED',reason:'MISSING_READBACK'};
    if(typeof raw!=='string')return {surface:name,status:'BLOCKED_CONFLICT',reason:'NON_TEXT_READBACK'};
    const match=predicates.every(x=>raw.includes(x));
    return {surface:name,status:match?'CONTENT_MATCH':'BLOCKED_CONFLICT',
      reason:match?'ALL_EXPECTED_MARKERS_PRESENT':'EXPECTED_MARKER_MISSING'};
  };
  const result=[
    check('notion',[arc,graph,manifest.source_commit]),
    check('google_drive',[sources.arc,sources.graph,manifest.source_commit]),
    check('create_state',[arc,manifest.source_commit])
  ];
  return readonly({
    schema_version:VERSION,review_only:true,
    surfaces:result,
    status:result.some(x=>x.status==='BLOCKED_CONFLICT')?'BLOCKED_CONFLICT':
      result.some(x=>x.status==='NOT_CHECKED')?'PARTIAL_UNVERIFIED':'CONSISTENT_READBACK_MARKERS',
    limitation:'CALLER_SUPPLIED_TEXT_ONLY_NOT_CONNECTOR_ATTESTATION',
    execution_authority:false
  });
}
function readRepoFile(root,p){
  const base=path.resolve(root);
  const target=path.resolve(base,p);
  if(!target.startsWith(base+path.sep))throw Error('MANIFEST_PATH_ESCAPE');
  return fs.readFileSync(target);
}
function runCli(){
  const root=path.resolve(__dirname,'../..');
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'master-save.snapshot.json'),'utf8'));
  const report=verifyFiles(manifest,p=>readRepoFile(root,p));
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.status!=='VERIFIED_LOCAL_CONTENT')process.exitCode=1;
}
if(require.main===module)runCli();
module.exports=Object.freeze({VERSION,assertManifest,gitBlobSha1,verifyFiles,compareMirrors,readRepoFile});
