'use strict';

// OI-01: offline SHADOW. Hypothetical worlds, NOT forecasts, market data, or bets.
// Never derive joint probabilities by multiplying marginal probabilities.
// Every ticket is priced independently AFTER the price-blind world receipt is frozen.
const { hashJSON } = require('./source-contract-shadow.cjs');
const { canonicalJSON } = require('./opportunity-shadow.cjs');

const VERSION='atlas.outcome-intelligence.shadow.v1';
const PHASE='PHASE1_PRICE_INDEPENDENT';
const ROOT=['schema_version','synthetic','research_only','phase','study_id','frozen_at','forecast_cutoff',
  'weight_origin','events','legs','worlds'];
const EVENT=['event_id','starts_at'];
const LEG=['leg_id','event_id','player_id','metric','unit','selection','comparator','threshold'];
const WORLD=['world_id','scenario_id','weight','stats'];
const STAT=['event_id','player_id','metric','unit','value'];
const TICKET=['ticket_id','expression','leg_ids','american_odds','stake_cents','quoted_at','quote_origin'];
const METRICS=Object.freeze({
  pass_attempts:'attempts',rushing_attempts:'attempts',receptions:'receptions',
  passing_yards:'yards',rushing_yards:'yards',receiving_yards:'yards',
  minutes:'minutes',points:'points',assists:'assists',rebounds:'rebounds',threes_made:'threes',
  strikeouts:'strikeouts',shots_on_goal:'shots',saves:'saves'
});
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const ident=v=>typeof v==='string'&&/^synthetic-[A-Za-z0-9_-]{1,80}$/.test(v);
const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&(!Number.isInteger(v)||Number.isSafeInteger(v));
const count=v=>Number.isSafeInteger(v)&&v>=0;
const stamp=v=>{
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v))return null;
  const ms=Date.parse(v);
  return Number.isFinite(ms)&&new Date(ms).toISOString()===(v.includes('.')?v:v.replace('Z','.000Z'))?ms:null;
};
const statKey=s=>JSON.stringify([s.event_id,s.player_id,s.metric,s.unit]);
const immutable=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(immutable);Object.freeze(v);}return v;};
const clone=v=>JSON.parse(canonicalJSON(v));
function requireValid(ok,code){if(!ok)throw Error(code);}
function validate(input){
  hashJSON(input); // refuse accessors, proxies, non-JSON and nonfinite values
  requireValid(exact(input,ROOT)&&input.schema_version===VERSION&&input.synthetic===true&&
    input.research_only===true&&input.phase===PHASE&&ident(input.study_id),'WORLD_CONTRACT');
  const frozen=stamp(input.frozen_at),cutoff=stamp(input.forecast_cutoff);
  requireValid(frozen!==null&&cutoff!==null&&frozen<=cutoff,'WORLD_TIME');
  requireValid(['UNESTIMATED','SYNTHETIC_ASSUMPTION'].includes(input.weight_origin),'WORLD_WEIGHT_ORIGIN');
  requireValid(Array.isArray(input.events)&&input.events.length>0&&input.events.length<=6,'WORLD_EVENTS');
  const events=new Map();
  for(const e of input.events){
    requireValid(exact(e,EVENT)&&ident(e.event_id)&&stamp(e.starts_at)!==null&&
      stamp(e.starts_at)>cutoff&&!events.has(e.event_id),'WORLD_EVENT_IDENTITY');
    events.set(e.event_id,e);
  }
  requireValid(Array.isArray(input.legs)&&input.legs.length>=2&&input.legs.length<=8,'WORLD_LEGS');
  const legs=new Map(),wanted=new Set();
  for(const l of input.legs){
    requireValid(exact(l,LEG)&&ident(l.leg_id)&&!legs.has(l.leg_id)&&
      events.has(l.event_id)&&ident(l.player_id)&&typeof l.selection==='string'&&l.selection.trim()!==''&&
      l.selection.length<=250&&Object.hasOwn(METRICS,l.metric)&&l.unit===METRICS[l.metric]&&
      ['AT_LEAST','AT_MOST','OVER','UNDER'].includes(l.comparator)&&count(l.threshold),'WORLD_LEG_IDENTITY');
    const stat=statKey(l);
    // Alternate lines are allowed; identical selections at different thresholds need distinct IDs.
    legs.set(l.leg_id,l);wanted.add(stat);
  }
  requireValid(Array.isArray(input.worlds)&&input.worlds.length>=2&&input.worlds.length<=128,'WORLD_COUNT');
  const seenWorlds=new Set();
  let mass=0;
  for(const w of input.worlds){
    requireValid(exact(w,WORLD)&&ident(w.world_id)&&ident(w.scenario_id)&&!seenWorlds.has(w.world_id),'WORLD_IDENTITY');
    seenWorlds.add(w.world_id);
    if(input.weight_origin==='UNESTIMATED')requireValid(w.weight===null,'WORLD_UNESTIMATED');
    else {requireValid(numeric(w.weight)&&w.weight>=0&&w.weight<=1,'WORLD_WEIGHT');mass+=w.weight;}
    requireValid(Array.isArray(w.stats)&&w.stats.length<=256,'WORLD_STATS');
    const observed=new Set();
    for(const stat of w.stats){
      requireValid(exact(stat,STAT)&&events.has(stat.event_id)&&ident(stat.player_id)&&
        Object.hasOwn(METRICS,stat.metric)&&stat.unit===METRICS[stat.metric]&&count(stat.value),'WORLD_STAT_INVALID');
      const key=statKey(stat);
      requireValid(!observed.has(key),'WORLD_STAT_DUPLICATE');
      observed.add(key);
    }
    requireValid([...wanted].every(key=>observed.has(key)),'WORLD_STAT_MISSING');
  }
  if(input.weight_origin==='SYNTHETIC_ASSUMPTION')requireValid(Math.abs(mass-1)<=1e-10,'WORLD_WEIGHT_SUM');
  return input;
}
function freezeWorlds(raw){
  try{
    validate(raw);
    const input=clone(raw);
    for(const field of ['events','legs','worlds'])input[field].sort((a,b)=>canonicalJSON(a).localeCompare(canonicalJSON(b),'en'));
    for(const w of input.worlds)w.stats.sort((a,b)=>canonicalJSON(a).localeCompare(canonicalJSON(b),'en'));
    return immutable({sha256:hashJSON(input),input});
  }catch(e){throw Error(e.message.startsWith('WORLD_')?e.message:'WORLD_CONTRACT');}
}
function readReceipt(receipt){
  try{
    hashJSON(receipt);
    requireValid(exact(receipt,['sha256','input'])&&
      typeof receipt.sha256==='string'&&/^[0-9a-f]{64}$/.test(receipt.sha256)&&
      hashJSON(receipt.input)===receipt.sha256,'WORLD_RECEIPT_INTEGRITY');
    validate(receipt.input);
    return receipt.input;
  }catch{throw Error('WORLD_RECEIPT_INTEGRITY');}
}
function state(leg,value){
  if(leg.comparator==='AT_LEAST')return value>=leg.threshold?'WIN':'LOSS';
  if(leg.comparator==='AT_MOST')return value<=leg.threshold?'WIN':'LOSS';
  if(value===leg.threshold)return 'PUSH';
  if(leg.comparator==='OVER')return value>leg.threshold?'WIN':'LOSS';
  return value<leg.threshold?'WIN':'LOSS';
}
function matrix(receipt,firstId,secondId){
  const input=readReceipt(receipt),legs=new Map(input.legs.map(l=>[l.leg_id,l]));
  requireValid(firstId!==secondId&&legs.has(firstId)&&legs.has(secondId),'WORLD_PAIR');
  const first=legs.get(firstId),second=legs.get(secondId);
  const cells={both:0,first_only:0,second_only:0,neither:0,push_unresolved:0};
  const counts={both:0,first_only:0,second_only:0,neither:0,push_unresolved:0};
  const scenarios=new Map();
  const weighted=input.weight_origin==='SYNTHETIC_ASSUMPTION';
  const rows=[];
  for(const w of input.worlds){
    const byStat=new Map(w.stats.map(s=>[statKey(s),s.value]));
    const a=state(first,byStat.get(statKey(first))),b=state(second,byStat.get(statKey(second)));
    const cell=a==='PUSH'||b==='PUSH'?'push_unresolved':a==='WIN'?(b==='WIN'?'both':'first_only'):(b==='WIN'?'second_only':'neither');
    counts[cell]++;
    if(weighted)cells[cell]+=w.weight;
    const key=w.scenario_id;
    const info=scenarios.get(key)||{scenario_id:key,world_count:0,assumed_weight:weighted?0:null,cells:{both:0,first_only:0,second_only:0,neither:0,push_unresolved:0}};
    info.world_count++;if(weighted){info.assumed_weight+=w.weight;info.cells[cell]+=w.weight;}
    scenarios.set(key,info);
    rows.push({world_id:w.world_id,scenario_id:key,first:a,second:b,cell,assumed_weight:weighted?w.weight:null});
  }
  const conditional=weighted&&cells.push_unresolved===0;
  const pa=conditional?cells.both+cells.first_only:null,pb=conditional?cells.both+cells.second_only:null;
  return immutable({schema_version:VERSION,synthetic:true,research_only:true,receipt_sha256:receipt.sha256,
    legs:[firstId,secondId],model_skill:'NOT_ESTABLISHED',source_probabilities:'NOT_VERIFIED',
    weighting:input.weight_origin,world_count:input.worlds.length,counts,
    hypothetical_joint:weighted?cells:null,
    hypothetical_independence_product:conditional?pa*pb:null,
    hypothetical_covariance:conditional?cells.both-pa*pb:null,
    hypothetical_conditional_second_given_first:conditional&&pa>0?cells.both/pa:null,
    scenarios:[...scenarios.values()].sort((a,b)=>a.scenario_id.localeCompare(b.scenario_id,'en')),
    worlds:rows,execution_authority:false});
}
function oddsToDecimal(value){
  requireValid(numeric(value)&&Math.abs(value)>=100&&Math.abs(value)<=1e6,'TICKET_ODDS');
  return value>0?1+value/100:1+100/-value;
}
function settleTickets(receipt,tickets){
  const input=readReceipt(receipt);
  requireValid(Array.isArray(tickets)&&tickets.length>0&&tickets.length<=32,'TICKET_BATCH');
  const legs=new Map(input.legs.map(l=>[l.leg_id,l])),ids=new Set(),cutoff=stamp(input.forecast_cutoff),frozen=stamp(input.frozen_at);
  let totalStake=0;
  for(const t of tickets){
    requireValid(exact(t,TICKET)&&ident(t.ticket_id)&&!ids.has(t.ticket_id)&&
      ['SINGLE','DOUBLE','TRIPLE','SGP','CROSS_GAME','ROUND_ROBIN_COMPONENT'].includes(t.expression)&&
      Array.isArray(t.leg_ids)&&t.leg_ids.length>=1&&t.leg_ids.length<=8&&
      new Set(t.leg_ids).size===t.leg_ids.length&&t.leg_ids.every(key=>legs.has(key))&&
      Number.isSafeInteger(t.stake_cents)&&t.stake_cents>0&&t.stake_cents<=1000000&&
      t.quote_origin==='SYNTHETIC_DEMO'&&stamp(t.quoted_at)!==null&&
      stamp(t.quoted_at)>=frozen&&stamp(t.quoted_at)<=cutoff,'TICKET_CONTRACT');
    oddsToDecimal(t.american_odds);ids.add(t.ticket_id);totalStake+=t.stake_cents;
    if(t.expression==='SINGLE')requireValid(t.leg_ids.length===1,'TICKET_CARDINALITY');
    if(['DOUBLE','SGP','CROSS_GAME'].includes(t.expression))requireValid(t.leg_ids.length===2,'TICKET_CARDINALITY');
    if(t.expression==='TRIPLE')requireValid(t.leg_ids.length===3,'TICKET_CARDINALITY');
    if(t.expression==='ROUND_ROBIN_COMPONENT')requireValid(t.leg_ids.length>=2,'TICKET_CARDINALITY');
    const games=new Set(t.leg_ids.map(id=>legs.get(id).event_id));
    if(t.expression==='SGP')requireValid(games.size===1,'TICKET_SGP_EVENT');
    if(t.expression==='CROSS_GAME')requireValid(games.size>1,'TICKET_CROSS_GAME');
  }
  const weighted=input.weight_origin==='SYNTHETIC_ASSUMPTION';
  const outcomes=[];
  let unresolved=false,expected=0;
  for(const w of input.worlds){
    const byStat=new Map(w.stats.map(s=>[statKey(s),s.value]));
    let net=0;
    const settlements=tickets.map(t=>{
      const states=t.leg_ids.map(id=>{const leg=legs.get(id);return state(leg,byStat.get(statKey(leg)));});
      // For a multiple-leg ticket, a single void/push requires book-specific repricing.
      // Do NOT infer reduced odds by multiplying independently quoted singles.
      const status=states.includes('PUSH')?(t.leg_ids.length===1?'PUSH':'UNRESOLVED_VOID'):
        states.includes('LOSS')?'LOSS':'WIN';
      const decimal=oddsToDecimal(t.american_odds);
      const profit_cents=status==='WIN'?t.stake_cents*(decimal-1):
        status==='LOSS'?-t.stake_cents:status==='PUSH'?0:null;
      if(profit_cents===null)unresolved=true;else net+=profit_cents;
      return {ticket_id:t.ticket_id,status,profit_cents};
    });
    const unresolvedHere=settlements.some(t=>t.profit_cents===null);
    if(weighted&&!unresolvedHere)expected+=w.weight*net;
    outcomes.push({world_id:w.world_id,scenario_id:w.scenario_id,assumed_weight:weighted?w.weight:null,
      settlements,net_profit_cents:unresolvedHere?null:net});
  }
  const allResolved=!unresolved;
  const values=outcomes.map(x=>x.net_profit_cents).filter(x=>x!==null);
  return immutable({schema_version:VERSION,synthetic:true,research_only:true,receipt_sha256:receipt.sha256,
    pricing_stage:'PHASE2_SYNTHETIC_DEMO_ONLY',model_skill:'NOT_ESTABLISHED',total_stake_cents:totalStake,
    ticket_count:tickets.length,unresolved_void:unresolved,
    hypothetical_expected_profit_cents:weighted&&allResolved?expected:null,
    hypothetical_roi:weighted&&allResolved?expected/totalStake:null,
    demonstrative_worst_case_cents:allResolved?Math.min(...values):null,
    demonstrative_best_case_cents:allResolved?Math.max(...values):null,
    outcomes,execution_authority:false,human_final_gate_required:true});
}
module.exports=Object.freeze({VERSION,freezeWorlds,readReceipt,matrix,settleTickets});
