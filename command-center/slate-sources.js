/* ATLAS Run the Slate: authenticated, read-only source surface.
 * Original 2026-10-11 frontend draft state and Final Gate are untouched.
 * The server is the only owner of canonical data; no API keys reside here.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AtlasSlateSources=api;
  if(root && root.document && typeof root.addEventListener==='function'){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.mount(root));
    else api.mount(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const ENDPOINT='https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-site-runtime';
  const CONTRACT='ATLAS_SLATE_SOURCES_READ_V1';
  const FRESH_MILLIS=15*60000;
  const clean=s=>typeof s==='string'?s.trim():'';
  const validDay=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
     Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const ageOk=(time,now)=>typeof time==='string' && Number.isFinite(Date.parse(time)) &&
     Date.parse(time)<=now+60000 && Date.parse(time)>=now-FRESH_MILLIS;
  function safeHeaders(headers){
    if(!headers||typeof headers!=='object'||Array.isArray(headers))return null;
    const entries=Object.entries(headers);
    if(!entries.some(([k,v])=>['authorization','x-atlas-site-token'].includes(k.toLowerCase())&&typeof v==='string'&&v.length>0))return null;
    if(entries.some(([k,v])=>!['authorization','x-atlas-site-token','apikey','x-client-info'].includes(k.toLowerCase())||typeof v!=='string'))return null;
    return Object.fromEntries(entries);
  }
  function normalize(body,{slateDate,league,now}){
    if(!body||body.ok!==true||body.contract!==CONTRACT||body.mode!=='slate_sources'||
      body.league!==league||body.slate_date!==slateDate||
      body.execution_authority!==false||body.human_final_gate_required!==true||
      body.paid_api_requests!==0||!Array.isArray(body.canonical_events)||!Array.isArray(body.slate_candidates)||
      !body.source_states||typeof body.source_states!=='object')
      return {status:'CONTRACT_REJECTED',events:[],execution_authority:false};
    const base={
      status:'RESEARCH_ONLY',slate_date:slateDate,league,
      source_states:{draftkings:clean(body.source_states.draftkings),flaim:clean(body.source_states.flaim),slate2:clean(body.source_states.slate2)},
      counts:{canonical_events:0,native_candidates:0,dk_quotes:0,fantasy_leads:0},
      events:[],execution_authority:false,approved_bet:null,executable_price_verified:false,
      human_final_gate_required:true,paid_api_requests:0
    };
    const seen=new Set();
    for(const e of body.canonical_events.slice(0,100)){
      if(!e||!clean(e.id)||!clean(e.away_team)||!clean(e.home_team)||e.league!==league||e.event_date!==slateDate||seen.has(e.id))continue;
      seen.add(e.id);
      base.events.push({id:clean(e.id),away_team:clean(e.away_team),home_team:clean(e.home_team),
        start_time:clean(e.start_time),identity_status:e.reconciliation_status==='reconciled'?'RECONCILED':'CANONICAL_PENDING',
        dk_quotes:[],candidate_count:0,betting_authority:false});
    }
    const byId=new Map(base.events.map(e=>[e.id,e]));
    for(const c of body.slate_candidates.slice(0,150)){
      if(c?.league!==league||!clean(c?.candidate_key))continue;
      const target=byId.get(c.event_id);
      if(target)target.candidate_count++;
    }
    base.counts.canonical_events=base.events.length;
    base.counts.native_candidates=base.events.reduce((n,e)=>n+e.candidate_count,0);
    const odds=body.odds_report;
    if(odds && (!ageOk(odds.observed_at,now)||base.source_states.draftkings!=='FRESH_RESEARCH'||
      odds.contract!=='ATLAS_DK_FIRST_SHADOW_V1'||odds.execution_authority!==false||
      odds.primary_book!=='draftkings'||odds.approved_bet!==null||odds.expected_value!==null||
      !Array.isArray(odds.events))){
      base.source_states.draftkings='STALE_OR_INVALID_CLIENT';
      return base;
    }
    if(!odds||base.source_states.draftkings!=='FRESH_RESEARCH')return base;
    for(const o of odds.events.slice(0,80)){
      const match=byId.get(o?.canonical_event_id);
      if(!match||match.away_team!==o.away_team||match.home_team!==o.home_team||
        !Number.isFinite(Date.parse(o.commence_time))||!Number.isFinite(Date.parse(match.start_time))||
        Math.abs(Date.parse(o.commence_time)-Date.parse(match.start_time))>15*60000)continue;
      const seenQuotes=new Map(),proposed=[];
      for(const q of (Array.isArray(o.primary_quotes)?o.primary_quotes:[]).slice(0,500)){
        const market=Array.isArray(q)?q[0]:q.m;
        const side=Array.isArray(q)?q[1]:q.s;
        const line=Array.isArray(q)?q[2]:q.l;
        const price=Array.isArray(q)?q[3]:q.o;
        const at=Array.isArray(q)?q[4]||o.market_last_update?.[market]:q.t||o.market_last_update?.[market];
        if(!['h2h','spreads','totals','player_points_alternate','player_threes_alternate'].includes(market)||
          typeof side!=='string'||!Number.isInteger(price)||Math.abs(price)<100||Math.abs(price)>10000||
          !(line===null||line===undefined||typeof line==='number'&&Number.isFinite(line))||!ageOk(at,now))continue;
        const key=JSON.stringify([market,side,line??null]);
        seenQuotes.set(key,(seenQuotes.get(key)||0)+1);
        proposed.push({key,market,selection:side,line:line??null,american_odds:price,observed_at:at,
          primary_book:'DraftKings',executable_price_verified:false});
      }
      for(const q of proposed)if(seenQuotes.get(q.key)===1&&match.dk_quotes.length<40){
        match.dk_quotes.push({market:q.market,selection:q.selection,line:q.line,
          american_odds:q.american_odds,observed_at:q.observed_at,primary_book:'DraftKings',
          executable_price_verified:false});
      }
    }
    base.counts.dk_quotes=base.events.reduce((n,e)=>n+e.dk_quotes.length,0);
    return base;
  }
  async function read({slateDate,league='NBA',getSessionHeaders,transport,now=Date.now()}={}){
    if(!validDay(slateDate)||!['NBA','NFL'].includes(league))return {status:'INVALID_SCOPE',events:[],execution_authority:false};
    if(typeof getSessionHeaders!=='function')return {status:'OPERATOR_CONNECTION_REQUIRED',events:[],execution_authority:false};
    let headers;
    try{headers=safeHeaders(await getSessionHeaders())}catch{}
    if(!headers)return {status:'OPERATOR_CONNECTION_REQUIRED',events:[],execution_authority:false};
    const fetcher=typeof transport==='function'?transport:typeof fetch==='function'?fetch:null;
    if(!fetcher)return {status:'NETWORK_UNAVAILABLE',events:[],execution_authority:false};
    const url=new URL(ENDPOINT);
    url.searchParams.set('mode','slate_sources');url.searchParams.set('league',league);url.searchParams.set('slate_date',slateDate);
    let response;
    try{response=await fetcher(url.toString(),{method:'GET',headers,cache:'no-store'})}
    catch{return {status:'NETWORK_UNAVAILABLE',events:[],execution_authority:false}}
    if(response.status===401||response.status===403)return {status:'UNAUTHORIZED',events:[],execution_authority:false};
    if(!response.ok)return {status:'SOURCE_UNAVAILABLE',events:[],execution_authority:false};
    let json;
    try{json=await response.json()}catch{return {status:'CONTRACT_REJECTED',events:[],execution_authority:false}}
    return normalize(json,{slateDate,league,now});
  }
  function mount(root){
    const doc=root.document,host=doc.getElementById('slate-sources');
    if(!host||host.dataset.initialized==='true')return;
    host.dataset.initialized='true';
    const button=doc.getElementById('slate-source-refresh'),label=doc.getElementById('slate-source-status');
    const results=doc.getElementById('slate-source-results');
    if(!button||!label||!results)return;
    function line(container,text){
      const p=doc.createElement('p');p.className='small muted';p.textContent=text;container.appendChild(p);
    }
    async function refresh(){
      const h=doc.getElementById('run-label');
      const active=h&&h.closest('#active-slate')?.hidden===false;
      const pieces=active?(h.textContent||'').split('/').map(x=>x.trim()):[];
      const sport=active?pieces[0]:doc.getElementById('quick-run-sport')?.value;
      const date=active?pieces[1]:doc.getElementById('quick-run-date')?.value;
      results.replaceChildren();
      if(!['NBA','NFL'].includes(sport)){label.textContent='Source read supports NBA/NFL. Other sports stay in the existing local research workflow.';return}
      label.textContent='Checking ATLAS evidence (read only)…';
      const config=root.AtlasSlateSourcesConfig||{};
      const snapshot=await read({slateDate:date,league:sport,getSessionHeaders:config.getSessionHeaders,transport:config.transport});
      const states=snapshot.source_states||{};
      label.textContent=snapshot.status==='RESEARCH_ONLY'?
        sport+' '+date+' · DK '+(states.draftkings||'MISSING')+' · Flaim '+(states.flaim||'MISSING'):
        ({
          OPERATOR_CONNECTION_REQUIRED:'ATLAS operator connection not configured. Local draft works; no remote data read.',
          UNAUTHORIZED:'Operator access denied; no source data loaded.',
          NETWORK_UNAVAILABLE:'Source network unavailable; check the connection.',
          SOURCE_UNAVAILABLE:'ATLAS source endpoint unavailable.',
          CONTRACT_REJECTED:'ATLAS source contract rejected; nothing imported.',
          INVALID_SCOPE:'Choose a valid slate date.'
        }[snapshot.status]||'Read-only source unavailable');
      if(snapshot.status!=='RESEARCH_ONLY')return;
      line(results,snapshot.counts.canonical_events+' canonical events · '+snapshot.counts.native_candidates+
        ' native candidates · '+snapshot.counts.dk_quotes+' current DK reference quotes');
      if(snapshot.events.length===0){line(results,'No registered games for this slate. No players or odds were invented.');return;}
      for(const e of snapshot.events){
        const card=doc.createElement('div');card.className='panel';
        const title=doc.createElement('strong');title.textContent=e.away_team+' @ '+e.home_team;
        card.appendChild(title);
        line(card,e.identity_status+' · '+e.candidate_count+' native candidates · '+e.dk_quotes.length+' DK reference quotes');
        for(const quote of e.dk_quotes.slice(0,5)){
          line(card,quote.market+' · '+quote.selection+(quote.line===null?'':' '+quote.line)+
            ' · '+(quote.american_odds>0?'+':'')+quote.american_odds+' (research, not executable)');
        }
        results.appendChild(card);
      }
    }
    button.addEventListener('click',refresh);
    const continueButton=doc.getElementById('continue-slate');
    if(continueButton)continueButton.addEventListener('click',()=>{
      const label=doc.getElementById('run-label');
      if(label&&doc.getElementById('active-slate')?.hidden===false)refresh();
    });
    label.textContent='Read-only source connection pending. Local slate draft works without it.';
  }
  return {CONTRACT,ENDPOINT,normalize,read,mount};
});