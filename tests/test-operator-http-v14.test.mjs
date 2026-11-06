import {test} from 'node:test';import assert from 'node:assert/strict';
import {testOperatorHttp,validateIntegration,ATLAS_ENDPOINT,SITE_ORIGIN} from '../scripts/admin/test-operator-http-v14.mjs';
const body={ok:true,mode:'integration',execution_authority:false,production_authority:false,
human_final_gate_required:true,status:'RESEARCH_BACKBONE_LINKED_NOT_EXECUTABLE',
real_bet_placed:false,calibrated_model_edge_proven:false,quote_provider_live:false,
totals:{scheduled_games:1,canonical_events:1,native_market_candidates:1,fully_proven_operator_review_candidates:0},
nodes:Array.from({length:12},(_,i)=>({node_key:'N'+i,state:'WATCH'})),
games:[{canonical_event_registered:true,native_candidates:1}]};
const env={ATLAS_OPERATOR_ACCESS_TOKEN:'synthetic-jwt',SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable'};
test('unprovisioned account cannot be reported as passed',async()=>assert.equal((await testOperatorHttp({env:{}})).status,'AUTH_NOT_BOOTSTRAPPED'));
test('rejects fake execution authority',()=>assert.throws(()=>validateIntegration({...body,execution_authority:true}),/UNTRUSTED_INTEGRATION_RESPONSE/));
test('rejects nonoperator mode',()=>assert.throws(()=>validateIntegration({...body,mode:'bet'}),/UNTRUSTED_INTEGRATION_RESPONSE/));
test('rejects partial canonical event coverage',()=>assert.throws(()=>validateIntegration({...body,totals:{...body.totals,canonical_events:0}}),/INTEGRATION_COVERAGE_INVALID/));
test('rejects empty node spine',()=>assert.throws(()=>validateIntegration({...body,nodes:[]}),/INTEGRATION_COVERAGE_INVALID/));
test('rejects unverified live quote claim',()=>assert.throws(()=>validateIntegration({...body,quote_provider_live:true}),/UNVERIFIED_LIVE_AUTHORITY_CLAIM/));
test('rejects any real bet claim',()=>assert.throws(()=>validateIntegration({...body,real_bet_placed:true}),/UNVERIFIED_LIVE_AUTHORITY_CLAIM/));
test('rejects missing game canonical identity',()=>assert.throws(()=>validateIntegration({...body,games:[{canonical_event_registered:false,native_candidates:1}]}),/INTEGRATION_COVERAGE_INVALID/));
test('requires rejected negative request',async()=>assert.rejects(testOperatorHttp({env,transport:async()=>({status:200})}),/UNAUTHORIZED_READ_NOT_REJECTED/));
test('requires actual authorized 200',async()=>{let n=0;await assert.rejects(testOperatorHttp({env,transport:async()=>({status:++n===1?401:403})}),/OPERATOR_AUTH_HTTP_NOT_PROVEN_403/)});
test('both HTTP paths and scope verified',async()=>{
 const calls=[];const r=await testOperatorHttp({env,transport:async(url,options)=>{
 calls.push({url,headers:options.headers,method:options.method});
 return calls.length===1?{status:401}:{status:200,json:async()=>body};
 }});
 assert.equal(r.status,'AUTHENTICATED_READONLY_PROVEN');assert.equal(r.betting_authority,false);
 assert.equal(calls.length,2);assert.equal(calls[0].headers.origin,SITE_ORIGIN);
 assert.equal(calls[0].headers.authorization,undefined);
 assert.equal(calls[1].headers.authorization,'Bearer synthetic-jwt');
 assert.equal(calls[1].url,ATLAS_ENDPOINT);
});
test('response never carries token back to caller',async()=>{let c=0;const r=await testOperatorHttp({env,transport:async()=>++c===1?{status:401}:{status:200,json:async()=>body}});assert.equal(JSON.stringify(r).includes('synthetic-jwt'),false)});
