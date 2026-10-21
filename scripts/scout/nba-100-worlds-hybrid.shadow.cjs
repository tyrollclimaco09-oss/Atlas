'use strict';
// ATLAS 100 Worlds Hybrid NBA v1, reproducible shadow research engine.
// Source contracts and uncertainty are checked by the caller. Never makes betting recommendations.
function simulateSlate(input,opts={}) {
  const {gamelog,teams,market}=input;
  const samples=opts.samples||12000,seed=opts.seed||20261021;
  if(!Number.isInteger(samples)||samples<1000||samples>100000 || !Number.isInteger(seed))throw Error("INVALID_SIMULATION_SCOPE");
  if(gamelog?.games?.length!==64 || Object.keys(teams?.teams||{}).length!==30 || market?.games?.length!==11)throw Error("DATA_COVERAGE_INCOMPLETE");
  if(new Set(gamelog.games.map(g=>g.date)).size!==64)throw Error("DUPLICATE_GAMELOG_DATE");
  if(gamelog.games.reduce((n,g)=>n+g.points,0)!==2143 || gamelog.games.reduce((n,g)=>n+g.rebounds,0)!==495||gamelog.games.reduce((n,g)=>n+g.assists,0)!==530||gamelog.games.reduce((n,g)=>n+g.threes_made,0)!==254)throw Error("GAMELOG_AGGREGATE_MISMATCH");
  if(market.market_observation_truth!=="THIRD_PARTY_REFERENCE_ONLY")throw Error("MARKET_PROVENANCE_INVALID");
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  const norm=()=>Math.sqrt(-2*Math.log(Math.max(1e-10,random())))*Math.cos(2*Math.PI*random());
  const between=(x,a,b)=>Math.min(b,Math.max(a,x));
  const pick=a=>a[Math.floor(random()*a.length)];
  const countScale=(n,ratio)=>{
    ratio=between(ratio,0,3);
    if(ratio<=1){let x=0;for(let k=0;k<n;k++)if(random()<ratio)x++;return x;}
    // Poisson additions approximate additional opportunity events; base totals come from historical game record.
    const extra=(ratio-1)*n,L=Math.exp(-Math.min(extra,45));let k=0,p=1;
    do{k++;p*=random()}while(p>L&&k<120);
    return n+k-1;
  };
  const quantile=(vals,q)=>{const a=[...vals].sort((x,y)=>x-y);return a[Math.floor((a.length-1)*q)];};
  const numericStats=(arr)=>({p10:quantile(arr,.10),p50:quantile(arr,.50),p90:quantile(arr,.90),mean:Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10});
  const leagueMean=Object.values(teams.teams).reduce((n,t)=>n+t.ortg,0)/30;
  const results=[];
  for(const game of market.games){
    const home=teams.teams[game.home],away=teams.teams[game.away];
    if(!home||!away||Date.parse(game.time_utc)<=Date.parse(market.observed_as_of)||!Number.isFinite(game.total)||!Number.isFinite(game.home_spread))throw Error("MARKET_IDENTITY_INVALID");
    const pace0=(home.pace+away.pace)/2;
    const historicalAway=pace0*(away.ortg+home.drtg)/200-1.5;
    const historicalHome=pace0*(home.ortg+away.drtg)/200+1.5;
    const historicTotal=historicalHome+historicalAway,historicMargin=historicalHome-historicalAway;
    const marketMargin=-game.home_spread;
    // Assumed historical/market blend: 35% last season, 65% current market; NOT fitted, NOT an edge model.
    const centerTotal=.65*game.total+.35*historicTotal;
    const centerMargin=.65*marketMargin+.35*historicMargin;
    const totals=[],margins=[],homePts=[],awayPts=[],records=[],scenarioCounts={};
    const lukaOnGame=game.home==="LAL" && game.away==="GSW";
    const lukaCategories={CONSTRAINED:{n:0,hits50:0,hits4threes:0},BASE:{n:0,hits50:0,hits4threes:0},EXPANDED:{n:0,hits50:0,hits4threes:0}};
    const lukaPRA=[],luka3pm=[],lukaPts=[],lukaReb=[],lukaAst=[],lukaMin=[],lukaHit50=[];
    let overtime=0,comeback=0,blowout=0,close=0,homewin=0;
    for(let i=0;i<samples;i++){
      // Shared pace shock + independent efficiency/margin shocks; SDs ASSUMED, not fitted on historic residuals.
      const possessions=between(pace0+2.8*norm(),86,114);
      const totalUnrounded=centerTotal+(possessions-pace0)*2.24+16.5*norm();
      const marginUnrounded=centerMargin+12.6*norm();
      const total=between(Math.round(totalUnrounded),170,300);
      let scoreHome=Math.max(60,Math.round((total+marginUnrounded)/2));
      let scoreAway=Math.max(60,total-scoreHome);
      let ot=false;
      if(scoreHome===scoreAway){
        ot=true;overtime++;
        const a=between(Math.round(8+3*norm()),2,16),b=between(Math.round(8+3*norm()),2,16);
        scoreHome+=a;scoreAway+=b;
        if(scoreHome===scoreAway){if(random()<.5)scoreHome+=2;else scoreAway+=2;}
      }
      const lateTotal=scoreHome+scoreAway,lateMargin=scoreHome-scoreAway;
      // Shared early pace and independent second-half corrections create momentum reversal paths.
      const halfBias=between(.49+.038*norm(),.38,.61);
      const halfHome=between(Math.round(scoreHome*halfBias+5.5*norm()),35,scoreHome-30);
      const halfAway=between(Math.round(scoreAway*halfBias+5.5*norm()),35,scoreAway-30);
      const firstMargin=halfHome-halfAway;
      const isComeback=(firstMargin>=5 && lateMargin<0)||(firstMargin<=-5 && lateMargin>0);
      const isBlowout=Math.abs(lateMargin)>=16;
      const isClose=Math.abs(lateMargin)<=6;
      const script=isComeback?"COMEBACK":isBlowout?"BLOWOUT":lateTotal<=game.total-18?"GRIND":lateTotal>=game.total+18?"SHOOTOUT":isClose?"CLOSE":"BALANCED";
      scenarioCounts[script]=(scenarioCounts[script]||0)+1;
      if(isComeback)comeback++;
      if(isBlowout)blowout++;
      if(isClose)close++;
      if(lateMargin>0)homewin++;
      totals.push(lateTotal);margins.push(lateMargin);homePts.push(scoreHome);awayPts.push(scoreAway);
      const record={id:"world-"+(i+1),score_home:scoreHome,score_away:scoreAway,total:lateTotal,home_margin:lateMargin,half_home:halfHome,half_away:halfAway,script,overtime:ot};
      if(lukaOnGame) {
        const h=pick(gamelog.games);
        const u=random();
        const role=u<.20?"CONSTRAINED":u<.75?"BASE":"EXPANDED";
        const roleMultiplier=role==="CONSTRAINED"?.91:role==="EXPANDED"?1.07:1;
        const minutesShift=role==="CONSTRAINED"?-2.5:role==="EXPANDED"?1.0:0;
        const minutes=Math.round(between(h.minutes+minutesShift-(isBlowout?2.5:0)+(ot?3:0),0,48));
        const minuteRate=minutes/Math.max(1,h.minutes),paceRate=possessions/pace0;
        const scoringRatio=minuteRate*paceRate*roleMultiplier;
        const otherRatio=minuteRate*paceRate*(role==="CONSTRAINED"?.96:role==="EXPANDED"?1.04:1);
        let points=Math.min(scoreHome,countScale(h.points,scoringRatio));
        let rebounds=Math.min(28,countScale(h.rebounds,otherRatio));
        let assists=Math.min(25,countScale(h.assists,otherRatio));
        const threeAttempts=countScale(h.threes_attempted,scoringRatio);
        const threes=Math.min(threeAttempts,countScale(h.threes_made,scoringRatio));
        points=Math.max(Math.min(scoreHome,points),Math.min(scoreHome,3*threes));
        const pra=points+rebounds+assists;
        record.luka={minutes,points,rebounds,assists,threes_attempted:threeAttempts,threes_made:threes,pra,role};
        lukaPRA.push(pra);luka3pm.push(threes);lukaPts.push(points);lukaReb.push(rebounds);lukaAst.push(assists);lukaMin.push(minutes);lukaHit50.push(pra>=50?1:0);
        lukaCategories[role].n++;if(pra>=50)lukaCategories[role].hits50++;if(threes>=4)lukaCategories[role].hits4threes++;
      }
      records.push(record);
    }
    // 100 stratified observable world samples by sorted total score. This covers full low/high-scoring spectrum,
    // unlike a cherry-picked scenario slate. Some rare events can still be absent from 100.
    const sorted=[...records].sort((a,b)=>a.total-b.total||a.id.localeCompare(b.id));
    const oneHundred=Array.from({length:100},(_,j)=>sorted[Math.min(sorted.length-1,Math.floor(((j+.5)/100)*sorted.length))]);
    const worldCounts={};
    for(const x of oneHundred)worldCounts[x.script]=(worldCounts[x.script]||0)+1;
    const report={
      game_id:`20261021-${game.away}-${game.home}`,away:game.away,home:game.home,start_utc:game.time_utc,
      reference:{source:"THIRD_PARTY_NONEXECUTABLE",total:game.total,home_spread:game.home_spread,source_observed_at:market.observed_as_of},
      prior:{season:"2025-26",historical_total:+historicTotal.toFixed(1),historical_home_margin:+historicMargin.toFixed(1),combined_pace:+pace0.toFixed(1),market_blend_weight:.65,roster_transfers_not_fully_modeled:true},
      modeled_center:{total:+centerTotal.toFixed(1),home_margin:+centerMargin.toFixed(1)},
      simulated:{n:samples,home_win_rate:+(homewin/samples).toFixed(4),overtime_rate:+(overtime/samples).toFixed(4),
        close_6_rate:+(close/samples).toFixed(4),blowout_16_rate:+(blowout/samples).toFixed(4),comeback_5_rate:+(comeback/samples).toFixed(4),
        total:numericStats(totals),margin:numericStats(margins),home_score:numericStats(homePts),away_score:numericStats(awayPts),
        script_rates:Object.fromEntries(Object.entries(scenarioCounts).map(([k,v])=>[k,+(v/samples).toFixed(4)]))},
      worlds100:{count:100,script_counts:worldCounts,range_total:[oneHundred[0].total,oneHundred[99].total],worlds:oneHundred},
      reliability:{game_probabilities:"ASSUMPTION_CONDITIONED_NOT_EMPIRICALLY_CALIBRATED",social_weight:0,prices_executable:false,bet_status:"RESEARCH_ONLY",forecast_edge:"NOT_ESTABLISHED"}
    };
    if(lukaOnGame){
      const categories=Object.fromEntries(Object.entries(lukaCategories).map(([name,d])=>[name,{n:d.n,pra50_frequency:+(d.hits50/d.n).toFixed(4),threes4_frequency:+(d.hits4threes/d.n).toFixed(4)}]));
      const pr=samples?lukaHit50.reduce((a,b)=>a+b,0)/samples:null;
      report.luka={
        historical_games:64,historical_pra50_hits:gamelog.games.filter(g=>g.points+g.rebounds+g.assists>=50).length,
        historical_threes4_hits:gamelog.games.filter(g=>g.threes_made>=4).length,
        uncertain_role_weights:{CONSTRAINED:.20,BASE:.55,EXPANDED:.25},
        bootstrap_joint_stats_true:true,
        simulated_pra50_frequency:+pr.toFixed(4),
        simulated_threes4_frequency:+(luka3pm.filter(n=>n>=4).length/samples).toFixed(4),
        pra:numericStats(lukaPRA),points:numericStats(lukaPts),rebounds:numericStats(lukaReb),
        assists:numericStats(lukaAst),threes_made:numericStats(luka3pm),minutes:numericStats(lukaMin),
        by_role:categories,
        caveat:"Weights/pace/minute/role adjustments are scenario assumptions, not empirical calibration. Not a fair probability or +EV proof."
      };
    }
    results.push(report);
  }
  return {schema:"atlas.nba.100worlds.hybrid.v1",status:"SHADOW_ONLY",season:"2026-27",date:"2026-10-21",seed,samples_per_matchup:samples,
    games:results.length,worlds_representative:results.length*100,
    modeling:{baseline:"35% prior-season team ORtg/DRtg/pace + 65% third-party market reference",outcome:"Joint pace shock + independent scoring/strength shocks; regulation + simulated overtime resolution; halftime scripts",player:"Luka 64-game joint empirical bootstrap with uncertain role/minute/pace modifiers",risks:["Prior-season roster shifts","Market-anchored model cannot prove independent edge","Scenario weights uncalibrated","Public quotes not account-executable","Shot allocation and defensive matchups approximated"]},
    results};
}
module.exports={simulateSlate};
