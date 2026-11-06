-- ATLAS V11 FILTER/VERIFY child capability; informational only.
insert into public.atlas_cortex_feature_bindings_v1
(feature_key,feature_version,owner_node,source_pr,source_commit_sha,source_path,test_path,state,scope,evidence_label,production_authority)
values
('native_handoff_v11','v11','FILTER_VERIFY',36,'cb5277dbb1e7cdf3f95cae4cb46d288d9c8cc795',
 'scripts/research/native-handoff-v11.cjs','scripts/research/native-handoff-v11.test.cjs',
 'LAB','NBA_NFL','DATABASE_VIEW_ACCEPTED_SOURCE_CI',false)
on conflict(feature_key) do nothing;

insert into public.atlas_feature_registry_v1
(feature_key,feature_version,owner_node,description,source_type,source_reference,
calculation_definition,availability_timing,leakage_risk,known_limitations,
sport_scope,market_scope,status,production_authority)
values
('native_handoff_v11','v11','FILTER_VERIFY',
 'Canonical slate to event/state identity and candidate readiness auditor; no executable price claims',
 'ORIGINAL_ATLAS_LAB',
 'https://github.com/tyrollclimaco09-oss/Atlas/pull/36',
 'Reads canonical event identity, candidate counts, independent proofs, Edge Thief resolution and price evidence',
 'READ_ONLY_DATABASE_OBSERVED_AT_QUERY_TIME',
 'NO_PREDICTIVE_FORECAST_OR_MARKET_VALUE_CLAIM',
 'Not an executable market candidate, does not authenticate published Command Center or price connector',
 '["NBA","NFL"]'::jsonb,'["schedule","market-readiness"]'::jsonb,'SHADOW',false)
on conflict(feature_key,feature_version) do nothing;
