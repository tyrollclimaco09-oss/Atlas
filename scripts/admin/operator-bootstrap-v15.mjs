import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// ATLAS V15 — server-side-only Auth Admin bootstrap, Supabase SDK v2.
// Live use requires installed @supabase/supabase-js@2.117.2 in trusted admin runtime.
// NEVER run in a browser, GitHub Actions with secret keys, or public ChatGPT Sites source.
export const PROJECT_URL='https://lhliqbbooproqtslmgqi.supabase.co';
export const digestEmail=email=>createHash('sha256').update(String(email??'').trim().toLowerCase()).digest('hex');
const validId=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
function getInputs(env,mode){
 if(env.SUPABASE_URL!==PROJECT_URL)throw Error('PROJECT_IDENTITY_MISMATCH');
 if(!['status','invite','authorize'].includes(mode))throw Error('UNSUPPORTED_AUTH_OPERATION');
 const email=String(env.ATLAS_OPERATOR_INVITE_EMAIL??'').trim().toLowerCase();
 const hash=String(env.ATLAS_OPERATOR_EMAIL_SHA256??'').toLowerCase();
 if(mode!=='status'){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('VERIFIED_EMAIL_REQUIRED');
  if(!/^[a-f0-9]{64}$/.test(hash)||digestEmail(email)!==hash)throw Error('EMAIL_IDENTITY_HASH_MISMATCH');
 }
 if(mode==='invite'&&env.ATLAS_ADMIN_INVITE_APPROVAL!=='APPROVE_EXACT_VERIFIED_EMAIL_INVITATION')
  throw Error('EXPLICIT_INVITE_APPROVAL_REQUIRED');
 if(mode==='authorize'&&(env.ATLAS_ADMIN_ROLE_APPROVAL!=='APPROVE_CONFIRMED_EXISTING_OPERATOR'||
    !validId(env.ATLAS_OPERATOR_USER_ID)))throw Error('EXPLICIT_OPERATOR_APPROVAL_REQUIRED');
 return {email,hash};
}
async function sdkFactory(url,key){
 // Intentional dynamic dependency: no SDK or secret used in unit tests or default dry-run.
 const {createClient}=await import('@supabase/supabase-js');
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
}
export function checkExistingUser(user,env){
 const {email,hash}=getInputs(env,'authorize');
 if(!user||!validId(user.id)||user.id!==env.ATLAS_OPERATOR_USER_ID||
 user.is_anonymous!==false||!user.email_confirmed_at||
 digestEmail(user.email)!==hash||String(user.email).trim().toLowerCase()!==email)
  throw Error('CONFIRMED_OPERATOR_IDENTITY_NOT_VERIFIED');
 return {user_id:user.id,already_operator:user.app_metadata?.atlas_operator===true};
}
export async function runBootstrap({mode='status',env=process.env,makeClient=sdkFactory,apply=false}={}){
 const {email}=getInputs(env,mode);
 if(mode==='status' && !env.SUPABASE_SECRET_KEY) return {state:'ADMIN_CREDENTIAL_UNAVAILABLE',changed:false};
 const key=env.SUPABASE_SECRET_KEY;
 if(typeof key!=='string'||key.length<20)throw Error('TRUSTED_SECRET_KEY_REQUIRED');
 const client=await makeClient(PROJECT_URL,key);
 if(!client?.auth?.admin)throw Error('SUPABASE_AUTH_ADMIN_UNAVAILABLE');
 if(mode==='status'){
  const {data,error}=await client.auth.admin.listUsers({page:1,perPage:1});
  if(error)throw Error('AUTH_ADMIN_LOOKUP_FAILED');
  return {state:data?.users?.length?'AUTH_USER_EXISTS_CHECK_IDENTITY':'AUTH_NO_USERS',changed:false};
 }
 if(!apply)return {state:'EXPLICIT_ADMIN_APPLY_REQUIRED',changed:false};
 if(mode==='invite'){
  if(env.ATLAS_ADMIN_INVITE_SECOND_CONFIRM!=='SEND_APPROVED_OPERATOR_INVITATION')throw Error('INVITE_SECOND_CONFIRMATION_REQUIRED');
  const {data,error}=await client.auth.admin.inviteUserByEmail(email);
  if(error||!data?.user?.id)throw Error('AUTH_INVITATION_FAILED');
  if(digestEmail(data.user.email)!==digestEmail(email))throw Error('INVITATION_IDENTITY_READBACK_MISMATCH');
  return {state:'INVITE_SENT_CONFIRMATION_PENDING',changed:true,role_granted:false};
 }
 if(env.ATLAS_ADMIN_ROLE_SECOND_CONFIRM!=='GRANT_TO_VERIFIED_EXISTING_AUTH_USER')throw Error('ROLE_SECOND_CONFIRMATION_REQUIRED');
 const uid=env.ATLAS_OPERATOR_USER_ID;
 const {data:before,error:readErr}=await client.auth.admin.getUserById(uid);
 if(readErr)throw Error('AUTH_USER_LOOKUP_FAILED');
 const user=before?.user;
 const check=checkExistingUser(user,env);
 if(check.already_operator)return {state:'OPERATOR_ALREADY_GRANTED',changed:false};
 const metadata={...(user.app_metadata??{}),atlas_operator:true};
 const {error:writeErr}=await client.auth.admin.updateUserById(uid,{app_metadata:metadata});
 if(writeErr)throw Error('AUTH_OPERATOR_ROLE_WRITE_FAILED');
 const {data:after,error:verifyErr}=await client.auth.admin.getUserById(uid);
 if(verifyErr||after?.user?.id!==uid||after?.user?.app_metadata?.atlas_operator!==true)
  throw Error('AUTH_OPERATOR_ROLE_READBACK_FAILED');
 return {state:'OPERATOR_ROLE_GRANTED_REFRESH_JWT',changed:true,requires_session_refresh:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const arg=process.argv.includes('--invite')?'invite':process.argv.includes('--authorize')?'authorize':'status';
 runBootstrap({mode:arg,apply:process.argv.includes('--apply')})
 .then(r=>console.log(r.state)).catch(e=>{console.error(e.message);process.exitCode=1});
}