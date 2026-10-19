'use strict';
// Deterministic ATLAS private preview packaging. No credentials, no deploy.
// Run: node scripts/remote/package-private-preview.cjs <destination>
// The destination must not be the repository or any source directory.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const files=Object.freeze({
 'index.html':'command-center/operator-private-index.html',
 'operator-remote.html':'command-center/operator-remote.html',
 'operator-status.html':'command-center/operator-status.html',
 'operator-status.css':'command-center/operator-status.css',
 'operator-status.js':'command-center/operator-status.js',
 'operator-continuity.js':'command-center/operator-continuity.js',
 'operator-continuity.css':'command-center/operator-continuity.css',
 'operator-remote.webmanifest':'command-center/operator-remote.webmanifest',
 'operator-icons/icon-192.png':'command-center/operator-icons/icon-192.png',
 'operator-icons/icon-512.png':'command-center/operator-icons/icon-512.png',
 'vercel.json':'command-center/operator-private-vercel.json',
 'scripts/remote/github-public-status.cjs':'scripts/remote/github-public-status.cjs',
 'scripts/remote/vercel-status.mjs':'scripts/remote/vercel-status.mjs'
});
const normalize=(p)=>path.resolve(p)+path.sep;
const rootBound=normalize(root);
function build(outDir){
 if(typeof outDir!=='string'||outDir.length===0)throw Error('DESTINATION_REQUIRED');
 const out=path.resolve(outDir);
 const normalized=normalize(out);
 if(out===root||rootBound.startsWith(normalized)||out===path.parse(out).root)
  throw Error('UNSAFE_OUTPUT_DESTINATION');
 // No overlapping source directories; destination can be a workspace subfolder
 // but may not write over source code paths.
 for(const source of Object.values(files)){
  const absolute=path.join(root,source);
  if(normalize(absolute).startsWith(normalized))throw Error('DESTINATION_OVERLAPS_SOURCE');
 }
 if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('DESTINATION_NOT_EMPTY');
 const content={};
 for(const [dest,source] of Object.entries(files)){
  const absolute=path.resolve(root,source);
  if(!absolute.startsWith(rootBound))throw Error('SOURCE_OUTSIDE_REPOSITORY');
  content[dest]=fs.readFileSync(absolute);
 }
 const input=content['operator-remote.html'].toString('utf8');
 const match=input.match(/<script>([\s\S]*?)<\/script>/g);
 if(!match||match.length!==1)throw Error('EXPECTED_SINGLE_INLINE_SCRIPT');
 const inside=match[0].slice('<script>'.length,-'</script>'.length);
 if(!inside.includes('ATLAS OPERATOR REMOTE v2'))throw Error('UNEXPECTED_REMOTE_SCRIPT');
 const policy="script-src 'unsafe-inline'";
 if(input.split(policy).length!==2)throw Error('UNEXPECTED_SOURCE_CSP');
 let processed=input.replace(policy,"script-src 'self'");
 processed=processed.replace(match[0],'<script defer src="./operator-remote.js"></script>');
 if(processed.includes('<script>')||processed.includes("script-src 'unsafe-inline'"))
  throw Error('INLINE_SCRIPT_REMAINS');
 content['operator-remote.html']=Buffer.from(processed);
 content['operator-remote.js']=Buffer.from(inside);
 content['api/status.mjs']=Buffer.from("export { default } from '../scripts/remote/vercel-status.mjs';\n");
 // Strictly prevent accidental Vercel auto-link, hidden env, or write-capable plugins.
 const manifest=JSON.parse(content['operator-remote.webmanifest'].toString('utf8'));
 if(manifest.start_url!=='./operator-remote.html'||manifest.scope!=='./')
  throw Error('UNEXPECTED_MANIFEST_SCOPE');
 const config=JSON.parse(content['vercel.json'].toString('utf8'));
 if(config.version!==2||!Array.isArray(config.headers))throw Error('UNEXPECTED_VERCEL_CONFIG');
 if(!content['scripts/remote/vercel-status.mjs'].toString().includes('write_authority:false'))
  throw Error('MISSING_READ_ONLY_FLAG');
 const destinations=Object.keys(content).sort();
 for(const name of destinations){
  const target=path.resolve(out,name);
  if(!target.startsWith(normalize(out)))throw Error('PATH_TRAVERSAL');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,content[name],{flag:'wx'});
 }
 const entries=destinations.map(file=>({
  file,
  bytes:content[file].length,
  sha256:crypto.createHash('sha256').update(content[file]).digest('hex')
 }));
 const receipt={
  schema:'atlas.private-preview.package.v1',
  created_from:'local checked-out ATLAS review-branch source (not a live authorization claim)',
  deployment:'NOT_DEPLOYED',
  login:'REQUIRES_VERCEL_AUTH_ALL_DEPLOYMENTS',
  readonly:true,
  files:entries
 };
 fs.writeFileSync(path.join(out,'atlas-package-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 return receipt;
}
if(require.main===module){
 try{
  const receipt=build(process.argv[2]);
  process.stdout.write(JSON.stringify({state:'PACKAGED_NOT_DEPLOYED',files:receipt.files.length})+'\n');
 }catch(err){process.stderr.write(String(err.message)+'\n');process.exitCode=1;}
}
module.exports=Object.freeze({build,files});
