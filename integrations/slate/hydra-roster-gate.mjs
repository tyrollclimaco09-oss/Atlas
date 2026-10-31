/**
 * ATLAS HYDRA roster identity preflight — research-only, zero network/provider calls.
 * Validates asserted, timestamped roster receipts before an experimental paper card
 * may be marked identity-ready. Does NOT authenticate the receipts or certify
 * actual injury/starting status, prices, EV, or execution authority.
 */
export const CONTRACT = 'ATLAS_HYDRA_ROSTER_GATE_V1';
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/;
const TEAM = /^[A-Z]{3}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const norm = s => typeof s === 'string' ? s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() : '';
const time = s => typeof s === 'string' && ISO.test(s) &&
  Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 19) === s.slice(0, 19)
  ? Date.parse(s) : null;
const unique = a => new Set(a).size === a.length;
const allowedStatus = new Set(['ACTIVE', 'QUESTIONABLE', 'OUT']);
const allowedMarkets = new Set(['PTS', 'REB', 'AST', '3PM', 'PRA', 'STL', 'BLK']);
const host = url => {try {const u = new URL(url); return u.protocol === 'https:' &&
  (u.hostname === 'nba.com' || u.hostname === 'www.nba.com') && !u.username && !u.password;}catch{return false;}};
function chicagoDay(stamp) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(stamp));
  const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return p.year+'-'+p.month+'-'+p.day;
}
export function checkHydraRoster(input, {now = new Date().toISOString()} = {}) {
  if (!input || input.contract !== CONTRACT || input.league !== 'NBA' ||
      typeof input.slate_date !== 'string' || !DAY.test(input.slate_date) ||
      new Date(input.slate_date+'T12:00:00Z').toISOString().slice(0,10) !== input.slate_date ||
      time(input.freeze_at) === null || time(now) === null || time(input.freeze_at) > time(now) + 60000 ||
      !Array.isArray(input.events) || input.events.length < 1 || input.events.length > 30 ||
      !Array.isArray(input.roster_receipts) || input.roster_receipts.length > 200 ||
      !Array.isArray(input.legs) || input.legs.length < 1 || input.legs.length > 40)
    throw Error('HYDRA_GATE_INPUT_INVALID');
  const freeze = time(input.freeze_at);
  const problems = [];
  const events = new Map();
  for (const e of input.events) {
    if (!ID.test(e?.id||'') || events.has(e.id) || !TEAM.test(e.home||'') ||
        !TEAM.test(e.away||'') || e.home === e.away || time(e.tip_at) === null ||
        chicagoDay(e.tip_at) !== input.slate_date || time(e.tip_at) <= freeze)
      throw Error('EVENT_IDENTITY_INVALID');
    events.set(e.id, e);
  }
  // One current roster identity per player. Duplicate/conflicting snapshots
  // are refused, not resolved by taking whichever is most convenient.
  const receipts = new Map();
  for (const r of input.roster_receipts) {
    if (!ID.test(r?.player_id||'') || !norm(r.player_name) || !TEAM.test(r.team||'') ||
        !allowedStatus.has(r.status) || !host(r.source_url) ||
        r.source_type !== 'OFFICIAL_NBA_ROSTER_OBSERVATION' ||
        time(r.observed_at) === null || time(r.observed_at) > freeze ||
        freeze - time(r.observed_at) > 48*3600000 ||
        !DAY.test(r.effective_date||'') || r.effective_date > input.slate_date)
      throw Error('ROSTER_RECEIPT_INVALID_OR_STALE');
    if (receipts.has(r.player_id)) problems.push({code:'CONFLICTING_PLAYER_ROSTER_RECEIPTS',player_id:r.player_id});
    else receipts.set(r.player_id, r);
  }
  const picks = new Set();
  const legs = input.legs.map(l => {
    const reasons = [];
    if (!ID.test(l?.id||'') || !ID.test(l?.player_id||'') || !norm(l?.player_name) ||
        !TEAM.test(l?.team||'') || !ID.test(l?.event_id||'') ||
        !allowedMarkets.has(l?.market) || !Number.isFinite(l?.threshold) || l.threshold <= 0 ||
        !['AT_LEAST','OVER','UNDER'].includes(l?.comparison)) reasons.push('LEG_SHAPE_INVALID');
    const e = events.get(l?.event_id);
    if (!e) reasons.push('EVENT_NOT_IN_FROZEN_SLATE');
    else if (l.team !== e.away && l.team !== e.home) reasons.push('PLAYER_TEAM_NOT_IN_EVENT');
    const roster = receipts.get(l?.player_id);
    if (!roster) reasons.push('MISSING_CURRENT_ROSTER_RECEIPT');
    else {
      if (roster.team !== l.team || norm(roster.player_name) !== norm(l.player_name)) reasons.push('ROSTER_PLAYER_TEAM_MISMATCH');
      if (roster.status === 'OUT') reasons.push('PLAYER_REPORTED_OUT');
      if (roster.status === 'QUESTIONABLE') reasons.push('PLAYER_STATUS_UNRESOLVED');
    }
    const pick = JSON.stringify([l?.event_id,l?.player_id,l?.market,l?.comparison,l?.threshold]);
    if (picks.has(pick)) reasons.push('DUPLICATE_EXACT_LEG');
    picks.add(pick);
    if (problems.some(p=>p.player_id === l?.player_id)) reasons.push('CONFLICTING_PLAYER_ROSTER_RECEIPTS');
    return {id:l?.id||null,player_id:l?.player_id||null,team:l?.team||null,
      event_id:l?.event_id||null,market:l?.market||null,threshold:l?.threshold??null,
      status:reasons.length ? 'HOLD' : 'ROSTER_IDENTITY_READY',reasons};
  });
  const allIds = input.legs.map(x=>x?.id);
  if (!unique(allIds)) throw Error('DUPLICATE_LEG_IDS');
  return {contract:CONTRACT,slate_date:input.slate_date,checked_at:now,
    freeze_at:input.freeze_at,identity_state:legs.every(x=>x.status==='ROSTER_IDENTITY_READY')?'IDENTITY_READY':'HOLD',
    legs,matched_count:legs.filter(x=>x.status==='ROSTER_IDENTITY_READY').length,
    held_count:legs.filter(x=>x.status==='HOLD').length,
    receipt_truth:'OPERATOR_REPORTED_NEEDS_SOURCE_RECHECK',
    required_next_checks:['AUTHENTICATE_OFFICIAL_ROSTER_CAPTURE','OFFICIAL_INJURY_AND_STARTER_STATUS','INDEPENDENT_OPPORTUNITY_FORECAST','SENTINEL_AND_HUMAN_FINAL_GATE'],
    execution_authority:false,approved_bet:null,expected_value:null,verified_odds:null};
}
