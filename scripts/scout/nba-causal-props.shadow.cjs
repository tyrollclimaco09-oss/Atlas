'use strict';
// ATLAS GS-PROP v1: prospective price-independent, player-game empirical resampling.
// World counts are scenarios, NOT validated probabilities. No executable wager authority.
function simulatePlayerProps(input, options={}) {
 const allowed=['dayron-sharpe','bam-adebayo','jalen-johnson','scottie-barnes'];
 if(!input || !input.logs || typeof input.logs!=='object'||allowed.some(n=>!Array.isArray(input.logs[n]?.games))) throw Error('DATA_COVERAGE');
 const expected={'dayron-sharpe':{games:62,points:540,rebounds:413,assists:145},
  'bam-adebayo':{games:73,points:1468,rebounds:732,assists:232},
  'jalen-johnson':{games:72,points:1621,rebounds:740,assists:566},
  'scottie-barnes':{games:80,points:1448,rebounds:600,assists:474}};
 for(const slug of allowed){
   const rec=input.logs[slug],g=rec.games,e=expected[slug];
   if(g.length!==e.games||new Set(g.map(x=>x.date)).size!==e.games)throw Error('HISTORICAL_COMPLETENESS_'+slug);
   for(const metric of ['points','rebounds','assists']){
     if(g.reduce((a,x)=>a+x[metric],0)!==e[metric])throw Error('HISTORICAL_TOTAL_'+slug+'_'+metric);
   }
   if(g.some(x=>!Number.isFinite(x.minutes)||x.minutes<=0||x.minutes>53||
     !Number.isInteger(x.rebounds)||x.rebounds<0||
     !Number.isInteger(x.assists)||x.assists<0||
     !Number.isInteger(x.points)||x.points<0||
     Date.parse(x.date)>Date.parse('2026-04-12T23:59:00Z')))throw Error('INVALID_GAME_LOG');
 }
 const n=options.n??12000,seed=options.seed??20261021;
 if(!Number.isInteger(n)||n<1000||n>100000||!Number.isInteger(seed))throw Error('SIMULATION_SCOPE');
 const overrides=options.overrides||{};
 let state=seed>>>0;
 const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
 const norm=()=>Math.sqrt(-2*Math.log(Math.max(1e-10,rand())))*Math.cos(2*Math.PI*rand());
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const choose=(values,weights)=>{
   let r=rand();for(let j=0;j<values.length;j++){r-=weights[j];if(r<=0)return values[j];}return values[values.length-1];
 };
 function sampleCount(base,scale){
   const s=clamp(scale,0,2.5);
   if(s<=1){let sum=0;for(let j=0;j<base;j++)if(rand()<s)sum++;return sum;}
   const lambda=base*(s-1),p0=Math.exp(-lambda);
   let p=1,extra=0;do{p*=rand();if(p>p0)extra++}while(p>p0&&extra<100);
   return base+extra;
 }
 const playerConfigs={
  'dayron-sharpe':{market:'Rebounds OVER 8.5',metric:'rebounds',threshold:9,quote:+113,
   minutes:[22,27,31],minuteWeights:[.20,.55,.25],shotRate:.99,
   roleMultiplier:.91,usageMultiplier:1,healthDropChance:.10,blowoutChance:.23,opponentMissFactor:.99,
   note:'Projected starter after Claxton trade; Randle/Porter compete for rebounds. Role assumptions NOT empirically fitted.'},
  'bam-adebayo':{market:'Rebounds OVER 8.5',metric:'rebounds',threshold:9,quote:-156,
   minutes:[29,32,35],minuteWeights:[.20,.60,.20],shotRate:1,
   roleMultiplier:.92,usageMultiplier:1,healthDropChance:.10,blowoutChance:.22,opponentMissFactor:1.0,
   note:'Giannis arrives in Miami; shared rebounds modeled via hypothetical role multiplier.'},
  'jalen-johnson':{market:'PRA OVER 39.5',metric:'pra',threshold:40,quote:-108,
   minutes:[32,35,38],minuteWeights:[.20,.60,.20],shotRate:1.015,
   roleMultiplier:1,usageMultiplier:.98,healthDropChance:.08,blowoutChance:.22,opponentMissFactor:1,
   note:'Role retention uncertain with Hawks redesigned perimeter roster.'},
  'scottie-barnes':{market:'Assists OVER 5.5',metric:'assists',threshold:6,quote:-139,
   minutes:[31,34,37],minuteWeights:[.20,.60,.20],shotRate:1.01,
   roleMultiplier:1,usageMultiplier:1.0,healthDropChance:.08,blowoutChance:.33,opponentMissFactor:1,
   note:'Toronto offense and blowout exposure vs Chicago; assists require teammate shot conversion.'}
 };
 const reports=[];
 for(const slug of allowed){
  const prior=input.logs[slug].games,c={...playerConfigs[slug],...(overrides[slug]||{})};
  if(!Array.isArray(c.minutes)||c.minutes.length!==3||c.minutes.some(x=>!Number.isFinite(x)||x<0||x>48)||
   !Array.isArray(c.minuteWeights)||c.minuteWeights.length!==3||c.minuteWeights.some(w=>!Number.isFinite(w)||w<0||w>1)||
   Math.abs(c.minuteWeights.reduce((a,b)=>a+b,0)-1)>1e-9)throw Error('MINUTES_MIX_INVALID');
  if(![c.shotRate,c.roleMultiplier,c.usageMultiplier,c.opponentMissFactor].every(x=>Number.isFinite(x)&&x>0&&x<=2)||
  ![c.healthDropChance,c.blowoutChance].every(x=>Number.isFinite(x)&&x>=0&&x<=1))throw Error('SCENARIO_INPUT_INVALID');
  const historic=prior.map(g=>({...g,pra:g.points+g.rebounds+g.assists}));
  const rawHits=historic.filter(g=>g[c.metric]>=c.threshold).length;
  const values=[],byMinutes={},byScripts={},outcomes=[],joint={BOTH:0,REB_ONLY:0,AST_ONLY:0,NEITHER:0};
  let hit=0;
  for(let i=0;i<n;i++){
    const g=historic[Math.floor(rand()*historic.length)];
    const mi=choose(c.minutes,c.minuteWeights);
    const foul=rand()<c.healthDropChance;
    const blowout=rand()<c.blowoutChance;
    const minutes=clamp(mi-(foul?5:0)-(blowout?2.5:0)+1.2*norm(),10,43);
    const pace=clamp(c.shotRate*(1+norm()*.035),.84,1.19);
    const miss=clamp(c.opponentMissFactor*(1+norm()*.05),.81,1.22);
    const reboundShare=clamp(c.roleMultiplier*(1+norm()*.065),.55,1.35);
    const usage=clamp(c.usageMultiplier*(1+norm()*.06),.65,1.35);
    const minutesRatio=minutes/g.minutes,scale=minutesRatio*pace;
    const pts=sampleCount(g.points,scale*usage);
    const rebounds=sampleCount(g.rebounds,scale*reboundShare*miss);
    const assists=sampleCount(g.assists,scale*usage*clamp(1+norm()*.065,.75,1.25));
    const value=c.metric==='pra'?pts+rebounds+assists:c.metric==='points'?pts:c.metric==='rebounds'?rebounds:assists;
    const passed=value>=c.threshold;
    values.push(value);outcomes.push({minutes,pts,rebounds,assists,pra:pts+rebounds+assists,blowout,foul,value});
    if(passed)hit++;
    const bucket=minutes<24?'LT24':minutes<28?'24to28':minutes<32?'28to32':'GE32';
    const b=byMinutes[bucket]||(byMinutes[bucket]={n:0,hits:0});
    b.n++;if(passed)b.hits++;
    const script=(foul?'FOUL_':'')+(blowout?'BLOWOUT':'REGULAR');
    const s=byScripts[script]||(byScripts[script]={n:0,hits:0});
    s.n++;if(passed)s.hits++;
    if(slug==='dayron-sharpe'){
       const re=rebounds>=9,as=assists>=3;
       joint[re?(as?'BOTH':'REB_ONLY'):(as?'AST_ONLY':'NEITHER')]++;
    }
  }
  const ordered=[...values].sort((a,b)=>a-b);
  const q=p=>ordered[Math.floor((n-1)*p)];
  const p=hit/n,decimal=c.quote>0?1+c.quote/100:1+100/(-c.quote),implied=1/decimal,roi=p*(decimal-1)-(1-p);
  const representatives=[...outcomes].sort((a,b)=>a.value-b.value||a.minutes-b.minutes);
  const readable=Array.from({length:100},(_,i)=>representatives[Math.floor((i+.5)*n/100)]);
  reports.push({
   player:slug,metric:c.metric,market:c.market,reference_american_odds:c.quote,reference_price_verified_executable:false,
   implied_probability:+implied.toFixed(4),n,
   historical:{n:historic.length,hits:rawHits,rate:+(rawHits/historic.length).toFixed(4),minutes_mean:+(historic.reduce((a,g)=>a+g.minutes,0)/historic.length).toFixed(1)},
   model:{frequency:+p.toFixed(4),median:q(.5),p10:q(.1),p90:q(.9),mean:+(values.reduce((a,b)=>a+b,0)/n).toFixed(1),
     hypothetical_roi:+roi.toFixed(4),by_minutes:Object.fromEntries(Object.entries(byMinutes).map(([k,v])=>[k,{n:v.n,freq:+(v.hits/v.n).toFixed(4)}])),
     by_script:Object.fromEntries(Object.entries(byScripts).map(([k,v])=>[k,{n:v.n,freq:+(v.hits/v.n).toFixed(4)}])),
     joint_truth:slug==='dayron-sharpe'?joint:null},
   assumptions:{minutes:c.minutes,minute_weights:c.minuteWeights,rebound_share:c.roleMultiplier,
     usage:c.usageMultiplier,shot_pace:c.shotRate,opponent_miss:c.opponentMissFactor,
     foul_downside:c.healthDropChance,blowout_chance:c.blowoutChance,notes:c.note},
   worlds100:{sampled_count:100,hits:readable.filter(x=>x.value>=c.threshold).length,examples:readable},
   verdict:'RESEARCH_ONLY_NO_VALIDATED_EDGE',calibrated_probability:false,bet_authority:false
  });
 }
 return {schema:'atlas.nba.causal_props.v1',mode:'SHADOW',date:'2026-10-21',n,seed,method:'2025-26 regular season empirical joint bootstrap + scenario-adjusted minutes, shared pace, usage, rebound opportunity, foul/blowout shock; perturbations uncalibrated',reports};
}
module.exports={simulatePlayerProps};
