/** ATLAS SCOUT → FILTER/VERIFY: operator-reviewed, read-only Flaim handoff. */
export const CONTRACT='ATLAS_FLAIM_SCOUT_SHADOW_V1';
const SUPPORTED=Object.freeze({
  get_transactions:new Set(['fantasy_add','fantasy_drop','fantasy_trade','fantasy_waiver']),
  get_roster:new Set(['fantasy_roster_presence','fantasy_status_flag']),
  get_free_agents:new Set(['fantasy_league_availability','fantasy_status_flag']),
  get_players:new Set(['fantasy_market_ownership','fantasy_status_flag']),
  get_matchups:new Set(['fantasy_projection','fantasy_points_observation'])
});
const MAX_AGE_MS=86400000;
const clean=(v,limit=160)=>typeof v==='string'&&v.length>0&&v.length<=limit&&!/[<>\u0000-\u001f]/.test(v)?v.trim():null;
const isIso=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)&&Number.isFinite(Date.parse(v));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const statuses=new Set(['questionable','doubtful','out','injured reserve','ir','gtd','day-to-day','dtd','suspended','pup']);
const rejected=(reason,source=null)=>({stage:'FILTER_VERIFY',status:'REJECTED',reason,source});
export function processFlaimObservation(input,{now=new Date().toISOString()}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return rejected('OBSERVATION_INVALID');
  const tool=clean(input.tool,40),platform=clean(input.platform,24)?.toLowerCase(),kind=clean(input.kind,48);
  const player=clean(input.player,100),sport=clean(input.sport,30)?.toLowerCase(),sourceTime=input.source_observed_at;
  const evaluatedAt=isIso(now)?Date.parse(now):NaN, timestamp=isIso(sourceTime)?Date.parse(sourceTime):NaN;
  const base=tool&&platform&&kind?{tool,platform,kind}:null;
  if(!SUPPORTED[tool]?.has(kind))return rejected('UNSUPPORTED_TOOL_OR_SIGNAL',base);
  if(!['espn','yahoo','sleeper'].includes(platform))return rejected('PLATFORM_UNSUPPORTED',base);
  if(!['basketball','football','baseball','hockey'].includes(sport))return rejected('SPORT_UNSUPPORTED',base);
  if(platform==='sleeper'&&!['basketball','football'].includes(sport))return rejected('SLEEPER_SPORT_UNSUPPORTED',base);
  if(!player||!clean(input.professional_team,80))return rejected('PLAYER_OR_TEAM_UNRESOLVED',base);
  if(!Number.isFinite(timestamp)||!Number.isFinite(evaluatedAt))return rejected('TIMESTAMP_REQUIRED',base);
  if(timestamp>evaluatedAt+60000)return rejected('FUTURE_TIMESTAMP',base);
  if(evaluatedAt-timestamp>MAX_AGE_MS)return rejected('STALE_FANTASY_SIGNAL',base);
  if(input.is_hypothetical!==false||input.is_from_connected_league!==true)return rejected('NOT_ATTESTED_FLAIM_CONNECTED_SOURCE',base);
  if(input.league_id||input.team_id||input.owner_name||input.credentials||input.raw_payload)return rejected('PRIVATE_OR_RAW_FIELDS_FORBIDDEN',base);
  const note=clean(input.note,240);
  if(!note)return rejected('CONCISE_EVIDENCE_NOTE_REQUIRED',base);
  if(kind==='fantasy_market_ownership'&&(input.ownership_scope!=='platform_global'||!finite(input.value)||input.value<0||input.value>100))
    return rejected('MARKET_OWNERSHIP_SCOPE_OR_RATE_INVALID',base);
  if(kind==='fantasy_projection'&&(!finite(input.value)||input.value<0||input.unit!=='fantasy_points'))
    return rejected('FANTASY_PROJECTION_UNIT_INVALID',base);
  if(kind==='fantasy_points_observation'&&(!finite(input.value)||input.value<0||input.unit!=='fantasy_points'))
    return rejected('FANTASY_POINTS_UNIT_INVALID',base);
  if(kind==='fantasy_status_flag'&&!statuses.has(String(input.status_code||'').toLowerCase()))return rejected('STATUS_CODE_NOT_INTERPRETABLE',base);
  if(['fantasy_add','fantasy_drop','fantasy_trade','fantasy_waiver'].includes(kind)&&!isIso(input.event_at))
    return rejected('TRANSACTION_TIME_REQUIRED',base);
  return {
    contract:CONTRACT,phase:'SCOUT',status:'FANTASY_SIGNAL_ONLY',player,
    professional_team:clean(input.professional_team,80),sport,
    source:{system:'FLAIM_FANTASY',platform,tool,observed_at:sourceTime,signal_kind:kind,scope:'CONNECTED_FANTASY_LEAGUE',
      provenance:'OPERATOR_ATTESTED_NOT_CRYPTOGRAPHICALLY_VERIFIED'},
    observation:{note,...(finite(input.value)?{value:input.value,unit:input.unit||'rate_percent'}:{}),
      ...(kind==='fantasy_status_flag'?{provider_status:String(input.status_code).toLowerCase()}:{}),
      ...(isIso(input.event_at)?{event_at:input.event_at}:{} )},
    verification:{source_provenance:'FANTASY_TOOL_RESPONSE_REPORTED',professional_fact_verified:false,
      independent_source_required:true,required_checks:['MATCH_PLAYER_AND_REAL_TEAM','CHECK_OFFICIAL_TEAM_OR_LEAGUE_REPORT','CHECK_GAME_DATE_AND_ROLE'],
      rank:'RESEARCH_LEAD',do_not_infer:['professional_injury_status','minutes','starting_lineup','player_availability','betting_edge']},
    execution_authority:false,approved_bet:null,independent_fair_probability:null,expected_value:null
  };
}
export function attachIndependentVerification(signal,check,{now=new Date().toISOString()}={}){
  if(signal?.contract!==CONTRACT||signal?.status!=='FANTASY_SIGNAL_ONLY')return rejected('SOURCE_SIGNAL_INVALID');
  const at=isIso(now)?Date.parse(now):NaN;
  if(!check||typeof check!=='object'||!['OFFICIAL_LEAGUE','OFFICIAL_TEAM'].includes(check.source_system))
    return {...signal,phase:'FILTER_VERIFY',verification:{...signal.verification,independent_check:'NO_OFFICIAL_CORROBORATION'}};
  if(!isIso(check.observed_at)||!Number.isFinite(at)||Date.parse(check.observed_at)>at+60000||at-Date.parse(check.observed_at)>MAX_AGE_MS)
    return {...signal,phase:'FILTER_VERIFY',verification:{...signal.verification,independent_check:'OFFICIAL_SOURCE_STALE_OR_INVALID'}};
  if(clean(check.player,100)!==signal.player||clean(check.professional_team,80)!==signal.professional_team||!clean(check.source_url,400)?.startsWith('https://'))
    return {...signal,phase:'FILTER_VERIFY',verification:{...signal.verification,independent_check:'IDENTITY_OR_SOURCE_MISMATCH'}};
  const statement=clean(check.professional_fact,200);
  if(!statement)return {...signal,phase:'FILTER_VERIFY',verification:{...signal.verification,independent_check:'MISSING_OFFICIAL_CLAIM'}};
  return {...signal,phase:'FILTER_VERIFY',
    verification:{...signal.verification,independent_check:'OFFICIAL_FACT_RECORDED_SEPARATELY',professional_fact_verified:false},
    independent_official_fact:{player:signal.player,team:signal.professional_team,statement,
      source_system:check.source_system,source_url:check.source_url,observed_at:check.observed_at,
      verification_status:'REQUIRES_HUMAN_SOURCE_REVIEW'},
    execution_authority:false,approved_bet:null,independent_fair_probability:null,expected_value:null};
}
export function flaimIntakeStatus({totalLeaguesFound=0,allLeagues=[]}={}){
  if(!Number.isInteger(totalLeaguesFound)||totalLeaguesFound<0||!Array.isArray(allLeagues))return rejected('SESSION_INVALID');
  if(totalLeaguesFound===0||allLeagues.length===0)
    return {contract:CONTRACT,status:'BLOCKED_NO_CONNECTED_LEAGUES',signals:[],source:'FLAIM_FANTASY',execution_authority:false};
  return {contract:CONTRACT,status:'READY_FOR_OPERATOR_SCOPED_READ',connected_league_count:allLeagues.length,signals:[],
    source:'FLAIM_FANTASY',execution_authority:false};
}
export function buildFlaimScoutVerifyPacket({session,observations=[],now=new Date().toISOString()}={}){
  const readiness=flaimIntakeStatus(session);
  const packet={contract:CONTRACT,mode:'SHADOW_READ_ONLY',source:'FLAIM_FANTASY',observed_at:now,
    status:readiness.status,scout_leads:[],verify_queue:[],rejected:[],
    verified_professional_facts:0,execution_authority:false,approved_bet:null,expected_value:null,
    independent_fair_probability:null,production_writes:0,betting_actions:0};
  if(readiness.status!=='READY_FOR_OPERATOR_SCOPED_READ')return packet;
  if(!Array.isArray(observations)||observations.length>100){packet.status='INVALID_INPUT_BATCH';return packet}
  const ids=new Set();
  for(const record of observations){
    const signal=processFlaimObservation(record,{now});
    if(signal.status==='REJECTED'){packet.rejected.push({reason:signal.reason});continue}
    const id=JSON.stringify([signal.source.platform,signal.source.tool,signal.source.signal_kind,
      signal.player,signal.professional_team,signal.source.observed_at,signal.observation.event_at||null]);
    if(ids.has(id)){packet.rejected.push({reason:'DUPLICATE_FANTASY_SIGNAL'});continue}
    ids.add(id);
    packet.scout_leads.push(signal);
    packet.verify_queue.push({player:signal.player,professional_team:signal.professional_team,topic:signal.source.signal_kind,
      independent_professional_source_required:true,professional_claim_verified:false,action:'CHECK_OFFICIAL_REPORT'});
  }
  packet.status=packet.scout_leads.length?'FANTASY_LEADS_UNVERIFIED':'NO_ADMISSIBLE_FANTASY_LEADS';
  return packet;
}