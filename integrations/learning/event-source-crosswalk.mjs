/**
 * ATLAS canonical event <-> connected sports-data event crosswalk.
 * Pure, fail-closed source-integrity check; no database writes or real bets.
 *
 * IMPORTANT: A matching game is NOT source authentication, market identity,
 * an official scoring attestation, or permission to promote prediction models.
 */
export const CROSSWALK_CONTRACT='ATLAS_EVENT_CROSSWALK_V1';
const isText=v=>typeof v==='string'&&v.trim().length>0;
const time=v=>isText(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):NaN;
const isPositiveInt=v=>Number.isSafeInteger(v)&&v>0;
const bad=items=>[...new Set(items)];
export function assessEventCrosswalk(packet,{maxClockSkewSeconds=120}={}){
  if (!packet||packet.contract!==CROSSWALK_CONTRACT||!packet.canonical||!packet.provider_event||
      !Array.isArray(packet.team_configurations)||!packet.source_capture) throw Error('EVENT_CROSSWALK_PACKET_INVALID');
  if(!Number.isInteger(maxClockSkewSeconds)||maxClockSkewSeconds<0||maxClockSkewSeconds>600)
    throw Error('EVENT_CROSSWALK_POLICY_INVALID');
  const errors=[];
  const c=packet.canonical, p=packet.provider_event, sc=packet.source_capture;
  const add=(v)=>errors.push(v);
  if(!isText(c.event_id)||!isText(c.canonical_key)||c.league!=='NFL'&&c.league!=='NBA')
    add('MISSING_CANONICAL_EVENT_IDENTITY');
  if(c.reconciliation_status!=='pending'&&c.reconciliation_status!=='verified')
    add('CANONICAL_EVENT_STATE_UNKNOWN');
  if(!isPositiveInt(p.competitionId)||p.league!==c.league)
    add('PROVIDER_EVENT_OR_LEAGUE_MISMATCH');
  if(sc.kind!=='CONNECTED_TOOL_RESULT'||sc.tool!=='DraftKings.search_games_v1'||
     !isText(sc.capture_observed_at)||!isText(sc.source_reference)||!Number.isFinite(time(sc.capture_observed_at)))
    add('UNATTESTED_OR_MISSING_SOURCE_CAPTURE');
  const actualTime=time(p.startDateTimeUtc), canonicalTime=time(c.start_time);
  if(!Number.isFinite(actualTime)||!Number.isFinite(canonicalTime)||
     Math.abs(actualTime-canonicalTime)>maxClockSkewSeconds*1000)
    add('START_TIME_MISMATCH');
  if(!Number.isFinite(time(sc.capture_observed_at))||
    !Number.isFinite(actualTime)||time(sc.capture_observed_at)>=actualTime)
    add('SOURCE_NOT_CAPTURED_BEFORE_START');
  if(!Array.isArray(p.teams)||p.teams.length!==2||
     !isText(c.home_team_abbr)||!isText(c.away_team_abbr)||
     c.home_team_abbr===c.away_team_abbr)
    add('INCOMPLETE_HOME_AWAY_TEAMS');
  const configs=packet.team_configurations;
  const validConfigs=new Map();
  for (const t of configs) {
    if(!isText(t?.teamAbbreviation)||!isPositiveInt(t?.teamId)) {add('INVALID_TEAM_CONFIG');continue;}
    if(validConfigs.has(t.teamAbbreviation)) add('DUPLICATE_TEAM_CONFIG');
    validConfigs.set(t.teamAbbreviation,t.teamId);
  }
  if (Array.isArray(p.teams)&&p.teams.length===2) {
    const h=p.teams.filter(t=>t?.isHomeTeam===true),a=p.teams.filter(t=>t?.isHomeTeam===false);
    if(h.length!==1||a.length!==1||h[0]?.teamAbbreviation!==c.home_team_abbr||
       a[0]?.teamAbbreviation!==c.away_team_abbr)
      add('HOME_AWAY_OR_TEAM_MATCHUP_MISMATCH');
    for (const t of p.teams) {
      if(!isText(t?.teamAbbreviation)||!isPositiveInt(t?.teamId)||
        validConfigs.get(t.teamAbbreviation)!==t.teamId)
        add('UNMATCHED_PROVIDER_TEAM_ID');
    }
  }
  if (!['Upcoming','Scheduled','PreGame'].includes(p.competitionStatus))
    add('NOT_A_PREGAME_SOURCE_SNAPSHOT');
  if(packet.provider_id_registered===true&&(!isText(packet.provider_id)||!isText(packet.provider_event_record_id)))
    add('PROVIDER_REGISTRATION_CLAIM_UNSUPPORTED');
  if(packet.provider_id_registered!==true&&packet.provider_id_registered!==false)
    add('PROVIDER_REGISTRATION_STATE_UNKNOWN');
  if(!Number.isInteger(packet.provider_binding_count)||packet.provider_binding_count<0)
    add('UNVERIFIED_PROVIDER_BINDING_COUNT');
  // Explicitly detect the existing missing provider binding: never silently infer a DB write.
  const passed=bad(errors).length===0;
  const linked=passed&&packet.provider_id_registered===true&&packet.provider_binding_count>0;
  const stage=!passed?'HOLD_SOURCE_OR_MATCHUP':
    !linked?'MATCHED_SHADOW_CROSSWALK_NOT_REGISTERED':
      'MATCHED_REGISTERED_SOURCE_NEEDS_OFFICIAL_ATTESTATION';
  return {
    contract:CROSSWALK_CONTRACT,canonical_event_id:c.event_id,
    provider_event_id:isPositiveInt(p.competitionId)?String(p.competitionId):null,
    stage, source_match:passed,
    source_capture_observed_at:isText(sc.capture_observed_at)?sc.capture_observed_at:null,
    source_clock_delta_seconds:Number.isFinite(actualTime)&&Number.isFinite(canonicalTime)
       ?Math.abs(actualTime-canonicalTime)/1000:null,
    errors:bad(errors),requires_official_market_identity:true,
    requires_official_outcome:true,
    record_provider_event_authorized:false,verified_native_book_quote:false,
    actual_money_wagered:false,production_authority:false,model_promotion:false,
    note:'An event ID/teams/time crosswalk is not an authenticated market, accepted sportsbook quote or an official final result.'
  };
}
