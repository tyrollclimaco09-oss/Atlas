#!/usr/bin/env node
/**
 * One-time REAL retrospective source reachability check for 2026-11-10.
 * There are no frozen forecasts in this control: it compares actual
 * NBA.com and ESPN final scores without inferring prediction skill/ROI.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fetchAllowedSource} from './direct-source-capture.mjs';
import {nbaWebGames,espnScoreboardGames} from './direct-outcome-join.mjs';
import {verifySourceCapture} from './direct-source-capture.mjs';

const date='2026-11-10';
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(!out)throw Error('SOURCE_CONTROL_REQUIRES_OUT');
const dir=resolve(out);mkdirSync(dir,{recursive:true});
const captures={},errors=[];
for(const provider of ['NBA_OFFICIAL_WEB','ESPN_SCOREBOARD']){
 try{
  const c=await fetchAllowedSource(provider,date);
  captures[provider]=c;
  const name=provider==='NBA_OFFICIAL_WEB'?'nba-official-web':'espn-scoreboard';
  writeFileSync(join(dir,name+'.raw'),c.raw,{flag:'wx'});
  writeFileSync(join(dir,name+'.capture.json'),JSON.stringify(c.metadata,null,2)+'\n',{flag:'wx'});
 }catch(e){errors.push({provider,error_code:/^[A-Z0-9_]+$/.test(e.message)?e.message:'SOURCE_FETCH_ERROR'});}
}
let controls=[];
try{
 if(captures.NBA_OFFICIAL_WEB&&captures.ESPN_SCOREBOARD){
  const nba=nbaWebGames(verifySourceCapture(captures.NBA_OFFICIAL_WEB.metadata,captures.NBA_OFFICIAL_WEB.raw),date);
  const espn=espnScoreboardGames(verifySourceCapture(captures.ESPN_SCOREBOARD.metadata,captures.ESPN_SCOREBOARD.raw),date);
  const keys=new Set([...nba.map(x=>x.away+'@'+x.home),...espn.map(x=>x.away+'@'+x.home)]);
  controls=[...keys].sort().map(key=>{
   const n=nba.filter(x=>x.away+'@'+x.home===key),e=espn.filter(x=>x.away+'@'+x.home===key);
   const a=n.length===1?n[0]:null,b=e.length===1?e[0]:null;
   const issues=[];
   if(n.length!==1)issues.push('NBA_MISSING_OR_DUPLICATE');
   if(e.length!==1)issues.push('ESPN_MISSING_OR_DUPLICATE');
   if(a&&a.status!==3)issues.push('NBA_NOT_FINAL');
   if(b&&!b.completed)issues.push('ESPN_NOT_FINAL');
   if(a&&b&&(a.home_score!==b.home_score||a.away_score!==b.away_score))issues.push('SCORE_CONFLICT');
   if(a&&b&&Math.abs(Date.parse(a.event_start)-Date.parse(b.event_start))>3*3600000)issues.push('EVENT_TIME_MISMATCH');
   if(a&&b&&(!Number.isInteger(a.home_score)||!Number.isInteger(a.away_score)||a.home_score===a.away_score))issues.push('INVALID_NBA_FINAL');
   return {matchup:key,nba_id:a?.id||null,espn_id:b?.id||null,
    home_score:issues.length===0?a.home_score:null,
    away_score:issues.length===0?a.away_score:null,
    state:issues.length===0?'TWO_DIRECT_HTTPS_DOMAINS_MATCH_PROVISIONAL':'HOLD',
    issues};
  });
 }
}catch(e){errors.push({provider:'CROSS_SOURCE_SCHEMA',error_code:/^[A-Z0-9_]+$/.test(e.message)?e.message:'SOURCE_SCHEMA_ERROR'});}
const matching=controls.filter(c=>c.state==='TWO_DIRECT_HTTPS_DOMAINS_MATCH_PROVISIONAL');
const report={contract:'ATLAS_NBA_RETROSPECTIVE_TWO_DOMAIN_CONTROL_V1',date,
 status:matching.length===6&&controls.length===6?'SIX_COMPLETED_GAMES_CROSSCHECKED_PROVISIONAL':'PARTIAL_OR_UNAVAILABLE_CONTROL',
 native_nba_web_sha256:captures.NBA_OFFICIAL_WEB?.metadata.sha256||null,
 native_espn_sha256:captures.ESPN_SCOREBOARD?.metadata.sha256||null,
 reported_match_count:matching.length,total_unique_games:controls.length,
 games:controls,errors,
 original_provider_signatures_verified:false,editorial_independence_verified:false,
 retrospective_forecast_count:0,calibration_authority:false,production_authority:false,execution_authority:false,
 warning:'Two direct HTTP origins with matching games demonstrate transport capture and comparison; they do not retroactively prove any prestart model, market identity, or independent editorial input.'};
writeFileSync(join(dir,'control-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({status:report.status,matching:report.reported_match_count,total:controls.length,
  events:matching.map(x=>({matchup:x.matchup,home:x.home_score,away:x.away_score})),
  errors,auth:'TRANSPORT_ORIGIN_ONLY_NO_VENDOR_SIGNATURE'})+'\n');
