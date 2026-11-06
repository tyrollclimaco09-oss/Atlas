// ATLAS V14: public negative HTTP security proof. No keys, no session tokens,
// no private query params, no sportsbook or paid provider calls.
import {pathToFileURL} from 'node:url';
export const ENDPOINT='https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-slate-duo-v10?mode=integration';
export const ORIGIN='https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site';
export async function verifyAnonymousDenied({transport=fetch}={}){
 const reply=await transport(ENDPOINT,{method:'GET',headers:{origin:ORIGIN,accept:'application/json'},
  cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(![401,403].includes(reply.status))throw Error('AUTH_GATE_UNEXPECTED_HTTP_'+reply.status);
 return {result:'UNAUTHENTICATED_HTTP_DENIED',http_status:reply.status,authenticated_http_proven:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 verifyAnonymousDenied().then(x=>console.log(x.result+': HTTP '+x.http_status))
 .catch(err=>{console.error(err.message);process.exitCode=1});
