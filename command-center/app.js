'use strict';
const nodes = [
  ['SCOUT','Find the useful signal.','Discover matchups, markets, role changes, injury news, and player opportunities across the slate.','Timestamped sources, identifiable events and markets, and enough context to investigate.','FILTER / VERIFY receives the candidate and source trail.'],
  ['FILTER / VERIFY','Check the claim before it travels.','Confirm source quality, freshness, player identity, market rules, and conflicting reports. Deduplicate copied claims.','Primary-source checks where available; unresolved claims and missing timestamps stay visible.','Verified facts and explicit gaps go to ORACLE and EDGE THIEF.'],
  ['EDGE THIEF + ORACLE','Construct the case. Attack the case.','ORACLE builds an independent causal forecast. EDGE THIEF tests role, matchup, game script, efficiency, price, correlation, and what the market may know.','An independent forecast with assumptions; the strongest counter-case and conditions that would break the thesis.','PRICING receives the forecast and unresolved uncertainty. These are paired responsibilities, not extra nodes.'],
  ['PRICING','A good thesis still needs a good price.','Compare independent fair value with timestamped market quotes. Research public prices proactively and identify acceptable thresholds.','Event, market, book, line, odds, timestamp, method, and model-versus-market distinction.','KAIROS gets an actionable price threshold and a clear freshness boundary.'],
  ['KAIROS','Choose the moment.','Track information windows, quote age, market movement, and the cost of waiting or acting early.','A reason to act or wait, a trigger, and an expiry or next review time.','SENTINEL receives the timing decision and conditions that invalidate it.'],
  ['SENTINEL','Risk has to clear its own gate.','Check bankroll, exposure, correlation, uncertainty, data quality, and whether the proposed decision is admissible.','Valid inputs, explicit risk limits, and proof that the gate actually ran.','PASS, WATCH, INVESTIGATE, or a decision eligible for further review. A website calculation cannot grant a pass.'],
  ['TACTICIAN','Choose the right expression.','Translate the surviving thesis into singles, props, or a justified combination. Compare routes to cash and ways the position can fail.','Price quality, correlation treatment, portfolio fit, and reasons this expression beats its alternatives.','FINAL GATE receives the exact proposed market and stake for human confirmation.'],
  ['FINAL GATE','Confirm what can actually be executed.','Check the user’s sportsbook screenshot against the exact market, line, odds, fresh information, and intended stake.','An executable quote and explicit operator confirmation. A prepared slip is not a placement receipt.','Execution remains human. A receipt is needed before LEDGER can establish a placed wager.'],
  ['LEDGER','Preserve what actually happened.','Keep immutable decision, execution, quote, outcome, and exposure records with provenance. Record corrections as explicit additions.','Bound execution receipt, price and time; qualified close observation and final settlement when available.','FORENSICS receives the decision-time record, missing fields, and verified outcome.'],
  ['FORENSICS','Explain the miss. Explain the hit.','Compare forecast, market, execution, and outcome. Separate process mistakes, source failures, timing issues, and ordinary variance.','Point-in-time evidence, counterfactuals, unplayed controls, and lessons that survive hindsight checks.','CALIBRATOR receives eligible evidence and testable change proposals.'],
  ['CALIBRATOR','Make changes earn their place.','Assess calibration, CLV, resolution, process metrics, and outcomes. Test improvements before promotion and retain an explicit change history.','Admissible samples, a baseline, out-of-sample checks where applicable, and evidence that complexity improves decisions.','Approved changes feed the existing workflow. Candidate research remains in the Lab until promoted.']
];
const historical = [
  {name:'Golden State Valkyries +2.5',sport:'WNBA',generation:'S1',implied:'52.38%',blockers:['No independent model probability','Executable price not verified','New York availability not fully resolved','Travel and adaptation uncertainty']},
  {name:'Los Angeles Dodgers ML',sport:'MLB',generation:'S1',implied:'47.62%',blockers:['Confirmed lineups missing','No independent model probability','Executable price not verified','Material market move unexplained']},
  {name:'Milwaukee Brewers ML',sport:'MLB',generation:'S2',implied:'65.99%',blockers:['Confirmed lineups missing','No independent model probability','Executable price not verified','Bullpen workload uncertainty']},
  {name:'Washington Mystics −4',sport:'WNBA',generation:'S1',implied:'52.38%',blockers:['No independent model probability','Executable price not verified','Rematch adaptation risk','Line move may already price the edge']},
  {name:'Milwaukee Brewers ML · prior generation',sport:'MLB',generation:'S1',implied:'65.99%',superseded:true,blockers:['Historical S1 generation was superseded by S2']}
];
const research = [
  ['Point-in-time reconstruction','Replay only the information available at the decision moment.','LEDGER / FORENSICS'],
  ['Uncertainty routing','Separate missing knowledge from irreducible outcome randomness.','VERIFY / KAIROS / SENTINEL'],
  ['Multiple de-vig methods','Compare justified methods and record disagreement instead of false precision.','PRICING'],
  ['Opportunity-first props','Model game state, team opportunity, player role, efficiency, then the distribution.','SCOUT / ORACLE'],
  ['Forecast calibration','Evaluate Brier score, log loss, reliability, resolution, CLV, and process quality.','CALIBRATOR'],
  ['Market leader profiles','Study leader and follower behavior by market and timing window.','PRICING / KAIROS'],
  ['Claim-specific source records','Track accuracy and latency by claim category.','FILTER / VERIFY']
];
const views = new Map(Array.from(document.querySelectorAll('.view'), view => [view.id, view]));
function route() {
  const requested = location.hash.slice(1);
  const id = views.has(requested) ? requested : 'slate';
  views.forEach((view, key) => { view.hidden = key !== id; });
  document.querySelectorAll('[data-view]').forEach(link => {
    if (link.dataset.view === id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.getElementById('breadcrumb').textContent = id.charAt(0).toUpperCase() + id.slice(1);
  document.title = 'ATLAS · ' + id.charAt(0).toUpperCase() + id.slice(1);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { route(); document.getElementById('content').focus({preventScroll:true}); });
const pipeline = document.getElementById('pipeline');
nodes.forEach((node, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'node-button';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-controls', 'node-detail');
  button.innerHTML = `<span class="node-index">${String(index + 1).padStart(2, '0')}</span><span class="node-label">${node[0]}</span><span class="node-arrow" aria-hidden="true">↗</span>`;
  button.addEventListener('click', () => {
    selectNode(index);
    if (window.matchMedia('(max-width:800px)').matches) document.getElementById('node-detail').scrollIntoView({block:'start',behavior:'instant'});
  });
  pipeline.appendChild(button);
});
function selectNode(index) {
  const node = nodes[index];
  document.querySelectorAll('.node-button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  document.getElementById('node-detail').innerHTML = `<p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${node[0]}</p><h2>${node[1]}</h2><p>${node[2]}</p><div class="detail-section"><h3>EVIDENCE TO CARRY</h3><p>${node[3]}</p></div><div class="detail-section"><h3>NEXT HANDOFF</h3><p>${node[4]}</p></div>`;
}
const archiveList = document.getElementById('archive-list');
const dialog = document.getElementById('archive-dialog');
historical.forEach(candidate => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'archive-card';
  button.innerHTML = `<span><strong>${candidate.name}</strong><small>${candidate.sport} · Historical ${candidate.generation}</small></span><span class="tag neutral">${candidate.superseded ? 'SUPERSEDED' : 'ARCHIVED'} ↗</span>`;
  button.addEventListener('click', () => {
    document.getElementById('archive-dialog-content').innerHTML = `<h2 id="archive-dialog-title">${candidate.name}</h2><p>${candidate.sport} · ${candidate.generation} · Historical market-implied probability: ${candidate.implied}</p><ul class="dialog-facts"><li>ATLAS fair probability: unavailable</li><li>Executable price: unverified</li><li>${candidate.superseded ? 'Generation superseded in the original snapshot.' : 'Original snapshot: SCOUT and lineage passed; ORACLE waited; downstream gates were not reached.'}</li></ul><h3>Recorded blockers</h3><ul class="reading-list">${candidate.blockers.map(blocker => `<li>${blocker}</li>`).join('')}</ul><p class="small">This is an August 27 archive, not a current recommendation or a placed bet.</p>`;
    dialog.showModal();
  });
  archiveList.appendChild(button);
});
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
document.getElementById('research-list').innerHTML = research.map(item => `<div class="research-row"><div><h3>${item[0]}</h3><p>${item[1]}</p></div><span>${item[2]}</span></div>`).join('');
const form = document.getElementById('price-form');
const errorElement = document.getElementById('price-error');
function clearResults() {
  ['break-even','decimal','return','fair-odds','expected'].forEach(id => { document.getElementById(id).textContent = '—'; });
  document.getElementById('price-headline').textContent = 'Start with an actual price.';
  document.getElementById('price-summary').textContent = 'Enter odds to calculate break-even probability and return per $1.';
  errorElement.hidden = true;
}
form.addEventListener('input', () => {
  clearResults();
  document.getElementById('price-headline').textContent = 'Ready for a fresh calculation.';
  document.getElementById('price-summary').textContent = 'Calculate to update the readout with these inputs.';
});
form.addEventListener('reset', clearResults);
form.addEventListener('submit', event => {
  event.preventDefault();
  clearResults();
  try {
    const result = AtlasPricing.calculatePrice(document.getElementById('odds').value, document.getElementById('probability').value);
    document.getElementById('break-even').textContent = (result.breakEven * 100).toFixed(2) + '%';
    document.getElementById('decimal').textContent = result.decimal.toFixed(3);
    document.getElementById('return').textContent = '$' + result.decimal.toFixed(2);
    if (result.fairOdds !== null) document.getElementById('fair-odds').textContent = (result.fairOdds > 0 ? '+' : '−') + Math.abs(result.fairOdds).toFixed(1);
    if (result.expected !== null) document.getElementById('expected').textContent = (result.expected < 0 ? '−' : '+') + '$' + Math.abs(result.expected).toFixed(3);
    document.getElementById('price-headline').textContent = result.expected === null ? 'The market’s hurdle.' : result.expected > 1e-10 ? 'Positive under your estimate.' : result.expected < -1e-10 ? 'This price misses your estimate.' : 'Break-even under your estimate.';
    document.getElementById('price-summary').textContent = result.expected === null ? 'Add an independent fair probability to compare value. Market odds alone cannot establish an edge.' : 'This is a mathematical scenario, not a betting authorization. Final Gate remains required.';
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.hidden = false;
    document.getElementById('price-headline').textContent = 'Check the inputs.';
  }
});
selectNode(0);
route();
