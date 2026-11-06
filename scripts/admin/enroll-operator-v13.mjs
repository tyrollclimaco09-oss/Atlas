import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
// ATLAS operator enrollment: EXISTING CONFIRMED USER ONLY. Admin-key server-side only.
const uuid=/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const digest=email=>createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
export function plan({user,id,emailSha256,approval}){
 if(!uuid.test(id??'')||!/^[a-f\d]{64}$/i.test(emailSha256??'')||
 approval!=='APPROVE_VERIFIED_OPERATOR')throw Error('ADMIN_APPROVAL_REQUIRED');
 if(!user||user.id!==id||user.is_anonymous!==false||!user.email_confirmed_at||
 digest(user.email)!==emailSha256.toLowerCase())throw Error('IDENTITY_NOT_VERIFIED');
 if(user.app_metadata?.atlas_operator===true)return {status:'ALREADY_AUTHORIZED',update:null};
 return {status:'REQUIRES_EXPLICIT_ADMIN_APPLY',update:{app_metadata:{...user.app_metadata,atlas_operator:true}}};
}
export async function enroll({env=process.env,fetcher=fetch,apply=false}={}){
 const {SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,ATLAS_OPERATOR_USER_ID:id,
 ATLAS_OPERATOR_CONFIRMED_EMAIL_SHA256:emailSha256,ATLAS_OPERATOR_ADMIN_APPROVAL:approval,
 ATLAS_OPERATOR_ADMIN_WRITE_CONFIRM:confirmation}=env;
 if(!url?.startsWith('https://')||!key)throw Error('SERVER_SECRETS_REQUIRED');
 if(key.startsWith('sb_secret_'))throw Error('USE_SDK_OPERATOR_BOOTSTRAP_V15_FOR_NEW_API_KEYS');
 if(!uuid.test(id??''))throw Error('VERIFIED_USER_ID_REQUIRED');
 const endpoint=url.replace(/\/$/,'')+'/auth/v1/admin/users/'+id;
 const headers={apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'};
 const response=await fetcher(endpoint,{method:'GET',headers});
 if(response.status===404)throw Error('OPERATOR_AUTH_ACCOUNT_NOT_CREATED');
 if(!response.ok)throw Error('AUTH_ADMIN_READ_FAILED');
 const data=await response.json(),user=data.user??data;
 const p=plan({user,id,emailSha256,approval});
 if(p.update===null)return {status:'ALREADY_AUTHORIZED',changed:false};
 if(!apply)return {status:'READY_FOR_ADMIN_APPLY',changed:false};
 if(confirmation!=='PROMOTE_EXISTING_VERIFIED_USER')throw Error('SECOND_ADMIN_CONFIRMATION_REQUIRED');
 const written=await fetcher(endpoint,{method:'PUT',headers,body:JSON.stringify(p.update)});
 if(!written.ok)throw Error('AUTH_ADMIN_WRITE_FAILED');
 const verify=await fetcher(endpoint,{method:'GET',headers});
 if(!verify.ok)throw Error('AUTH_READBACK_FAILED');
 const json=await verify.json(),current=json.user??json;
 if(current.id!==id||current.app_metadata?.atlas_operator!==true)throw Error('AUTH_READBACK_MISMATCH');
 return {status:'VERIFIED_OPERATOR_ENROLLED',changed:true,jwt_refresh_required:true};
}
export const emailDigest=digest;
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 enroll({apply:process.argv.includes('--apply')}).then(x=>console.log(x.status))
 .catch(e=>{console.error(e.message);process.exitCode=1});
