/**
 * Prospective NBA research-only forecast freeze.
 * This is a transparent, UNVALIDATED model, not a price estimate or wager.
 * No provider calls, storage writes, implicit result joins or promotion.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const COHORT_CONTRACT='ATLAS_NBA_PRESTART_PROSPECTIVE_COHORT_V1';
export const MODEL_KEY='NBA_RAW_PPG_DIFFERENTIAL_LOGISTIC18_V0';
export const BASELINE_KEY='NBA_NEUTRAL_GAME_WINNER_50_50_V1';
const SOURCE_CONTRACT='ATLAS_CONNECTED_NBA_PRESTART_SOURCE_V1';
const isText=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>isText(x)&&Number.isFinite(Date.parse(x));
const isInt=x=>Number.isSafeInteger(x)&&x>0;
const number=x=>typeof x==='number'&&Number.isFinite(x);
function fail(code){throw new Error(code);}
export function gitBlobSha(buffer) {
  if(!Buffer.isBuffer(buffer))fail('SOURCE_BYTES_INVALID');
  return createHash('sha1').update(Buffer.from('blob '+buffer.length+'\0')).update(buffer).digest('hex');
}
export function readSourceWithBlob(path){
  const bytes=readFileSync(path);
  return {snapshot:JSON.parse(bytes.toString('utf8')),source_git_blob_sha:gitBlobSha(bytes)};
}
export function freezePregameSource(snapshot,{preparedAt,sourceBlobSha}={}){
  if(!snapshot||snapshot.contract!==SOURCE_CONTRACT||
     snapshot.mode!=='RESEARCH_ONLY_PRESTART_NOT_EXECUTABLE'||
     snapshot.source_system!=='CONNECTED_DRAFTKINGS_SEARCH_GAMES_V1'||
     snapshot.provider_executable_quote!==false||
     snapshot.official_outcome_authenticated!==false||
     !isText(snapshot.provider_request_id)||!date(snapshot.source_generated_at_utc)||
     !date(preparedAt)||Date.parse(preparedAt)<Date.parse(snapshot.source_generated_at_utc)||
     !/^[a-f0-9]{40}$/.test(sourceBlobSha||'')||
     !Array.isArray(snapshot.games)||snapshot.games.length<1||snapshot.games.length>100||
     snapshot.game_count!==snapshot.games.length||
     snapshot.query?.leagueAbbreviation!=='NBA'||
     !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.query?.startLocalDateTime?.slice(0,10)||''))
     fail('PROSPECTIVE_SOURCE_CONTRACT_INVALID');
  const gameDateCT=snapshot.query.startLocalDateTime.slice(0,10);
  const usedEvents=new Set(),usedMatchups=new Set();
  const predictions=snapshot.games.map(g=>{
    if(!isInt(g.provider_competition_id)||usedEvents.has(g.provider_competition_id)||
       g.status!=='Upcoming'||g.league!=='NBA'||!date(g.start_utc)||
       Date.parse(g.start_utc)<=Date.parse(preparedAt)||!Array.isArray(g.teams)||
       g.teams.length!==2||!number(g.points_per_game?.home)||
       !number(g.points_per_game?.away)||
       g.points_per_game.home<60||g.points_per_game.home>180||
       g.points_per_game.away<60||g.points_per_game.away>180)
      fail('PROSPECTIVE_GAME_INVALID');
    const home=g.teams.find(t=>t.home===true),away=g.teams.find(t=>t.home===false);
    if(!home||!away||g.teams.filter(t=>t.home===true).length!==1||
       home.abbreviation===away.abbreviation||
       !isInt(home.provider_team_id)||!isInt(away.provider_team_id)||
       home.provider_team_id===away.provider_team_id||
       !/^[A-Z]{2,4}$/.test(home.abbreviation)||
       !/^[A-Z]{2,4}$/.test(away.abbreviation)||
       !/^\d{1,2}-\d{1,2}$/.test(home.record)||
       !/^\d{1,2}-\d{1,2}$/.test(away.record))
      fail('PROSPECTIVE_TEAM_IDENTITY_INVALID');
    usedEvents.add(g.provider_competition_id);
    const pair=away.abbreviation+'@'+home.abbreviation;
    if(usedMatchups.has(pair))fail('PROSPECTIVE_MATCHUP_DUPLICATED');
    usedMatchups.add(pair);
    const p=1/(1+Math.exp(-(g.points_per_game.home-g.points_per_game.away)/18));
    return {
      candidate_key:'ATLAS-PROSPECTIVE-NBA-'+gameDateCT+'-'+pair+'-HOME-WIN-PPG18-V0',
      sport:'NBA',market_family:'GAME_WINNER_NOT_BOOK_MONEYLINE',
      canonical_source_event_key:'NBA:'+gameDateCT+':'+pair,
      source_provider_competition_id:g.provider_competition_id,
      away_team:away.abbreviation,home_team:home.abbreviation,
      source_away_team_id:away.provider_team_id,source_home_team_id:home.provider_team_id,
      event_start_utc:g.start_utc,
      features_observed_at:snapshot.source_generated_at_utc,
      forecast_prepared_at:preparedAt,
      model_probability_home:Number(p.toFixed(9)),
      frozen_baseline_probability_home:0.5,
      root_key:'NBA:'+gameDateCT+':'+pair+':FULL_GAME_RESULT',
      result:null,official_result_authenticated:false,
      bookmaker_price:null,financial_return:null,
      identity_authority:'CONNECTED_PROVIDER_SCHEDULE_NOT_OFFICIAL_MARKET_IDENTITY',
      forecast_skill_eligible:false,real_betting_authority:false
    };
  });
  return {
    contract:COHORT_CONTRACT,
    status:'UNVALIDATED_PROSPECTIVE_PRESTART_RESEARCH_ONLY',
    slate_date_ct:gameDateCT,league:'NBA',count:predictions.length,
    prepared_at_utc:preparedAt,source_generated_at_utc:snapshot.source_generated_at_utc,
    source_provider_request_id:snapshot.provider_request_id,
    source_git_blob_sha:sourceBlobSha,
    source_artifact:'integrations/learning/fixtures/nba-connected-prestart-20261111.json',
    source_authentication:'CONNECTED_TOOL_OBSERVED_NO_VENDOR_SIGNED_PAYLOAD',
    independently_checked_nba_schedule_url:'https://www.nba.com/games?date=2026-11-11',
    independent_schedule_check:'PUBLIC_PAGE_REVIEW_NOT_MACHINE_AUTHENTICATED',
    model:{key:MODEL_KEY,formula:'sigmoid((home_ppg-away_ppg)/18)',scale_ppg:18,
      preregistered:true,trained_on_holdout:false,calibrated:false,
      odds_or_market_prices_used:false,included_inputs:['connected_home_ppg','connected_away_ppg']},
    baseline:{key:BASELINE_KEY,p_home:0.5},
    caveats:['No pregame identity binding in ATLAS canonical event registry',
      'One source for statistics; no independent stats corroboration',
      'No athlete/rotation/injury adjustments, home-court effect or strength of schedule',
      'Not a market quote, player-prop probability, betting recommendation or calibrated model',
      'Do not score until independently verified official results are bound by exact event identity'],
    predictions,
    no_bets:true,automatic_model_promotion:false,production_authority:false
  };
}
export function validateProspectiveFreeze(snapshot,cohort,actualSourceBlobSha){
  if(!cohort||cohort.contract!==COHORT_CONTRACT||
     cohort.source_git_blob_sha!==actualSourceBlobSha||
     !date(cohort.prepared_at_utc))
    fail('PROSPECTIVE_FREEZE_INTEGRITY_INVALID');
  const expected=freezePregameSource(snapshot,{preparedAt:cohort.prepared_at_utc,
    sourceBlobSha:actualSourceBlobSha});
  if(JSON.stringify(expected)!==JSON.stringify(cohort))
    fail('PROSPECTIVE_FREEZE_DRIFT_OR_REWRITE');
  return {status:'FROZEN_SOURCE_ARITHMETIC_MATCH',
    source_git_blob_sha:actualSourceBlobSha,cases:cohort.count,
    results_admitted:0,model_calibration_authorized:false,pricing_authorized:false};
}
