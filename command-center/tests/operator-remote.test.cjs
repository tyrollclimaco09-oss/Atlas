'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.resolve(__dirname,'../operator-remote.html'),'utf8');
const registry=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/continuity/ATLAS_OPERATOR_REMOTE_V1.json'),'utf8'));
const expected=['STATUS','MASTERSAVE','RESTORE','AUDIT','GRAPH','PLUGINS','ARCIII','RESUME'];
const script=html.match(/<script>([\s\S]*?)<\/script>/);

function fakeBrowser(clipboardPresent=true){
 const buttons=expected.map(id=>{
   const attrs={'data-action':id,'aria-pressed':'false'}, listeners={};
   return {
     getAttribute:(n)=>attrs[n],setAttribute:(n,v)=>attrs[n]=String(v),
     addEventListener:(n,f)=>listeners[n]=f,
     click:()=>listeners.click(),
     attrs
   };
 });
 let copied=null,selected=false;
 const elements={
  command:{value:'',focus(){},select(){selected=true;}},
  'action-summary':{textContent:''},
  'copy-status':{textContent:''},
  copy:{handler:null,addEventListener(type,fn){assert.equal(type,'click');this.handler=fn;}}
 };
 const document={
  querySelectorAll(selector){assert.equal(selector,'[data-action]');return buttons;},
  getElementById(id){if(!elements[id])throw Error('UNKNOWN_ELEMENT: '+id);return elements[id];}
 };
 const navigator=clipboardPresent?{clipboard:{writeText:async text=>{copied=text;}}}:{};
 new vm.Script(script[1]).runInNewContext({document,navigator});
 return {buttons,elements,getCopied:()=>copied,getSelected:()=>selected};
}

test('registry preserves one deliberate and uniquely named operator action per button',()=>{
 assert.equal(registry.schema,'atlas.operator-remote.v1');
 assert.equal(registry.release,'review_only_not_deployed');
 assert.equal(registry.checkpoint_id,'ATLAS-ARCIII-20261018-MASTERSAVE-01');
 assert.deepEqual(registry.actions.map(a=>a.id),expected);
 const actual=[...html.matchAll(/<button class="action" type="button" data-action="([A-Z]+)"/g)].map(x=>x[1]);
 assert.deepEqual(actual,expected);
 assert.ok(registry.actions.every(a=>a.instruction.length>=80&&a.summary.length>=10));
});

test('read actions cannot acquire write/deploy authority from the registry',()=>{
 assert.deepEqual(registry.actions.map(x=>x.class),[
  'read','write_review','read','read','read','read','read','review_work'
 ]);
 assert.deepEqual(registry.policy,{
  human_final_gate:true,bet_execution:false,production_writes:false,
  credentials_in_chat_or_static_ui:false,automatic_plugin_install:false,
  background_sync:false,default_floot:'PARKED',no_closure_without_evidence:true,
  external_mirror_statuses:['MATCH','PARTIAL','UNKNOWN','CONFLICT']
 });
 assert.ok(registry.actions.find(x=>x.id==='MASTERSAVE').instruction.includes('read back'));
 assert.ok(registry.actions.find(x=>x.id==='RESUME').instruction.includes('No deployment'));
 assert.ok(registry.actions.find(x=>x.id==='ARCIII').instruction.includes('Do not start'));
});

test('remote is standalone, offline, no token capture, no network or storage writes',()=>{
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/form-action 'none'/);
 assert.match(html,/These are prompts, not API calls/);
 assert.match(html,/no silent execution/);
 for(const prohibited of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\bWebSocket\b/,/\beval\s*\(/,/\bdocument\.cookie\b/,/<input[^>]+type="password"/]){
  assert.doesNotMatch(html,prohibited);
 }
 assert.equal([...html.matchAll(/<script>/g)].length,1);
 assert.ok(script,'inline command script missing');
 assert.doesNotThrow(()=>new vm.Script(script[1]));
});

test('source links are bounded to GitHub, Notion, Drive and ChatGPT',()=>{
 const urls=[...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(urls.length>=6);
 for(const url of urls){
  assert.ok(['github.com','app.notion.com','docs.google.com','chatgpt.com'].includes(new URL(url).hostname),url);
 }
 assert.equal([...html.matchAll(/target="_blank"/g)].length,[...html.matchAll(/rel="noopener noreferrer"/g)].length);
 assert.match(html,/ATLAS_OPERATOR_REMOTE_V1\.json/);
 assert.match(html,/ATLAS_MASTER_CHECKPOINT_2026-10-18\.json/);
});

test('UI selects actions and constructs source-pinned commands rather than invoking plugins',()=>{
 const app=fakeBrowser();
 assert.equal(app.buttons[0].attrs['aria-pressed'],'true');
 app.buttons[7].click();
 assert.equal(app.buttons[7].attrs['aria-pressed'],'true');
 assert.equal(app.buttons[0].attrs['aria-pressed'],'false');
 assert.match(app.elements.command.value,/ATLAS OPERATOR REMOTE v1 — RESUME/);
 assert.match(app.elements.command.value,/ATLAS_OPERATOR_REMOTE_V1\.json/);
 assert.match(app.elements.command.value,/Pinned registry commit: 05d0adef0e175fe0ac60174a9360aae432df8ea5/);
 assert.match(app.elements.command.value,/Execute only the action with id RESUME/);
 assert.match(app.elements.command.value,/Never silently deploy, place bets, install plugins/);
 assert.match(app.elements['action-summary'].textContent,/Deliberate launch/);
});

test('copy button copies exactly the selected prompt, not an unreviewed hidden command',async()=>{
 const app=fakeBrowser();
 app.buttons[1].click();
 const before=app.elements.command.value;
 await app.elements.copy.handler();
 assert.equal(app.getCopied(),before);
 assert.match(before,/id MASTERSAVE/);
 assert.match(app.elements['copy-status'].textContent,/Copied/);
});

test('clipboard unavailable remains recoverable without claiming success',async()=>{
 const app=fakeBrowser(false);
 app.buttons[3].click();
 await app.elements.copy.handler();
 assert.equal(app.getCopied(),null);
 assert.equal(app.getSelected(),true);
 assert.match(app.elements['copy-status'].textContent,/copy it manually/);
 assert.doesNotMatch(app.elements['copy-status'].textContent,/^Copied/);
});

test('original Command Center files are separate and this remote does not assume live sync',()=>{
 assert.match(html,/archived checkpoint facts, not live/);
 assert.match(html,/review-only/);
 assert.match(html,/Floot is parked/);
 assert.match(html,/this static file cannot call your accounts/);
 assert.match(registry.authority.manifest,/docs\/continuity\/ATLAS_MASTER_CHECKPOINT_2026-10-18\.json/);
 assert.match(registry.authority.primary_handoff,/docs\/ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18\.md/);
});
