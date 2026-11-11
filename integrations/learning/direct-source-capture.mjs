/**
 * ATLAS source evidence: direct HTTPS, exact allowlisted provider endpoints,
 * retained response bytes + SHA256, no user-controlled URL, no credentials.
 *
 * This establishes transport-observed provenance for a GitHub-runner fetch.
 * It is NOT a provider digital signature or guaranteed independent editorial
 * origin, and cannot retroactively authenticate older ATLAS screenshots.
 */
import {createHash} from 'node:crypto';
export const CAPTURE_CONTRACT='ATLAS_HTTPS_SOURCE_CAPTURE_V1';
export const NBA_URL='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const ESPN_BASE='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const MAX_BYTES=8_000_000;
const allowed=(provider,date)=>{
 if(!DATE_RE.test(date||''))throw Error('SOURCE_DATE_INVALID');
 if(provider==='NBA_OFFICIAL_CDN')return NBA_URL;
 if(provider==='ESPN_SCOREBOARD')return ESPN_BASE+'?dates='+date.replace(/-/g,'');
 throw Error('SOURCE_PROVIDER_NOT_ALLOWLISTED');
};
export function sha256(bytes){
 if(!Buffer.isBuffer(bytes))throw Error('CAPTURE_BYTES_INVALID');
 return createHash('sha256').update(bytes).digest('hex');
}
function bytesFrom(input) {
 if(!Buffer.isBuffer(input)&&!(input instanceof Uint8Array))throw Error('CAPTURE_BYTES_INVALID');
 return Buffer.from(input);
}
export function createSourceCapture({provider,date,bytes,observedAt,contentType,httpStatus=200}={}){
 const url=allowed(provider,date);
 const raw=bytesFrom(bytes);
 if(raw.length<25||raw.length>MAX_BYTES||httpStatus!==200||
    !/^(application\/(?:[\w.+-]*json)|text\/plain)(?:\s*;.*)?$/i.test(contentType||'')||
    !Number.isFinite(Date.parse(observedAt||'')))throw Error('CAPTURE_RESPONSE_INVALID');
 let data;try{data=JSON.parse(raw.toString('utf8'));}catch{throw Error('CAPTURE_JSON_INVALID');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('CAPTURE_JSON_INVALID');
 return {raw,metadata:{
  contract:CAPTURE_CONTRACT,provider,requested_date:date,request_url:url,
  origin_host:new URL(url).hostname,transport:'HTTPS_TLS_VALIDATED_BY_NODE_FETCH',
  response_status:httpStatus,content_type:contentType,
  observed_at:observedAt,sha256:sha256(raw),raw_byte_length:raw.length,
  provider_signature_verified:false,
  source_authentication_class:'DIRECT_HTTPS_ORIGIN_OBSERVED_BYTES_HASH_BOUND',
  warning:'HTTPS proves host transport observed by this collector, not a provider-signed outcome or independent upstream editorial origin.'
 }};
}
export function verifySourceCapture(metadata,bytes) {
 const raw=bytesFrom(bytes);
 if(!metadata||metadata.contract!==CAPTURE_CONTRACT||
    metadata.request_url!==allowed(metadata.provider,metadata.requested_date)||
    metadata.origin_host!==new URL(metadata.request_url).hostname||
    metadata.transport!=='HTTPS_TLS_VALIDATED_BY_NODE_FETCH'||
    metadata.response_status!==200||
    metadata.provider_signature_verified!==false||
    metadata.source_authentication_class!=='DIRECT_HTTPS_ORIGIN_OBSERVED_BYTES_HASH_BOUND'||
    metadata.raw_byte_length!==raw.length||
    metadata.sha256!==sha256(raw))throw Error('CAPTURE_PROVENANCE_OR_BYTES_MISMATCH');
 const check=createSourceCapture({provider:metadata.provider,date:metadata.requested_date,
    bytes:raw,observedAt:metadata.observed_at,contentType:metadata.content_type,
    httpStatus:metadata.response_status});
 if(check.metadata.sha256!==metadata.sha256)throw Error('CAPTURE_PROVENANCE_OR_BYTES_MISMATCH');
 return JSON.parse(raw.toString('utf8'));
}
export async function fetchAllowedSource(provider,date,{fetchImpl=fetch,now=()=>new Date().toISOString()}={}){
 const url=allowed(provider,date);
 const response=await fetchImpl(url,{
  method:'GET',redirect:'error',cache:'no-store',
  headers:{Accept:'application/json','User-Agent':'ATLAS-Research-Source-Evidence/1.0'},
  signal:AbortSignal.timeout(12000)
 });
 if(!response||response.status!==200)throw Error('SOURCE_HTTP_'+(response?.status||'UNAVAILABLE'));
 const cl=Number(response.headers?.get('content-length')||0);
 if(Number.isFinite(cl)&&cl>MAX_BYTES)throw Error('SOURCE_BODY_TOO_LARGE');
 // Response.arrayBuffer() is bounded after read; do not persist oversized bytes.
 const bytes=Buffer.from(await response.arrayBuffer());
 return createSourceCapture({provider,date,bytes,observedAt:now(),
   contentType:response.headers?.get('content-type')||'',httpStatus:response.status});
}
