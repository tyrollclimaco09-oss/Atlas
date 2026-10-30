import { timingSafeEqual } from "node:crypto";

// ATLAS DK-only cost-bounded daily refresh. Not a sportsbook execution endpoint.
// Cron-only: never call from the browser or expose provider credentials.
export const PROVIDER_ID="3b9f6438-22c9-4ed7-992e-59a54e7bcc11";
export const DAILY_MAX_CREDITS=3,MIN_REMAINING=100;
export function authorized(header,secret){
 if(typeof secret!=="string"||secret.length<32||typeof header!=="string")return false;
 const expected="Bearer "+secret;
 const a=Buffer.from(header),b=Buffer.from(expected);
 return a.length===b.length && timingSafeEqual(a,b);
}
export function normalizeDK(events, mappings, canonical, observedAt){
 const now=Date.parse(observedAt), bindings=new Map(mappings.map(x=>[x.provider_event_id,x.event_id]));
 const byId=new Map(canonical.map(x=>[x.id,x]));
 const result=[];
 for(const e of events){
  const tip=Date.parse(e.commence_time);
  if(!e?.id||!Number.isFinite(tip)||tip<now-60000||tip>now+36*3600000)continue;
  const book=(e.bookmakers||[]).find(b=>b.key==="draftkings");
  if(!book)continue;
  const official=byId.get(bindings.get(e.id));
  let canonicalId=null,identity="UNMAPPED";
  if(official){
   const match=official.league==="NBA"&&official.home_team===e.home_team&&official.away_team===e.away_team&&
     Number.isFinite(Date.parse(official.start_time))&&Math.abs(Date.parse(official.start_time)-tip)<=15*60000;
   identity=match?(official.reconciliation_status==="reconciled"?"RECONCILED":"LINKED_PENDING"):"CONFLICT";
   if(match)canonicalId=official.id;
  }
  const all=[],seen=new Map(),quarantined=[];
  for(const m of book.markets||[]){
   if(!["h2h","spreads","totals"].includes(m.key))continue;
   const quoteAt=Date.parse(m.last_update);
   if(!Number.isFinite(quoteAt)||quoteAt>now+60000||now-quoteAt>900000){quarantined.push({market:m.key,reason:"STALE_OR_INVALID_TIMESTAMP"});continue;}
   for(const o of m.outcomes||[]){
    if(!Number.isInteger(o.price)||Math.abs(o.price)<100||Math.abs(o.price)>10000||(o.point!==undefined&&!Number.isFinite(o.point))){
      quarantined.push({market:m.key,reason:"INVALID_QUOTE"});continue;
    }
    const side=o.name===e.home_team?"home":o.name===e.away_team?"away":o.name;
    const q=[m.key,side,o.point??null,o.price,m.last_update];
    const key=JSON.stringify([m.key,side,o.point??null]);
    seen.set(key,(seen.get(key)||0)+1);
    all.push({key,q});
   }
  }
  const primary=all.filter(x=>seen.get(x.key)===1).map(x=>x.q);
  if(all.length!==primary.length)quarantined.push({reason:"DUPLICATE_OR_CONFLICTING_PRICE",count:all.length-primary.length});
  result.push({provider_event_id:e.id,canonical_event_id:canonicalId,identity_status:identity,
    away_team:e.away_team,home_team:e.home_team,commence_time:e.commence_time,
    dk_status:primary.length?"DK_REFERENCE_AVAILABLE":"DK_NO_VALID_QUOTES",
    primary_quotes:primary,price_disagreements:[],quarantined_count:quarantined.length});
 }
 return {contract:"ATLAS_DK_FIRST_SHADOW_V1",snapshot_schema:"ATLAS_DK_SITE_CRON_V1",
   observed_at:observedAt,primary_book:"draftkings",secondary_book:"betmgm",source:"THE_ODDS_API_V4",
   quote_columns:["market","side","line","american_odds","market_last_update"],
   execution_authority:false,approved_bet:null,expected_value:null,independent_fair_probability:null,
   executable_price_verified:false,requires_event_id_reconciliation:true,
   events:result};
}
export async function refresh({env=process.env,fetchImpl=fetch,now=new Date().toISOString()}={}){
 const url=env.SUPABASE_URL,role=env.SUPABASE_SERVICE_ROLE_KEY,key=env.THE_ODDS_API_KEY;
 if(!url?.startsWith("https://")||!role||!key)throw Error("INTERNAL_ENV_NOT_CONFIGURED");
 const day=now.slice(0,10),lockKey="atlas-dk-refresh-lock-"+day;
 const headers={apikey:role,Authorization:"Bearer "+role,"Content-Type":"application/json"};
 const db=async(path,options={})=>{
   const response=await fetchImpl(url+"/rest/v1/"+path,{headers:{...headers,...options.headers},method:options.method||"GET",
     body:options.body?JSON.stringify(options.body):undefined,signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error("DB_HTTP_"+response.status);
   return response.status===204?null:response.json().catch(()=>null);
 };
 const lock=await fetchImpl(url+"/rest/v1/atlas_site_research_reports_v1",{
   method:"POST",headers:{...headers,Prefer:"return=representation,resolution=ignore-duplicates"},
   body:JSON.stringify({delivery_key:lockKey,title:"ATLAS daily DK provider quota reservation",slate_date:day,
     truth_label:"RESEARCH_ONLY",body:JSON.stringify({phase:"RESERVED",max_credits:DAILY_MAX_CREDITS,at:now})}),
   signal:AbortSignal.timeout(10000)});
 if(!lock.ok)throw Error("LOCK_INSERT_HTTP_"+lock.status);
 const reserved=await lock.json();
 if(!Array.isArray(reserved)||reserved.length===0)return {status:"ALREADY_ATTEMPTED_TODAY",charged:0};
 const updateLock=async(data)=>{
   await db("atlas_site_research_reports_v1?delivery_key=eq."+encodeURIComponent(lockKey),{
     method:"PATCH",headers:{Prefer:"return=minimal"},body:{body:JSON.stringify(data)}});
 };
 // Probe last owned budget evidence before touching provider. Do not trust expired or absent quota anchors.
 const recent=await db("atlas_site_research_reports_v1?select=delivery_key,body,created_at&delivery_key=like.atlas-dk-refresh-lock-%25&order=created_at.desc&limit=5");
 const earlier=(recent||[]).filter(x=>x.delivery_key!==lockKey).find(x=>{
   try{return Number.isInteger(JSON.parse(x.body).remaining)}catch{return false}
 });
 const prior=earlier?JSON.parse(earlier.body):{remaining:454,at:"2026-10-29T23:59:47.562Z"};
 if(!Number.isInteger(prior.remaining)||prior.remaining<MIN_REMAINING+DAILY_MAX_CREDITS||
    Date.parse(now)-Date.parse(prior.at)>35*86400000){
   await updateLock({phase:"BLOCKED_BUDGET",at:now});return {status:"QUOTA_RESERVE_BLOCKED",charged:0};
 }
 const provider=new URL("https://api.the-odds-api.com/v4/sports/basketball_nba/odds/");
 provider.searchParams.set("apiKey",key);provider.searchParams.set("bookmakers","draftkings");
 provider.searchParams.set("markets","h2h,spreads,totals");provider.searchParams.set("oddsFormat","american");
 let rsp;
 try{rsp=await fetchImpl(provider,{signal:AbortSignal.timeout(14000)});}
 catch {await updateLock({phase:"PROVIDER_NETWORK_FAILED",at:now});throw Error("PROVIDER_NETWORK_FAILED");}
 const credits=Number(rsp.headers.get("x-requests-last")),remaining=Number(rsp.headers.get("x-requests-remaining"));
 if(!rsp.ok||credits>DAILY_MAX_CREDITS||credits<0||!Number.isFinite(remaining)){
   await updateLock({phase:"PROVIDER_QUOTA_OR_HTTP_FAILED",at:now,remaining:Number.isFinite(remaining)?remaining:null});
   throw Error("PROVIDER_FAILED_CLOSED");
 }
 const feed=await rsp.json();
 if(!Array.isArray(feed))throw Error("PROVIDER_JSON_INVALID");
 const ids=feed.map(x=>x.id).filter(x=>/^[a-f0-9]{32}$/.test(x)).slice(0,80);
 let mappings=[],canon=[];
 if(ids.length){
  mappings=await db("provider_events?select=event_id,provider_event_id&provider_id=eq."+PROVIDER_ID+
   "&provider_event_id=in.("+ids.join(",")+")");
  const ids2=[...new Set(mappings.map(x=>x.event_id).filter(x=>/^[a-f0-9-]{36}$/.test(x)))];
  if(ids2.length)canon=await db("events?select=id,league,home_team,away_team,start_time,reconciliation_status&id=in.("+ids2.join(",")+")");
 }
 const doc=normalizeDK(feed,mappings,canon,now);
 const body=JSON.stringify(doc);
 if(body.length>79000)throw Error("SNAPSHOT_EXCEEDS_REPORT_LIMIT");
 const keyReport="atlas-dk-odds-shadow-"+now.replace(/[-:.]/g,"").toLowerCase();
 await db("atlas_site_research_reports_v1",{
  method:"POST",headers:{Prefer:"return=minimal"},body:{
   delivery_key:keyReport,title:"DraftKings daily live provider research snapshot",slate_date:day,
   body,truth_label:"RESEARCH_ONLY"
  }});
 await updateLock({phase:"SUCCESS",at:now,remaining,credits_spent:credits,delivery_key:keyReport});
 return {status:"SUCCESS",as_of:now,events:doc.events.length,quotes:doc.events.reduce((n,e)=>n+e.primary_quotes.length,0),
   linked:doc.events.filter(e=>e.canonical_event_id).length,credits_spent:credits,credits_remaining:remaining,
   production_market_writes:0,betting_actions:0};
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({ok:false,status:"METHOD_NOT_ALLOWED"});
 if(!authorized(req.headers.authorization,process.env.CRON_SECRET))
   return res.status(401).json({ok:false,status:"UNAUTHORIZED"});
 try{
  const out=await refresh();
  return res.status(200).json({ok:true,...out});
 }catch(e){
  return res.status(503).json({ok:false,status:"FAILED_CLOSED",code:String(e.message||e).slice(0,80)});
 }
}
