(function(){
'use strict';
const $=id=>document.getElementById(id);
const statuses=new Set(['MATCH','PARTIAL','UNKNOWN','CONFLICT']);
const expected=[
 'Original baseline provenance',
 'Review code and regression suite',
 'Real Chromium archive smoke',
 'Offline SCOUT and Outcome Intelligence shadow',
 'MasterSave source integrity and drift denials'
];
let pending=false;
function renderRows(list){
 const root=$('job-list');root.replaceChildren();
 let passed=0;
 for(const name of expected){
  const match=Array.isArray(list)?list.filter(item=>item&&item.name===name):[];
  const entry=match.length===1?match[0]:null;
  const ok=entry&&entry.status==='completed'&&entry.conclusion==='success';
  if(ok)passed++;
  const li=document.createElement('li');
  li.className=ok?'pass':entry?.conclusion==='failure'?'fail':'pending';
  const label=document.createElement('span');label.textContent=name;
  const state=document.createElement('em');state.textContent=ok?'PASS':entry?.conclusion==='failure'?'FAIL':'UNVERIFIED';
  li.append(label,state);root.appendChild(li);
 }
 $('job-count').textContent=passed+'/5 succeeded';
 return passed;
}
function resetState(reason){
 $('state').textContent='UNKNOWN';$('state').dataset.status='UNKNOWN';
 $('reason').textContent=reason;
 $('sha').textContent='—';$('observed').textContent='—';
 $('ci').hidden=true;$('ci').removeAttribute('href');$('ci-empty').hidden=false;
 renderRows(null);
}
function setReport(data){
 if(!data||data.schema!=='atlas.remote.private-status.v1'||
    !statuses.has(data.result)||data.write_authority!==false||
    data.sportsbook_execution!==false||
    data.app_login!==false||
    data.auth_boundary!=='VERCEL_AUTH_ALL_DEPLOYMENTS_REQUIRED')
  throw Error('INVALID_RESPONSE_CONTRACT');
 const count=renderRows(data.jobs);
 let verdict=data.result;
 if(verdict==='MATCH'&&(!/^[a-f0-9]{40}$/.test(data.head_sha||'')||
   data.ci?.conclusion!=='success'||data.ci?.status!=='completed'||count!==5||
   !Array.isArray(data.sources)||data.sources.length!==4))verdict='UNKNOWN';
 $('state').textContent=verdict;$('state').dataset.status=verdict;
 $('reason').textContent=(typeof data.reason==='string'?data.reason:'UNKNOWN')+
  (verdict!==data.result?' (insufficient evidence for MATCH)':'');
 $('sha').textContent=/^[a-f0-9]{40}$/.test(data.head_sha||'')?data.head_sha:'—';
 const d=Date.parse(data.observed_at||'');
 $('observed').textContent=Number.isFinite(d)?new Date(d).toLocaleString():'Unknown';
 const id=data.ci?.run_id;
 if(Number.isSafeInteger(id)&&id>0&&id<1e16){
  const url='https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/'+id;
  $('ci').href=url;
  $('ci').hidden=false;$('ci-empty').hidden=true;
 } else {
  $('ci').hidden=true;$('ci').removeAttribute('href');$('ci-empty').hidden=false;
 }
}
async function refresh(){
 if(pending)return;
 pending=true;
 $('refresh').disabled=true;
 $('busy').textContent='Checking source…';
 try{
  const response=await fetch('./api/status',{method:'GET',credentials:'same-origin',
   cache:'no-store',redirect:'error',headers:{accept:'application/json'}});
  if(response.status===401||response.status===403)throw Error('Authentication required or access denied');
  if(![200,503].includes(response.status))throw Error('Endpoint unavailable (HTTP '+response.status+')');
  const type=response.headers.get('content-type')||'';
  if(!type.startsWith('application/json'))throw Error('Expected JSON; check Vercel sign-in');
  const data=await response.json();setReport(data);
 }catch(e){
  resetState('Unable to verify live status: '+(e?.message||'unknown failure'));
 }finally{
  pending=false;$('refresh').disabled=false;$('busy').textContent='';
 }
}
$('refresh').addEventListener('click',refresh);
refresh();
}());
