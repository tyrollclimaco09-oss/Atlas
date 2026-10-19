'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.resolve(__dirname,'../operator-remote.html'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/continuity/ATLAS_OPERATOR_REMOTE_V2.json'),'utf8'));
const actionIds=['STATUS','MASTERSAVE','RESTORE','AUDIT','GRAPH','PLUGINS','ARCIII','RESUME'];
const routineIds=['PREFLIGHT','RECOVERY','RESEARCH_PREP'];
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,'Expected exactly one executable inline script');

function fakeBrowser(copy=true) {
 const create=(attrs={})=>({
  attrs:{...attrs},value:'',textContent:'',hidden:false,checked:false,
  listeners:{},focused:false,selected:false,
  getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=String(v);},
  addEventListener(k,f){this.listeners[k]=f;},
  click(){if(this.listeners.click)this.listeners.click();},
  dispatch(k){if(this.listeners[k])this.listeners[k]();},
  focus(){this.focused=true;},select(){this.selected=true;}
 });
 const actions=actionIds.map(id=>create({'data-action':id,'aria-pressed':'false'}));
 const routines=routineIds.map(id=>create({'data-routine':id,'aria-pressed':'false'}));
 const providers=registry.providers.map(p=>create({'data-provider':p.id,'data-routed':'false'}));
 const ids=Object.fromEntries(['command','execute-confirm','execute-gate','route-name','route-summary',
  'action-summary','mode-state','copy-status','copy'].map(id=>[id,create()]));
 let copied;
 const document={
  querySelectorAll(q){if(q==='[data-action]')return actions;if(q==='[data-routine]')return routines;if(q==='[data-provider]')return providers;throw Error('BAD_SELECTOR: '+q);},
  getElementById(id){if(!(id in ids))throw Error('BAD_ID: '+id);return ids[id];}
 };
 const navigator=copy?{clipboard:{writeText:async t=>{copied=t;}}}:{};
 new vm.Script(script[1]).runInNewContext({document,navigator});
 return {actions,routines,providers,ids,copyText:()=>copied};
}
const press=(list,id,attr)=>list.find(el=>el.getAttribute(attr)===id).click();

test('v2 schema and embedded offline configuration exactly match versioned registry',()=>{
 assert.equal(registry.schema,'atlas.operator-remote.v2');
 assert.equal(registry.status,'REVIEW_ONLY_NOT_DEPLOYED');
 assert.equal(registry.checkpoint_id,'ATLAS-ARCIII-20261018-MASTERSAVE-01');
 const match=html.match(/var remoteRegistry=(\{[^\n]*\});\nvar registryPin='([a-f0-9]{40})'/);
 assert.ok(match,'Embedded registry and immutable Git pin not found');
 assert.deepEqual(JSON.parse(match[1]),registry,'The static HTML must not drift from the canonical JSON');
 assert.equal(match[2],'6e9910d8e4b6858853b41782d984a391674aeef9');
});

test('all actions, routes and routines are allowlisted and workflow kits remain READ_ONLY',()=>{
 assert.deepEqual(registry.actions.map(x=>x.id),actionIds);
 assert.deepEqual(registry.routines.map(x=>x.id),routineIds);
 assert.deepEqual([...html.matchAll(/<button class="action" type="button" data-action="([A-Z]+)"/g)].map(x=>x[1]),actionIds);
 assert.deepEqual([...html.matchAll(/data-routine="([A-Z_]+)"/g)].map(x=>x[1]),routineIds);
 const providers=new Set(registry.providers.map(x=>x.id));
 assert.equal(providers.size,7);
 for(const action of registry.actions)for(const p of action.route)assert.ok(providers.has(p),p);
 for(const routine of registry.routines){
  assert.equal(routine.scope,'READ_ONLY');
  assert.ok(routine.steps.length>=2);
  for(const id of routine.steps)assert.equal(registry.actions.find(x=>x.id===id).scope,'READ_ONLY');
 }
 assert.deepEqual(registry.actions.filter(x=>x.scope!=='READ_ONLY').map(x=>x.id),['MASTERSAVE','RESUME']);
 assert.equal(registry.safeguards.auto_bets,false);
 assert.equal(registry.safeguards.main_or_production_writes,false);
 assert.equal(registry.safeguards.automatic_plugin_install,false);
 assert.equal(registry.safeguards.background_operations,false);
 assert.equal(registry.safeguards.human_final_gate,true);
 assert.equal(registry.safeguards.floot,'PARKED');
});

test('offline launcher has no secret capture, storage, network or prevalidated connectivity',()=>{
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/form-action 'none'/);
 assert.match(html,/this static file cannot call your accounts/);
 assert.match(html,/Not live-checked/);
 for(const forbidden of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\bWebSocket\b/,/\beval\s*\(/,/\bdocument\.cookie\b/,/<input[^>]+type="password"/]){
  assert.doesNotMatch(html,forbidden);
 }
 assert.equal([...html.matchAll(/<script>/g)].length,1);
 assert.doesNotThrow(()=>new vm.Script(script[1]));
});

test('provider cards and source links are exact and do not imply live tool health',()=>{
 assert.deepEqual([...html.matchAll(/data-provider="([a-z_]+)"/g)].map(x=>x[1]),registry.providers.map(p=>p.id));
 const urls=[...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(x=>x[1]);
 for(const u of urls)assert.ok(['github.com','app.notion.com','docs.google.com','chatgpt.com'].includes(new URL(u).hostname));
 assert.equal([...html.matchAll(/target="_blank"/g)].length,[...html.matchAll(/rel="noopener noreferrer"/g)].length);
 assert.match(html,/ATLAS_MASTER_CHECKPOINT_2026-10-18\.json/);
});

test('STATUS is read-only by default and routes illuminate only intended providers',()=>{
 const app=fakeBrowser();
 assert.equal(app.ids['execute-gate'].hidden,true);
 assert.equal(app.actions[0].getAttribute('aria-pressed'),'true');
 assert.match(app.ids.command.value,/ATLAS OPERATOR REMOTE v2 — ACTION STATUS/);
 assert.match(app.ids.command.value,/MODE: READ_ONLY/);
 assert.match(app.ids.command.value,/Pinned registry commit: 6e9910d8e4b6858853b41782d984a391674aeef9/);
 const route=app.providers.filter(x=>x.getAttribute('data-routed')==='true').map(x=>x.getAttribute('data-provider'));
 assert.deepEqual(route,registry.actions[0].route);
 assert.match(app.ids['route-summary'].textContent,/Check actual connection inside ChatGPT/);
});

test('MASTERSAVE cannot perform writes from a selection alone; operator must explicitly check box',()=>{
 const app=fakeBrowser();
 press(app.actions,'MASTERSAVE','data-action');
 assert.equal(app.ids['execute-gate'].hidden,false);
 assert.match(app.ids.command.value,/MODE: PREVIEW_ONLY/);
 assert.match(app.ids.command.value,/do not write or start research/);
 assert.doesNotMatch(app.ids.command.value,/MODE: OPERATOR_APPROVED_REVIEW_ONLY/);
 app.ids['execute-confirm'].checked=true;
 app.ids['execute-confirm'].dispatch('change');
 assert.match(app.ids.command.value,/MODE: OPERATOR_APPROVED_REVIEW_ONLY/);
 assert.match(app.ids.command.value,/no production authority|no production|No production/i);
});

test('changing from approved MASTERSAVE to RESUME or a routine always clears consent',()=>{
 const app=fakeBrowser();
 press(app.actions,'MASTERSAVE','data-action');
 app.ids['execute-confirm'].checked=true;app.ids['execute-confirm'].dispatch('change');
 press(app.actions,'RESUME','data-action');
 assert.equal(app.ids['execute-confirm'].checked,false);
 assert.match(app.ids.command.value,/MODE: PREVIEW_ONLY/);
 press(app.routines,'PREFLIGHT','data-routine');
 assert.equal(app.ids['execute-gate'].hidden,true);
 assert.match(app.ids.command.value,/MODE: READ_ONLY/);
 assert.equal(app.ids['execute-confirm'].checked,false);
});

test('read-only workflow kit emits only allowlisted ordered actions and changes provider routes',()=>{
 const app=fakeBrowser();
 press(app.routines,'RECOVERY','data-routine');
 assert.equal(app.routines[1].getAttribute('aria-pressed'),'true');
 assert.equal(app.actions[0].getAttribute('aria-pressed'),'false');
 assert.match(app.ids.command.value,/ATLAS OPERATOR REMOTE v2 — ROUTINE RECOVERY/);
 assert.ok(app.ids.command.value.indexOf('1. RESTORE')<app.ids.command.value.indexOf('2. AUDIT'));
 assert.match(app.ids.command.value,/MODE: READ_ONLY/);
 assert.doesNotMatch(app.ids.command.value,/MODE: OPERATOR_APPROVED_REVIEW_ONLY/);
 const route=app.providers.filter(x=>x.getAttribute('data-routed')==='true').map(x=>x.getAttribute('data-provider'));
 assert.deepEqual(route,['github','create_state','notion','drive']);
});

test('copied command equals visible textarea and clipboard fallback never lies',async()=>{
 const a=fakeBrowser(true);
 press(a.routines,'RESEARCH_PREP','data-routine');
 const t=a.ids.command.value;
 await a.ids.copy.dispatch('click');
 assert.equal(a.copyText(),t);
 assert.match(a.ids['copy-status'].textContent,/Copied/);
 const b=fakeBrowser(false);
 press(b.actions,'AUDIT','data-action');
 await b.ids.copy.dispatch('click');
 assert.equal(b.ids.command.selected,true);
 assert.match(b.ids['copy-status'].textContent,/copy it manually/);
 assert.doesNotMatch(b.ids['copy-status'].textContent,/^Copied/);
});

test('original command center and Final Gate stay outside review-only remote authority',()=>{
 assert.match(html,/Floot is parked/);
 assert.match(html,/archived checkpoint facts, not live/);
 assert.match(html,/These are prompts, not API calls/);
 assert.match(registry.authority.handoff,/ARCIII_REALITY_FORGE_RESUME_HANDOFF/);
 assert.match(registry.authority.master_manifest,/ATLAS_MASTER_CHECKPOINT_2026-10-18/);
});
