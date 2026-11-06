import {pathToFileURL} from 'node:url';
// ATLAS V14: operator-origin HTTP acceptance, read-only. Requires a real operator
// session JWT and public publishable key. DO NOT log a JWT, key or response body.
export const ATLAS_ENDPOINT='https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-slate-duo-v10?mode=integration';
export const SITE_ORIGIN='https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site';
export function validateIntegration(body){
 if(!body||body.ok!==true||body.mode!=='integration'||
 body.execution_authority!==false||body.production_authority!==false||
 body.human_final_gate_required!==true||
 body.status!=='RESEARCH_BACKBONE_LINKED_NOT_EXECUTABLE')throw Error('UNTRUSTED_INTEGRATION_RESPONSE');
 const t=body.totals;
 if(!t||!Number.isInteger(t.scheduled_games)||t.scheduled_games<1||
 !Number.isInteger(t.canonical_events)||t.canonical_events!==t.scheduled_games||
 !Array.isArray(body.nodes)||body.nodes.length!==12||
 !Array.isArray(body.games)||body.games.length!==t.scheduled_games ||
 body.games.some(g=>!g.canonical_event_registered||
   !Number.isInteger(g.native_candidates)||g.native_candidates<0))
  throw Error('INTEGRATION_COVERAGE_INVALID');
 if(body.real_bet_placed!==false||body.calibrated_model_edge_proven!==false||
 body.quote_provider_live!==false)throw Error('UNVERIFIED_LIVE_AUTHORITY_CLAIM');
 return {status:'AUTHENTICATED_READONLY_PROVEN',games:t.scheduled_games,nodes:body.nodes.length,
  native_candidates:t.native_market_candidates,ready_for_operator:t.fully_proven_operator_review_candidates,
  betting_authority:false};
}
export async function testOperatorHttp({env=process.env,transport=fetch}={}){
 const jwt=env.ATLAS_OPERATOR_ACCESS_TOKEN;
 const publishable=env.SUPABASE_PUBLISHABLE_KEY;
 if(!jwt||!publishable)return {status:'AUTH_NOT_BOOTSTRAPPED',positive_http_proven:false,
 negative_http_proven:false};
 const base={'apikey':publishable,'origin':SITE_ORIGIN,'accept':'application/json'};
 const anonymous=await transport(ATLAS_ENDPOINT,{method:'GET',headers:base,redirect:'error'});
 if(![401,403].includes(anonymous.status))throw Error('UNAUTHORIZED_READ_NOT_REJECTED');
 const response=await transport(ATLAS_ENDPOINT,{method:'GET',
 headers:{...base,authorization:'Bearer '+jwt},redirect:'error'});
 if(response.status!==200)throw Error('OPERATOR_AUTH_HTTP_NOT_PROVEN_'+response.status);
 const data=await response.json();
 const proof=validateIntegration(data);
 return {...proof,positive_http_proven:true,negative_http_proven:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 testOperatorHttp().then(result=>console.log(JSON.stringify(result)))
 .catch(err=>{console.error(err.message);process.exitCode=1});
