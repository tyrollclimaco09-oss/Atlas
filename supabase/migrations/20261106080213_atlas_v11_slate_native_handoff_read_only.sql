
-- ATLAS V11: read-only native candidate preflight mapped to the existing V10 slate.
-- Never creates a fake event, price, candidate, model forecast or Final Gate approval.
create view public.atlas_slate_native_handoff_v11
with (security_invoker=true)
as
select
  r.run_key,
  r.slate_date,
  r.league,
  j.game->>'source_event_id' as source_event_id,
  j.game->>'away' as away_team,
  j.game->>'home' as home_team,
  (j.game->>'start_utc')::timestamptz as start_at,
  case when e.match_count=1 then e.event_id else null end as canonical_event_id,
  coalesce(c.native_candidate_count,0)::int as native_candidate_count,
  coalesce(o.oracle_pass_count,0)::int as independent_oracle_proof_count,
  coalesce(x.edge_resolved_count,0)::int as resolved_edge_thief_count,
  coalesce(p.execution_quote_count,0)::int as fresh_execution_grade_quote_count,
  coalesce(f.native_ready_count,0)::int as native_ready_gate_count,
  case
    when e.match_count<>1 then 'CANONICAL_EVENT_REQUIRES_VERIFICATION'
    when coalesce(c.native_candidate_count,0)=0 then 'NO_NATIVE_CANDIDATE'
    else 'PROOF_INCOMPLETE'
  end as handoff_status,
  (array_remove(array[
    case when e.match_count=0 then 'CANONICAL_EVENT_NOT_REGISTERED'::text
         when e.match_count>1 then 'CANONICAL_EVENT_AMBIGUOUS'::text end,
    case when coalesce(c.native_candidate_count,0)=0 then 'NATIVE_MARKET_CANDIDATE_MISSING'::text end,
    case when coalesce(o.oracle_pass_count,0)=0 then 'INDEPENDENT_ORACLE_PROOF_MISSING'::text end,
    case when coalesce(x.edge_resolved_count,0)=0 then 'RESOLVED_EDGE_THIEF_CHALLENGE_MISSING'::text end,
    case when coalesce(p.execution_quote_count,0)=0 then 'FRESH_EXECUTION_GRADE_QUOTE_MISSING'::text end,
    case when coalesce(f.native_ready_count,0)=0 then 'NATIVE_FINAL_GATE_NOT_READY'::text end,
    'OFFICIAL_ROSTER_AVAILABILITY_NOT_CERTIFIED'::text
  ],null)) as evidence_gaps,
  false as execution_authority,
  false as model_production_authority,
  true as human_final_gate_required
from public.atlas_slate_research_runs_v10 r
cross join lateral jsonb_array_elements(r.event_manifest) as j(game)
left join lateral (
  select count(*) match_count,max(ev.id::text)::uuid event_id
  from public.events ev
  where upper(ev.league)=upper(r.league)
    and lower(ev.home_team)=lower(j.game->>'home')
    and lower(ev.away_team)=lower(j.game->>'away')
    and ev.start_time=(j.game->>'start_utc')::timestamptz
    and ev.event_date=r.slate_date
) e on true
left join lateral (
 select count(*) native_candidate_count from public.candidate_spine_trace t
 where t.event_id=e.event_id and t.decision_cutoff>now()
) c on true
left join lateral (
 select count(*) oracle_pass_count from public.atlas_oracle_independence_proofs op
 where op.event_id=e.event_id and op.proof_status='PASS' and op.decision_cutoff>now()
) o on true
left join lateral (
 select count(*) edge_resolved_count from public.edge_thief_shadow et
 where et.event_id=e.event_id and et.challenge_status in ('CLEARED','RESOLVED','NO_OBJECTION')
   and et.evidence_cutoff<=now()
) x on true
left join lateral (
 select count(*) execution_quote_count from public.market_snapshots ms
 where ms.event_id=e.event_id and ms.execution_grade=true
 and ms.execution_source in ('USER_SPORTSBOOK_SCREENSHOT','CONNECTED_SPORTSBOOK')
 and ms.quote_health='HEALTHY' and ms.rules_match_state='MATCH'
 and ms.market_status in ('OPEN','ACTIVE')
 and ms.retrieved_at between now()-interval '5 minutes' and now()
) p on true
left join lateral (
 select count(*) native_ready_count from public.final_gate_checks fg
 where fg.event_id=e.event_id and fg.gate_status='READY_FOR_OPERATOR'
   and fg.executable_price_verified=true
   and fg.checked_at between now()-interval '5 minutes' and now()
) f on true;

revoke all on public.atlas_slate_native_handoff_v11 from public,anon,authenticated;
grant select on public.atlas_slate_native_handoff_v11 to service_role;
