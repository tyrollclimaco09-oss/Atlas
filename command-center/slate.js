/* A guided, device-local draft workspace. No network calls or automatic inference. */
(function () {
  'use strict';
  const E=AtlasSlate, D=AtlasDiscovery, STORAGE='atlas.slate.draft.v1', DISCOVERY_STORAGE='atlas.discovery.census.v1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const $=id=>document.getElementById(id);
  let run=null,selected=null,stage=0,pendingImport=null,storageOK=true;
  let preferredChat='';try{preferredChat=localStorage.getItem('atlas.chat.url.v1')||'';}catch{}
  const stageCopy=[
    ['Find a candidate worth investigating.','Attach the event, exact selection, start time, and the reason it deserves a closer look.'],
    ['Check the facts that could change the read.','Open the source links. Record availability, market rules, and any material conflict. Imported research still needs your review.'],
    ['Build the case. Attack the case.','Record a defensible independent forecast and its strongest counter-case. Freeze it before you bring in prices.'],
    ['Make the price earn its place.','Compare public quotes proactively. Fair probability comes from the frozen forecast. A positive calculation does not verify the evidence.'],
    ['Decide when the read expires.','ACT needs a reason and a deadline. WAIT needs a concrete trigger; you can close this candidate as WATCH.'],
    ['Account for every dollar already exposed.','Enter current bankroll and open exposure. Confirmed candidates in this draft count toward the slate cap until explicitly reopened.'],
    ['Choose how to express the thesis.','Explain why this market is the best expression, how it can cash, and where its risks overlap.'],
    ['Confirm the exact book, price, and stake.','Attach the book screenshot and visually check it. This site cannot interpret images or place bets.']
  ];
  // field, label, type, help, options
  const config=[
    [['event','Event / matchup','text'],['selection','Exact selection','text'],['market','Market','select','',['Moneyline','Spread','Total','Player prop','Other']],['startsAt','Event start (your device time)','datetime-local'],['discovery','Why investigate?','textarea'],['source','Discovery source URL','url']],
    [['availability','Availability / role evidence','textarea'],['source','Availability source URL','url'],['checkedAt','Source checked at (your device time)','datetime-local','Refresh within 6 hours and after any material news.'],['rules','Market and settlement rules','textarea'],['unresolved','Material conflicts still unresolved','textarea','Leave blank only when there are none.'],['reviewed','I opened the sources and checked the facts.','checkbox']],
    [['thesis','ORACLE · strongest case','textarea'],['counter','EDGE THIEF · strongest counter-case','textarea'],['invalidation','What breaks the thesis?','textarea'],['method','Forecast method and model evidence','textarea','Explain opportunity, role, efficiency, assumptions, and model/source references.'],['probability','Independent fair probability (%)','number','A model estimate, not a confidence score. Unknown stays blank.'],['independence','Evidence of independence from market odds','textarea','Explain when and how the forecast was made without using this market’s price. An assertion alone is not external proof.'],['reviewed','I reviewed the forecast, counter-case, and independence evidence.','checkbox']],
    [['book','Book','text'],['line','Exact selection / line as displayed','text','Include the player or team, direction, and numeric line, where applicable.'],['odds','American odds','text'],['source','Public quote source URL','url'],['capturedAt','Quote captured at (your device time)','datetime-local'],['comparison','Cross-book comparison and acceptable price','textarea','Include source links, observation times, movement, and what number is too expensive.'],['noPush','I checked that this is a two-outcome market with no push/void in the model.','checkbox','Pushes, ties, dead heats, and combinations require a supported settlement model; they cannot pass this version.']],
    [['action','Timing decision','select','',['','ACT','WAIT']],['reason','Why act or wait?','textarea'],['expiresAt','Next review deadline (your device time)','datetime-local','Must be in the future and no later than the event start.'],['trigger','What triggers a new review?','textarea']],
    [['stake','Proposed stake ($)','number','Entered by you. This version does not calculate a recommended stake.'],['correlation','Existing position overlap and exposure','textarea'],['reviewed','I checked my balances, open positions, limits, and overlapping risk.','checkbox']],
    [['layer','Slate layer','select','',['FOUNDATION','EXPEDITION','CONSTELLATION','ORION']],['expression','Expression','select','',['Single','SGP','Parlay']],['reason','Why this expression beats alternatives','textarea'],['routes','Routes to cash and failure paths','textarea'],['correlation','Correlation and slate fit','textarea']],
    [['book','Book shown in screenshot','text'],['line','Exact selection / line shown','text'],['odds','American odds shown','text'],['stake','Stake you are confirming ($)','number'],['capturedAt','Screenshot captured at (your device time)','datetime-local'],['imageReviewed','I visually checked the screenshot against this exact event, selection, line, odds, and stake.','checkbox'],['infoReviewed','I rechecked late news, availability, and whether the thesis still holds.','checkbox'],['confirmed','I confirm this exact market and stake for my own execution.','checkbox']]
  ];
  function current(){return run?.candidates.find(x=>x.id===selected);}
  function toast(message,error=false){$('slate-status').textContent=message;$('slate-status').className=error?'error':'small muted';}
  function readDiscovery(){
    const raw=localStorage.getItem(DISCOVERY_STORAGE);
    return raw?D.importJSON(raw):D.empty();
  }
  function refreshDiscoveryCensus(){
    try{
      const count=D.census(readDiscovery());
      $('discovery-census').textContent=`Research archive · ${count.unique} unique candidates / ${count.observations} observations · this browser only`;
    }catch(e){$('discovery-census').textContent='Research archive unavailable · export existing browser data before continuing';}
  }
  let discoveryOffset=0;
  function renderDiscovery(){
    try{
      const result=D.page(readDiscovery(),{offset:discoveryOffset,limit:25,query:$('discovery-search').value});
      $('discovery-page-count').textContent=`${result.total} saved candidates · showing ${result.records.length?result.offset+1:0}–${result.offset+result.records.length} · research only`;
      $('discovery-results').innerHTML=result.records.map(r=>{
        const last=r.observations[r.observations.length-1];
        return `<div class="panel"><strong>${esc(r.scout.selection)}</strong><p class="small muted">${esc(r.scout.event)} · ${esc(r.scout.market)} · ${esc(r.scout.startsAt)}</p><p class="small muted">${r.observations.length} observation(s) · latest ${esc(last?.at||'unknown')}</p></div>`;
      }).join('')||'<p class="muted">No saved research matches this search.</p>';
      $('discovery-prev').disabled=discoveryOffset===0;
      $('discovery-next').disabled=discoveryOffset+result.records.length>=result.total;
    }catch(e){$('discovery-page-count').textContent='Discovery board unavailable: '+e.message;$('discovery-results').textContent='';}
  }
  function archiveResearchPacket(data){
    if(data.phase!=='research')return;
    // Fail closed: never claim an imported packet was archived if the local write failed.
    const next=D.ingest(readDiscovery(),data);
    localStorage.setItem(DISCOVERY_STORAGE,D.exportJSON(next));
    refreshDiscoveryCensus();
  }
  function persist(){
    if(!run)return;
    run.updatedAt=new Date().toISOString();
    try{localStorage.setItem(STORAGE,JSON.stringify(run));storageOK=true;}catch{storageOK=false;}
    $('draft-state').textContent=storageOK?'Temporary draft · this browser only':'Draft could not be saved · export before leaving';
    $('draft-state').className=storageOK?'small muted':'error';
  }
  function toLocal(value){if(!value||!Number.isFinite(Date.parse(value)))return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
  function inputDate(value){if(!value)return '';const d=new Date(value);return Number.isFinite(d.getTime())?d.toISOString():value;}
  function field(group,def,value,disabled=false){
    const [key,label,type,help='',options=[]]=def, ident='slate-'+group+'-'+key, attr=`id="${ident}" data-group="${group}" data-key="${key}" ${disabled?'disabled':''}`;
    if(type==='checkbox')return `<label class="run-check"><input type="checkbox" ${attr} ${value===true?'checked':''}><span>${esc(label)}${help?`<small>${esc(help)}</small>`:''}</span></label>`;
    let control=type==='textarea'?`<textarea ${attr} rows="3" maxlength="6000">${esc(value)}</textarea>`:type==='select'?`<select ${attr}>${options.map(o=>`<option value="${esc(o)}" ${value===o?'selected':''}>${esc(o||'Choose…')}</option>`).join('')}</select>`:`<input ${attr} type="${type}" ${type==='number'?'step="any" inputmode="decimal" min="0"':''} value="${esc(type==='datetime-local'?toLocal(value):value)}" ${type==='text'||type==='url'?'maxlength="6000"':''}>`;
    const nowKeys=['checkedAt','capturedAt','accountAt'];
    return `<div class="run-field ${type==='textarea'?'wide':''}"><div class="field-label"><label for="${ident}">${esc(label)}</label>${type==='datetime-local'&&nowKeys.includes(key)&&!disabled?`<button type="button" class="text-button" data-now="${ident}">Now</button>`:''}</div>${control}${help?`<p class="field-help">${esc(help)}</p>`:''}</div>`;
  }
  function selectOptions(values,selectedValue){return values.map(value=>`<option value="${esc(value)}" ${value===selectedValue?'selected':''}>${esc(value)}</option>`).join('');}
  function updateContinue(){
    const action=E.nextAction(run);$('continue-slate').textContent=action.label;$('continue-hint').textContent=action.hint;$('quick-run-options').hidden=!!run;
  }
  $('quick-run-date').value=E.newRun().date;
  $('continue-slate').addEventListener('click',()=>{
    let action=E.nextAction(run);
    if(action.action==='start'){
      if(!$('quick-run-date').reportValidity())return;
      run=E.newRun({date:$('quick-run-date').value,sport:$('quick-run-sport').value});selected=null;stage=0;
      E.log(run,'Quick slate started',null,{date:run.date,sport:run.sport});render();action={action:'research'};
    }
    if(action.action==='research'||action.action==='pricing'){
      const phase=action.action==='research'?'research':'pricing';
      showPrompt(phase);copyPrompt(true);return;
    }
    if(action.action==='import'){$('import-research').click();return;}
    if(action.action==='done'){exportDraft();return;}
    selected=action.id;stage=action.stage;render();
    if(action.action==='freeze'){try{E.seal(run,current());render();toast('Forecast frozen. Continue to review the next candidate or request prices.');}catch(e){toast(e.message,true);}return;}
    if(action.action==='revise'){$('revise-research').click();return;}
    if(action.action==='reopen'){$('reopen-candidate').click();return;}
    $('stage-title').scrollIntoView({block:'start',behavior:'instant'});
    $('stage-fields').querySelector('input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')?.focus({preventScroll:true});
  });
  function render(){
    updateContinue();
    $('no-slate').hidden=!!run;$('active-slate').hidden=!run;
    if(!run){$('draft-state').textContent='Start a slate or restore a draft file.';return;}
    $('run-label').textContent=`${run.sport} / ${run.date}`;
    $('run-meta').textContent=`${run.timezone} · ${run.books} · ${run.candidates.length}/${run.limit} candidates`;
    $('settings-fields').innerHTML=[
      field('run',['date','Slate date','date'],run.date),field('run',['sport','Sport','select','',['NFL','CFB','MLB','WNBA','NBA','NHL','Tennis','Soccer','Mixed']],run.sport),
      field('run',['timezone','Slate timezone','text'],run.timezone),field('run',['books','Books to compare','text'],run.books),
      field('run',['limit','Review workspace capacity','select','Discovery may continue across 1–8 candidate research batches; this is not a discovery ceiling.',[3,5,8,16,32,64]],Number(run.limit)),field('run',['quoteMinutes','Maximum quote age (minutes)','select','A review policy, not a guarantee of price availability.',[5,15,30,60]],Number(run.quoteMinutes)),
      field('run',['scope','Research focus / exclusions','textarea'],run.scope)
    ].join('');
    $('candidate-list').innerHTML=run.candidates.map(c=>{const ev=E.evaluate(run,c);return `<button type="button" class="candidate-option ${c.id===selected?'selected':''}" data-candidate="${esc(c.id)}" aria-pressed="${c.id===selected}"><span class="small muted">${esc(c.scout.event||'Event not entered')}</span><strong>${esc(c.scout.selection||'New candidate')}</strong><span class="tag ${c.approval?'amber':'neutral'}">${esc(ev.status)}</span></button>`;}).join('');
    $('add-candidate').disabled=run.candidates.length>=run.limit;
    $('pricing-handoff').disabled=!run.candidates.some(c=>c.sealed&&!c.disposition);
    $('empty-candidates').hidden=run.candidates.length>0;
    $('candidate-workspace').hidden=!current();
    renderStage();renderHistory();persist();
  }
  function renderStage(){
    const c=current();if(!c)return;
    const ev=E.evaluate(run,c),key=E.KEYS[stage],closed=!!c.disposition,locked=closed||(stage<3&&!!c.sealed)||!!c.approval;
    $('stage-nav').innerHTML=ev.stages.map((s,i)=>`<button type="button" data-stage="${i}" class="stage-tab ${i===stage?'active':''} ${s.status==='complete'?'done':''}" aria-current="${i===stage?'step':'false'}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(s.name)}</strong><small>${s.status==='complete'?'Evidence recorded':s.status==='waiting'?'Waiting':'Needs input'}</small></button>`).join('');
    $('stage-eyebrow').textContent=E.STAGES[stage];$('stage-title').textContent=stageCopy[stage][0];$('stage-help').textContent=stageCopy[stage][1];
    $('paste-stage').hidden=locked;
    $('copy-reviewed-quote').disabled=locked;
    $('stage-fields').innerHTML=config[stage].map(def=>field(key,def,c[key][def[0]],locked)).join('');
    $('risk-inputs').hidden=stage!==5;
    if(stage===5)$('risk-fields').innerHTML=[field('run',['bankroll','Total betting bankroll ($)','number','Total funds including open stakes. Use current balances; no old snapshot is assumed.'],run.bankroll,locked),field('run',['exposure','Already open stakes ($)','number','Existing bets outside this draft. Enter 0 explicitly if none.'],run.exposure,locked),field('run',['budget','Maximum new stake for this slate ($)','number'],run.budget,locked),field('run',['accountAt','Balances checked at (your device time)','datetime-local'],run.accountAt,locked)].join('');
    $('freeze-controls').hidden=stage!==2;
    $('freeze-research').hidden=!!c.sealed||closed;
    $('frozen-message').textContent=c.sealed?`Frozen ${new Date(c.sealed.at).toLocaleString()}. A revision preserves this earlier snapshot.`:'Freeze after reviewing the first three stages. Pricing imports cannot alter this forecast.';
    $('revise-research').hidden=!c.sealed||closed;
    $('quote-readout').hidden=stage!==3;
    $('screenshot-controls').hidden=stage!==7;
    $('screenshot-input').disabled=locked;
    $('screenshot-label').textContent=c.final.image?c.final.image.name:'No screenshot attached';
    const img=$('screenshot-preview');img.hidden=!c.final.image;if(c.final.image)img.src=c.final.image.data;else img.removeAttribute('src');
    $('clear-screenshot').hidden=!c.final.image;$('clear-screenshot').disabled=locked;
    $('confirm-final').hidden=stage!==7||closed||!!c.approval;
    $('previous-stage').disabled=stage===0;$('next-stage').disabled=stage===7;
    $('closed-note').hidden=!closed&&!c.approval;
    $('closed-text').textContent=closed?`${c.disposition.status}: ${c.disposition.reason}${c.disposition.trigger?' · Trigger: '+c.disposition.trigger:''}`:`Final Gate confirmed ${new Date(c.approval?.at).toLocaleString()}. This is a decision receipt, not proof of a placed bet.`;
    $('close-candidate').hidden=closed||!!c.approval;$('reopen-candidate').hidden=!closed&&!c.approval;
    updateReadout();
  }
  function updateReadout(){
    updateContinue();
    const c=current();if(!c)return;
    const ev=E.evaluate(run,c);$('candidate-state').textContent=ev.status;
    $('stage-nav').querySelectorAll('[data-stage]').forEach((button,i)=>{const s=ev.stages[i];button.classList.toggle('done',s.status==='complete');button.querySelector('small').textContent=s.status==='complete'?'Evidence recorded':s.status==='waiting'?'Waiting':'Needs input';});
    const issues=ev.stages[stage].issues;
    const earlier=ev.errors.slice(0,stage).some(x=>x.length);
    $('stage-issues').innerHTML=(earlier?'<li>Earlier stages still need evidence. You can prepare this step, but Final Gate stays closed.</li>':'')+issues.map(i=>`<li>${esc(i)}</li>`).join('');
    $('stage-issues').hidden=!issues.length&&!earlier;
    $('stage-clear').hidden=issues.length>0||earlier;
    $('confirm-final').disabled=!ev.ready;
    const calc=ev.calc;
    $('quote-readout').innerHTML=`<div><small>BREAK-EVEN</small><strong>${calc?(calc.breakEven*100).toFixed(2)+'%':'—'}</strong></div><div><small>FROZEN FAIR ESTIMATE</small><strong>${c.sealed?esc(c.sealed.oracle.probability)+'%':'—'}</strong></div><div><small>ESTIMATED NET / $1</small><strong>${calc&&calc.expected!==null?(calc.expected>=0?'+':'−')+E.money(Math.abs(calc.expected)):'—'}</strong></div><p class="small muted">Conditional on the forecast and market model. This is not an independently verified edge.</p>`;
    $('risk-summary').textContent=`Other confirmed stakes in this draft: ${E.money(ev.approved)}. Slate cap remaining before this candidate: ${E.money(ev.remaining)}.`;
    $('gate-summary').textContent=ev.ready?'All recorded checks are present. Review, then explicitly confirm.':`${ev.errors.flat().length} checks remain. Next: ${E.STAGES[Math.max(0,ev.next)]}.`;
    $('candidate-list').querySelectorAll('[data-candidate]').forEach(button=>{const item=run.candidates.find(x=>x.id===button.dataset.candidate);button.querySelector('strong').textContent=item.scout.selection||'New candidate';button.querySelector('.small').textContent=item.scout.event||'Event not entered';button.querySelector('.tag').textContent=E.evaluate(run,item).status;});
  }
  function renderHistory(){
    $('history-count').textContent=run?`${run.history.length} entries`:'';
    $('run-history').innerHTML=run?.history.length?run.history.slice().reverse().map(h=>`<li><strong>${esc(h.action)}</strong><span>${esc(new Date(h.at).toLocaleString())}</span><details><summary>Recorded detail</summary><pre>${esc(JSON.stringify(h.detail,(k,v)=>k==='data'&&typeof v==='string'&&v.startsWith('data:image')?'[Image included in exported draft]':v,2))}</pre></details></li>`).join(''):'<li class="muted">Imports, frozen research, decisions, and revisions appear here.</li>';
  }
  function saveField(target){
    if(!run||!target.dataset.group)return;
    const {group,key}=target.dataset,c=current();
    let value=target.type==='checkbox'?target.checked:target.type==='datetime-local'?inputDate(target.value):target.value;
    const hadApprovals=run.candidates.some(item=>item.approval);
    if(group==='run'){
      if(['limit','quoteMinutes'].includes(key))value=Number(value);
      if(key==='limit'&&value<run.candidates.length){toast('Shortlist size cannot be smaller than the current candidate count.',true);target.value=run.limit;return;}
      run[key]=value;run.pendingPhase=null;
      // Changes to common risk or scope invalidate every approval; keep a visible history record.
      run.candidates.forEach(item=>E.invalidate(run,item,'Slate settings or risk inputs changed'));
      $('run-meta').textContent=`${run.timezone} · ${run.books} · ${run.candidates.length}/${run.limit} candidates`;
      $('run-label').textContent=`${run.sport} / ${run.date}`;
      $('add-candidate').disabled=run.candidates.length>=run.limit;
    }else if(c){
      if(c.disposition||c.approval||(c.sealed&&['scout','verify','oracle'].includes(group)))return;
      if(c.final.confirmed&&!(group==='final'&&key==='confirmed'))c.final.confirmed=false;
      if(group==='final'&&!['imageReviewed','infoReviewed','confirmed'].includes(key))c.final.imageReviewed=false;
      c[group][key]=value;
      if(['pricing','kairos','sentinel','tactician'].includes(group)){c.final.confirmed=false;c.final.infoReviewed=false;}
    }
    if(c) $('stage-fields').querySelectorAll('input[type=checkbox]').forEach(input=>{input.checked=c[input.dataset.group][input.dataset.key]===true;});
    persist();
    if(group==='run'&&hadApprovals){renderStage();renderHistory();toast('Slate inputs changed. Previous Final Gate confirmations were invalidated and preserved in history.');}
    else updateReadout();
  }
  function showPrompt(phase){
    if(!run)return;
    if(phase==='pricing'&&!run.candidates.some(c=>c.sealed&&!c.disposition)){toast('Freeze research for a candidate first.',true);return;}
    $('handoff-title').textContent=phase==='research'?'1 · Research the slate':'2 · Research current prices';
    $('handoff-text').value=E.prompt(run,phase);
    run.pendingPhase=phase;persist();updateContinue();
    $('copy-result').textContent='Copy & open ChatGPT, paste the prompt there, then send it. Return to this tab to add the response.';
    $('chat-url').value=run.chatUrl||preferredChat;
    $('handoff-dialog').showModal();
    return true;
  }
  function chatDestination(){
    const value=$('chat-url').value.trim();
    if(!value)return 'https://chatgpt.com/';
    let url;try{url=new URL(value);}catch{throw Error('Use the https://chatgpt.com link to your ATLAS conversation.');}
    if(url.origin!=='https://chatgpt.com'||url.username||url.password||url.pathname.startsWith('/share/'))throw Error('Use your own chatgpt.com conversation link, not a shared conversation or another website.');
    return url.href;
  }
  function rememberChat(){
    preferredChat=$('chat-url').value.trim();run.chatUrl=preferredChat;persist();
    try{localStorage.setItem('atlas.chat.url.v1',preferredChat);}catch{}
  }
  async function copyPrompt(openChat=false){
    let destination;
    try{destination=chatDestination();}catch(e){$('copy-result').textContent=e.message;$('chat-destination').open=true;$('chat-url').focus();return;}
    rememberChat();
    $('open-chatgpt').href=destination;
    const text=$('handoff-text').value;
    $('copy-open-handoff').disabled=true;$('copy-handoff').disabled=true;$('continue-slate').disabled=true;
    $('copy-result').textContent='Copying your prompt…';
    try{
      await navigator.clipboard.writeText(text);
      if(openChat&&storageOK){
        $('copy-result').textContent='Copied. Opening ChatGPT. If this screen stays open, tap Open ChatGPT below. Paste and send there, then return to this saved slate.';
        try{window.location.assign(destination);}catch{$('copy-result').textContent='Prompt copied. Tap Open ChatGPT below. If this viewer blocks leaving, close the site with × and paste in your ChatGPT conversation.';}
      }else{
        $('copy-result').textContent=storageOK?'Copied. Open ChatGPT, paste and send.':'Prompt copied, but your slate could not be saved. Export your draft before leaving.';
      }
    }catch{
      $('prompt-details').open=true;$('handoff-text').focus();$('handoff-text').select();
      $('copy-result').textContent='Your browser blocked copying. Touch and hold the selected prompt and choose Copy. Then tap Open ChatGPT, or close the site with × to return to your conversation.';
    }finally{$('copy-open-handoff').disabled=false;$('copy-handoff').disabled=false;$('continue-slate').disabled=false;}
  }

  function download(content,name){
    const blob=new Blob([content],{type:'application/json'}),href=URL.createObjectURL(blob),link=document.createElement('a');link.href=href;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),10000);
  }
  function exportDraft(){if(run){download(JSON.stringify(run,null,2),`ATLAS-${run.date}-${run.id.slice(0,8)}.json`);toast('Draft exported with research, review history, and screenshots. It is not synced to the master Ledger.');}}
  function restore(raw){
    if(raw.length>16000000)throw Error('Draft exceeds 16 MB.');
    let d;try{d=JSON.parse(raw);}catch{throw Error('This file is not valid JSON.');}
    if(d?.schema!=='atlas.slate.v1'||typeof d.id!=='string'||!Array.isArray(d.candidates)||d.candidates.length>64||!Array.isArray(d.history))throw Error('Choose an ATLAS slate draft export.');
    const clean=E.newRun();
    for(const key of ['id','createdAt','updatedAt','date','timezone','sport','books','scope','bankroll','exposure','budget','accountAt','chatUrl'])if(typeof d[key]==='string'&&d[key].length<=6000)clean[key]=d[key];
    clean.handoffDrafts={};for(const phase of ['research','pricing'])if(typeof d.handoffDrafts?.[phase]==='string'&&d.handoffDrafts[phase].length<=1000000)clean.handoffDrafts[phase]=d.handoffDrafts[phase];
    if(['research','pricing'].includes(d.pendingPhase))clean.pendingPhase=d.pendingPhase;
    clean.limit=[3,5,8,16,32,64].includes(Number(d.limit))?Math.max(Number(d.limit),d.candidates.length):Math.max(16,d.candidates.length);
    clean.quoteMinutes=[5,15,30,60].includes(Number(d.quoteMinutes))?Number(d.quoteMinutes):15;
    const ids=new Set();
    clean.candidates=d.candidates.map(rawCandidate=>{
      const c=E.newCandidate();if(!rawCandidate||typeof rawCandidate!=='object')throw Error('Invalid candidate in draft.');
      if(typeof rawCandidate.id==='string'&&rawCandidate.id.length<200)c.id=rawCandidate.id;
      if(ids.has(c.id))throw Error('Duplicate candidate IDs in draft.');ids.add(c.id);
      for(const group of E.KEYS){const input=rawCandidate[group];if(!input||typeof input!=='object')throw Error('Draft candidate is missing '+group+'.');for(const key of Object.keys(c[group])){if(key==='image')continue;const val=input[key];if(typeof c[group][key]==='boolean')c[group][key]=false;else if(typeof val==='string'&&val.length<=6000)c[group][key]=val;}}
      const image=rawCandidate.final?.image;
      if(image&&typeof image.data==='string'&&image.data.length<3000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image.data))c.final.image={data:image.data,name:String(image.name||'Restored screenshot').slice(0,200)};
      // Imported files are untrusted drafts. Preserve prior snapshots as evidence; require all reviews anew.
      if(rawCandidate.sealed){clean.history.push({at:new Date().toISOString(),action:'Prior frozen research restored as evidence; re-review required',candidateId:c.id,detail:rawCandidate.sealed});c.pricing=E.newCandidate().pricing;c.final=E.newCandidate().final;}
      return c;
    });
    clean.history=[...d.history.filter(h=>h&&typeof h.at==='string'&&typeof h.action==='string').map(h=>({at:h.at,action:h.action.slice(0,200),candidateId:typeof h.candidateId==='string'?h.candidateId:null,detail:h.detail})),...clean.history];
    E.log(clean,'Draft restored; prior approvals and prices require fresh review',null,{sourceRun:d.id});return clean;
  }
  $('new-slate').addEventListener('click',()=>{$('new-date').value=E.newRun().date;$('new-warning').hidden=!run;$('new-dialog').showModal();});
  $('new-slate-empty').addEventListener('click',()=>$('new-slate').click());
  $('new-slate-form').addEventListener('submit',event=>{
    event.preventDefault();if(!event.currentTarget.reportValidity())return;
    if(run)exportDraft();
    run=E.newRun({date:$('new-date').value,sport:$('new-sport').value,scope:$('new-scope').value});selected=null;stage=0;
    E.log(run,'Slate draft started',null,{date:run.date,sport:run.sport,timezone:run.timezone});$('new-dialog').close();render();showPrompt('research');
  });
  $('add-candidate').addEventListener('click',()=>{if(!run||run.candidates.length>=run.limit)return;const c=E.newCandidate();run.candidates.push(c);selected=c.id;stage=0;E.log(run,'Manual candidate added',c,{});render();});
  $('candidate-list').addEventListener('click',event=>{const b=event.target.closest('[data-candidate]');if(b){selected=b.dataset.candidate;stage=Math.max(0,E.evaluate(run,current()).next);render();}});
  $('stage-nav').addEventListener('click',event=>{const b=event.target.closest('[data-stage]');if(b){stage=Number(b.dataset.stage);renderStage();}});
  $('previous-stage').addEventListener('click',()=>{if(stage>0){stage--;renderStage();}});
  $('next-stage').addEventListener('click',()=>{if(stage<7){stage++;renderStage();}});
  $('slate').addEventListener('input',event=>{if(event.target.matches('input:not([type=checkbox]),textarea'))saveField(event.target);});
  $('slate').addEventListener('change',event=>{if(event.target.matches('select,input[type=checkbox]'))saveField(event.target);});
  $('slate').addEventListener('click',event=>{const b=event.target.closest('[data-now]');if(b){const input=$(b.dataset.now);input.value=toLocal(new Date().toISOString());saveField(input);renderStage();}});
  $('freeze-research').addEventListener('click',()=>{try{E.seal(run,current());stage=3;render();toast('Research frozen. You can now request the pricing batch.');}catch(e){toast(e.message,true);}});
  $('revise-research').addEventListener('click',()=>{ $('revision-reason').value='';$('revision-dialog').showModal(); });
  $('revision-form').addEventListener('submit',event=>{
    event.preventDefault();const c=current(),reason=$('revision-reason').value.trim();if(!reason)return;
    E.log(run,'Research revision started',c,{reason,previous:E.copy(c)});E.invalidate(run,c,reason);c.sealed=null;c.revision++;
    c.pricing=E.newCandidate().pricing;c.kairos=E.newCandidate().kairos;c.final=E.newCandidate().final;c.verify.reviewed=false;c.oracle.reviewed=false;c.sentinel.reviewed=false;
    $('revision-dialog').close();stage=1;render();toast('Earlier snapshot preserved. Recheck the evidence and document independence before freezing again.');
  });
  $('research-handoff').addEventListener('click',()=>{if(showPrompt('research'))copyPrompt(true);});
  $('pricing-handoff').addEventListener('click',()=>{if(showPrompt('pricing'))copyPrompt(true);});
  $('copy-handoff').addEventListener('click',()=>copyPrompt());
  $('copy-open-handoff').addEventListener('click',()=>copyPrompt(true));
  $('open-chatgpt').addEventListener('click',event=>{try{event.currentTarget.href=chatDestination();rememberChat();}catch(e){event.preventDefault();$('copy-result').textContent=e.message;}});
  $('return-with-research').addEventListener('click',()=>{$('handoff-dialog').close();$('import-research').click();});
  let importTimer;
  function showReuseOption(){
    let eligible=false;
    try{const d=E.parse($('import-text').value);eligible=!!run&&d.schema==='atlas.research.v1'&&d.phase==='research'&&typeof d.runId==='string'&&!!d.runId.trim()&&d.runId!==run.id;}catch{}
    $('reuse-research-option').hidden=!eligible;
    if(!eligible)$('reuse-research').checked=false;
  }
  function checkImport(){
    if(run&&$('import-text').value.length<=1000000){run.handoffDrafts=run.handoffDrafts||{};run.handoffDrafts[run.pendingPhase||'research']=$('import-text').value;persist();}
    showReuseOption();
    $('repair-format').hidden=true;
    $('import-feedback').className='field-help';
    pendingImport=null;$('apply-import').disabled=false;$('import-candidates').textContent='';
    if(!$('import-text').value.trim()){$('import-feedback').textContent='Paste a response to preview the candidates.';return;}
    let parsed=false;
    try{
      const data=E.parse($('import-text').value);parsed=true;pendingImport=E.importResearch(run,$('import-text').value,Date.now(),$('reuse-research').checked===true);
      $('import-feedback').textContent=`${data.phase==='research'?'Add':'Update'} ${data.candidates.length} candidate(s). No review checks or confirmations are imported.`;
      $('import-candidates').innerHTML=data.candidates.map(c=>`<li><strong>${esc(c.scout?.selection||c.selection)}</strong>${c.scout?.event?' · '+esc(c.scout.event):''}</li>`).join('');
      $('apply-import').disabled=false;
    }catch(e){$('import-feedback').textContent=e.message+(parsed?' Your response is kept here. Resolve this issue before applying.':' Your response is kept here. Use “Fix response format” to reformat it without repeating the research.');$('repair-format').hidden=parsed;}
  }
  async function pasteText(target,feedback,after){
    try{target.value=await navigator.clipboard.readText();$('reuse-research').checked=false;after?.();}
    catch{target.focus();feedback.textContent='Clipboard access is unavailable. Touch and hold in the box, then choose Paste.';}
  }
  $('import-research').addEventListener('click',()=>{if(!run){toast('Start a slate first.',true);return;}clearTimeout(importTimer);pendingImport=null;$('reuse-research').checked=false;$('import-text').value=run.handoffDrafts?.[run.pendingPhase||'research']||'';checkImport();$('import-dialog').showModal();});
  $('import-text').addEventListener('input',()=>{$('reuse-research').checked=false;pendingImport=null;$('apply-import').disabled=false;clearTimeout(importTimer);if(run&&$('import-text').value.length<=1000000){run.handoffDrafts=run.handoffDrafts||{};run.handoffDrafts[run.pendingPhase||'research']=$('import-text').value;persist();}importTimer=setTimeout(checkImport,350);});
  $('repair-format').addEventListener('click',()=>{
    if(!run||!$('import-text').value.trim())return;
    const phase=run.pendingPhase||'research';
    try{const prompt=E.formatPrompt(run,phase,$('import-text').value);$('import-dialog').close();showPrompt(phase);$('handoff-title').textContent='Fix the response format';$('handoff-text').value=prompt;copyPrompt(true);}
    catch(e){$('import-feedback').textContent=e.message;}
  });
  $('reuse-research').addEventListener('change',checkImport);
  $('preview-import').addEventListener('click',checkImport);
  $('paste-research-clipboard').addEventListener('click',()=>pasteText($('import-text'),$('import-feedback'),checkImport));
  $('research-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Choose a research file under 1 MB.');$('reuse-research').checked=false;$('import-text').value=await file.text();checkImport();}catch(e){$('import-feedback').textContent=e.message;}event.target.value='';});
  $('apply-import').addEventListener('click',()=>{
    clearTimeout(importTimer);
    try{
      if(!run)throw Error('Start a slate before importing research.');
      if(!$('import-text').value.trim())throw Error('Paste the ChatGPT research response in the box above first.');
      // Validate the current text on every click; the optional delayed preview is never a prerequisite.
      const next=E.importResearch(run,$('import-text').value,Date.now(),$('reuse-research').checked===true);
      const parsedPacket=E.parse($('import-text').value);
      archiveResearchPacket(parsedPacket);
      if(next.handoffDrafts)delete next.handoffDrafts[E.parse($('import-text').value).phase];
      const candidate=next.candidates.find(c=>c.id===selected)||next.candidates[0];
      const nextStage=candidate?Math.max(0,E.evaluate(next,candidate).next):0;
      run=next;run.pendingPhase=null;selected=candidate?.id||null;stage=nextStage;pendingImport=null;
      persist();$('import-dialog').close();render();
      toast('Research applied. Your candidates are below—review their sources before continuing.');
      $('candidate-list').scrollIntoView({block:'start',behavior:'instant'});
    }catch(e){
      showReuseOption();
      pendingImport=null;$('import-feedback').textContent='Could not apply research: '+e.message;
      $('import-feedback').className='error';$('import-feedback').scrollIntoView({block:'nearest'});
      try{E.parse($('import-text').value);$('repair-format').hidden=true;}catch{$('repair-format').hidden=!$('import-text').value.trim();}
    }
  });
  $('discovery-search').addEventListener('input',()=>{discoveryOffset=0;renderDiscovery();});
  $('discovery-prev').addEventListener('click',()=>{discoveryOffset=Math.max(0,discoveryOffset-25);renderDiscovery();});
  $('discovery-next').addEventListener('click',()=>{discoveryOffset+=25;renderDiscovery();});
  $('restore-discovery').addEventListener('change',async event=>{
    const file=event.target.files?.[0];
    try{
      if(!file)return;
      if(file.size>8000000)throw Error('Archive exceeds 8 MB');
      const incoming=D.importJSON(await file.text());
      const merged=D.merge(readDiscovery(),incoming);
      localStorage.setItem(DISCOVERY_STORAGE,D.exportJSON(merged));
      discoveryOffset=0;refreshDiscoveryCensus();renderDiscovery();
      toast('Research census restored and merged. Existing observations retained.');
    }catch(e){toast('Discovery restore failed: '+e.message,true);}
    finally{event.target.value='';}
  });
  $('export-discovery').addEventListener('click',()=>{
    try{download(D.exportJSON(readDiscovery()),'ATLAS-discovery-census.json');toast('Research census exported. This is a browser-local research archive, not the immutable Ledger.');}
    catch(e){toast('Cannot export discovery census: '+e.message,true);}
  });
  $('export-slate').addEventListener('click',exportDraft);
  $('restore-draft').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{const next=restore(await file.text());if(run)exportDraft();run=next;selected=run.candidates[0]?.id||null;stage=0;render();toast('Draft restored. Research and approvals require fresh review.');}catch(e){toast(e.message,true);}event.target.value='';});
  $('close-candidate').addEventListener('click',()=>{$('disposition-form').reset();$('disposition-error').textContent='';$('disposition-dialog').showModal();});
  $('disposition-form').addEventListener('submit',event=>{event.preventDefault();const c=current(),status=$('disposition-status').value,reason=$('disposition-reason').value.trim(),trigger=$('disposition-trigger').value.trim(),expires=inputDate($('disposition-expiry').value);if(!reason)return;if(status==='WATCH'&&(!trigger||!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now())){$('disposition-error').textContent='WATCH needs a trigger and a future review deadline.';return;}c.disposition={status,reason,trigger,expires,at:new Date().toISOString()};E.invalidate(run,c,reason);E.log(run,'Candidate closed as '+status,c,E.copy(c));$('disposition-dialog').close();render();});
  $('reopen-candidate').addEventListener('click',()=>{$('reopen-reason').value='';$('reopen-dialog').showModal();});
  $('reopen-form').addEventListener('submit',event=>{event.preventDefault();const c=current(),reason=$('reopen-reason').value.trim();if(!reason)return;E.log(run,'Candidate explicitly reopened',c,{reason,previous:E.copy(c)});E.invalidate(run,c,reason);c.disposition=null;c.final.confirmed=false;c.final.infoReviewed=false;c.final.imageReviewed=false;c.sentinel.reviewed=false;$('reopen-dialog').close();render();});
  async function attachScreenshot(file){
    const c=current();if(!file||!c||c.approval||c.disposition)return;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2000000)throw Error('Use a PNG, JPEG, or WebP screenshot under 2 MB.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('The screenshot could not be read.'));reader.readAsDataURL(file);});
      await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(Error('This file is not a readable image.'));img.src=data;});
      c.final.image={name:file.name,data};c.final.imageReviewed=false;c.final.confirmed=false;persist();renderStage();toast(storageOK?'Screenshot attached. Check its details visually.':'Screenshot attached in this session, but storage is full. Export the draft before leaving.',!storageOK);
    }catch(e){toast(e.message,true);}
  }
  $('screenshot-input').addEventListener('change',async event=>{await attachScreenshot(event.target.files[0]);event.target.value='';});
  $('screenshot-controls').addEventListener('paste',event=>{const file=Array.from(event.clipboardData?.items||[]).find(item=>item.type.startsWith('image/'))?.getAsFile();if(file){event.preventDefault();attachScreenshot(file);}});
  $('screenshot-controls').addEventListener('dragover',event=>event.preventDefault());
  $('screenshot-controls').addEventListener('drop',event=>{event.preventDefault();attachScreenshot(event.dataTransfer?.files[0]);});
  $('clear-screenshot').addEventListener('click',()=>{const c=current();c.final.image=null;c.final.imageReviewed=false;c.final.confirmed=false;persist();renderStage();});
  $('confirm-final').addEventListener('click',()=>{try{E.approve(run,current());render();toast('Final Gate decision recorded. No bet was placed. Keep the actual placement receipt for the Ledger.');}catch(e){toast(e.message,true);updateReadout();}});
  $('copy-reviewed-quote').addEventListener('click',()=>{
    const c=current();if(!c||c.approval||c.disposition)return;
    Object.assign(c.final,{book:c.pricing.book,line:c.pricing.line,odds:c.pricing.odds,stake:c.sentinel.stake,imageReviewed:false,infoReviewed:false,confirmed:false});
    persist();renderStage();toast('Reviewed details copied. Check the actual screenshot and enter its capture time.');
  });
  let pasteTarget=null;
  $('paste-stage').addEventListener('click',()=>{
    pasteTarget={id:selected,stage};$('paste-stage-title').textContent='Paste · '+E.STAGES[stage];
    $('stage-paste-template').textContent=config[stage].filter(d=>d[2]!=='checkbox').map(d=>d[1]+': ').join('\n');
    $('stage-paste-text').value='';$('stage-paste-feedback').textContent='';$('paste-stage-dialog').showModal();
  });
  $('stage-paste-clipboard').addEventListener('click',()=>pasteText($('stage-paste-text'),$('stage-paste-feedback')));
  $('apply-stage-paste').addEventListener('click',()=>{
    const c=current();if(!pasteTarget||pasteTarget.id!==selected||pasteTarget.stage!==stage||c?.approval||c?.disposition||(c?.sealed&&stage<3))return;
    const defs=config[stage].filter(d=>d[2]!=='checkbox'),normalize=s=>s.trim().replace(/\*\*/g,'').toLowerCase(),values={};let active=null;
    try{
      for(const line of $('stage-paste-text').value.split(/\r?\n/)){
        const colon=line.indexOf(':'),name=colon>=0?normalize(line.slice(0,colon)):'';
        const def=defs.find(d=>normalize(d[1])===name||d[0].toLowerCase()===name);
        if(def){active=def[0];if(Object.hasOwn(values,active))throw Error('Duplicate label: '+def[1]);values[active]=line.slice(colon+1).trim();}
        else if(active)values[active]+='\n'+line;
        else if(line.trim())throw Error('Start with an accepted label, such as '+defs[0][1]+':');
      }
      const entries=Object.entries(values);if(!entries.length)throw Error('No labeled fields found. Use the template above.');
      for(const [key,raw]of entries){const def=defs.find(d=>d[0]===key),value=raw.trim();
        if(!value)throw Error('No value supplied for '+def[1]+'. Leave that label out to keep the current value.');
        if(value.length>6000)throw Error('One field exceeds 6,000 characters.');
        if(def[2]==='select'&&!def[4].includes(value))throw Error(def[1]+': use '+def[4].filter(Boolean).join(', '));
        if(def[2]==='datetime-local'&&(!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))))throw Error(def[1]+': use an ISO timestamp with timezone, e.g. 2026-09-18T19:00:00-05:00.');
        if(def[2]==='number'&&!Number.isFinite(Number(value)))throw Error(def[1]+' must be a number.');
        if(def[2]==='url'&&!E.url(value))throw Error(def[1]+' must be a valid http(s) URL.');
        values[key]=value;
      }
      Object.assign(c[E.KEYS[stage]],values);c.final.confirmed=false;c.final.infoReviewed=false;
      if(stage===1)c.verify.reviewed=false;if(stage===2)c.oracle.reviewed=false;if(stage===3)c.pricing.noPush=false;if(stage===5)c.sentinel.reviewed=false;if(stage===7)c.final.imageReviewed=false;
      E.log(run,'Pasted stage fields; review required',c,{stage:E.STAGES[stage],fields:Object.keys(values)});
      $('paste-stage-dialog').close();render();toast(entries.length+' fields filled. Review the entries and any remaining checks.');
    }catch(e){$('stage-paste-feedback').textContent=e.message;}
  });
  document.querySelectorAll('[data-close-run-dialog]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.closeRunDialog).close()));
  window.addEventListener('focus',()=>{if(run)updateReadout();});
  setInterval(()=>{if(run&&!$('slate').hidden)updateReadout();},30000);
  // Resume only a device-local working draft. It is never a canonical or tamper-proof record.
  try{const raw=localStorage.getItem(STORAGE);if(raw){const d=JSON.parse(raw);if(d?.schema==='atlas.slate.v1'&&Array.isArray(d.candidates)&&d.candidates.length<=64&&[3,5,8,16,32,64].includes(Number(d.limit))&&d.candidates.length<=Number(d.limit)&&Array.isArray(d.history)&&d.candidates.every(c=>c&&E.KEYS.every(k=>c[k]&&typeof c[k]==='object'))){run=d;selected=run.candidates[0]?.id||null;run.candidates.forEach(c=>{c.final.confirmed=false;c.final.infoReviewed=false;c.final.imageReviewed=false;});}}}catch{storageOK=false;toast('The prior local draft could not be loaded. Restore an export or start a new slate.',true);}
  refreshDiscoveryCensus();
  renderDiscovery();
  render();
})();
