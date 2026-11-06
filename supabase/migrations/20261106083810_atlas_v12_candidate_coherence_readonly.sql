
-- ATLAS V12: a candidate must pass all required proofs for the SAME market/selection/state.
-- This is read-only research diagnostics, not an autonomous approval or a betting API.
create view public.atlas_slate_candidate_coherence_v12
with (security_invoker=true) as
select
  h.*,
  coalesce(c.coherent_duo_count,0)::int as coherent_duo_candidate_count,
  coalesce(c.operator_review_count,0)::int as fully_proven_operator_review_count,
  case
    when h.canonical_event_id is null then 'EVENT_NOT_RECONCILED'
    when h.native_candidate_count=0 then 'NATIVE_MARKET_INTAKE_PENDING'
    when coalesce(c.coherent_duo_count,0)=0 then 'DUO_PROOFS_NOT_ALIGNED'
    when coalesce(c.operator_review_count,0)=0 then 'FULL_NATIVE_PRICE_RISK_GATE_NOT_PROVEN'
    else 'OPERATOR_REVIEW_REQUIRES_LIVE_AUTH_CONFIRMATION'
  end as coherent_handoff_status,
  false as coherent_handoff_execution_authority
from public.atlas_slate_native_handoff_v11 h
left join lateral (
 select
   count(*) filter (where q.duo_ok) as coherent_duo_count,
   count(*) filter (where q.duo_ok and q.risk_ok and q.price_ok and q.gate_ok) as operator_review_count
 from (
  select t.candidate_key,
   (
     t.oracle_independent is true and t.provenance_valid is true and t.state_valid is true
     and exists (
       select 1 from public.atlas_oracle_independence_proofs op
       where op.candidate_key=t.candidate_key and op.event_id=t.event_id
         and op.state_version=t.state_version
         and op.proof_status='PASS' and op.independent_evidence_groups>=2
         and op.decision_cutoff=t.decision_cutoff
     )
     and exists (
       select 1 from public.edge_thief_shadow et
       where et.candidate_key=t.candidate_key and et.event_id=t.event_id
         and et.state_version=t.state_version
         and et.challenge_status in ('CLEARED','RESOLVED','NO_OBJECTION')
         and et.evidence_cutoff<=t.decision_cutoff
     )
     and not exists (
       select 1 from public.edge_thief_shadow et
       where et.candidate_key=t.candidate_key and et.event_id=t.event_id
         and et.state_version=t.state_version
         and (et.challenge_status not in ('CLEARED','RESOLVED','NO_OBJECTION')
              or et.challenge_status is null or et.evidence_cutoff>t.decision_cutoff)
     )
   ) as duo_ok,
   (
     t.sentinel_valid is true
     and exists(
       select 1 from public.atlas_sentinel_validity_proofs sp
       where sp.candidate_key=t.candidate_key and sp.event_id=t.event_id
         and sp.state_version=t.state_version
         and sp.proof_status='PASS'
         and sp.decision_cutoff<=t.decision_cutoff
     )
     and exists(
       select 1 from public.atlas_tactician_risk_proofs tr
       where tr.candidate_key=t.candidate_key and tr.event_id=t.event_id
         and tr.state_version=t.state_version
         and tr.proof_status='PASS'
         and tr.decision_cutoff<=t.decision_cutoff
     )
     and exists(
       select 1 from public.atlas_kairos_arbitrations kr
       where kr.candidate_key=t.candidate_key and kr.event_id=t.event_id
         and kr.state_version=t.state_version
         and kr.decision_cutoff<=t.decision_cutoff
     )
   ) as risk_ok,
   exists(
     select 1 from public.atlas_execution_price_bindings epb
     where epb.candidate_key=t.candidate_key and epb.event_id=t.event_id
       and epb.state_version=t.state_version
       and public.atlas_final_gate_quote_is_verified_v10(epb.id,now())
   ) as price_ok,
   exists(
     select 1 from public.final_gate_checks fg
     where fg.id=t.final_gate_id and fg.event_id=t.event_id
       and fg.state_version=t.state_version
       and fg.gate_status='READY_FOR_OPERATOR'
       and fg.executable_price_verified is true
       and fg.invariant_status='PASS'
       and fg.checked_at between now()-interval '5 minutes' and now()
       and public.atlas_final_gate_quote_is_verified_v10(fg.execution_price_binding_id,fg.checked_at)
   ) as gate_ok
  from public.candidate_spine_trace t
  where t.event_id=h.canonical_event_id
    and t.decision_cutoff>now()
    and (t.expires_at is null or t.expires_at>now())
 ) q
) c on true;

revoke all on public.atlas_slate_candidate_coherence_v12 from public,anon,authenticated;
grant select on public.atlas_slate_candidate_coherence_v12 to service_role;
