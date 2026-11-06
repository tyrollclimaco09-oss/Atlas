/* ATLAS Cortex V9: independent read-only frontend bridge for recovered source. No credential storage. */
(function(root){
  'use strict';
  const endpoint='https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-cortex-read-v9';
  const modes=['manifest','receipts','health'];
  function safeHeaders(h){
    if(!h || typeof h!=='object' || Array.isArray(h))return null;
    const entries=Object.entries(h);
    if(!entries.some(([k,v])=>['authorization','x-atlas-site-token'].includes(k.toLowerCase())&&typeof v==='string'&&v.trim().length>0))return null;
    if(entries.some(([k,v])=>!['authorization','x-atlas-site-token','apikey','x-client-info'].includes(k.toLowerCase())||typeof v!=='string'))return null;
    return Object.fromEntries(entries);
  }
  function validate(payload,mode){
    if(!payload||payload.ok!==true||payload.scope!=='ATLAS_CORTEX_V9_LAB'||payload.mode!==mode||
      payload.execution_authority!==false||payload.production_authority!==false||
      payload.human_final_gate_required!==true)return null;
    if(mode==='manifest' && (!Array.isArray(payload.modules)||payload.modules.some(x=>!x.feature_key||!x.owner_node||x.production_authority!==false)))return null;
    if(mode==='receipts' && (!Array.isArray(payload.receipts)||payload.receipts.some(x=>x.production_authority!==false)))return null;
    if(mode==='health' && (!Number.isInteger(payload.registered_module_count)||payload.live_origin_verified!==false||
      payload.book_account_price_verified!==false))return null;
    return payload;
  }
  async function read({mode='manifest',getSessionHeaders,transport}={}){
    if(!modes.includes(mode))return {status:'INVALID_MODE'};
    if(typeof getSessionHeaders!=='function')return {status:'OPERATOR_CONNECTION_REQUIRED'};
    let headers; try{headers=safeHeaders(await getSessionHeaders())}catch{}
    if(!headers)return {status:'OPERATOR_CONNECTION_REQUIRED'};
    const fetcher=typeof transport==='function'?transport:typeof fetch==='function'?fetch:null;
    if(!fetcher)return {status:'NETWORK_UNAVAILABLE'};
    let response;try{response=await fetcher(endpoint+'?mode='+encodeURIComponent(mode),{method:'GET',headers,cache:'no-store'})}catch{return {status:'NETWORK_UNAVAILABLE'}}
    if(response.status===401||response.status===403)return {status:'UNAUTHORIZED'};
    if(!response.ok)return {status:'SOURCE_UNAVAILABLE'};
    let result;try{result=await response.json()}catch{return {status:'CONTRACT_REJECTED'}}
    const verified=validate(result,mode);
    return verified?{status:'RESEARCH_READ_ONLY',data:verified}:{status:'CONTRACT_REJECTED'};
  }
  function mount(ctx){
    const doc=ctx.document,anchor=doc&&doc.getElementById('slate-sources');
    if(!anchor || doc.getElementById('atlas-cortex-v9'))return;
    const panel=doc.createElement('section');panel.id='atlas-cortex-v9';panel.className='panel';
    panel.setAttribute('aria-label','ATLAS Cortex V9 research modules');
    const heading=doc.createElement('h2');heading.textContent='ATLAS Cortex · Research integration';
    const note=doc.createElement('p');note.className='small muted';note.textContent='Verified database module registry. Research-only, no executable sportsbook prices or betting authority.';
    const actions=doc.createElement('div');actions.className='action-row';
    const label=doc.createElement('p');label.className='small muted';label.setAttribute('role','status');label.setAttribute('aria-live','polite');label.textContent='Operator session required to read Cortex status.';
    const results=doc.createElement('div');results.setAttribute('aria-label','Cortex evidence readback');
    function line(message){const p=doc.createElement('p');p.className='small muted';p.textContent=message;results.appendChild(p)}
    async function show(mode){
      label.textContent='Reading '+mode+'…';results.replaceChildren();
      const config=ctx.AtlasSlateSourcesConfig||{};
      const result=await read({mode,getSessionHeaders:config.getSessionHeaders,transport:config.transport});
      if(result.status!=='RESEARCH_READ_ONLY'){label.textContent='Cortex: '+result.status+' · no live authority';return;}
      label.textContent='Cortex '+mode+' — read-only evidence; betting gate closed';
      if(mode==='health')line('Registered modules: '+result.data.registered_module_count+' · Live site/origin, executable quotes, and calibrated models not certified.');
      if(mode==='manifest'){
        for(const item of result.data.modules.slice(0,30))line(item.owner_node+' · '+item.feature_key+' · '+item.state+' · PR #'+item.source_pr);
        if(!result.data.modules.length)line('No validated module registrations were returned.');
      }
      if(mode==='receipts'){
        for(const item of result.data.receipts.slice(0,25))line(item.receipt_key+' · '+item.evidence_status+' · '+item.evidence_type);
        if(!result.data.receipts.length)line('No integration receipts were returned.');
      }
    }
    for(const [mode,caption] of [['health','Check connection'],['manifest','Explore nodes'],['receipts','Proof receipts']]){
      const button=doc.createElement('button');button.className='button secondary';button.type='button';button.textContent=caption;button.addEventListener('click',()=>{void show(mode)});actions.appendChild(button);
    }
    panel.append(heading,note,actions,label,results);anchor.insertAdjacentElement('afterend',panel);
  }
  const api={read,validate,safeHeaders,mount};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.AtlasCortexBridge=api;if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>mount(root));else mount(root)}}
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null);