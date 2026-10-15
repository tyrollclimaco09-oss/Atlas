'use strict';

// Independently authored synthetic research assumptions. These are not provider
// records, official basketball usage statistics, forecasts, or calibrated effects.
const VERSION = 'atlas.game-sense.workload-shadow.v1';
const copy = value => JSON.parse(JSON.stringify(value));
function immutable(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}
const player = number => 'synthetic-player-' + number;
const starters = [1, 2, 3, 4, 5].map(player);
function baseline(league = 'NBA') {
  const minutes = league === 'WNBA' ? 40 : 48;
  return {
    schema_version: VERSION, synthetic: true, research_only: true,
    phase: 'PHASE1_PRICE_INDEPENDENT', scenario_id: 'synthetic-baseline-' + league,
    event_id: 'synthetic-game-' + league, team_id: 'synthetic-team-' + league,
    league, forecast_cutoff: '2026-10-13T12:00:00Z', frozen_at: '2026-10-13T11:00:00Z',
    evidence_at: '2026-10-13T10:00:00Z', roster_complete: true,
    assumptions: {
      usage_definition: 'synthetic-possession-ending-share-v1', pace_timing: 'uniform',
      efficiency_definition: 'synthetic-conversion-per-opportunity-v1', causal_claim: false
    },
    rules: { regulation_minutes: minutes, ot_periods: 0, ot_minutes: 5, players_on_court: 5 },
    pace: { basis_minutes: minutes, before: 100, after: 100,
      overtime_possessions_before: 0, overtime_possessions_after: 0 },
    players: Array.from({ length: 7 }, (_, index) => ({
      player_id: player(index + 1), available_before: true, available_after: true,
      minutes_before: index < 5 ? minutes : 0, minutes_after: index < 5 ? minutes : 0,
      usage_before: index < 5 ? 0.2 : 0, usage_after: index < 5 ? 0.2 : 0,
      opportunities_before: index < 5 ? 20 : 0, opportunities_after: index < 5 ? 20 : 0,
      efficiency_before: 0.5, efficiency_after: 0.5
    })),
    rotations: {
      before: [{ start: 0, end: minutes, player_ids: [...starters] }],
      after: [{ start: 0, end: minutes, player_ids: [...starters] }]
    },
    transfers: [], disruptions: []
  };
}
function disruption(kind, subject, cap, suffix = kind) {
  return { disruption_id: 'synthetic-' + suffix, kind,
    player_id: subject === null ? null : player(subject), max_minutes_after: cap,
    evidence_at: '2026-10-13T10:00:00Z' };
}
function transfer(from, to, minutes, causes, suffix = from + '-' + to) {
  return { transfer_id: 'synthetic-transfer-' + suffix,
    from_player_id: player(from), to_player_id: player(to), minutes,
    disruption_ids: causes.map(cause => 'synthetic-' + cause) };
}
function setAfter(s, number, minutes, share) {
  const p = s.players[number - 1];
  p.minutes_after = minutes; p.usage_after = share;
  p.opportunities_after = share * (s.pace.after + s.pace.overtime_possessions_after);
}
function absence(league = 'NBA', split = false) {
  const s = baseline(league), duration = s.rules.regulation_minutes;
  s.scenario_id = 'synthetic-absence-' + league + (split ? '-split' : '');
  s.players[0].available_after = false;
  setAfter(s, 1, 0, 0);
  s.disruptions = [disruption('absence', 1, 0)];
  if (split) {
    setAfter(s, 6, 20, 0.08); setAfter(s, 7, duration - 20, 0.12);
    s.rotations.after = [
      { start: 0, end: 20, player_ids: [2, 3, 4, 5, 6].map(player) },
      { start: 20, end: duration, player_ids: [2, 3, 4, 5, 7].map(player) }
    ];
    s.transfers = [transfer(1, 6, 20, ['absence']), transfer(1, 7, duration - 20, ['absence'])];
  } else {
    setAfter(s, 6, duration, 0.2);
    s.rotations.after = [{ start: 0, end: duration, player_ids: [2, 3, 4, 5, 6].map(player) }];
    s.transfers = [transfer(1, 6, duration, ['absence'])];
  }
  return s;
}
function foulTrouble(league = 'NBA') {
  const s = baseline(league), duration = s.rules.regulation_minutes;
  s.scenario_id = 'synthetic-foul-trouble-' + league;
  setAfter(s, 1, 20, 0.08); setAfter(s, 6, duration - 20, 0.12);
  s.rotations.after = [
    { start: 0, end: 20, player_ids: [...starters] },
    { start: 20, end: duration, player_ids: [2, 3, 4, 5, 6].map(player) }
  ];
  s.disruptions = [disruption('foul_trouble', 1, 20)];
  s.transfers = [transfer(1, 6, duration - 20, ['foul_trouble'])];
  return s;
}
function blowout(league = 'NBA') {
  const s = baseline(league), duration = s.rules.regulation_minutes;
  s.scenario_id = 'synthetic-blowout-' + league;
  setAfter(s, 1, duration - 20, 0.12); setAfter(s, 2, duration - 20, 0.12);
  setAfter(s, 6, 20, 0.08); setAfter(s, 7, 20, 0.08);
  s.rotations.after = [
    { start: 0, end: duration - 20, player_ids: [...starters] },
    { start: duration - 20, end: duration, player_ids: [3, 4, 5, 6, 7].map(player) }
  ];
  s.disruptions = [disruption('blowout', null, null)];
  s.transfers = [transfer(1, 6, 20, ['blowout']), transfer(2, 7, 20, ['blowout'])];
  return s;
}
function paceChange(league = 'NBA') {
  const s = baseline(league); s.scenario_id = 'synthetic-pace-change-' + league; s.pace.after = 110;
  for (let i = 0; i < 5; i++) s.players[i].opportunities_after = 22;
  return s;
}
function efficiencyChange() {
  const s = baseline(); s.scenario_id = 'synthetic-assumed-efficiency-change';
  s.players[0].efficiency_after = 0.8; return s;
}
function overlappingDisruptions(league = 'NBA') {
  const s = absence(league); s.scenario_id = 'synthetic-overlapping-disruptions-' + league;
  s.disruptions.push(disruption('foul_trouble', 1, 0));
  s.transfers[0].disruption_ids.push('synthetic-foul_trouble'); return s;
}
function overtime(league = 'NBA') {
  const s = baseline(league); s.scenario_id = 'synthetic-overtime-' + league;
  s.rules.ot_periods = 1;
  s.pace.overtime_possessions_before = 10; s.pace.overtime_possessions_after = 10;
  const duration = s.rules.regulation_minutes + 5;
  for (let i = 0; i < 5; i++) {
    s.players[i].minutes_before = duration; s.players[i].minutes_after = duration;
    s.players[i].opportunities_before = 22; s.players[i].opportunities_after = 22;
  }
  s.rotations.before[0].end = duration; s.rotations.after[0].end = duration;
  return s;
}
function intervalCapacity(valid = true) {
  const s = baseline(); s.scenario_id = 'synthetic-interval-capacity-' + (valid ? 'valid' : 'invalid');
  for (let number = 8; number <= 10; number++) {
    const extra = copy(s.players[5]); extra.player_id = player(number); s.players.push(extra);
  }
  for (let index = 0; index < 10; index++) {
    s.players[index].minutes_after = 24;
    s.players[index].usage_after = valid ? 0.1 : index < 5 ? 0.2 : 0;
    s.players[index].opportunities_after = valid ? 10 : index < 5 ? 20 : 0;
  }
  s.rotations.after = [
    { start: 0, end: 24, player_ids: [...starters] },
    { start: 24, end: 48, player_ids: [6, 7, 8, 9, 10].map(player) }
  ];
  s.disruptions = [disruption('rotation', null, null)];
  s.transfers = Array.from({ length: 5 }, (_, index) => transfer(index + 1, index + 6, 24, ['rotation']));
  return s;
}
function overtimeSubstitute() {
  const s = overtime(); s.scenario_id = 'synthetic-overtime-only-substitute';
  s.pace.overtime_possessions_before = 20; s.pace.overtime_possessions_after = 20;
  for (let index = 0; index < 5; index++) {
    s.players[index].opportunities_before = 24; s.players[index].opportunities_after = 24;
  }
  setAfter(s, 1, 48, 0.075); setAfter(s, 6, 5, 0.125);
  s.rotations.after = [
    { start: 0, end: 48, player_ids: [...starters] },
    { start: 48, end: 53, player_ids: [2, 3, 4, 5, 6].map(player) }
  ];
  s.disruptions = [disruption('rotation', null, null)];
  s.transfers = [transfer(1, 6, 5, ['rotation'])];
  return s;
}
const templates = immutable({ NBA: baseline(), WNBA: baseline('WNBA') });
const baseNBA = () => copy(templates.NBA);
const baseWNBA = () => copy(templates.WNBA);
const altered = (build, change) => () => { const s = build(); change(s); return s; };
const cases = immutable([
  { name: 'NBA complete regulation baseline', build: baseNBA, eligible: true },
  { name: 'WNBA complete regulation baseline', build: baseWNBA, eligible: true },
  { name: 'NBA starter absence redistributes once', build: absence, eligible: true },
  { name: 'WNBA starter absence redistributes once', build: () => absence('WNBA'), eligible: true },
  { name: 'NBA absence split across two backups', build: () => absence('NBA', true), eligible: true },
  { name: 'WNBA absence split across two backups', build: () => absence('WNBA', true), eligible: true },
  { name: 'foul trouble cap and explicit replacement', build: foulTrouble, eligible: true },
  { name: 'WNBA foul trouble cap and explicit replacement', build: () => foulTrouble('WNBA'), eligible: true },
  { name: 'blowout transfers two disjoint minute budgets', build: blowout, eligible: true },
  { name: 'WNBA blowout transfers two disjoint minute budgets', build: () => blowout('WNBA'), eligible: true },
  { name: 'pace increases opportunity volume only', build: paceChange, eligible: true },
  { name: 'WNBA pace increases opportunity volume only', build: () => paceChange('WNBA'), eligible: true },
  { name: 'efficiency assumption changes separately', build: efficiencyChange, eligible: true },
  { name: 'overlapping disruptions reuse one minute transfer', build: overlappingDisruptions, eligible: true },
  { name: 'WNBA overlapping disruptions reuse one minute transfer', build: () => overlappingDisruptions('WNBA'), eligible: true },
  { name: 'NBA overtime has explicit possession assumption', build: overtime, eligible: true },
  { name: 'WNBA overtime has explicit possession assumption', build: () => overtime('WNBA'), eligible: true },
  { name: 'wrong NBA regulation duration', build: altered(baseNBA, s => { s.rules.regulation_minutes = 40; }), eligible: false },
  { name: 'six players in a lineup', build: altered(baseNBA, s => { s.rotations.after[0].player_ids.push(player(6)); }), eligible: false },
  { name: 'duplicate lineup identity', build: altered(baseNBA, s => { s.rotations.after[0].player_ids[0] = player(2); }), eligible: false },
  { name: 'rotation gap', build: altered(foulTrouble, s => { s.rotations.after[1].start = 21; }), eligible: false },
  { name: 'rotation overlap', build: altered(foulTrouble, s => { s.rotations.after[1].start = 19; }), eligible: false },
  { name: 'unresolved lineup player', build: altered(baseNBA, s => { s.rotations.after[0].player_ids[0] = 'synthetic-unknown'; }), eligible: false },
  { name: 'negative player minutes', build: altered(baseNBA, s => { s.players[0].minutes_after = -1; }), eligible: false },
  { name: 'minutes beyond elapsed game', build: altered(baseNBA, s => { s.players[0].minutes_after = 49; }), eligible: false },
  { name: 'team minutes are not conserved', build: altered(baseNBA, s => { s.players[0].minutes_after = 47; }), eligible: false },
  { name: 'unavailable player retains volume', build: altered(baseNBA, s => { s.players[0].available_after = false; }), eligible: false },
  { name: 'missing usage assumption remains unknown', build: altered(baseNBA, s => { s.players[0].usage_after = null; }), eligible: false },
  { name: 'missing efficiency remains unknown', build: altered(baseNBA, s => { s.players[0].efficiency_after = null; }), eligible: false },
  { name: 'share outside unit interval', build: altered(baseNBA, s => { s.players[0].usage_after = 1.2; }), eligible: false },
  { name: 'opportunity exceeds uniform exposure budget', build: altered(foulTrouble, s => {
    s.players[0].usage_after = 0.5; s.players[0].opportunities_after = 50;
    s.players[1].usage_after = 0.02; s.players[1].opportunities_after = 2;
    s.players[2].usage_after = 0.02; s.players[2].opportunities_after = 2;
    s.players[3].usage_after = 0.17; s.players[3].opportunities_after = 17;
    s.players[4].usage_after = 0.17; s.players[4].opportunities_after = 17;
  }), eligible: false },
  { name: 'opportunities disagree with possession budget', build: altered(baseNBA, s => { s.players[0].opportunities_after = 21; }), eligible: false },
  { name: 'missing redistribution transfer', build: altered(absence, s => { s.transfers = []; }), eligible: false },
  { name: 'overlapping disruptions double-count transfer', build: altered(overlappingDisruptions, s => {
    const twice = copy(s.transfers[0]); twice.transfer_id = 'synthetic-transfer-double';
    s.transfers.push(twice);
  }), eligible: false },
  { name: 'circular minute flow', build: altered(baseNBA, s => {
    s.disruptions = [disruption('rotation', null, null)];
    s.transfers = [transfer(1, 2, 1, ['rotation']), transfer(2, 1, 1, ['rotation'])];
  }), eligible: false },
  { name: 'unresolved disruption reference', build: altered(absence, s => { s.transfers[0].disruption_ids = ['synthetic-missing']; }), eligible: false },
  { name: 'foul cap contradicts declared rotation', build: altered(foulTrouble, s => { s.disruptions[0].max_minutes_after = 19; }), eligible: false },
  { name: 'absence contradicts available player', build: altered(baseNBA, s => { s.disruptions = [disruption('absence', 1, 0)]; }), eligible: false },
  { name: 'missing pace timing assumption', build: altered(baseNBA, s => { s.assumptions.pace_timing = null; }), eligible: false },
  { name: 'unsupported causal conclusion', build: altered(baseNBA, s => { s.assumptions.causal_claim = true; }), eligible: false },
  { name: 'missing synthetic evidence timestamp', build: altered(baseNBA, s => { s.evidence_at = null; }), eligible: false },
  { name: 'disruption evidence arrives after freeze', build: altered(absence, s => { s.disruptions[0].evidence_at = '2026-10-13T11:00:01Z'; }), eligible: false },
  { name: 'research roster scope exceeds thirty synthetic players', build: altered(baseNBA, s => {
    for (let number = 8; number <= 31; number++) {
      const extra = copy(s.players[5]); extra.player_id = player(number); s.players.push(extra);
    }
  }), eligible: false }
]);

module.exports = Object.freeze({ VERSION, templates, cases, baseNBA, baseWNBA,
  absence, foulTrouble, blowout, paceChange, efficiencyChange, overlappingDisruptions, overtime,
  intervalCapacity, overtimeSubstitute });
