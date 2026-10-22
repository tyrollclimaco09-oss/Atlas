// ATLAS RILL source intake — pure, side-effect-free normalization.
// No external content is fetched. Operator-reported timestamps and claims are NEVER verified facts.
const HOSTS = new Map([
  ["reddit.com","REDDIT"],["www.reddit.com","REDDIT"],["old.reddit.com","REDDIT"],
  ["x.com","X"],["www.x.com","X"],["twitter.com","X"],["www.twitter.com","X"],
  ["instagram.com","INSTAGRAM"],["www.instagram.com","INSTAGRAM"],
  ["youtube.com","YOUTUBE"],["www.youtube.com","YOUTUBE"],["youtu.be","YOUTUBE"]
]);
const SPORTS = new Set(["NBA","WNBA","NFL","CFB","CBB","MLB","NHL","SOCCER","TENNIS","OTHER"]);
function sourceUrl(raw) {
  if(typeof raw!=="string" || raw.length>1500) throw Error("SOURCE_URL_REQUIRED");
  let u; try{u=new URL(raw)}catch{throw Error("INVALID_SOURCE_URL")}
  if(u.protocol!=="https:" || u.username || u.password || u.port) throw Error("HTTPS_SOURCE_REQUIRED");
  const platform=HOSTS.get(u.hostname.toLowerCase());
  if(!platform || u.pathname.length<3) throw Error("UNSUPPORTED_SOURCE_URL");
  u.hash=""; u.search=""; u.hostname=u.hostname.toLowerCase();
  const path=u.pathname.replace(/\/+$/,"");
  return {url:u.origin+path,platform};
}
export function normalizeSignal(body,observedAt=new Date().toISOString()){
  if(!body || typeof body!=="object" || Array.isArray(body)) throw Error("INVALID_BODY");
  const now=Date.parse(observedAt);
  if(!Number.isFinite(now))throw Error("CLOCK_INVALID");
  const src=sourceUrl(body.source_url);
  const original=body.original_url ? sourceUrl(body.original_url) : src;
  if(typeof body.handle!=="string" || !/^[a-zA-Z0-9_./-]{2,64}$/.test(body.handle))throw Error("HANDLE_REQUIRED");
  if(typeof body.claim!=="string" || body.claim.trim().length<12 || body.claim.length>1200)throw Error("CLAIM_LENGTH_INVALID");
  if(typeof body.sport!=="string" || !SPORTS.has(body.sport))throw Error("SPORT_INVALID");
  const reported=body.released_at;
  let releasedAt=observedAt,releaseTimeTrust="OBSERVED_AT_ONLY";
  if(reported!==undefined && reported!==null){
    if(typeof reported!=="string"|| !/Z$|[+-]\d\d:\d\d$/.test(reported)) throw Error("RELEASE_TIME_ZONE_REQUIRED");
    const time=Date.parse(reported);
    if(!Number.isFinite(time)|| time>now+300000 || time<946684800000)throw Error("RELEASE_TIME_INVALID");
    releasedAt=new Date(time).toISOString();releaseTimeTrust="OPERATOR_ASSERTED_UNVERIFIED";
  }
  let odds=null,line=null;
  if(body.odds!==undefined && body.odds!==null){
    if(!Number.isInteger(body.odds) || (body.odds<100 && body.odds>-100) || Math.abs(body.odds)>10000)throw Error("ODDS_INVALID");
    odds=body.odds;
  }
  if(body.line!==undefined && body.line!==null){
    if(typeof body.line!=="number" || !Number.isFinite(body.line) || body.line < -1000 || body.line>10000)throw Error("LINE_INVALID");
    line=body.line;
  }
  const market=body.market===undefined||body.market===null?null:String(body.market).trim();
  if(market!==null && (market.length<2||market.length>100))throw Error("MARKET_INVALID");
  const eventLabel=body.event_label===undefined||body.event_label===null?null:String(body.event_label).trim();
  if(eventLabel!==null && (eventLabel.length<3||eventLabel.length>120))throw Error("EVENT_LABEL_INVALID");
  const handle=body.handle.trim().toLowerCase();
  return {
    source_key:"RILL:"+src.platform+":"+handle,
    display_name:body.handle.trim(),
    source_type:src.platform,
    sport:body.sport,
    claim:body.claim.trim(),
    source_url:src.url,
    root_url:original.url,
    origin_assertion:body.original_url ? "OPERATOR_ASSERTED_UNVERIFIED" : "SOURCE_ITSELF",
    released_at:releasedAt,
    observed_at:observedAt,
    release_time_trust:releaseTimeTrust,
    market, line, odds, event_label:eventLabel,
    role:"DISCOVERY_ONLY",verification_state:"UNVERIFIED",
    production_authority:false,production_influence:false,
    executable_price_verified:false
  };
}
