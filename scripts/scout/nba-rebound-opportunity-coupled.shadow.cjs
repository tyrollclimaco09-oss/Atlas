'use strict';
// ATLAS NBA rebound opportunity simulator v1.
// Couples player and full-game worlds. Scores, FGM, shot attempts, made threes,
// free throws, ORB/DRB, assists and allocated minutes conserve within each world.
// Research-only conditional scenario generator, NOT a calibrated sports betting model.
const between=(x,a,b)=>Math.min(b,Math.max(a,x));
function simulateCoupledRebounds(input,options={}){
 const {fullWorlds,teamHistory,playerLog}=input||{};
 const seeds=options.seed??20261021;
 if(!Number.isInteger(seeds)||!Array.isArray(fullWorlds)||fullWorlds.length<1000||
    !teamHistory?.teams?.BKN || !teamHistory?.teams?.CHA ||
    !Array.isArray(playerLog?.games)||playerLog.games.length!==62)throw Error('COUPLED_INPUT_INVALID');
 const tB=teamHistory.teams.BKN,tC=teamHistory.teams.CHA,p=teamHistory.player;
 if(p?.key!=='dayron-sharpe'||p.orb!==171||p.drb!==242||p.minutes!==1160||
 p.fgm!==214||p.fga!==356||p.three_made!==9||p.three_attempts!==39||p.ftm!==103||p.fta!==152)
   throw Error('PLAYER_TOTALS_UNVERIFIED');
 if(playerLog.games.reduce((s,g)=>s+g.rebounds,0)!==413||
   playerLog.games.reduce((s,g)=>s+g.points,0)!==540||
   playerLog.games.reduce((s,g)=>s+g.assists,0)!==145)throw Error('PLAYER_LOG_UNVERIFIED');
 const scenario=options.scenario||'MIXED';
 const choices={
   RESTRICTED:{mins:[22,25,28],weights:[.25,.5,.25],retention:.88},
   MIXED:{mins:[23,27,30],weights:[.25,.5,.25],retention:.90},
   STARTER:{mins:[27,30,33],weights:[.2,.55,.25],retention:.95},
   COMPETITION:{mins:[27,30,33],weights:[.2,.55,.25],retention:.85}
 };
 if(!Object.hasOwn(choices,scenario))throw Error('SCENARIO_UNSUPPORTED');
 const selected={...choices[scenario],...(options.override||{})};
 if(!Array.isArray(selected.mins)||selected.mins.length!==3||
 selected.mins.some(x=>!Number.isFinite(x)||x<5||x>44)||
 !Array.isArray(selected.weights)||selected.weights.length!==3||
 selected.weights.some(x=>!Number.isFinite(x)||x<0||x>1)||
 Math.abs(selected.weights.reduce((a,b)=>a+b,0)-1)>1e-8||
 !Number.isFinite(selected.retention)||selected.retention<.5||selected.retention>1.25)
 throw Error('SCENARIO_INVALID');
 let state=seeds>>>0;
 const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const normal=()=>Math.sqrt(-2*Math.log(Math.max(1e-12,rand())))*Math.cos(2*Math.PI*rand());
 const binom=(n,p)=>{let x=0;for(let j=0;j<n;j++)if(rand()<p)x++;return x;};
 const poisson=(lambda)=>{if(lambda<=0)return 0;let j=0,pp=1,lim=Math.exp(-Math.min(50,lambda));do{j++;pp*=rand();}while(pp>lim&&j<200);return j-1;};
 const quantile=(arr,q)=>{const a=[...arr].sort((x,y)=>x-y);return a[Math.floor((a.length-1)*q)];};
 const choose=()=>{let r=rand();for(let j=0;j<3;j++){r-=selected.weights[j];if(r<=0)return selected.mins[j];}return selected.mins[2];};
 const scoreMean=team=>2*team.fgm+team.three_made+team.ftm;
 function shootingLine(points,team){
   // Score is fixed by a sampled world. Solve exact score decomposition:
   // 2 * FGM + 3PM + FTM = points.
   const scale=between(Math.sqrt(points/scoreMean(team)),.72,1.35);
   let fga=between(Math.round(team.fga*scale+normal()*4),55,130);
   let pa3=between(Math.round(team.three_attempts*scale+normal()*3),6,fga-12);
   let fta=between(Math.round(team.fta*scale+normal()*3),6,42);
   let chosen=null,best=Infinity;
   const trySearch=()=>{
     for(let m3=0;m3<=Math.min(pa3,38,Math.floor(points/3));m3++){
       for(let ftm=0;ftm<=fta;ftm++){
         const rem=points-3*m3-ftm;
         if(rem<0 || (rem%2)!==0)continue;
         const made2=rem/2;
         if(made2>fga-pa3)continue;
         const expectedTwo=(team.fgm-team.three_made)*scale;
         const expected3=team.three_made*scale;
         const expectedFT=team.ftm*scale;
         const err=(made2-expectedTwo)**2/(7+expectedTwo)+
            (m3-expected3)**2/(3+expected3)+(ftm-expectedFT)**2/(4+expectedFT);
         if(err<best){best=err;chosen={points,fga,pa3,fta,made2,made3:m3,ftm,fgm:made2+m3};}
       }
     }
   };
   trySearch();
   if(!chosen){
     // Rare tails: give high-scoring game additional attempts, without
     // changing score or manufacturing phantom baskets.
     fga+=12;fta+=6;trySearch();
   }
   if(!chosen)throw Error('SHOOTING_SCORE_INFEASIBLE');
   chosen.missed=chosen.fga-chosen.fgm;
   chosen.threePoints=3*chosen.made3;
   return chosen;
 }
 function reboundOwnership(misses,orbP,drbP){
   // Rebound events are exclusive. Remainder is dead-ball or uncredited.
   let orb=0,drb=0,dead=0;
   const pO=between(orbP,0,.45),pD=between(drbP,0,.93);
   if(pO+pD>1)throw Error('REBOUND_PROBABILITY_SUM_INVALID');
   for(let i=0;i<misses;i++){
     const x=rand();
     if(x<pO)orb++;else if(x<pO+pD)drb++;else dead++;
   }
   return {orb,drb,dead};
 }
 const avgMinutes=p.minutes/p.games;
 const baseDRB=p.drb/p.games,baseORB=p.orb/p.games;
 const priorOnCourtDRB=baseDRB/tB.drb*(48/avgMinutes);
 const priorOnCourtORB=baseORB/tB.orb*(48/avgMinutes);
 const totals=[],records=[],sums={reb:0,orb:0,drb:0,minutes:0,pts:0,assists:0,potentialAssists:0,oppMisses:0,
  teamReb:0,hits:0};
 const scripts={},fourTruth={REB_AND_AST:0,REB_ONLY:0,AST_ONLY:0,NEITHER:0};
 for(const g of fullWorlds){
  if(g.id===undefined || !Number.isInteger(g.score_home)||!Number.isInteger(g.score_away)||
    g.home_margin!==g.score_home-g.score_away||
    g.score_home+g.score_away!==g.total || g.score_home===g.score_away ||
    typeof g.script!=='string'||typeof g.overtime!=='boolean')throw Error('GAME_WORLD_INVALID');
  // Fixed market-defined role: BKN home, CHA away.
  const bkn=shootingLine(g.score_home,tB),cha=shootingLine(g.score_away,tC);
  // NBA counted boards for each missed FG; no miss can credit two players/teams.
  const bknMiss=reboundOwnership(bkn.missed,tB.orb/(tB.fga-tB.fgm),tC.drb/(tB.fga-tB.fgm));
  const chaMiss=reboundOwnership(cha.missed,tC.orb/(tC.fga-tC.fgm),tB.drb/(tC.fga-tC.fgm));
  const brooklyn={orb:bknMiss.orb,drb:chaMiss.drb,reb:bknMiss.orb+chaMiss.drb};
  const charlotte={orb:chaMiss.orb,drb:bknMiss.drb,reb:chaMiss.orb+bknMiss.drb};
  const orig=playerLog.games[Math.floor(rand()*playerLog.games.length)];
  const foul=rand()<.10;
  const blowout=Math.abs(g.home_margin)>=16;
  const minutes=between(Math.round(choose()+(g.overtime?2:0)-(blowout?2.3:0)-(foul?4.2:0)+normal()*1.2),
    9,g.overtime?53:48);
  // Derived from Sharpe 2025-26 ORB/DRB totals per minute vs Brooklyn
  // historical whole-team reb counts. No fabricated additional rebounds.

  const gameShareShift=between(1+normal()*.06,.75,1.20);
  const pDRB=between(priorOnCourtDRB*minutes/48*selected.retention*gameShareShift,0,.85);
  const pORB=between(priorOnCourtORB*minutes/48*selected.retention*gameShareShift,0,.91);
  const drb=binom(brooklyn.drb,pDRB),orb=binom(brooklyn.orb,pORB),reb=drb+orb;
  const scale=between(minutes/Math.max(1,orig.minutes),.1,3);
  const twoAtt=between(Math.round((orig.field_goals_attempted-orig.threes_attempted)*scale*(1+normal()*.09)),0,bkn.fga-bkn.pa3);
  const threeAtt=between(Math.round(orig.threes_attempted*scale*(1+normal()*.08)),0,bkn.pa3);
  const ftAtt=between(Math.round(orig.free_throws_attempted*scale*(1+normal()*.12)),0,bkn.fta);
  const made2=Math.min(binom(twoAtt,(p.fgm-p.three_made)/(p.fga-p.three_attempts)), bkn.made2);
  const made3=Math.min(binom(threeAtt,p.three_made/p.three_attempts),bkn.made3);
  const madeFT=Math.min(binom(ftAtt,p.ftm/p.fta),bkn.ftm);
  const points=2*made2+3*made3+madeFT;
  const madeFG=made2+made3;
  const remainingTeammateMadeFG=bkn.fgm-madeFG;
  // Potential assists are not identical to assists; conversion depends
  // on remaining teammate makes and shot environment.
  const potential=poisson(Math.max(0,orig.assists/.49*scale));
  const teammateAttempts=Math.max(1,bkn.fga-twoAtt-threeAtt);
  const teammateConversion=between(remainingTeammateMadeFG/teammateAttempts,.25,.75);
  const assists=Math.min(binom(potential,teammateConversion),remainingTeammateMadeFG);
  const teamAssists=Math.max(assists,Math.min(bkn.fgm,binom(bkn.fgm,.66)));
  const leftover={
    minutes:(g.overtime?265:240)-minutes,
    points:bkn.points-points,
    rebounds:brooklyn.reb-reb,
    assists:teamAssists-assists,
    fgm:bkn.fgm-madeFG,
    made3:bkn.made3-made3,
    ftm:bkn.ftm-madeFT
  };
  if(Object.values(leftover).some(x=>x<0)||orb>brooklyn.orb||drb>brooklyn.drb||
    made2>bkn.made2||made3>bkn.made3||
    bkn.made2+bkn.made3!==bkn.fgm||
    2*bkn.fgm+bkn.made3+bkn.ftm!==bkn.points||
    2*cha.fgm+cha.made3+cha.ftm!==cha.points||
    chaMiss.orb+chaMiss.drb+chaMiss.dead!==cha.missed||
    bknMiss.orb+bknMiss.drb+bknMiss.dead!==bkn.missed
    )throw Error('CONSERVATION_FAILED');
  const hit=reb>=9,ast=assists>=3;
  fourTruth[hit?(ast?'REB_AND_AST':'REB_ONLY'):(ast?'AST_ONLY':'NEITHER')]++;
  const record={id:g.id,script:g.script,home_margin:g.home_margin,total:g.total,
    bkn:{score:bkn.points,fga:bkn.fga,fgm:bkn.fgm,three_made:bkn.made3,ftm:bkn.ftm,orb:brooklyn.orb,drb:brooklyn.drb,total_reb:brooklyn.reb,assists:teamAssists},
    cha:{score:cha.points,fga:cha.fga,fgm:cha.fgm,orb:charlotte.orb,drb:charlotte.drb,total_reb:charlotte.reb},
    rebound_pool:{bkn_missed:bkn.missed,cha_missed:cha.missed,dead_bkn:bknMiss.dead,dead_cha:chaMiss.dead},
    sharpe:{minutes,points,orb,drb,reb,assists,potential_assists:potential,foul_shock:foul,blowout,three_made:made3,ftm:madeFT},
    teammates:leftover};
  records.push(record);
  totals.push(reb);
  for(const [key,value] of Object.entries({reb,orb,drb,minutes,pts:points,assists,potentialAssists:potential,oppMisses:cha.missed,teamReb:brooklyn.reb,hits:Number(hit)}))sums[key]+=value;
  const s=scripts[g.script]||(scripts[g.script]={n:0,hits:0,rebSum:0});s.n++;s.hits+=Number(hit);s.rebSum+=reb;
 }
 const count=fullWorlds.length;
 const sorted=[...records].sort((a,b)=>a.total-b.total||a.id.localeCompare(b.id));
 const readable=[];
 // Balanced game scoring and player reb distribution, NOT equal-weight outcomes.
 for(let i=0;i<10;i++){
   const segment=sorted.slice(Math.floor(i*count/10),Math.floor((i+1)*count/10))
     .sort((a,b)=>a.sharpe.reb-b.sharpe.reb||a.id.localeCompare(b.id));
   for(let j=0;j<10;j++)readable.push(segment[Math.floor((j+.5)*segment.length/10)]);
 }
 return {
   schema:'atlas.nba.rebound_opportunity_coupled.v1',
   date:'2026-10-21',game:'CHA@BKN',scope:'SHADOW_ONLY',seed:seeds,
   total_worlds:count,readable_worlds:100,script_assumptions:scenario,
   inputs:{minutes:selected.mins,weights:selected.weights,retention:selected.retention,
     priorOnCourtDRB:+priorOnCourtDRB.toFixed(3),priorOnCourtORB:+priorOnCourtORB.toFixed(3)},
   result:{reb_over8_5:+(sums.hits/count).toFixed(4),reb_mean:+(sums.reb/count).toFixed(2),
     reb_p10:quantile(totals,.1),reb_median:quantile(totals,.5),reb_p90:quantile(totals,.9),
     means:Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,+(v/count).toFixed(2)])),
     fourTruth,
     by_script:Object.fromEntries(Object.entries(scripts).map(([k,v])=>[k,{n:v.n,hit_rate:+(v.hits/v.n).toFixed(4),mean_reb:+(v.rebSum/v.n).toFixed(2)}]))},
   worlds100:readable,
   provenance:{player_shooting_rates:'2025-26 actual season 2PM/2PA, 3PM/3PA, FTM/FTA',
     team_shooting_rebounding_rates:'2025-26 actual team average',minutes_forecast:'UNVERIFIED_SCENARIO',
     forecast_calibration:'NOT_PROVEN',book_price:'NOT_EXECUTABLE',bet_qualified:false,authority:false}
 };
}
module.exports={simulateCoupledRebounds};