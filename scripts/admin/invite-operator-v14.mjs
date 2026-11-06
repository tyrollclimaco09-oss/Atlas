import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

// ATLAS V14. This script *invites* a verified human; never creates privileges.
// Use in a trusted admin environment. Never commit email, service keys, or OTPs.
export const EXPECTED_URL='https://lhliqbbooproqtslmgqi.supabase.co';
export function hashEmail(value){
 return createHash('sha256').update(String(value??'').trim().toLowerCase()).digest('hex');
}
export function validateInvitation(env){
 const {SUPABASE_URL,ATLAS_OPERATOR_INVITE_EMAIL:email,ATLAS_OPERATOR_INVITE_EMAIL_SHA256:hash,
 ATLAS_OPERATOR_INVITE_APPROVAL:approval}=env;
 if(SUPABASE_URL!==EXPECTED_URL)throw Error('ATLAS_PROJECT_MISMATCH');
 if(typeof email!=='string'||email.length>254||
 !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('VERIFIED_OPERATOR_EMAIL_REQUIRED');
 if(!/^[a-f0-9]{64}$/i.test(hash??'')||hashEmail(email)!==hash.toLowerCase())
  throw Error('OPERATOR_EMAIL_HASH_MISMATCH');
 if(approval!=='ADMIN_APPROVED_OPERATOR_INVITE')throw Error('ADMIN_INVITE_APPROVAL_REQUIRED');
 return {status:'READY_FOR_OPERATOR_INVITE',email_hash:hash.toLowerCase(),permission_granted:false};
}
export async function inviteOperator({env=process.env,send=false,fetcher=fetch}={}){
 const validated=validateInvitation(env);
 if(!send)return {...validated,sent:false};
 if(env.ATLAS_OPERATOR_INVITE_SEND_CONFIRM!=='SEND_EXISTING_VERIFIED_OPERATOR_INVITE')
  throw Error('SECOND_INVITATION_CONFIRMATION_REQUIRED');
 const secret=env.SUPABASE_SERVICE_ROLE_KEY??env.SUPABASE_SECRET_KEY;
 if(typeof secret!=='string'||secret.length<20)throw Error('TRUSTED_ADMIN_SECRET_REQUIRED');
 const response=await fetcher(EXPECTED_URL+'/auth/v1/invite',{
  method:'POST',
  headers:{'Content-Type':'application/json',apikey:secret,Authorization:'Bearer '+secret},
  body:JSON.stringify({email:env.ATLAS_OPERATOR_INVITE_EMAIL.trim()})
 });
 if(!response.ok)throw Error('INVITATION_PROVIDER_REJECTED_'+response.status);
 const body=await response.json();
 const user=body.user??body;
 if(!user?.id||!user.email)throw Error('INVITATION_RESPONSE_MISSING_USER');
 if(hashEmail(user.email)!==validated.email_hash)throw Error('INVITATION_IDENTITY_MISMATCH');
 return {status:'INVITED_EMAIL_CONFIRMATION_PENDING',sent:true,email_hash:validated.email_hash,
  permission_granted:false,operator_sign_in_verified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 inviteOperator({send:process.argv.includes('--send')}).then(result=>{
  console.log(result.status+'; permission_granted=false');
 }).catch(e=>{console.error(e.message);process.exitCode=1});
