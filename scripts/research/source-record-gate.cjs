'use strict';
// Pure offline record checks. Approval fields are trusted configuration inputs,
// not proof that this module authenticated a vendor or contacted a venue.
const {createHash}=require('node:crypto');
const {implied}=require('./market-intelligence.cjs');
const filled=v=>typeof v==='string'&&v.trim().length>0;
function utc(v){
 if(typeof v!=='string')return null;
 const m=v.match(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.\d{1,3})?Z$/);
 const t=m?Date.parse(v):NaN;
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,19)===m[1]?t:null;
}
const hash=body=>createHash('sha256').update(body,'utf8').digest('hex');
function validateSnapshot(snapshot){
 const errors=[];let payload=null;
 if(!snapshot||!filled(snapshot.snapshotId)||!filled(snapshot.sourceId)||utc(snapshot.fetchedAtUtc)===null)
  errors.push('SNAPSHOT_IDENTITY_INVALID');
 if(typeof snapshot?.rawBody!=='string'||Buffer.byteLength(snapshot.rawBody,'utf8')>8_000_000)
  errors.push('RAW_BODY_INVALID');
 if(typeof snapshot?.rawSha256!=='string'||!/^[a-f0-9]{64}$/i.test(snapshot.rawSha256)||
   typeof snapshot.rawBody==='string'&&hash(snapshot.rawBody)!==snapshot.rawSha256.toLowerCase())
  errors.push('RAW_HASH_MISMATCH');
 if(!errors.length){
  try{payload=JSON.parse(snapshot.rawBody);}catch{errors.push('RAW_JSON_INVALID');}
  if(payload?.contract!=='ATLAS_NORMALIZED_ODDS_SNAPSHOT_V1'||!Array.isArray(payload?.observations))
   errors.push('UNSUPPORTED_SNAPSHOT_FORMAT');
 }
 return {passed:errors.length===0,errors,payload:errors.length?null:payload};
}
function validateMoneylineObservation(q,{snapshot,sourceRegistry,rulesRegistry,asOfUtc,policy}){
 const errors=[],warnings=[];
 const add=s=>errors.push(s);
 const source=sourceRegistry.filter(s=>s?.sourceId===q?.sourceId);
 if(source.length!==1)add('SOURCE_NOT_UNIQUE');
 const s=source.length===1?source[0]:null;
 if(s?.status!=='approved'||s?.usageReview!=='approved'||s?.approvedForOfflineResearch!==true)
  add('SOURCE_NOT_APPROVED');
 if(!Array.isArray(s?.products)||!s.products.includes(q?.product))add('SOURCE_PRODUCT_NOT_COVERED');
 if(!Array.isArray(s?.capabilities)||!s.capabilities.includes('two_sided_prices'))add('SOURCE_CAPABILITY_NOT_COVERED');
 if(!Array.isArray(s?.bookIds)||!s.bookIds.includes(q?.book)||
  typeof q?.book!=='string'||!/^[a-z0-9_]+$/.test(q.book))add('BOOK_NOT_APPROVED');
 if(s?.timestampSemantics!=='market_last_seen')add('TIMESTAMP_SEMANTICS_UNSUPPORTED');
 const evidence=validateSnapshot(snapshot);
 if(!evidence.passed)errors.push(...evidence.errors);
 if(q?.rawSnapshotId!==snapshot?.snapshotId||q?.sourceId!==snapshot?.sourceId||
  q?.fetchedAtUtc!==snapshot?.fetchedAtUtc)add('RAW_EVIDENCE_LINK_MISMATCH');
 if(evidence.passed){
  const raw=evidence.payload.observations.filter(x=>filled(q?.observationId)&&x?.observationId===q.observationId);
  const normalized={...q};delete normalized.rawSnapshotId;
  if(raw.length!==1||JSON.stringify(raw[0])!==JSON.stringify(normalized))add('RAW_RECORD_MISMATCH');
 }
 for(const field of ['observationId','sourceId','book','eventId','homeTeamId','awayTeamId','settlementRuleId'])
  if(!filled(q?.[field]))add('MISSING_'+field.toUpperCase());
 if(q?.product!=='sportsbook')add('UNSUPPORTED_PRODUCT');
 if(q?.sport!=='NBA'||q?.market!=='moneyline')add('UNSUPPORTED_LANE');
 if(q?.homeTeamId===q?.awayTeamId)add('PARTICIPANT_MISMATCH');
 const rules=rulesRegistry.filter(r=>r?.rulesId===q?.settlementRuleId);
 if(rules.length!==1)add('UNAPPROVED_RULES');
 else if(['product','sport','market','period','overtimeRule'].some(k=>rules[0][k]!==q?.[k])||
  rules[0].settlement!=='win_loss_no_push'||q.period!=='full_game'||q.overtimeRule!=='included')add('RULES_MISMATCH');
 if(q?.marketStatus==='UNKNOWN'||!filled(q?.marketStatus))add('MARKET_STATUS_UNKNOWN');
 else if(q.marketStatus!=='OPEN')add('MARKET_NOT_OPEN');
 const now=utc(asOfUtc),observed=utc(q?.sourceObservedAtUtc),fetched=utc(q?.fetchedAtUtc),start=utc(q?.eventStartUtc);
 if([now,observed,fetched,start].some(t=>t===null))add('INVALID_TIMESTAMP');
 else{
  if(observed>now+5000)add('FUTURE_SOURCE');
  if(fetched>now+5000)add('FUTURE_FETCH');
  if(observed>fetched+5000)add('SOURCE_AFTER_FETCH');
  if(now-observed>policy.maxSourceAgeSeconds*1000)add('STALE_SOURCE');
  if(now-fetched>policy.maxFetchAgeSeconds*1000)add('STALE_FETCH');
  if(start<=now||observed>=start)add('NOT_PREGAME');
 }
 const o=q?.outcomes;
 if(!Array.isArray(o)||o.length!==2||o.some(x=>!x||typeof x!=='object'))add('INCOMPLETE_TWO_SIDED_MARKET');
 else{
  const ids=o.map(x=>x.participantId);
  if(new Set(ids).size!==2||!ids.includes(q.homeTeamId)||!ids.includes(q.awayTeamId))add('PARTICIPANT_MISMATCH');
  if(o.some(x=>x.side!=='win'||x.line!==null))add('UNSUPPORTED_OUTCOME');
  if(o.some(x=>!Number.isSafeInteger(x.americanOdds)||implied(x.americanOdds)===null))add('INVALID_ODDS');
  else if(o.reduce((sum,x)=>sum+implied(x.americanOdds),0)<=1)warnings.push('NONPOSITIVE_OVERROUND_REVIEW');
 }
 // A source/evidence/identity-valid withdrawal or malformed later price must
 // suppress an older price, without admitting that later record as a quote.
 const priceErrors=new Set(['MARKET_NOT_OPEN','MARKET_STATUS_UNKNOWN','INCOMPLETE_TWO_SIDED_MARKET',
  'INVALID_ODDS','UNSUPPORTED_OUTCOME','PARTICIPANT_MISMATCH']);
 return {passed:errors.length===0,errors:[...new Set(errors)],warnings,
  lifecycle_usable:errors.every(e=>priceErrors.has(e)),
  raw_evidence_matched:evidence.passed&&!errors.includes('RAW_RECORD_MISMATCH')&&!errors.includes('RAW_EVIDENCE_LINK_MISMATCH'),
  venue_verified:false,source_authenticated:false,
  synthetic_fixture:snapshot?.syntheticFixture===true||s?.sourceClass==='FIXTURE'};
}
module.exports={utc,hash,validateSnapshot,validateMoneylineObservation};
