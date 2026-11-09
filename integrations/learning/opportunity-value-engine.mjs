/**
 * ATLAS Opportunity Value Engine v1 — SHADOW evaluation only.
 *
 * Pure source-integrity-gated market valuation. Separates opportunity discovery,
 * pre-price sports forecasting, exact-book price verification, downside uncertainty
 * and portfolio concentration. NEVER executes a wager or promotes a model.
 *
 * Inputs are already-authorized and independently authenticated evidence packets.
 * Mere booleans in caller-supplied objects are not authentication. A trusted
 * server-side source attestor must produce and sign those facts in production.
 */
export const OPPORTUNITY_CONTRACT='ATLAS_OPPORTUNITY_VALUE_V1';
const markets=new Set(['moneyline','spread','total','team_total','period','points','rebounds','assists',
  'three_pointers','steals','blocks','pra','double_double','alternates','passing_yards',
  'passing_attempts','receiving_yards','receptions','rushing_yards','rushing_attempts',
  'touchdowns','first_score','quarter_rushing','each_quarter_rushing','special_teams',
  'sgp','sgpx','round_robin','live_derivative','other_verified']);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?Date.parse(v):NaN;
const pct=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<1;
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>1;
const id=v=>typeof v==='string'&&v.trim().length>0&&v.length<300;
const round=(v,n=5)=>Number(v.toFixed(n));
const unique=a=>[...new Set(a)];
export function rankOpportunities(packet,policy={}){
 if(!packet||packet.contract!==OPPORTUNITY_CONTRACT||!Array.isArray(packet.candidates)||
    !id(packet.as_of)||!Number.isFinite(date(packet.as_of)))throw Error('OPPORTUNITY_PACKET_INVALID');
 const rules={maxQuoteAgeSeconds:Math.min(Math.max(policy.maxQuoteAgeSeconds??300,1),1800),
  minScoredRoots:Math.max(policy.minScoredRoots??120,10),
  minLowerBoundEV:Math.max(policy.minLowerBoundEV??0.015,0),
  maxRootFraction:Math.min(Math.max(policy.maxRootFraction??.01,0),.05),
  maxEventFraction:Math.min(Math.max(policy.maxEventFraction??.03,0),.1)};
 const now=date(packet.as_of);
 const bankroll=typeof packet.virtual_bankroll==='number'&&Number.isFinite(packet.virtual_bankroll)&&packet.virtual_bankroll>0?packet.virtual_bankroll:null;
 const seenCases=new Set(),ranked=[];
 for(const c of packet.candidates){
   const errors=[];const info=[];const put=s=>errors.push(s);
   const caseKey=c?.case_key;
   if(!id(caseKey)||seenCases.has(caseKey))put('DUPLICATE_OR_MISSING_CASE_KEY');
   if(id(caseKey))seenCases.add(caseKey);
   if(!['NBA','NFL'].includes(c?.sport)||!id(c?.official_event_id)||!id(c?.dependency_root))
     put('INCOMPLETE_SPORT_EVENT_ROOT');
   if(!markets.has(c?.market_family)||!id(c?.selection)||!id(c?.market_period)||!id(c?.settlement_rule))
     put('MARKET_SELECTION_PERIOD_OR_RULES_UNKNOWN');
   const start=date(c?.event_start_at);
   if(!Number.isFinite(start)||now>=start)put('EVENT_NOT_UPCOMING');
   if(c?.market_currently_offered!==true)put('MARKET_NOT_VERIFIED_AS_CURRENTLY_OFFERED');
   if(c?.market_restricted===true)put('PARTNER_OR_LEAGUE_RESTRICTED_MARKET');
   if(c?.requires_player && (!id(c?.player_id)||c?.official_current_team_verified!==true||
      c?.official_availability_verified!==true))put('PLAYER_TEAM_OR_AVAILABILITY_NOT_VERIFIED');
   if(c?.official_event_identity_verified!==true)put('OFFICIAL_EVENT_IDENTITY_NOT_ATTESTED');
   const m=c?.model,quote=c?.quote;
   const frozen=date(m?.frozen_at),dataCut=date(m?.feature_cutoff);
   const score=pct(m?.probability)?m.probability:null;
   const baseline=pct(m?.baseline_probability)?m.baseline_probability:null;
   const lower=pct(m?.probability_lower95)?m.probability_lower95:null;
   if(!id(m?.model_key)||!id(m?.model_version)||score===null||baseline===null||
      !Number.isFinite(frozen)||!Number.isFinite(dataCut)||dataCut>frozen||
      frozen>=start||frozen>now||m?.price_independent!==true)
     put('NO_VERIFIED_PREGAME_PRICE_INDEPENDENT_MODEL_AND_BASELINE');
   if(m?.prospectively_validated!==true||!Number.isInteger(m?.unique_scored_roots)||
      m.unique_scored_roots<rules.minScoredRoots||typeof m?.brier_gain_lower95!=='number'||
      !Number.isFinite(m.brier_gain_lower95)||m.brier_gain_lower95<=0)
     put('MODEL_NOT_PROVEN_BETTER_THAN_BASELINE');
   if(lower===null||score!==null&&lower>score)put('NO_USABLE_CONSERVATIVE_PROBABILITY_BOUND');
   const qt=date(quote?.observed_at),qAge=Number.isFinite(qt)?Math.max(0,(now-qt)/1000):null;
   if(!quote||quote.verified_book_source!==true||quote.exact_native_quote!==true||
      quote.execution_grade!==true||quote.synthetic_combination===true||!id(quote?.provider_market_id)||
      !id(quote?.sportsbook)||!id(quote?.selection)||!id(quote?.market_period)||
      !id(quote?.settlement_rule)||quote.selection!==c?.selection||
      quote.market_period!==c?.market_period||quote.settlement_rule!==c?.settlement_rule||
      !positive(quote.decimal_odds)||!Number.isFinite(qt)||!Number.isFinite(frozen)||
      qt<=frozen||qt>=start||qt>now)put('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE');
   if(qAge===null||qAge>rules.maxQuoteAgeSeconds)put('QUOTE_STALE_OR_UNTIMESTAMPED');
   if(quote?.book_market_status!=='OPEN')put('MARKET_NOT_OPEN');
   const validPrice=positive(quote?.decimal_odds)?quote.decimal_odds:null;
   const breakEven=validPrice!==null?1/validPrice:null;
   const expectedValue=score!==null&&validPrice!==null?score*validPrice-1:null;
   const lowerBoundEV=lower!==null&&validPrice!==null?lower*validPrice-1:null;
   if(lowerBoundEV===null||lowerBoundEV<=rules.minLowerBoundEV)
     put('NO_CONSERVATIVE_PRICE_ADVANTAGE_AT_CURRENT_QUOTE');
   if(bankroll===null)put('NO_RECONCILED_VIRTUAL_BANKROLL');
   // Portfolio position caps are applied in sorted order, accounting for shared roots.
   ranked.push({case_key:caseKey||null,event_id:c?.official_event_id||null,
    market_family:c?.market_family||null,selection:c?.selection||null,dependency_root:c?.dependency_root||null,
    model_probability:score,baseline_probability:baseline,probability_lower95:lower,
    model_baseline_delta:score!==null&&baseline!==null?round(score-baseline):null,
    decimal_quote:validPrice,break_even_probability:breakEven===null?null:round(breakEven),
    modeled_ev_per_unit:expectedValue===null?null:round(expectedValue),
    conservative_ev_per_unit:lowerBoundEV===null?null:round(lowerBoundEV),
    quote_age_seconds:qAge===null?null:round(qAge,2),blockers:unique(errors),
    stage:errors.length?'HOLD_UNQUALIFIED':'EVIDENCE_READY_PENDING_PORTFOLIO_CHECK',
    paper_stake_cap:0,real_money_wagered:0,production_authority:false,
    metric_note:'EV only conditional on validated independent model, exact native bookmaker price, calibrated uncertainty and source authenticity'});
 }
 // Never double count the same root or event for exposure just because it
 // appears in multiple parlay tickets. Shadow ranking is not live execution.
 ranked.sort((a,b)=>(b.conservative_ev_per_unit??-Infinity)-(a.conservative_ev_per_unit??-Infinity)||
   String(a.case_key).localeCompare(String(b.case_key)));
 const byRoot=new Map(),byEvent=new Map();
 for(const c of ranked){
   if(c.blockers.length)continue;
   const stake=bankroll===null?0:Math.floor(Math.min(
     bankroll*rules.maxRootFraction-(byRoot.get(c.dependency_root)||0),
     bankroll*rules.maxEventFraction-(byEvent.get(c.event_id)||0))*100)/100;
   if(stake<=0){c.blockers.push('PORTFOLIO_ROOT_OR_EVENT_CAP_REACHED');c.stage='HOLD_PORTFOLIO_CAP';continue;}
   c.paper_stake_cap=stake;c.stage='SHADOW_HUMAN_REVIEW_ONLY';
   byRoot.set(c.dependency_root,(byRoot.get(c.dependency_root)||0)+stake);
   byEvent.set(c.event_id,(byEvent.get(c.event_id)||0)+stake);
 }
 const summary={total_candidates:ranked.length,qualified_for_shadow_human_review:ranked.filter(x=>x.stage==='SHADOW_HUMAN_REVIEW_ONLY').length,
  hold:ranked.filter(x=>x.stage!=='SHADOW_HUMAN_REVIEW_ONLY').length,
  markets_considered:unique(ranked.map(x=>x.market_family).filter(Boolean)).length,
  illustrative_total_paper_stake:round(ranked.reduce((s,x)=>s+x.paper_stake_cap,0),2),
  real_money_staked:0};
 return {contract:OPPORTUNITY_CONTRACT,as_of:packet.as_of,summary,
   policy:rules,ranked,production_authority:false,execution_authority:false,
   result_authority:'RESEARCH_AND_SHADOW_REVIEW_ONLY',
   caveat:'This evaluator cannot authenticate its own inputs, train models, make wagers, place future orders or prove profitability. Production requires trusted source adapters, auth and live end-to-end proof.'};
}
