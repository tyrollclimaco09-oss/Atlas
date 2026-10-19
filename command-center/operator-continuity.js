/* ATLAS Operator continuity: additive UI only. No network, credentials or execution. */
(function () {
  'use strict';
  const KEY='atlas.operator.continuity.v1';
  const TTL=30*24*60*60*1000;
  const branch='review/pass0-slate-regression-2026-10-16';
  const repo='tyrollclimaco09-oss/Atlas';
  const docs='https://github.com/'+repo+'/blob/'+branch+'/docs/PASS0_SLATE_REGRESSION_2026-10-16.md';
  const workspace='https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site';
  const actionIds=new Set(['STATUS','MASTERSAVE','RESTORE','AUDIT','GRAPH','PLUGINS','ARCIII','RESUME']);
  const routineIds=new Set(['PREFLIGHT','RECOVERY','RESEARCH_PREP']);
  const $=id=>document.getElementById(id);
  const actionHost=$('actions'), box=$('command'), consent=$('execute-confirm');
  if(!actionHost||!box||!consent||!$('copy'))return;
  function valid(mode,id){return mode==='action'?actionIds.has(id):mode==='routine'?routineIds.has(id):mode==='slate'&&id==='SLATE';}
  function fromHash(){
    const m=/^#atlas=(action|routine|slate):([A-Z_]+)$/.exec(location.hash);
    return m&&valid(m[1],m[2])?{mode:m[1],id:m[2]}:null;
  }
  function fromStore(){
    try {
      const r=JSON.parse(localStorage.getItem(KEY)||'null');
      if(r&&r.v===1&&valid(r.mode,r.id)&&Number.isSafeInteger(r.savedAt)&&r.savedAt<=Date.now()&&Date.now()-r.savedAt<=TTL)
        return {mode:r.mode,id:r.id};
      if(r!==null)localStorage.removeItem(KEY);
    } catch (_) { /* Storage may be unavailable in private browsing. */ }
    return null;
  }
  function remember(mode,id){
    if(!valid(mode,id))return;
    last={mode,id};
    try { localStorage.setItem(KEY,JSON.stringify({v:1,mode,id,savedAt:Date.now()})); } catch (_) {}
    try { history.replaceState(null,'',location.pathname+location.search+'#atlas='+mode+':'+id); } catch (_) {}
    updateResume();
  }
  function contextPrompt(){
    const selected=last ? last.mode+':'+last.id : 'NONE';
    return [
      'ATLAS — RECONSTRUCT WORK CONTINUITY (READ ONLY)',
      'I am resuming the ATLAS project across a conversation/browser boundary.',
      'Authoritative repository: '+repo,
      'Canonical review baseline branch: '+branch,
      'Historical handoff file: docs/continuity/ATLAS_REMOTE_PRIVATE_STATUS_HANDOFF_2026-10-19.md',
      'Historical checkpoint: ATLAS-REMOTE-PRIVATE-STATUS-20261019-HANDOFF-01',
      'Continuity feature review branch: review/operator-resume-qol-2026-10-19 (verify live HEAD; do not guess its SHA).',
      'Last local command selection (a navigation hint, NOT proof of actual progress): '+selected,
      'FIRST: read latest GitHub HEAD/CI and exact handoff. Reconcile newer reviewed work with preserved snapshots and separate historical evidence from fresh readbacks.',
      'THEN: summarize which ATLAS components and slates are complete, in review, unverified, or blocked. Preserve all candidates, provenance, Game Sense, PRICING, House Mirror, TACTICIAN, SENTINEL, Human Final Gate, LEDGER, FORENSICS and CALIBRATOR.',
      'Respect Arc III 0/15 formal sign-offs unless independent accepted proof changes that. Floot remains parked.',
      'This website has NOT loaded local browser slate drafts or chat messages. If material data is absent from GitHub, say MISSING and ask for an authorized export; do not recreate or invent records.',
      'Propose one highest-value next action, with current blockers and an operator-ready checkpoint at the end. Do not automatically research a slate, write data, merge/deploy, or execute bets.',
      'No production or Supabase writes, no credentials, no sportsbook activity, and no automatic approvals. Knowledge over greed; evidence over confidence.'
    ].join('\n');
  }
  function slatePrompt(){
    return [
      'ATLAS — RUN THE SLATE (RESEARCH HANDOFF, NOT WEBSITE EXECUTION)',
      'Read the existing GitHub checkpoint and current review status before starting.',
      'Repository: '+repo+' | review branch: '+branch,
      'Existing slate notes: '+docs,
      'Research a fresh FUTURE slate for the current requested date and target timezone. Reverify actual schedule, event cutoff, team/player eligibility, news, and source times; do not reuse expired candidates.',
      'Preserve one persistent discovery registry and existing candidates. Broadly scout football, basketball, baseball or relevant active sports without a permanent three-candidate discovery cap; use bounded research packets as required by the existing importer.',
      'PHASE 1: SCOUT → FILTER/VERIFY → ORACLE + EDGE THIEF, independent role/volume/efficiency thesis, Game Sense and competing outcome paths. Do not look up odds or anchor fair probabilities to bookmaker lines in this phase. Leave probabilities unknown without a defensible model.',
      'PHASE 2 only if sources allow: independent PRICING/House Mirror → KAIROS → SENTINEL → TACTICIAN. Explore FOUNDATION singles, EXPEDITION props/doubles, CONSTELLATION longshots and ORION parlays as RESEARCH options. Check correlation and both/A-only/B-only/neither settlement outcomes; no coherent-story-as-edge shortcut.',
      'Give one organized opportunity board with PASS/WATCH/INVESTIGATE/BET only when evidence supports each category, uncertainties, invalidation triggers, timestamped sources, and final shortlist. Do not force picks or invent odds, tests, feeds, simulations, or execution.',
      'Human Final Gate is mandatory. This handoff is research only: do not execute wagers, connect a sportsbook, install plugins, alter Supabase, merge branches, or authorize production writes.',
      'Keep ARC III certification parked and preserve MasterSave and provenance. Ask for an essential missing constraint only if necessary.',
      'STATE: USER-REQUESTED SLATE RESEARCH IN CHAT — NOT AUTOMATIC WEBSITE EXECUTION.'
    ].join('\n');
  }
  // This section is deliberately outside the immutable eight-action registry.
  const section=document.createElement('section');
  section.id='atlas-continuity';
  section.className='atlas-continuity';
  section.setAttribute('aria-label','Resume and slate handoff');
  section.innerHTML=
    '<div class="atlas-quick-head"><strong>Pick up where you left off</strong><span>LOCAL HANDOFF</span></div>'+
    '<p id="atlas-last">No recent selection saved on this browser.</p>'+
    '<div class="atlas-quick-controls">'+
      '<button type="button" id="atlas-continue">Continue command</button>'+
      '<button type="button" id="atlas-context">Restore project context</button>'+
      '<button type="button" id="atlas-copy">Copy current command</button>'+
      '<button type="button" id="atlas-send">Copy &amp; open ChatGPT ↗</button>'+
      '<a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a>'+
      '<button type="button" id="atlas-return-link">Copy return link</button>'+
    '</div>'+
    '<div class="atlas-slate-card"><div><strong>Run the Slate</strong><p>Prepare a fresh research request; never place a bet from this site.</p></div>'+
      '<button type="button" id="atlas-slate">Prepare slate handoff</button>'+
      '<div class="atlas-quick-controls">'+
        '<a id="atlas-notes" href="'+docs+'" target="_blank" rel="noopener noreferrer">Slate notes (GitHub) ↗</a>'+
        '<a id="atlas-workspace" href="'+workspace+'" target="_blank" rel="noopener noreferrer">Legacy slate workspace ↗</a>'+
      '</div>'+
      '<small>Existing legacy draft stays on its own website/browser. No automatic sync or state import.</small>'+
    '</div>'+
    '<p id="atlas-quick-message" role="status" aria-live="polite"></p>'+
    '<small>ChatGPT opens its homepage, not necessarily this same conversation. Paste the copied handoff in your existing ATLAS chat.</small>'+
    '<button type="button" id="atlas-clear">Forget this browser shortcut</button>'+
    '<small>Only a command ID is remembered locally (up to 30 days). Never credentials, stakes, approvals or research notes. Each Vercel preview hostname has separate browser storage; use a return link for that specific preview or Restore project context across chats.</small>';
  // Keep the resume action visible before the larger grid on iPhone.
  const hero=document.querySelector('.hero');
  if(hero)hero.after(section);
  else actionHost.closest('section').before(section);
  // Static HTML cannot attest host authentication or plugin permissions.
  const phone=$('phone-readiness');
  if(phone && location.protocol==='https:' && /\.vercel\.app$/i.test(location.hostname)){
    phone.dataset.authState='HOST_READBACK_REQUIRED';
    const label=phone.querySelector('.not-auth');
    if(label)label.textContent='Verify Vercel sign-in';
    const description=phone.querySelector('p');
    if(description)description.textContent='Hosted preview detected. Sign-in and access protection must be checked through Vercel and a private browser session; this page cannot prove them. Plugin calls still require ChatGPT.';
  }
  let last=fromHash()||fromStore();
  let suppressClickSave=false;
  function updateResume(){
    $('atlas-last').textContent=last?'Saved selection: '+(last.mode==='slate'?'Run the Slate':last.id)+'. Reopen without restoring approval.':'No recent selection saved on this browser.';
    $('atlas-continue').disabled=!last;
  }
  function prepareSlate(rememberIt=true){
    consent.checked=false;
    $('execute-gate').hidden=true;
    document.querySelectorAll('[data-action],[data-routine]').forEach(el=>el.setAttribute('aria-pressed','false'));
    document.querySelectorAll('[data-provider]').forEach(el=>el.setAttribute('data-routed','false'));
    $('route-name').textContent='SLATE (handoff)';
    $('route-summary').textContent='GitHub source → manually copy to ChatGPT. No live sportsbook or website-run engine.';
    $('action-summary').textContent='Selected: Run the Slate. Research only; not executed by this website.';
    $('mode-state').textContent='RESEARCH HANDOFF — fresh sources and Human Final Gate required.';
    box.value=slatePrompt();
    $('copy-status').textContent='';
    if(rememberIt)remember('slate','SLATE');
  }
  function activate(mode,id,save=true){
    if(!valid(mode,id))return;
    if(mode==='slate'){prepareSlate(save);return;}
    const attr=mode==='routine'?'data-routine':'data-action';
    const target=Array.from(document.querySelectorAll('['+attr+']')).find(el=>el.getAttribute(attr)===id);
    if(!target)return;
    consent.checked=false;
    suppressClickSave=true;
    try { target.click(); } finally { suppressClickSave=false; }
    if(save)remember(mode,id);
  }
  function moveToPrompt(){
    box.scrollIntoView({behavior:'smooth',block:'center'});
    box.focus({preventScroll:true});
  }
  // Register after the original launcher so its paint() completes first.
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{if(!suppressClickSave)remember('action',el.getAttribute('data-action'));}));
  document.querySelectorAll('[data-routine]').forEach(el=>el.addEventListener('click',()=>{if(!suppressClickSave)remember('routine',el.getAttribute('data-routine'));}));
  $('atlas-slate').addEventListener('click',()=>{prepareSlate();moveToPrompt();});
  $('atlas-context').addEventListener('click',()=>{
    consent.checked=false;
    $('execute-gate').hidden=true;
    document.querySelectorAll('[data-action],[data-routine]').forEach(el=>el.setAttribute('aria-pressed','false'));
    document.querySelectorAll('[data-provider]').forEach(el=>el.setAttribute('data-routed','false'));
    $('route-name').textContent='RECOVER CONTEXT';
    $('route-summary').textContent='GitHub checkpoint → fresh readbacks in ChatGPT, no changes.';
    $('action-summary').textContent='Selected: Restore ATLAS project context from versioned evidence.';
    $('mode-state').textContent='READ ONLY — context reconciliation, not progress attestation.';
    box.value=contextPrompt();
    $('copy-status').textContent='';
    $('atlas-quick-message').textContent='Context request prepared. Copy it to your ATLAS chat to reconcile your work.';
    moveToPrompt();
  });
  $('atlas-continue').addEventListener('click',()=>{if(last){activate(last.mode,last.id);moveToPrompt();}});
  $('atlas-copy').addEventListener('click',()=>{ $('copy').click(); $('atlas-quick-message').textContent='Check the copy confirmation by the command box, then paste into ChatGPT.'; moveToPrompt(); });
  $('atlas-send').addEventListener('click',async()=>{
    const notice=$('atlas-quick-message'),button=$('atlas-send');
    button.disabled=true;
    try{
      if(!navigator.clipboard?.writeText)throw Error('clipboard_unavailable');
      await navigator.clipboard.writeText(box.value);
      notice.textContent='Command copied. Opening ChatGPT; paste in your existing ATLAS conversation.';
      // A deliberate user click initiated the copy. Never transmit the prompt in a URL.
      location.assign('https://chatgpt.com/');
    }catch(_){
      box.focus();box.select();moveToPrompt();
      notice.textContent='Automatic copy was blocked. Command selected; copy manually, then tap Open ChatGPT.';
    }finally{button.disabled=false;}
  });
  $('atlas-return-link').addEventListener('click',async()=>{
    const mode=last?.mode||'action',id=last?.id||'STATUS';
    const link=location.href.split('#')[0]+'#atlas='+mode+':'+id;
    try{
      if(!navigator.clipboard?.writeText)throw Error('clipboard_unavailable');
      await navigator.clipboard.writeText(link);
      $('atlas-quick-message').textContent='Return link copied. Open it later to restore only this command selection.';
    }catch(_){
      const hint=$('atlas-quick-message');
      hint.textContent='Copy the address from the field below (clipboard unavailable).';
      let input=$('atlas-link-fallback');
      if(!input){ input=document.createElement('input');input.id='atlas-link-fallback';input.readOnly=true;hint.after(input);}
      input.value=link;input.focus();input.select();
    }
  });
  $('atlas-clear').addEventListener('click',()=>{
    last=null;
    try{localStorage.removeItem(KEY);}catch(_){}
    try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}
    activate('action','STATUS',false);
    updateResume();
    $('atlas-quick-message').textContent='Local shortcut cleared. Existing slate drafts were not touched.';
  });
  if(last)activate(last.mode,last.id,false);
  updateResume();
  window.addEventListener('pageshow',ev=>{if(ev.persisted){const r=fromHash()||fromStore();if(r){last=r;activate(r.mode,r.id,false);}updateResume();}});
}());