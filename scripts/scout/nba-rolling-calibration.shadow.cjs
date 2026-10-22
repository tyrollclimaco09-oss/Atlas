'use strict';
// Expanding-history calibration diagnostic, strictly chronological.
// Applies 2026 thresholds retrospectively to 2025-26 season: selection-biased, not a 2026 odds backtest.
const spec={
 'dayron-sharpe':{metric:'rebounds',threshold:9},
 'bam-adebayo':{metric:'rebounds',threshold:9},
 'jalen-johnson':{metric:'pra',threshold:40},
 'scottie-barnes':{metric:'assists',threshold:6}
};
function evaluate(logs){
 if(!logs||Object.keys(spec).some(k=>!Array.isArray(logs[k]?.games)))throw Error('MISSING_LOGS');
 const reports=[];
 for(const [slug,m] of Object.entries(spec)){
  const gs=[...logs[slug].games].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const get=x=>m.metric==='pra'?x.points+x.rebounds+x.assists:x[m.metric];
  if(gs.length<30||new Set(gs.map(x=>x.date)).size!==gs.length||gs.some(x=>x.minutes<=0||!Number.isInteger(get(x))||get(x)<0))throw Error('BAD_HISTORY');
  const records=[];
  for(let i=20;i<gs.length;i++){
   const prev=gs.slice(0,i),recent=prev.slice(-20), y=get(gs[i])>=m.threshold?1:0;
   const hits=g=>g.reduce((n,x)=>n+(get(x)>=m.threshold?1:0),0);
   const global=(hits(prev)+1)/(prev.length+2);
   const local=(hits(recent)+1)/(recent.length+2);
   const rate=recent.reduce((s,x)=>s+get(x),0)/recent.reduce((s,x)=>s+x.minutes,0);
   const projectedMinutes=recent.slice(-10).reduce((s,x)=>s+x.minutes,0)/10;
   const lambda=rate*projectedMinutes;
   let term=Math.exp(-lambda),cdf=term;
   for(let k=1;k<m.threshold;k++){term*=lambda/k;cdf+=term}
   const poisson=Math.max(0,Math.min(1,1-cdf));
   records.push({outcome:y,past_smoothed:global,recent20:local,minutes_poisson:poisson,blend:.6*global+.4*poisson});
  }
  const brier=k=>records.reduce((s,x)=>s+(x[k]-x.outcome)**2,0)/records.length;
  reports.push({player:slug,market:m,holdout_games:records.length,
   outcomes_over:records.reduce((a,b)=>a+b.outcome,0),
   brier:{neutral_50:0.25,past_smoothed:brier('past_smoothed'),recent20:brier('recent20'),minutes_poisson:brier('minutes_poisson'),blend:brier('blend')}
  });
 }
 return {schema:'atlas.nba.historical_time_ordered_cv.v2',validation:'SHADOW_ONLY',historical_scope:'2025-26',reports};
}
module.exports={evaluate};