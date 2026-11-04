'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const bridge = require('../slate-sources.js');

// DOM contract probe, not a browser/authentication test. The two labels below
// match the current saved Sites renderer. No real sessions or network are used.
function page(sport='NBA', connected=true) {
  const nodes = new Map(), handlers = new Map(), calls = [];
  const active = {hidden:false};
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      dataset:{}, textContent:'', children:[],
      addEventListener(type, fn) { handlers.set(id+':'+type,fn); },
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children=[]; },
      closest(selector) { return selector==='#active-slate'?active:null; }
    });
    return nodes.get(id);
  };
  node('active-slate').hidden=false;
  node('run-label').textContent=sport+' / 2026-11-04';
  const draft={id:'synthetic-current-site-draft',candidates:[]};
  const root={document:{getElementById:node,createElement:()=>({children:[],appendChild(x){this.children.push(x);}})}};
  if (connected) root.AtlasSlateSourcesConfig={
    getSessionHeaders:async()=>({Authorization:'Bearer synthetic-offline-session'}),
    transport:async(url,options)=>{
      calls.push({url,options});
      return {status:200,ok:true,json:async()=>({
        ok:true,mode:'slate_sources',contract:'ATLAS_SLATE_SOURCES_READ_V1',
        league:sport,slate_date:'2026-11-04',execution_authority:false,
        human_final_gate_required:true,paid_api_requests:0,
        source_states:{draftkings:'NO_SNAPSHOT',flaim:'NO_SNAPSHOT'},
        canonical_events:[],slate_candidates:[],odds_report:null,flaim_packet:null
      })};
    }
  };
  bridge.mount(root);
  return {root,node,handlers,calls,draft};
}

test('current Sites run label feeds one scoped read without changing the local draft',async()=>{
  const source=readFileSync(require.resolve('../slate.js'),'utf8');
  assert.ok(source.includes("$('run-label').textContent=`${run.sport} / ${run.date}`"));
  const x=page(),before=JSON.stringify(x.draft);
  bridge.mount(x.root); // Repeated mounting cannot register another listener.
  x.handlers.get('continue-slate:click')();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(x.calls.length,1);
  const url=new URL(x.calls[0].url);
  assert.equal(url.searchParams.get('league'),'NBA');
  assert.equal(url.searchParams.get('slate_date'),'2026-11-04');
  assert.equal(url.searchParams.get('mode'),'slate_sources');
  assert.equal(x.calls[0].options.method,'GET');
  assert.equal(JSON.stringify(x.draft),before);
  assert.match(x.node('slate-source-status').textContent,/DK NO_SNAPSHOT/);
});

test('current Mixed default stays local and does not make a provider or runtime request',async()=>{
  const x=page('Mixed');
  await x.handlers.get('slate-source-refresh:click')();
  assert.equal(x.calls.length,0);
  assert.match(x.node('slate-source-status').textContent,/supports NBA\/NFL/);
});

test('an unconfigured operator session keeps the current slate intact and reports the gap',async()=>{
  const x=page('NBA',false),before=JSON.stringify(x.draft);
  await x.handlers.get('slate-source-refresh:click')();
  assert.equal(x.calls.length,0);
  assert.equal(JSON.stringify(x.draft),before);
  assert.match(x.node('slate-source-status').textContent,/operator connection not configured/);
});
