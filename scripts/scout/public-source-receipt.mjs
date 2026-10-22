const SHAS=/^[a-f0-9]{64}$/;
const ALLOWED=Object.freeze({
 NFL:'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv',
 MLB:'https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=2026-10-19',
 NHL:'https://api-web.nhle.com/v1/score/2026-10-19',
});
const SCOPE='REAL_INPUT_TO_DEPLOYED_CODE_SNAPSHOT_NOT_EDGE_INVOCATION';
export function validateSourceProof(p){
  if(!p||p.schema!=='atlas.public-source-proof.v1'||p.scope!=='PUBLIC_UPSTREAM_ONLY_NOT_DEPLOYED_EDGE'||
    p.production_authority!==false||p.external_edge_invoked!==false||
    p.database_written!==false||p.paid_odds_requests!==0||
    !Array.isArray(p.observations)||p.observations.length!==3||
    (p.run_id!==null && !/^[0-9]{5,20}$/.test(p.run_id)))throw Error('PUBLIC_RECEIPT_CONTRACT');
  const seen=new Set();
  for(const o of p.observations){
    if(!Object.hasOwn(ALLOWED,o.sport)||seen.has(o.sport)||o.source_url!==ALLOWED[o.sport]||
      o.proof_scope!==SCOPE||o.upstream_published_at!==null||
      !SHAS.test(o.upstream_sha256)||!SHAS.test(o.normalizer_sha256)||
      !Number.isSafeInteger(o.records)||o.records<1||o.records>200||
      typeof o.example_id!=='string'||o.example_id.length<3||
      typeof o.observed_at_utc!=='string'||!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(o.observed_at_utc)||
      !Number.isFinite(Date.parse(o.observed_at_utc)))throw Error('INVALID_UPSTREAM_OBSERVATION');
    if(o.sport==='NFL' && (o.week!==7||o.records>18))throw Error('NFL_SCOPE_CHANGED');
    if(o.sport!=='NFL' && o.date!=='2026-10-19')throw Error('HISTORICAL_SOURCE_SCOPE_CHANGED');
    seen.add(o.sport);
  }
  return Object.freeze(p);
}