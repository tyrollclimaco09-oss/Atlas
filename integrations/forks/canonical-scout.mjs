/**
 * ATLAS SCOUT forked-source lab: consume the *actual schema* emitted by the
 * forked sports-skills canonical NBA adapter, plus optional nba_api static
 * reference identities. NO provider fetches, database writes, bets or claims
 * that a Machina provider-scoped surrogate equals an ATLAS event UUID.
 */
export const CONTRACT="ATLAS_FORK_SCOUT_LAB_V1";
const ALLOWED_SOURCE="sports-skills/espn";
const iso=s=>typeof s==="string"&&Number.isFinite(Date.parse(s));
const name=s=>typeof s==="string"&&s.length>0&&s.length<=100&& !/[\u0000-\u001f<>]/.test(s);
const sha=s=>typeof s==="string"&&/^[0-9a-f]{40}$/i.test(s);
const fail=reason=>({contract:CONTRACT,status:"QUARANTINED",reason,
  stage:"FILTER_VERIFY",execution_authority:false,canonical_event_id:null,approved_bet:null});
export function ingestCanonicalNBA(document,{
  forkCommit,observedAt,teamReference=null,now=new Date().toISOString()
}={}){
  if(!sha(forkCommit)||!iso(observedAt)||!iso(now))return fail("SOURCE_PROVENANCE_INVALID");
  const core=document?.machina_sports_schema;
  if(!core||core.schema_version!=="machina-sports-schema/1"||
    core.profile!=="machina-iptc-profile/1.2")return fail("SCHEMA_CONTRACT_INVALID");
  const rights=core.rights,prov=core.provenance,e=core.event_view;
  if(!rights||rights.data_class!=="open-public"||
    rights.prototype_only!==true||rights.commercial_use!==false||
    prov?.rights?.prototype_only!==true||prov?.rights?.commercial_use!==false)
    return fail("RIGHTS_UNASSERTED_OR_NOT_RESEARCH_ONLY");
  if(prov?.provider?.namespace!==ALLOWED_SOURCE||
    prov?.adapter?.name!=="sports_skills.canonical.adapters.nba"||
    prov.observed_at!==observedAt||
    !Array.isArray(prov.source_refs)||!prov.source_refs.length)
    return fail("ORIGIN_OR_OBSERVATION_MISMATCH");
  if(e?.sport!=="basketball"||
    typeof e.event_id!=="string"||!e.event_id.startsWith("urn:machina:sports:event:")||
    !Array.isArray(core.provider_ids)||
    !core.provider_ids.some(x=>x.entity_type==="event"&&x.machina_id===e.event_id&&
      x.provider_namespace===ALLOWED_SOURCE&&x.resolution_method==="provider-native"&&
      typeof x.provider_id==="string"&&x.provider_id.length>0))
    return fail("PROVIDER_EVENT_ID_INVALID");
  const eventBinding=core.provider_ids.find(x=>x.entity_type==="event"&&x.machina_id===e.event_id&&x.provider_namespace===ALLOWED_SOURCE);
  const temporal=e.temporal_evidence;
  if(temporal?.kind!=="start"||temporal.precision!=="minute"||
    !iso(temporal.lower_inclusive)||!iso(temporal.upper_exclusive)||
    Date.parse(temporal.upper_exclusive)-Date.parse(temporal.lower_inclusive)!==60000||
    Date.parse(temporal.lower_inclusive)>Date.parse(observedAt)+60000||
    Date.parse(observedAt)>Date.parse(now)+60000)
    return fail("TEMPORAL_EVIDENCE_INVALID");
  const participants=e.participants;
  if(!Array.isArray(participants)||participants.length!==2||
    !participants.every(x=>(x.role==="home"||x.role==="away")&&name(x.name))||
    participants.filter(x=>x.role==="home").length!==1)
    return fail("PARTICIPANTS_INVALID");
  if(!core.capabilities||!Array.isArray(core.capabilities.present)||
    !Array.isArray(core.capabilities.absent))return fail("CAPABILITY_MATRIX_MISSING");
  const mapped=[];
  for(const p of participants){
    const row=Array.isArray(teamReference)?teamReference.filter(t=>t&&t.full_name===p.name&&
      Number.isInteger(t.id)&&t.id>0):[];
    const unique=row.length===1;
    mapped.push({role:p.role,team_name:p.name,
      nba_static_id:unique?row[0].id:null,nba_identity_state:unique?"OFFLINE_STATIC_MATCH":"UNRESOLVED"});
  }
  // The forked team reference does NOT independently validate professional
  // playing status, current rosters, or an ATLAS canonical event relation.
  return {
    contract:CONTRACT,mode:"HISTORICAL_RESEARCH_ONLY",status:"SCOUT_REFERENCE",
    source:{fork:"tyrollclimaco09-oss/sports-skills",fork_commit:forkCommit,
      provider_namespace:ALLOWED_SOURCE,observed_at:observedAt,
      upstream_sport_schema_version:core.schema_version,profile:core.profile},
    event:{provider_native_id:eventBinding.provider_id,machina_surrogate_id:e.event_id,
      event_status:typeof e.status==="string"?e.status:null,
      start_interval:{lower_inclusive:temporal.lower_inclusive,upper_exclusive:temporal.upper_exclusive,
        precision:"minute"},teams:mapped},
    evidence_boundary:{
      rights:{data_class:"open-public",prototype_only:true,commercial_use:false},
      capability_present:core.capabilities.present.filter(x=>typeof x==="string").slice(0,60),
      capability_absent:core.capabilities.absent.filter(x=>typeof x==="string").slice(0,60),
      independent_professional_verification:false,
      historical_reference_only:true,raw_provider_payload_copied:false,
      requires_exact_atlas_event_reconciliation:true
    },
    stage:"SCOUT",canonical_event_id:null,execution_authority:false,
    approved_bet:null,independent_fair_probability:null,expected_value:null,production_writes:0
  };
}
