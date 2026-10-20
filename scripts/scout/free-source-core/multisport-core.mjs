// ATLAS free-first multisport schedule reader. Pure functions; no API calls, database, or betting logic.
// SHADOW / SCOUT_REFERENCE_ONLY. No result, odds, pricing, probability or execution authority.
const SPEC = Object.freeze({
  MLB:{provider:'MLB_STATS_API',host:'statsapi.mlb.com',trust:'LEAGUE_OPERATED_PUBLIC_ENDPOINT'},
  NHL:{provider:'NHL_WEB_API',host:'api-web.nhle.com',trust:'LEAGUE_OPERATED_PUBLIC_ENDPOINT'},
  NBA:{provider:'ESPN_UNOFFICIAL',path:'basketball/nba',trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT'},
  WNBA:{provider:'ESPN_UNOFFICIAL',path:'basketball/wnba',trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT'},
  CFB:{provider:'ESPN_UNOFFICIAL',path:'football/college-football',trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT'},
  SOCCER:{provider:'ESPN_UNOFFICIAL',path:'soccer',trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT'},
  TENNIS:{provider:'ESPN_UNOFFICIAL',path:'tennis',trust:'UNOFFICIAL_UNSUPPORTED_ENDPOINT'},
});
export const SOCCER_LEAGUES = Object.freeze(['eng.1','esp.1','ger.1','ita.1','fra.1','usa.1']);
export const TENNIS_TOURS = Object.freeze(['atp','wta']);
export const SUPPORTED_SPORTS = Object.freeze(Object.keys(SPEC));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TZ = /(Z|[+-]\d{2}:\d{2})$/;
const safeId = value => { const s=String(value??'');if(!/^[A-Za-z0-9_.:-]{1,100}$/.test(s))throw Error('INVALID_FIXTURE_ID');return s;};
function checkDate(date){
  if(typeof date!=='string'||!DAY.test(date))throw Error('INVALID_DATE');
  const p=Date.parse(date+'T12:00:00Z');if(!Number.isFinite(p)||new Date(p).toISOString().slice(0,10)!==date)throw Error('INVALID_DATE');
  const year=Number(date.slice(0,4));if(year<2000||year>2100)throw Error('INVALID_DATE');
  return p;
}
export function buildRequest({sport,date,league}={}){
  const s=String(sport||'').toUpperCase();if(!Object.hasOwn(SPEC,s))throw Error('UNSUPPORTED_SPORT');
  checkDate(date);
  if(s==='SOCCER'&&!SOCCER_LEAGUES.includes(league))throw Error('SOCCER_LEAGUE_REQUIRED');
  if(s==='TENNIS'&&!TENNIS_TOURS.includes(league))throw Error('TENNIS_TOUR_REQUIRED');
  if(!['SOCCER','TENNIS'].includes(s)&&league!==undefined&&league!==null)throw Error('UNEXPECTED_LEAGUE');
  let url;
  if(s==='MLB')url=`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
  else if(s==='NHL')url=`https://api-web.nhle.com/v1/score/${date}`;
  else {
    let sub=SPEC[s].path;
    if(s==='SOCCER'||s==='TENNIS')sub+=`/${league}`;
    url=`https://site.api.espn.com/apis/site/v2/sports/${sub}/scoreboard?dates=${date.replaceAll('-','')}`;
    if(s==='CFB')url+='&groups=80'; // FBS only; group may be changed by publisher
  }
  const o=new URL(url);
  if(o.protocol!=='https:'||!['statsapi.mlb.com','api-web.nhle.com','site.api.espn.com'].includes(o.hostname))throw Error('SOURCE_NOT_ALLOWED');
  return {sport:s,date,league:league??null,source_url:url,provider:SPEC[s].provider,source_trust:SPEC[s].trust};
}
function kickoff(date,day){
  if(typeof date!=='string'||!TZ.test(date))throw Error('INVALID_KICKOFF_OFFSET');
  const p=Date.parse(date);if(!Number.isFinite(p))throw Error('INVALID_KICKOFF');
  if(Math.abs(p-checkDate(day))>60*60*1000*48)throw Error('KICKOFF_OUT_OF_DAY_WINDOW');
  return new Date(p).toISOString();
}
function participant(s,v){
  if(!v||typeof v!=='object')throw Error('MISSING_PARTICIPANT');
  const id=v.id??v.team?.id??v.athlete?.id;
  const name=v.name??v.fullName??v.displayName??v.team?.displayName??v.team?.name??v.athlete?.displayName??v.athlete?.fullName;
  const abbr=v.abbreviation??v.abbrev??v.team?.abbreviation??v.team?.shortDisplayName??null;
  if(id===undefined||id===null||typeof name!=='string'||name.trim().length<2||name.length>130)throw Error('MISSING_PARTICIPANT_ID_OR_NAME');
  return {id:safeId(id),name:name.trim(),abbreviation:typeof abbr==='string'&&abbr.length<=15?abbr:null};
}
function parseMLB(data){
  if(!Array.isArray(data?.dates))throw Error('MLB_SCHEMA_INVALID');
  return data.dates.flatMap(x=>{
    if(!Array.isArray(x?.games))throw Error('MLB_GAMES_INVALID');
    return x.games.map(g=>({id:g.gamePk,at:g.gameDate,away:participant('MLB',g.teams?.away?.team),home:participant('MLB',g.teams?.home?.team),status:g.status?.abstractGameState??'UNKNOWN',provider_game_date:x.date}));
  });
}
function parseNHL(data){
  if(!Array.isArray(data?.games))throw Error('NHL_SCHEMA_INVALID');
  return data.games.map(g=>({id:g.id,at:g.startTimeUTC,away:participant('NHL',{id:g.awayTeam?.id,name:g.awayTeam?.placeName?.default||g.awayTeam?.abbrev,abbreviation:g.awayTeam?.abbrev}),home:participant('NHL',{id:g.homeTeam?.id,name:g.homeTeam?.placeName?.default||g.homeTeam?.abbrev,abbreviation:g.homeTeam?.abbrev}),status:g.gameState??'UNKNOWN',provider_game_date:g.gameDate??null}));
}
function parseESPN(data,sport){
  if(!Array.isArray(data?.events))throw Error('ESPN_SCHEMA_INVALID');
  return data.events.flatMap(event=>{
    if(!Array.isArray(event?.competitions)||event.competitions.length<1)throw Error('ESPN_COMPETITION_INVALID');
    return event.competitions.map(comp=>{
      const members=comp.competitors;
      if(!Array.isArray(members)||members.length!==2)throw Error('ESPN_COMPETITORS_INVALID');
      // Match sports have home/away; tennis uses draw order (A/B) rather than misleading home/away.
      let away,home;
      if(sport==='TENNIS'){
        [away,home]=members;
      }else{
        home=members.find(x=>x.homeAway==='home');away=members.find(x=>x.homeAway==='away');
        if(!home||!away)throw Error('ESPN_HOME_AWAY_UNKNOWN');
      }
      return {id:comp.id??event.id,at:comp.date??event.date,away:participant(sport,away),home:participant(sport,home),status:comp.status?.type?.name??event.status?.type?.name??'UNKNOWN',provider_game_date:null};
    });
  });
}
export function normalizeResponse(data,scope,{observed_at}={}){
  const config=buildRequest(scope);
  const now=observed_at??new Date().toISOString();
  if(typeof now!=='string'||!TZ.test(now)||!Number.isFinite(Date.parse(now)))throw Error('OBSERVED_AT_INVALID');
  if(Date.parse(now)>Date.now()+60000)throw Error('FUTURE_OBSERVED_AT');
  const raw=config.sport==='MLB'?parseMLB(data):config.sport==='NHL'?parseNHL(data):parseESPN(data,config.sport);
  if(raw.length>200)throw Error('RESOURCE_BUDGET_EXCEEDED');
  const ids=new Set();const results=[];
  for(const g of raw){
    const id=safeId(g.id),at=kickoff(g.at,config.date);
    if(g.away.id===g.home.id)throw Error('SELF_MATCH_INVALID');
    if(ids.has(id))throw Error('DUPLICATE_FIXTURE_ID');ids.add(id);
    if(typeof g.status!=='string'||!g.status||g.status.length>80)throw Error('GAME_STATUS_INVALID');
    results.push({
      event_key:`${config.sport}:${config.provider}:${id}`,source_event_id:id,
      sport:config.sport,league:config.league??config.sport,event_date:config.date,
      // For tennis these are ordered participants rather than geographic home/away.
      away:g.away,home:g.home,participants_ordered_not_home_away:config.sport==='TENNIS',
      start_at_utc:at,status_at_retrieval:g.status,
      observed_at:new Date(Date.parse(now)).toISOString(),source_published_at:null,
      source_url:config.source_url,source_provider:config.provider,source_trust:config.source_trust,
      historical_pit_verified:false,independent_schedule_verified:false,source_freshness_proven:false,
      truth_label:'SCOUT_REFERENCE_ONLY',verification_state:'UNVERIFIED',
      market_price:null,model_probability:null,executable_price_verified:false,
      production_authority:false,execution_authority:false,
    });
  }
  return results.sort((a,b)=>a.start_at_utc.localeCompare(b.start_at_utc)||a.event_key.localeCompare(b.event_key));
}