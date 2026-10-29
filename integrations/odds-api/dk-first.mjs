/** ATLAS SCOUT -> PRICING -> EDGE THIEF. Pure, read-only DraftKings-first normalizer. */
export const BOOK_ORDER = Object.freeze(["draftkings","betmgm","fanduel"]);
export const FRESHNESS_MS = 15 * 60 * 1000;
const MARKETS = new Set(["h2h","spreads","totals","player_points","player_rebounds","player_assists","player_threes","player_points_alternate","player_threes_alternate"]);
export function impliedProbability(o) {
  if(!Number.isInteger(o)||Math.abs(o)<100) throw Error("ODDS_INVALID");
  return o>0 ? 100/(o+100) : -o/(-o+100);
}
function makeQuote(raw,event,book,market,now) {
  const player = typeof raw.description==="string"&&raw.description.trim()?raw.description.trim():null;
  const selection=typeof raw.name==="string"?raw.name.trim():null;
  const line=raw.point??null;
  const stamp=market.last_update;
  const ts=Date.parse(stamp);
  let status="VALID_REFERENCE";
  if(!selection||!Number.isInteger(raw.price)||Math.abs(raw.price)<100||Math.abs(raw.price)>100000||(line!==null&&(!Number.isFinite(line)))) status="INVALID_QUOTE";
  if(!Number.isFinite(ts))status="MISSING_MARKET_TIMESTAMP";
  else if(ts>now+60000)status="FUTURE_TIMESTAMP";
  else if(now-ts>FRESHNESS_MS)status="STALE_MARKET";
  return {
    provider_event_id:event.id,canonical_event_id:null,bookmaker:book.key,market:market.key,
    player,selection,line,american_odds:raw.price,market_last_update:typeof stamp==="string"?stamp:null,
    observed_at:new Date(now).toISOString(),status,source:"THE_ODDS_API_V4",executable_price_verified:false
  };
}
function id(q){return JSON.stringify([q.provider_event_id,q.bookmaker,q.market,q.player,q.selection,q.line]);}
function comparable(q){return JSON.stringify([q.provider_event_id,q.market,q.player,q.selection,q.line]);}
export function buildDraftKingsFeed({featured,eventPayloads=[],observedAt=new Date().toISOString(),upcomingOnly=true}){
  const now=Date.parse(observedAt);
  if(!Number.isFinite(now))throw Error("OBSERVED_TIME_INVALID");
  if(!Array.isArray(featured))throw Error("FEATURED_EVENTS_REQUIRED");
  const events=new Map();
  for(const e of featured)if(e&&typeof e.id==="string")events.set(e.id,{...e,bookmakers:[...(e.bookmakers||[])]});
  for(const e of eventPayloads){
    if(e&&typeof e.id==="string"&&events.has(e.id))events.get(e.id).bookmakers.push(...(e.bookmakers||[]));
  }
  const stats={events_seen:events.size,events_with_dk:0,accepted_dk_quotes:0,quarantined_quotes:0,price_comparisons:0};
  const output=[];
  for(const e of events.values()){
    const tip=Date.parse(e.commence_time);
    if(!Number.isFinite(tip)||(upcomingOnly&&tip<=now))continue;
    const groups=new Map(),seen=new Set();
    for(const b of e.bookmakers||[]){
      if(!BOOK_ORDER.includes(b.key))continue;
      seen.add(b.key);
      for(const m of b.markets||[]){
        if(!MARKETS.has(m.key))continue;
        for(const raw of m.outcomes||[]){
          const q=makeQuote(raw,e,b,m,now),key=id(q);
          if(!groups.has(key))groups.set(key,[]);
          groups.get(key).push(q);
        }
      }
    }
    const accepted=[],quarantined=[];
    for(const a of groups.values()){
      if(a.length>1){
        const different=new Set(a.map(q=>JSON.stringify([q.american_odds,q.market_last_update]))).size>1;
        const reason=different?"CONFLICTING_DUPLICATE":"DUPLICATE_QUOTE";
        quarantined.push(...a.map(q=>({...q,status:reason})));
      }else if(a[0].status!=="VALID_REFERENCE")quarantined.push(a[0]);
      else accepted.push(a[0]);
    }
    const dk=accepted.filter(q=>q.bookmaker==="draftkings");
    const rivals=accepted.filter(q=>q.bookmaker!=="draftkings");
    const lookup=new Map(),disagreements=[];
    for(const q of rivals){
      const key=comparable(q);if(!lookup.has(key))lookup.set(key,[]);
      lookup.get(key).push(q);
    }
    for(const q of dk){
      const options=lookup.get(comparable(q))||[];
      if(!options.length)continue;
      const best=options.reduce((a,b)=>b.american_odds>a.american_odds?b:a);
      const pp=100*(impliedProbability(best.american_odds)-impliedProbability(q.american_odds));
      disagreements.push({
        market:q.market,player:q.player,selection:q.selection,line:q.line,
        draftkings_odds:q.american_odds,best_comparator_book:best.bookmaker,best_comparator_odds:best.american_odds,
        dk_price_advantage_pp:Math.round(pp*100)/100,
        verdict:pp>0?"DK_BETTER_PRICE":pp<0?"RIVAL_BETTER_PRICE":"SAME_PRICE",
        expected_value:null,independent_fair_probability:null
      });
    }
    if(seen.has("draftkings"))stats.events_with_dk++;
    stats.accepted_dk_quotes+=dk.length;stats.quarantined_quotes+=quarantined.length;stats.price_comparisons+=disagreements.length;
    output.push({
      provider_event_id:e.id,canonical_event_id:null,sport:e.sport_key||"basketball_nba",
      away_team:e.away_team,home_team:e.home_team,commence_time:e.commence_time,
      dk_status:dk.length?"DK_REFERENCE_AVAILABLE":seen.has("draftkings")?"DK_NO_VALID_QUOTES":"DK_UNAVAILABLE",
      primary_quotes:dk,comparator_quotes:rivals,quarantined,price_disagreements:disagreements
    });
  }
  return {
    contract:"ATLAS_DK_FIRST_SHADOW_V1",observed_at:new Date(now).toISOString(),
    source:"THE_ODDS_API_V4",primary_book:"draftkings",secondary_book:"betmgm",reference_only_books:["fanduel"],
    authority:"REFERENCE_ONLY",execution_authority:false,approved_bet:null,expected_value:null,independent_fair_probability:null,
    requires_event_id_reconciliation:true,totals:stats,events:output
  };
}
