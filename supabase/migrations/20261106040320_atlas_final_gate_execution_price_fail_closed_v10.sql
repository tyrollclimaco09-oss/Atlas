
-- A verified sportsbook quote is necessary, not sufficient; operator approval remains separate.
create or replace function public.atlas_final_gate_quote_is_verified_v10(
 p_execution_price_binding_id uuid,p_checked_at timestamptz)
returns boolean language sql stable security invoker
set search_path = pg_catalog,public
as $guard$
 select exists(
  select 1 from public.atlas_execution_price_bindings epb
  join public.market_snapshots ms on ms.id=epb.market_snapshot_id
  join public.atlas_price_integrity_gate_v1 h on h.quote_id=ms.id
  where epb.id=p_execution_price_binding_id
    and epb.binding_source in ('EXECUTION_GRADE_SNAPSHOT','EXECUTION_GRADE_SNAPSHOT_V2')
    and epb.candidate_key is not null
    and epb.event_id=ms.event_id
    and epb.sportsbook=ms.sportsbook
    and epb.market_type=ms.market_type
    and epb.selection=ms.selection
    and epb.line is not distinct from ms.line
    and epb.price=ms.price
    and epb.decision_cutoff>=p_checked_at
    and ms.execution_grade is true
    and ms.execution_source in ('USER_SPORTSBOOK_SCREENSHOT','CONNECTED_SPORTSBOOK')
    and nullif(btrim(ms.execution_evidence_hash),'') is not null
    and ms.execution_evidence_snapshot_id is not null
    and ms.quote_health='HEALTHY'
    and ms.rules_match_state='MATCH'
    and ms.market_status in ('OPEN','ACTIVE')
    and h.price_integrity_status='ELIGIBLE_FOR_REFERENCE_RESEARCH'
    and ms.retrieved_at is not null
    and ms.retrieved_at between (p_checked_at - interval '5 minutes') and (p_checked_at + interval '30 seconds')
    and ms.retrieved_at<=epb.decision_cutoff
 )
$guard$;
revoke all on function public.atlas_final_gate_quote_is_verified_v10(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.atlas_final_gate_quote_is_verified_v10(uuid,timestamptz) to service_role;

create or replace function public.atlas_final_gate_quote_enforcement_v10()
returns trigger language plpgsql security invoker
set search_path = pg_catalog,public
as $trigger$
begin
 if new.gate_status in ('PASS','READY_FOR_OPERATOR','APPROVED','BET','CLEARED','EXECUTED') then
  if new.executable_price_verified is distinct from true
   or coalesce(public.atlas_final_gate_quote_is_verified_v10(new.execution_price_binding_id,clock_timestamp()),false) is not true
  then
    raise exception 'FINAL_GATE_V10_EXECUTION_PRICE_PROOF_REQUIRED';
  end if;
 end if;
 if new.gate_status in ('APPROVED','BET','CLEARED','EXECUTED') and
 (new.operator_approved_at is null or nullif(btrim(new.operator_approved_by),'') is null or nullif(btrim(new.operator_approval_reference),'') is null)
 then raise exception 'FINAL_GATE_V10_HUMAN_APPROVAL_REQUIRED'; end if;
 if new.gate_status='EXECUTED' and new.execution_receipt_id is null then
   raise exception 'FINAL_GATE_V10_EXECUTION_RECEIPT_REQUIRED';
 end if;
 return new;
end
$trigger$;
revoke all on function public.atlas_final_gate_quote_enforcement_v10() from public,anon,authenticated;
drop trigger if exists atlas_final_gate_quote_enforcement_v10 on public.final_gate_checks;
create trigger atlas_final_gate_quote_enforcement_v10
before insert or update on public.final_gate_checks
for each row execute function public.atlas_final_gate_quote_enforcement_v10();

-- Patch existing canonical preparation: a weak VERIFY price can no longer turn into READY.

CREATE OR REPLACE FUNCTION public.atlas_prepare_final_gate_v2(p_candidate_key text, p_execution_price_binding_id uuid, p_approved_stake numeric, p_stop_price numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'atlas_private', 'extensions'
AS $function$
declare
  c record;
  bnd record;
  risk record;
  st record;
  v_market_valid boolean:=false;
  v_exposure_valid boolean:=false;
  v_ready boolean:=false;
  v_failures jsonb:='[]'::jsonb;
  v_gate_id uuid;
  v_unresolved integer:=0;
  v_critical_claims integer:=0;
  v_critical_primary integer:=0;
  v_checked timestamptz:=clock_timestamp();
begin
  if p_approved_stake is null or p_approved_stake<=0 then
    raise exception 'Final Gate requires positive approved stake.';
  end if;

  select * into c
  from public.candidate_spine_trace
  where candidate_key=p_candidate_key
  limit 1;

  if c.id is null then raise exception 'Unknown candidate_key: %',p_candidate_key; end if;
  if c.tactician_id is null then raise exception 'Final Gate preparation requires tactician_id.'; end if;
  if c.truth_label is distinct from 'POINT_IN_TIME_VERIFIED' then
    raise exception 'Final Gate preparation requires POINT_IN_TIME_VERIFIED truth label.';
  end if;
  if c.decision_cutoff is null then raise exception 'Final Gate preparation requires decision_cutoff.'; end if;
  if v_checked>c.decision_cutoff then raise exception 'Final Gate preparation after decision cutoff.'; end if;

  select * into st
  from public.state_snapshots
  where event_id=c.event_id
    and state_version=c.state_version
    and is_current=true
    and invalidated_at is null
  order by created_at desc,id desc
  limit 1;

  if st.id is null or st.decision_cutoff is distinct from c.decision_cutoff then
    raise exception 'Final Gate preparation requires current canonical state.';
  end if;

  select epb.*,pig.price_integrity_status
    into bnd
  from public.atlas_execution_price_bindings epb
  left join public.atlas_price_integrity_gate_v1 pig on pig.quote_id=epb.market_snapshot_id
  where epb.id=p_execution_price_binding_id;

  if bnd.id is null then raise exception 'Unknown execution price binding.'; end if;
  if bnd.candidate_key is distinct from p_candidate_key
     or bnd.event_id is distinct from c.event_id
     or bnd.state_version is distinct from c.state_version
     or bnd.decision_cutoff is distinct from c.decision_cutoff then
    raise exception 'Execution binding does not match candidate identity/state/cutoff.';
  end if;

  v_market_valid:=public.atlas_final_gate_quote_is_verified_v10(p_execution_price_binding_id,v_checked);

  if c.tactician_risk_proof_id is not null then
    select * into risk
    from public.atlas_tactician_risk_proofs
    where id=c.tactician_risk_proof_id;

    v_exposure_valid:=
      risk.id is not null
      and risk.proof_status='PASS'
      and risk.candidate_key=p_candidate_key
      and risk.state_version=c.state_version
      and risk.execution_price_binding_id=p_execution_price_binding_id
      and p_approved_stake<=risk.proposed_stake;
  end if;

  v_unresolved:=jsonb_array_length(coalesce(c.unresolved_information_flags,'[]'::jsonb));

  select count(*) into v_critical_claims
  from public.evidence_lineage el
  where el.candidate_key=p_candidate_key
    and el.claim_type in ('LINEUP','INACTIVE','STARTER','SETTLEMENT_RULE');

  select count(*) into v_critical_primary
  from public.evidence_lineage el
  where el.candidate_key=p_candidate_key
    and el.claim_type in ('LINEUP','INACTIVE','STARTER','SETTLEMENT_RULE')
    and el.source_tier='PRIMARY'
    and el.verification_state in ('CONFIRMED','CORROBORATED')
    and coalesce(el.observed_at,el.created_at)<=c.decision_cutoff;

  if not coalesce(c.oracle_independent,false) then
    v_failures:=v_failures||jsonb_build_array('ORACLE_INDEPENDENCE_NOT_PROVEN');
  end if;
  if not coalesce(c.sentinel_valid,false) then
    v_failures:=v_failures||jsonb_build_array('SENTINEL_NOT_VALID');
  end if;
  if not coalesce(c.provenance_valid,false) then
    v_failures:=v_failures||jsonb_build_array('PROVENANCE_NOT_VALID');
  end if;
  if not coalesce(c.state_valid,false) then
    v_failures:=v_failures||jsonb_build_array('STATE_NOT_VALID');
  end if;
  if c.decision_id is null then
    v_failures:=v_failures||jsonb_build_array('MISSING_DECISION');
  end if;
  if not v_market_valid then
    v_failures:=v_failures||jsonb_build_array('PRICE_INTEGRITY_BLOCK');
  end if;
  if not v_exposure_valid then
    v_failures:=v_failures||jsonb_build_array('TACTICIAN_RISK_PROOF_NOT_VALID');
  end if;
  if v_unresolved>0 then
    v_failures:=v_failures||jsonb_build_array('UNRESOLVED_INFORMATION');
  end if;
  if v_critical_claims>0 and v_critical_primary=0 then
    v_failures:=v_failures||jsonb_build_array('OFFICIAL_SOURCE_CONFIRMATION_MISSING');
  end if;
  if c.expires_at is not null and c.expires_at<=v_checked then
    v_failures:=v_failures||jsonb_build_array('CANDIDATE_EXPIRED');
  end if;

  v_ready:=jsonb_array_length(v_failures)=0;

  insert into public.final_gate_checks(
    tactician_id,event_id,gate_status,decision_id,checked_at,evidence_cutoff,
    market_state_valid,sentinel_valid,provenance_valid,exposure_valid,rationale,
    state_sync_at,gate_started_at,state_freshness_seconds,market_snapshot_at,
    race_status,state_version,exposure_snapshot,external_intel_used,decision_cutoff,
    tactician_risk_proof_id,execution_price_binding_id,executable_price_verified,
    invariant_status,invariant_failures,approved_stake,stop_price
  ) values (
    c.tactician_id,c.event_id,
    case when v_ready then 'READY_FOR_OPERATOR' else 'BLOCKED' end,
    c.decision_id,v_checked,c.decision_cutoff,
    v_market_valid,coalesce(c.sentinel_valid,false),coalesce(c.provenance_valid,false),v_exposure_valid,
    case when v_ready
      then 'Machine-checkable preconditions passed; human Final Gate remains mandatory.'
      else 'Blocked by one or more machine-checkable preconditions.' end,
    st.captured_at,v_checked,
    greatest(0,floor(extract(epoch from (v_checked-st.captured_at)))::integer),
    bnd.retrieved_at,
    case when v_ready then 'CLEAR' else 'UNTESTED' end,
    coalesce(c.state_version,0),
    case when risk.id is null then '{}'::jsonb else to_jsonb(risk) end,
    false,c.decision_cutoff,c.tactician_risk_proof_id,
    p_execution_price_binding_id,v_market_valid,
    case when v_ready then 'PASS' else 'FAIL' end,
    v_failures,p_approved_stake,p_stop_price
  )
  returning id into v_gate_id;

  update public.candidate_spine_trace
     set final_gate_id=v_gate_id,
         lifecycle_status=case when v_ready then 'BET_READY' else lifecycle_status end,
         next_action=case when v_ready then 'OPERATOR_FINAL_GATE_REVIEW'
                          else 'RESOLVE_FINAL_GATE_BLOCKERS' end,
         updated_at=clock_timestamp()
   where id=c.id;

  return v_gate_id;
end;
$function$
;
