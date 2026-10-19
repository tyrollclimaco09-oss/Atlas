'use strict';

// ATLAS Operator Remote: secure-backend admission POLICY ONLY.
// Not wired to any HTTP server, OAuth identity provider, secrets store, or plugin adapter.
// A real backend MUST source "trusted" from independently authenticated server middleware,
// never the request body. Successful admission is NOT execution.
const {timingSafeEqual} = require('node:crypto');

const ACTIONS=Object.freeze({
 STATUS:'READ_ONLY', MASTERSAVE:'REVIEW_WRITE', RESTORE:'READ_ONLY',
 AUDIT:'READ_ONLY', GRAPH:'READ_ONLY', PLUGINS:'READ_ONLY',
 ARCIII:'READ_ONLY', RESUME:'REVIEW_WORK'
});
const KEYS=Object.freeze(['action','intent','request_id','csrf']);
const FAILURE='DENIED_NO_PROVIDER_EXECUTION';
const exact=(v,fields)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.getPrototypeOf(v)===Object.prototype &&
  Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
const safeText=(x,n=256)=>typeof x==='string'&&x.length>0&&x.length<=n;
const deny=reason=>Object.freeze({authorized:false,admission:FAILURE,reason,provider_calls:0});
const admitted=(admission,action)=>Object.freeze({authorized:true,admission,action,execution:'NOT_IMPLEMENTED',provider_calls:0});

function equalsSecret(a,b){
 if(!safeText(a)||!safeText(b))return false;
 const x=Buffer.from(a,'utf8'),y=Buffer.from(b,'utf8');
 return x.length===y.length&&timingSafeEqual(x,y);
}

// All inputs to 'trusted' must be loaded exclusively from the server's authenticated
// session/grant store. The function cannot prove those services exist or are trustworthy.
function authorizeIntent(request,trusted,nowMs){
 if(!Number.isSafeInteger(nowMs)||nowMs<0)return deny('INVALID_CLOCK');
 if(!exact(request,KEYS))return deny('INVALID_REQUEST_SHAPE');
 if(!Object.hasOwn(ACTIONS,request.action))return deny('UNKNOWN_ACTION');
 if(!['PREVIEW','EXECUTE'].includes(request.intent)||!safeText(request.request_id,100))
   return deny('INVALID_INTENT');
 if(!trusted||typeof trusted!=='object')return deny('NO_TRUSTED_SERVER_CONTEXT');
 if(trusted.method!=='POST'||trusted.content_type!=='application/json')
   return deny('BAD_METHOD_OR_CONTENT_TYPE');
 if(!safeText(trusted.origin,500)||!safeText(trusted.allowed_origin,500)||
    trusted.origin!==trusted.allowed_origin||!trusted.origin.startsWith('https://'))
   return deny('UNTRUSTED_ORIGIN');
 const session=trusted.session;
 if(!session||session.verified!==true||session.role!=='owner'||
    session.realm!=='ATLAS_REVIEW'||!safeText(session.subject,120)||
    !Number.isSafeInteger(session.issued_at)||!Number.isSafeInteger(session.expires_at)||
    session.issued_at>nowMs||session.expires_at<=nowMs||
    session.expires_at-session.issued_at>86_400_000)
   return deny('NO_ACTIVE_VERIFIED_OWNER_SESSION');
 if(!equalsSecret(request.csrf,session.csrf_token))return deny('CSRF_MISMATCH');
 if(request.intent==='PREVIEW')return admitted('PREVIEW_ONLY',request.action);
 const role=ACTIONS[request.action];
 if(role==='READ_ONLY')return admitted('READ_INTENT_ACCEPTED',request.action);
 const grant=trusted.review_grant;
 if(!grant||!safeText(grant.id,120)||grant.action!==request.action||
    grant.subject!==session.subject||grant.approved_by_owner!==true||
    !Number.isSafeInteger(grant.issued_at)||!Number.isSafeInteger(grant.expires_at)||
    grant.issued_at>nowMs||grant.expires_at<=nowMs||
    grant.expires_at-grant.issued_at>120_000)
   return deny('MISSING_FRESH_SCOPED_GRANT');
 if(typeof trusted.consume_grant_once!=='function')return deny('NO_ATOMIC_GRANT_STORE');
 // Must be an atomic compare-and-set in a real backend: one session, one grant, one
 // action and one request ID. A callback returning true without server-side custody
 // is NOT reliable proof that replay was prevented.
 let used=false;
 try{used=trusted.consume_grant_once(grant.id,session.subject,request.action,request.request_id)===true;}
 catch{return deny('GRANT_STORE_UNAVAILABLE');}
 if(!used)return deny('GRANT_ALREADY_USED_OR_UNAVAILABLE');
 return admitted(role==='REVIEW_WRITE'?'REVIEW_WRITE_INTENT_ACCEPTED':'RESEARCH_INTENT_ACCEPTED',request.action);
}

module.exports=Object.freeze({ACTIONS,authorizeIntent});
