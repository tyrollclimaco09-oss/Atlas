import {test} from 'node:test';import assert from 'node:assert/strict';
import {hashEmail,validateInvitation,inviteOperator,EXPECTED_URL} from '../scripts/admin/invite-operator-v14.mjs';
const mail='synthetic.operator@example.invalid';
const env={SUPABASE_URL:EXPECTED_URL,ATLAS_OPERATOR_INVITE_EMAIL:mail,
ATLAS_OPERATOR_INVITE_EMAIL_SHA256:hashEmail(mail),
ATLAS_OPERATOR_INVITE_APPROVAL:'ADMIN_APPROVED_OPERATOR_INVITE'};
const answer=(status=200,email=mail)=>({ok:status>=200&&status<300,status,json:async()=>({user:{id:'synthetic-id',email}})});
test('sha256 normalizes case',()=>assert.equal(hashEmail('SYNTHETIC.OPERATOR@EXAMPLE.INVALID '),hashEmail(mail)));
test('original project enforced',()=>assert.throws(()=>validateInvitation({...env,SUPABASE_URL:'https://another.supabase.co'}),/ATLAS_PROJECT_MISMATCH/));
test('no recipient fails',()=>assert.throws(()=>validateInvitation({...env,ATLAS_OPERATOR_INVITE_EMAIL:''}),/VERIFIED_OPERATOR_EMAIL_REQUIRED/));
test('incorrect recipient hash fails',()=>assert.throws(()=>validateInvitation({...env,ATLAS_OPERATOR_INVITE_EMAIL_SHA256:'0'.repeat(64)}),/OPERATOR_EMAIL_HASH_MISMATCH/));
test('missing admin approval fails',()=>assert.throws(()=>validateInvitation({...env,ATLAS_OPERATOR_INVITE_APPROVAL:''}),/ADMIN_INVITE_APPROVAL_REQUIRED/));
test('valid plan has no privilege',()=>assert.equal(validateInvitation(env).permission_granted,false));
test('dry-run sends no network calls',async()=>{const x=await inviteOperator({env,fetcher:()=>{throw Error('network should not be used')}});assert.equal(x.sent,false)});
test('send requires second authorization',async()=>assert.rejects(inviteOperator({env,send:true}),/SECOND_INVITATION_CONFIRMATION_REQUIRED/));
test('send requires admin secret',async()=>assert.rejects(inviteOperator({env:{...env,ATLAS_OPERATOR_INVITE_SEND_CONFIRM:'SEND_EXISTING_VERIFIED_OPERATOR_INVITE'},send:true}),/TRUSTED_ADMIN_SECRET_REQUIRED/));
const sending={...env,ATLAS_OPERATOR_INVITE_SEND_CONFIRM:'SEND_EXISTING_VERIFIED_OPERATOR_INVITE',SUPABASE_SERVICE_ROLE_KEY:'synthetic-admin-key-long-enough'};
test('invite writes only email and never authorization metadata',async()=>{
 let seen=null;const x=await inviteOperator({env:sending,send:true,fetcher:async(url,o)=>{seen={url,method:o.method,body:JSON.parse(o.body)};return answer()}});
 assert.equal(seen.method,'POST');assert.equal(seen.url,EXPECTED_URL+'/auth/v1/invite');
 assert.deepEqual(seen.body,{email:mail});assert.equal(x.permission_granted,false);
});
test('provider 401 rejected',async()=>assert.rejects(inviteOperator({env:sending,send:true,fetcher:async()=>answer(401)}),/INVITATION_PROVIDER_REJECTED_401/));
test('provider identity mismatch rejected',async()=>assert.rejects(inviteOperator({env:sending,send:true,fetcher:async()=>answer(200,'wrong@example.invalid')}),/INVITATION_IDENTITY_MISMATCH/));
test('response missing user fails',async()=>assert.rejects(inviteOperator({env:sending,send:true,fetcher:async()=>({ok:true,json:async()=>({})})}),/INVITATION_RESPONSE_MISSING_USER/));
test('no secret exposed in returned status',async()=>{const x=await inviteOperator({env:sending,send:true,fetcher:async()=>answer()});assert.equal(JSON.stringify(x).includes('synthetic-admin-key'),false)});
