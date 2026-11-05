'use strict';
// ATLAS EDGE DNA — pure research utilities. No sportsbook API, account, bet or network operations.
function americanToDecimal(odds) {
  if (!Number.isInteger(odds) || Math.abs(odds)<100 || odds===0) return null;
  return odds>0 ? 1 + odds/100 : 1 + 100/(-odds);
}
function roiAtPrice(probability, american) {
  const decimal = americanToDecimal(american);
  if (decimal === null || !Number.isFinite(probability) || probability < 0 || probability > 1) return null;
  return probability * decimal - 1;
}
// Symmetric two-factor Shapley decomposition of apparent ROI difference.
// Attribution is accounting/math only; it is NOT a causal claim or proof the inputs are calibrated.
function edgeDNA({beforeProbability, afterProbability, beforeAmerican, afterAmerican}={}) {
  const d0=americanToDecimal(beforeAmerican), d1=americanToDecimal(afterAmerican);
  const p0=beforeProbability, p1=afterProbability;
  if (d0==null || d1==null || ![p0,p1].every(p=>Number.isFinite(p) && p>=0 && p<=1)) return null;
  const beforeROI=p0*d0-1, afterROI=p1*d1-1;
  const probabilityContribution=(p1-p0)*(d0+d1)/2;
  const priceContribution=(d1-d0)*(p0+p1)/2;
  return {beforeROI,afterROI,change:afterROI-beforeROI,probabilityContribution,priceContribution,
    check:Math.abs((probabilityContribution+priceContribution)-(afterROI-beforeROI))<1e-10,
    status:'RESEARCH_ACCOUNTING_NOT_CAUSAL', fairProbabilityValidated:false, executable:false};
}
function isoMillis(v) { if(typeof v!=='string'|| !/Z$/.test(v))return null; const t=Date.parse(v);return Number.isFinite(t)?t:null; }
// Observe time can be recent while the *origin* of the book's quote is unknown.
function quoteProvenance(quote, decisionUtc, {maxObservedAgeMinutes=15}={}) {
  const now=isoMillis(decisionUtc), observed=isoMillis(quote?.observedAtUtc), changed=isoMillis(quote?.bookChangedAtUtc);
  const flags=[];
  if(now===null||observed===null||observed>now)flags.push('BAD_OBSERVATION_TIMESTAMP');
  else if((now-observed)/60000>maxObservedAgeMinutes)flags.push('STALE_OBSERVATION');
  if(changed===null)flags.push('BOOK_CHANGE_TIME_UNKNOWN');
  else if(now!==null&&changed>now)flags.push('FUTURE_BOOK_CHANGE');
  else if(observed!==null&&changed>observed)flags.push('BOOK_CHANGE_AFTER_CAPTURE');
  if(quote?.withdrawn===true||quote?.suspended===true)flags.push('QUOTE_NOT_AVAILABLE');
  if(quote?.accountConfirmed!==true)flags.push('NOT_ACCOUNT_CONFIRMED');
  if(americanToDecimal(quote?.american)===null)flags.push('BAD_PRICE');
  const exactBookTimeKnown=changed!==null && !flags.includes('FUTURE_BOOK_CHANGE')&&!flags.includes('BOOK_CHANGE_AFTER_CAPTURE');
  return {flags, observedAgeMinutes:now!==null&&observed!==null?(now-observed)/60000:null,
    bookAgeMinutes:now!==null&&changed!==null?(now-changed)/60000:null,
    exactBookTimeKnown, executable:false, approval:'HUMAN_FINAL_GATE_REQUIRED'};
}
// Canonical 'same outcome' cannot be inferred from similar titles or price alone.
function compareStructures(a,b) {
  const fields=['eventId','outcomePredicate','gradingRule','overtimeRule','voidRule'];
  const missing=fields.filter(f=>typeof a?.[f]!=='string'||!a[f]||typeof b?.[f]!=='string'||!b[f]);
  if(missing.length) return {match:false,state:'UNVERIFIED_EQUIVALENCE',missing};
  const mismatch=fields.filter(f=>a[f]!==b[f]);
  return {match:mismatch.length===0,state:mismatch.length?'RULES_DIFFER':'SAME_DECLARED_RULES_REVIEW_REQUIRED',mismatch,
    verifiedBookAuthority:false};
}
// Source DAG: each child must be observed no earlier than its parents. Future observations fail cutoff.
function validateEvidenceGraph(nodes, cutoffUtc) {
  const issues=[],cutoff=isoMillis(cutoffUtc),list=Array.isArray(nodes)?nodes:[];
  if(cutoff===null)issues.push('BAD_CUTOFF');
  const byId=new Map();
  for(const n of list){if(!n||typeof n.id!=='string'||!n.id){issues.push('BAD_NODE_ID');continue}
    if(byId.has(n.id)) issues.push('DUPLICATE_NODE:'+n.id); else byId.set(n.id,n);
    const t=isoMillis(n.observedAtUtc);
    if(t===null)issues.push('MISSING_NODE_TIME:'+n.id); else if(cutoff!==null&&t>cutoff)issues.push('POST_CUTOFF:'+n.id);
  }
  for(const n of list){if(!n||!n.id)continue;for(const p of (n.parents||[])){
    const prior=byId.get(p);if(!prior){issues.push('MISSING_PARENT:'+n.id+':'+p);continue}
    const nt=isoMillis(n.observedAtUtc),pt=isoMillis(prior.observedAtUtc);
    if(nt!==null&&pt!==null&&nt<pt)issues.push('PARENT_AFTER_CHILD:'+n.id+':'+p);
  }}
  const visited=new Set(),stack=new Set();
  function visit(id){if(stack.has(id)){issues.push('CYCLE:'+id);return};if(visited.has(id))return;
    visited.add(id);stack.add(id);for(const parent of byId.get(id)?.parents||[])if(byId.has(parent))visit(parent);stack.delete(id);}
  for(const id of byId.keys())visit(id);
  return {valid:issues.length===0,issues:[...new Set(issues)],nodesChecked:byId.size,
    status:issues.length?'QUARANTINE':'STRUCTURAL_LINEAGE_PASS_NOT_TRUTH_PROOF'};
}
// Paper result graph — a root repeated across cards is NOT independent evidence.
function paperRootMap(cards) {
  const rows=new Map(),invalid=[],counted=new Set();let total=0;
  for(const card of (cards||[])) {
    if(!card||!card.id||counted.has(card.id)){invalid.push('DUPLICATE_OR_MISSING_CARD_ID');continue}
    counted.add(card.id); total++;
    const legs=Array.isArray(card.legs)?card.legs:[];
    const encountered=new Set();
    for(const leg of legs){
      if(!leg||!leg.rootId||encountered.has(leg.rootId))continue;
      encountered.add(leg.rootId);
      if(!rows.has(leg.rootId))rows.set(leg.rootId,{rootId:leg.rootId,appearances:0,failedCards:0,invalidCards:0,cardIds:[]});
      const rec=rows.get(leg.rootId);rec.appearances++;rec.cardIds.push(card.id);
      if(leg.result==='MISS')rec.failedCards++;
      if(['DNP_REVIEW','UNGRADABLE'].includes(leg.result))rec.invalidCards++;
    }
  }
  return {totalDistinctCards:total,roots:[...rows.values()].sort((a,b)=>b.failedCards-a.failedCards||b.appearances-a.appearances),invalid,
    note:'Repeated root appearances are correlated. They cannot be used as independent forecast samples.'};
}
module.exports={americanToDecimal,roiAtPrice,edgeDNA,quoteProvenance,compareStructures,validateEvidenceGraph,paperRootMap};