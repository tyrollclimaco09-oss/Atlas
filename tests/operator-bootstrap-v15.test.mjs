import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runBootstrap,digestEmail,checkExistingUser,PROJECT_URL} from '../scripts/admin/operator-bootstrap-v15.mjs';
const email='operator@example.invalid',id='ea7b14f8-8a15-4749-97f2-3789527caecc';
const base={SUPABASE_URL:PROJECT_URL,SUPABASE_SECRET_KEY:'synthetic-secret-key-which-never-exists',
 ATLAS_OPERATOR_INVITE_EMAIL:email,ATLAS_OPERATOR_EMAIL_SHA256:digestEmail(email),
 ATLAS_ADMIN_INVITE_APPROVAL:'APPROVE_EXACT_VERIFIED_EMAIL_INVITATION',
 ATLAS_ADMIN_ROLE_APPROVAL:'APPROVE_CONFIRMED_EXISTING_OPERATOR',
 ATLAS_OPERATOR_USER_ID:id};
const user={id,email,is_anonymous:false,email_confirmed_at:'2026-11-06T16:00:00Z',app_metadata:{provider:'email'}};
function factory({users=[],userRead=user,invitationUser=user}={}){
 const calls=[];
 return {calls,makeClient:async()=>({auth:{admin:{
  listUsers:async()=>{calls.push('list');return {data:{users},error:null}},
  getUserById:async()=>{calls.push('get');return {data:{user:userRead},error:null}},
  inviteUserByEmail:async(x)=>{calls.push('invite');return {data:{user:{...invitationUser,email:x}},error:null}},
  updateUserById:async(x,attributes)=>{calls.push('update');userRead={...userRead,app_metadata:attributes.app_metadata};return {data:{user:userRead},error:null}}
 }}})};
}
test('hash is case-insensitive',()=>assert.equal(digestEmail('OPERATOR@EXAMPLE.INVALID'),digestEmail(email)));
test('missing admin key status is blocked with no API call',async()=>assert.equal((await runBootstrap({env:{SUPABASE_URL:PROJECT_URL}})).state,'ADMIN_CREDENTIAL_UNAVAILABLE'));
test('wrong project fails',async()=>assert.rejects(runBootstrap({env:{...base,SUPABASE_URL:'https://other.supabase.co'}}),/PROJECT_IDENTITY_MISMATCH/));
test('invite requires verified exact email hash',async()=>assert.rejects(runBootstrap({mode:'invite',env:{...base,ATLAS_OPERATOR_EMAIL_SHA256:'0'.repeat(64)}}),/EMAIL_IDENTITY_HASH_MISMATCH/));
test('invite default dry-run causes no SDK calls',async()=>{const f=factory();const r=await runBootstrap({mode:'invite',env:base,makeClient:f.makeClient});assert.equal(r.changed,false);assert.deepEqual(f.calls,[])});
test('invitation requires second consent',async()=>assert.rejects(runBootstrap({mode:'invite',env:base,apply:true,makeClient:factory().makeClient}),/INVITE_SECOND_CONFIRMATION_REQUIRED/));
test('invitation only calls auth invite, does not grant operator role',async()=>{const f=factory();const r=await runBootstrap({mode:'invite',env:{...base,ATLAS_ADMIN_INVITE_SECOND_CONFIRM:'SEND_APPROVED_OPERATOR_INVITATION'},apply:true,makeClient:f.makeClient});assert.deepEqual(f.calls,['invite']);assert.equal(r.role_granted,false)});
test('authorization rejects invalid account identity',()=>assert.throws(()=>checkExistingUser({...user,email:'not-me@invalid.test'},base),/CONFIRMED_OPERATOR_IDENTITY_NOT_VERIFIED/));
test('authorization rejects unconfirmed email',()=>assert.throws(()=>checkExistingUser({...user,email_confirmed_at:null},base),/CONFIRMED_OPERATOR_IDENTITY_NOT_VERIFIED/));
test('authorization rejects anonymous users',()=>assert.throws(()=>checkExistingUser({...user,is_anonymous:true},base),/CONFIRMED_OPERATOR_IDENTITY_NOT_VERIFIED/));
test('role cannot be applied without second confirmation',async()=>assert.rejects(runBootstrap({mode:'authorize',env:base,apply:true,makeClient:factory().makeClient}),/ROLE_SECOND_CONFIRMATION_REQUIRED/));
test('real mock update preserves existing provider field',async()=>{const f=factory();const r=await runBootstrap({mode:'authorize',env:{...base,ATLAS_ADMIN_ROLE_SECOND_CONFIRM:'GRANT_TO_VERIFIED_EXISTING_AUTH_USER'},apply:true,makeClient:f.makeClient});assert.deepEqual(f.calls,['get','update','get']);assert.equal(r.requires_session_refresh,true)});
test('status read does not create account or grant access',async()=>{const f=factory();const r=await runBootstrap({env:base,makeClient:f.makeClient});assert.deepEqual(f.calls,['list']);assert.equal(r.state,'AUTH_NO_USERS')});
test('unrecognized mode fails',async()=>assert.rejects(runBootstrap({mode:'signup',env:base}),/UNSUPPORTED_AUTH_OPERATION/));
