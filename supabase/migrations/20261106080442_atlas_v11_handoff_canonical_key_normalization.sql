create or replace view public.atlas_slate_native_handoff_v11 with (security_invoker=true) as
 SELECT r.run_key,
    r.slate_date,
    r.league,
    j.game ->> 'source_event_id'::text AS source_event_id,
    j.game ->> 'away'::text AS away_team,
    j.game ->> 'home'::text AS home_team,
    (j.game ->> 'start_utc'::text)::timestamp with time zone AS start_at,
        CASE
            WHEN e.match_count = 1 THEN e.event_id
            ELSE NULL::uuid
        END AS canonical_event_id,
    COALESCE(c.native_candidate_count, 0::bigint)::integer AS native_candidate_count,
    COALESCE(o.oracle_pass_count, 0::bigint)::integer AS independent_oracle_proof_count,
    COALESCE(x.edge_resolved_count, 0::bigint)::integer AS resolved_edge_thief_count,
    COALESCE(p.execution_quote_count, 0::bigint)::integer AS fresh_execution_grade_quote_count,
    COALESCE(f.native_ready_count, 0::bigint)::integer AS native_ready_gate_count,
        CASE
            WHEN e.match_count <> 1 THEN 'CANONICAL_EVENT_REQUIRES_VERIFICATION'::text
            WHEN COALESCE(c.native_candidate_count, 0::bigint) = 0 THEN 'NO_NATIVE_CANDIDATE'::text
            ELSE 'PROOF_INCOMPLETE'::text
        END AS handoff_status,
    array_remove(ARRAY[
        CASE
            WHEN e.match_count = 0 THEN 'CANONICAL_EVENT_NOT_REGISTERED'::text
            WHEN e.match_count > 1 THEN 'CANONICAL_EVENT_AMBIGUOUS'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(c.native_candidate_count, 0::bigint) = 0 THEN 'NATIVE_MARKET_CANDIDATE_MISSING'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(o.oracle_pass_count, 0::bigint) = 0 THEN 'INDEPENDENT_ORACLE_PROOF_MISSING'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(x.edge_resolved_count, 0::bigint) = 0 THEN 'RESOLVED_EDGE_THIEF_CHALLENGE_MISSING'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(p.execution_quote_count, 0::bigint) = 0 THEN 'FRESH_EXECUTION_GRADE_QUOTE_MISSING'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(f.native_ready_count, 0::bigint) = 0 THEN 'NATIVE_FINAL_GATE_NOT_READY'::text
            ELSE NULL::text
        END, 'OFFICIAL_ROSTER_AVAILABILITY_NOT_CERTIFIED'::text], NULL::text) AS evidence_gaps,
    false AS execution_authority,
    false AS model_production_authority,
    true AS human_final_gate_required
   FROM atlas_slate_research_runs_v10 r
     CROSS JOIN LATERAL jsonb_array_elements(r.event_manifest) j(game)
     LEFT JOIN LATERAL ( SELECT count(*) AS match_count,
            max(ev.id::text)::uuid AS event_id
           FROM events ev
          WHERE upper(ev.league) = upper(r.league) AND ev.canonical_key = (upper(r.league) || ':' || r.slate_date::text || ':' || (j.game ->> 'away'::text) || '@' || (j.game ->> 'home'::text)) AND lower(ev.sport) = 'basketball' AND ev.start_time = ((j.game ->> 'start_utc'::text)::timestamp with time zone) AND ev.event_date = r.slate_date) e ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS native_candidate_count
           FROM candidate_spine_trace t
          WHERE t.event_id = e.event_id AND t.decision_cutoff > now()) c ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS oracle_pass_count
           FROM atlas_oracle_independence_proofs op
          WHERE op.event_id = e.event_id AND op.proof_status = 'PASS'::text AND op.decision_cutoff > now()) o ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS edge_resolved_count
           FROM edge_thief_shadow et
          WHERE et.event_id = e.event_id AND (et.challenge_status = ANY (ARRAY['CLEARED'::text, 'RESOLVED'::text, 'NO_OBJECTION'::text])) AND et.evidence_cutoff <= now()) x ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS execution_quote_count
           FROM market_snapshots ms
          WHERE ms.event_id = e.event_id AND ms.execution_grade = true AND (ms.execution_source = ANY (ARRAY['USER_SPORTSBOOK_SCREENSHOT'::text, 'CONNECTED_SPORTSBOOK'::text])) AND ms.quote_health = 'HEALTHY'::text AND ms.rules_match_state = 'MATCH'::text AND (ms.market_status = ANY (ARRAY['OPEN'::text, 'ACTIVE'::text])) AND ms.retrieved_at >= (now() - '00:05:00'::interval) AND ms.retrieved_at <= now()) p ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS native_ready_count
           FROM final_gate_checks fg
          WHERE fg.event_id = e.event_id AND fg.gate_status = 'READY_FOR_OPERATOR'::text AND fg.executable_price_verified = true AND fg.checked_at >= (now() - '00:05:00'::interval) AND fg.checked_at <= now()) f ON true;
