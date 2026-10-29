import {readFile,writeFile} from "node:fs/promises";
import {reconcileCanonical} from "./canonical-reconcile.mjs";
export const PROVIDER_ID="3b9f6438-22c9-4ed7-992e-59a54e7bcc11";
const MINUTES_15=15*60*1000;
const keepQuote=q=>({
  market:q.market,player:q.player,selection:q.selection,line:q.line,
  odds:q.american_odds,market_last_update:q.market_last_update,quote_status:q.status,
  executable_price_verified:false
});
const keepSpread=d=>({
  market:d.market,player:d.player,selection:d.selection,line:d.line,
  draftkings_odds:d.draftkings_odds,best_comparator_book:d.best_comparator_book,
  best_comparator_odds:d.best_comparator_odds,dk_price_advantage_pp:d.dk_price_advantage_pp,
  expected_value:null,independent_fair_probability:null
});
export function makeSiteSnapshot({receipt,events,bindings}){
  const reconciled=reconcileCanonical({packet:receipt,events,bindings,providerId:PROVIDER_ID,maxTipDeltaMinutes:15});
  if(receipt.contract!=="ATLAS_DK_FIRST_SHADOW_V1"||receipt.execution_authority!==false)throw Error("SOURCE_CONTRACT_INVALID");
  const asOf=Date.parse(receipt.observed_at);if(!Number.isFinite(asOf))throw Error("OBSERVED_AT_REQUIRED");
  const summary={
    contract:"ATLAS_DK_FIRST_SHADOW_V1",snapshot_schema:"ATLAS_DK_SITE_SNAPSHOT_V1",
    observed_at:receipt.observed_at,primary_book:"draftkings",secondary_book:"betmgm",
    source:"THE_ODDS_API_V4",source_hash:receipt.raw_sha256||null,
    credits_remaining_at_capture:receipt.credits_remaining??null,identity_summary:reconciled.identity_summary,
    totals:receipt.totals,execution_authority:false,approved_bet:null,expected_value:null,independent_fair_probability:null,
    executable_price_verified:false,requires_event_id_reconciliation:reconciled.requires_event_id_reconciliation,
    events:reconciled.events.map(e=>({
      provider_event_id:e.provider_event_id,canonical_event_id:e.canonical_event_id,
      identity_status:e.identity_status,identity_reason:e.identity_reason,
      away_team:e.away_team,home_team:e.home_team,commence_time:e.commence_time,
      dk_status:e.dk_status,
      primary_quotes:e.primary_quotes.map(keepQuote),
      price_disagreements:e.price_disagreements.map(keepSpread),
      quarantined_count:e.quarantined.length
    }))
  };
  if(JSON.stringify(summary).length>79000)throw Error("EXCEEDS_EXISTING_SITE_REPORT_LIMIT");
  if(summary.events.some(e=>e.primary_quotes.some(q=>{
    const t=Date.parse(q.market_last_update);
    return !Number.isFinite(t)||t>asOf+60000||asOf-t>MINUTES_15;
  })))throw Error("SNAPSHOT_CONTAINS_INVALID_DK_QUOTE");
  return summary;
}
async function cli(){
  const args=process.argv.slice(2);
  if(args.length===0)return;
  const arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};
  const oddsPath=arg("--odds"),bindingsPath=arg("--bindings"),output=arg("--output");
  if(!oddsPath||!bindingsPath||!output)throw Error("SNAPSHOT_FILES_REQUIRED");
  const [receipt,mapping]=await Promise.all([readFile(oddsPath,"utf8").then(JSON.parse),readFile(bindingsPath,"utf8").then(JSON.parse)]);
  const doc=makeSiteSnapshot({receipt,events:mapping.events,bindings:mapping.bindings});
  await writeFile(output,JSON.stringify(doc),{flag:"wx",mode:0o600});
  console.log(JSON.stringify({status:"FROZEN",events:doc.events.length,matched:doc.identity_summary.RECONCILED||0,
    linked_pending:doc.identity_summary.LINKED_PENDING||0,unmapped:doc.identity_summary.UNMAPPED||0,
    quotes:doc.events.reduce((n,e)=>n+e.primary_quotes.length,0),
    bytes:JSON.stringify(doc).length,execution_authority:false,production_writes:0}));
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href)cli().catch(e=>{console.error(e.message);process.exitCode=1});
