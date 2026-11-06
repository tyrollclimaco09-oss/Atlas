'use strict';
// ATLAS V15: explicit zero-credit market source preflight. No network calls or bets.
const MODES=Object.freeze({
 ATLAS_WEB_REFERENCE:Object.freeze({source_class:'PUBLIC_REFERENCE',mode:'MANUAL_REFERENCE',network_calls_enabled:false,paid_credits_per_day:0}),
 THE_ODDS_API:Object.freeze({source_class:'PAID_ODDS',mode:'DISABLED',network_calls_enabled:false,paid_credits_per_day:0})
});
const MARKETS=new Set(['moneyline','spread','total','player_prop']);
const utc=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?Date.parse(s):null;
function statusResult(status,key){return Object.freeze({
 status,source_key:key??null,network_request_performed:false,paid_credits_consumed:0,
 execution_grade:false,account_price_verified:false,independent_fair_probability:null,
 expected_value:null,production_authority:false,betting_authority:false,human_final_gate_required:true
});}
function preflightReference(input,{now=Date.now(),policies=MODES}={}){
 const key=input?.source_key;
 const control=policies[key];
 if(!control)return statusResult('SOURCE_NOT_REGISTERED',key);
 if(control.mode==='DISABLED'||control.source_class==='PAID_ODDS')return statusResult('PAID_CONNECTOR_DISABLED',key);
 const t=utc(input?.source_quote_at),observed=utc(input?.observed_at),tip=utc(input?.event_start_at);
 const odds=input?.odds_american;
 if(t===null||observed===null||tip===null||!Number.isInteger(odds)||
    odds>-100&&odds<100||!MARKETS.has(input?.market)||
    typeof input?.selection!=='string'||!input.selection.trim()||
    typeof input?.source_url!=='string'||!/^https:\/\/\S+$/.test(input.source_url))
  return statusResult('REFERENCE_IDENTITY_INVALID',key);
 if(t>observed||observed>now+30000||t>=tip||observed>=tip)
  return statusResult('REFERENCE_TIME_INVALID_OR_EXPIRED',key);
 if(t<now-900000)return statusResult('STALE_PUBLIC_REFERENCE',key);
 return statusResult('MANUAL_RESEARCH_REFERENCE_ONLY',key);
}
module.exports={MODES,preflightReference};