-- ATLAS SHADOW — export ONE actually preregistered, frozen cohort as a read-only
-- JSON evidence packet. No schema changes, repairs, simulated results or authority.
-- To use another cohort, replace ONLY the exact manifest receipt key below.
-- Unattested official outcomes, market identities and sportsbook prices remain [].
WITH manifest AS (
 SELECT payload,receipt_key,evidence_observed_at
 FROM public.atlas_slate_node_receipts_v10
 WHERE receipt_key='ATLAS-NFL-BUFMIN-20261109-COHORT-PREREG-FROZEN-V1'
 AND payload->>'type'='atlas_forecast_holdout_cohort_manifest_v1'
 AND NOT production_authority AND NOT real_betting_authority
),
experiment AS (
 SELECT e.* FROM public.atlas_shadow_experiment_registry_v2 e
 JOIN manifest m ON e.experiment_id::text=m.payload->>'experiment_id'
 WHERE NOT e.production_authority
),
frozen AS (
 SELECT o.id AS observation_id,o.experiment_id,o.candidate_key,o.event_id,
 o.observed_at,o.baseline_output,o.experimental_output,
 p.prediction_id,p.sport,p.model_key,p.predicted_probability,p.frozen_at,
 p.event_start_at,p.market_family,p.market_price,p.root_tags,
 s.receipt_key AS source_receipt,s.evidence_observed_at AS source_observed_at,
 (coalesce((s.payload->>'source_price_independent_features')::boolean,false)
   AND s.evidence_observed_at<=p.frozen_at AND p.market_price IS NULL
   AND p.frozen_at < p.event_start_at) AS independent_inputs_verified
 FROM public.atlas_shadow_experiment_observations_v2 o
 JOIN experiment e ON e.experiment_id=o.experiment_id
 JOIN manifest m ON (m.payload->'frozen_case_keys') ? o.candidate_key
 JOIN public.atlas_prospective_prediction_freeze_v1 p
   ON p.candidate_key=o.candidate_key AND p.event_id=o.event_id
 LEFT JOIN public.atlas_slate_node_receipts_v10 s
   ON s.receipt_key=p.root_tags->>'source_receipt'
 WHERE NOT p.production_authority AND NOT o.production_influence
),
attested_identities AS (
 SELECT jsonb_build_object(
 'candidate_key',f.candidate_key,'event_id',f.event_id::text,
 'market_id',r.payload->>'market_id',
 'verified_current_team',r.payload->'verified_current_team',
 'verified_event_teams',r.payload->'verified_event_teams',
 'verified_market_identity',r.payload->'verified_market_identity',
 'verified_settlement_rules',r.payload->'verified_settlement_rules',
 'source_uri',r.evidence_source,'source_observed_at',r.evidence_observed_at) AS item
 FROM frozen f JOIN public.atlas_slate_node_receipts_v10 r ON r.candidate_key=f.candidate_key
 WHERE r.payload->>'type'='atlas_canonical_market_identity_attestation_v1'
 AND r.payload->>'event_id'=f.event_id::text
 AND r.payload->>'source_authenticated'='true'
 AND r.evidence_observed_at<=f.frozen_at
 AND NOT r.production_authority
),
attested_results AS (
 SELECT jsonb_build_object(
 'candidate_key',f.candidate_key,'event_id',f.event_id::text,
 'market_id',r.payload->>'market_id',
 'binary_outcome',r.payload->'binary_outcome',
 'verified_official_source',r.payload->'verified_official_source',
 'source_uri',r.evidence_source,'observed_at',r.evidence_observed_at,
 'invalid_market',coalesce(r.payload->'invalid_market','false'::jsonb),
 'void_or_push',coalesce(r.payload->'void_or_push','false'::jsonb)) AS item
 FROM frozen f JOIN public.atlas_slate_node_receipts_v10 r ON r.candidate_key=f.candidate_key
 WHERE r.payload->>'type'='atlas_official_binary_outcome_v1'
 AND r.payload->>'event_id'=f.event_id::text
 AND r.payload->>'verified_official_source'='true'
 AND r.evidence_observed_at>f.event_start_at
 AND NOT r.production_authority
),
attested_quotes AS (
 SELECT jsonb_build_object(
 'candidate_key',f.candidate_key,'event_id',f.event_id::text,
 'market_id',r.payload->>'market_id',
 'verified_exact_book_quote',r.payload->'verified_exact_book_quote',
 'book',r.payload->>'book','provider_market_id',r.payload->>'provider_market_id',
 'source_uri',r.evidence_source,'observed_at',r.evidence_observed_at,
 'synthetic_combination',coalesce(r.payload->'synthetic_combination','false'::jsonb),
 'odds_decimal',r.payload->'odds_decimal',
 'virtual_stake',r.payload->'virtual_stake') AS item
 FROM frozen f JOIN public.atlas_slate_node_receipts_v10 r ON r.candidate_key=f.candidate_key
 WHERE r.payload->>'type'='atlas_native_book_quote_v1'
 AND r.payload->>'event_id'=f.event_id::text
 AND r.payload->>'verified_exact_book_quote'='true'
 AND r.evidence_observed_at>f.frozen_at AND r.evidence_observed_at<f.event_start_at
 AND NOT r.production_authority
)
SELECT jsonb_build_object(
 'experiment',(SELECT jsonb_build_object('experiment_id',e.experiment_id::text,
 'experiment_key',e.experiment_key) FROM experiment e LIMIT 1),
 'frozen_cohort',(SELECT jsonb_build_object(
  'model_version',m.payload->>'model_version',
  'baseline_id',m.payload->>'baseline_id',
  'frozen_cohort_id',m.payload->>'frozen_cohort_id',
  'training_cutoff',m.payload->>'training_data_cutoff_at',
  'holdout_start',m.payload->>'holdout_start',
  'hypothesis',m.payload->>'hypothesis',
  'out_of_time_holdout',true,
  'frozen_case_count',(m.payload->>'frozen_case_count')::int,
  'independent_model_inputs_verified',
     (SELECT count(*)>0 AND bool_and(independent_inputs_verified) FROM frozen)
 ) FROM manifest m LIMIT 1),
 'observations',coalesce((SELECT jsonb_agg(jsonb_build_object(
  'experiment_id',f.experiment_id::text,'candidate_key',f.candidate_key,
  'event_id',f.event_id::text,'observed_at',f.observed_at,
  'baseline_output',f.baseline_output,'experimental_output',f.experimental_output)
  ORDER BY f.candidate_key) FROM frozen f),'[]'::jsonb),
 'predictions',coalesce((SELECT jsonb_agg(jsonb_build_object(
  'candidate_key',f.candidate_key,'event_id',f.event_id::text,'sport',f.sport,
  'model_key',f.model_key,'predicted_probability',f.predicted_probability,
  'frozen_at',f.frozen_at,'features_observed_at',f.source_observed_at,
  'event_start_at',f.event_start_at,'independent_inputs_verified',f.independent_inputs_verified,
  'root_tags',f.root_tags) ORDER BY f.candidate_key) FROM frozen f),'[]'::jsonb),
 'identities',coalesce((SELECT jsonb_agg(item) FROM attested_identities),'[]'::jsonb),
 'official_outcomes',coalesce((SELECT jsonb_agg(item) FROM attested_results),'[]'::jsonb),
 'quotes',coalesce((SELECT jsonb_agg(item) FROM attested_quotes),'[]'::jsonb),
 'policy',jsonb_build_object('minCases',120,'minDays',21),
 'export_audit',jsonb_build_object(
    'export_is_read_only',true,
    'canonical_frozen_cases',(SELECT count(*) FROM frozen),
    'source_receipt_matched',(SELECT count(*) FROM frozen WHERE source_receipt IS NOT NULL),
    'official_outcome_count',(SELECT count(*) FROM attested_results),
    'attested_identity_count',(SELECT count(*) FROM attested_identities),
    'native_quote_count',(SELECT count(*) FROM attested_quotes),
    'no_auto_promotion',true,
    'no_real_bet_execution',true
 )
) AS canonical_export