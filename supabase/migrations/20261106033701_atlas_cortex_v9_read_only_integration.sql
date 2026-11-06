
-- ATLAS V9 read-only research Cortex bridge: additive, non-executable.
create table if not exists public.atlas_cortex_feature_bindings_v1 (
 feature_key text primary key,
 feature_version text not null default 'v9',
 owner_node text not null,
 source_pr integer not null check (source_pr between 1 and 999999),
 source_commit_sha text not null check (source_commit_sha ~ '^[0-9a-f]{40}$'),
 source_path text not null,
 test_path text not null,
 state text not null default 'LAB' check (state in ('LAB','SHADOW','READ_ONLY_WIRED','BLOCKED')),
 scope text not null default 'NBA_NFL',
 evidence_label text not null default 'CODE_SOURCE_RECHECK',
 production_authority boolean not null default false check (production_authority = false),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.atlas_cortex_feature_bindings_v1 enable row level security;
revoke all on public.atlas_cortex_feature_bindings_v1 from public, anon, authenticated;
grant select on public.atlas_cortex_feature_bindings_v1 to service_role;

create table if not exists public.atlas_cortex_release_receipts_v1 (
 receipt_key text primary key,
 integration_version text not null,
 node_key text not null,
 evidence_type text not null check (evidence_type in ('SOURCE_READBACK','OFFLINE_TEST','DB_ACCEPTANCE','EDGE_SOURCE_READBACK','HTTP_AUTH_ACCEPTANCE','BLOCKER')),
 evidence_status text not null check (evidence_status in ('VERIFIED','RESEARCH_ONLY','BLOCKED')),
 evidence_scope text not null default 'LAB' check (evidence_scope in ('LAB','SHADOW','STAGING')),
 source_reference text not null,
 source_commit_sha text check (source_commit_sha is null or source_commit_sha ~ '^[0-9a-f]{40}$'),
 observations jsonb not null default '{}'::jsonb check (jsonb_typeof(observations)='object'),
 observed_at timestamptz not null,
 created_at timestamptz not null default now(),
 production_authority boolean not null default false check (production_authority = false)
);
create index if not exists atlas_cortex_release_receipts_v1_created_idx on public.atlas_cortex_release_receipts_v1 (created_at desc);
alter table public.atlas_cortex_release_receipts_v1 enable row level security;
revoke all on public.atlas_cortex_release_receipts_v1 from public, anon, authenticated;
grant select on public.atlas_cortex_release_receipts_v1 to service_role;
grant insert on public.atlas_cortex_release_receipts_v1 to service_role;

create or replace function public.atlas_cortex_release_receipt_immutable_v1()
returns trigger language plpgsql security invoker
set search_path = pg_catalog, public as $f$
begin
 raise exception 'ATLAS Cortex release receipts are append-only';
end;
$f$;
revoke all on function public.atlas_cortex_release_receipt_immutable_v1() from public,anon,authenticated;
drop trigger if exists atlas_cortex_release_receipts_v1_immutable on public.atlas_cortex_release_receipts_v1;
create trigger atlas_cortex_release_receipts_v1_immutable
before update or delete on public.atlas_cortex_release_receipts_v1
for each row execute function public.atlas_cortex_release_receipt_immutable_v1();

insert into public.atlas_cortex_feature_bindings_v1
(feature_key,feature_version,owner_node,source_pr,source_commit_sha,source_path,test_path,state,evidence_label)
values
('pivot_gate','v9','SENTINEL',29,'518f03c98aeee130fb015b081ac6145bd3ed0584','scripts/research/pivot-gate.cjs','scripts/research/pivot-gate.test.cjs','LAB','OFFLINE_TESTED'),
('market_intelligence','v9','PRICING',29,'518f03c98aeee130fb015b081ac6145bd3ed0584','scripts/research/market-intelligence.cjs','scripts/research/market-intelligence.test.cjs','LAB','OFFLINE_TESTED'),
('discovery_guard','v9','CALIBRATOR',29,'518f03c98aeee130fb015b081ac6145bd3ed0584','scripts/research/discovery-guard.cjs','scripts/research/discovery-guard.test.cjs','LAB','OFFLINE_TESTED'),
('feature_lab','v9','ORACLE',30,'0aab7015df9422926e37692af9db53a4f1078a8c','scripts/research/feature-lab.cjs','scripts/research/feature-lab.test.cjs','LAB','OFFLINE_TESTED'),
('value_cortex','v9','EDGE_THIEF',31,'862c4247a6718906ca7c8cdf1fa7824777eafb6a','scripts/research/value-cortex.cjs','scripts/research/value-cortex.test.cjs','LAB','OFFLINE_TESTED'),
('edge_dna','v9','FORENSICS',32,'6f0ebcde3da65ef85fdef869ff18102c84fefde8','scripts/research/edge-dna.cjs','scripts/research/edge-dna.test.cjs','LAB','OFFLINE_TESTED'),
('integration_arena_v8','v9','ARCHIVIST',33,'e3b1e3fe7d97973074096666f450652a8a3f6ee3','scripts/research/integration-v8.cjs','scripts/research/integration-v8-public.test.cjs','LAB','OFFLINE_TESTED')
on conflict (feature_key) do nothing;

insert into public.atlas_feature_registry_v1
(feature_key,feature_version,owner_node,description,source_type,source_reference,calculation_definition,availability_timing,leakage_risk,known_limitations,sport_scope,market_scope,status,production_authority)
select b.feature_key,'v9',b.owner_node,
 'ATLAS original research-only module; public source verified by PR and commit; not production',
 'ORIGINAL_ATLAS_LAB',
 'https://github.com/tyrollclimaco09-oss/Atlas/pull/'||b.source_pr,
 b.source_path,
 'Historical or synthetic inputs frozen before evaluation; no authenticated book quotes',
 'HIGH_UNTIL_PROSPECTIVELY_VALIDATED',
 'No live site origin parity or bookmaker executable price proof. Local tests are not performance validation.',
 '["NBA","NFL"]'::jsonb,'["moneyline","spread","total","props","parlay"]'::jsonb,
 'SHADOW',false
from public.atlas_cortex_feature_bindings_v1 b
on conflict (feature_key,feature_version) do nothing;

insert into public.atlas_shadow_experiment_registry_v2
(experiment_key,title,owner_node,problem_solved,hypothesis,inputs_required,output_produced,point_in_time_requirements,primary_metric,guardrail_metric,disproof_condition,minimum_sample,minimum_days,shadow_impact,status,production_authority,rollback_condition)
values
('EXP-CORTEX-V9-CROSS-NODE-001','ATLAS V9 research-to-runtime cross-node integration','CALIBRATOR',
'Independent features lack authenticated persisted runtime evidence',
'Read-only status manifests can reconcile original code to immutable DB evidence without creating betting authority',
'["verified_git_sha","migration_receipt","runtime_auth_response","prospective_forecast_freeze"]'::jsonb,
'Authenticated read-only manifest, append-only proof and explicit blocked readiness',
'All historical and prospective data carry observed_at and decision_cutoff; no postgame updates to frozen forecasts',
'fraction of source and DB manifests reconciled',
'unauthenticated access, stale quotes, secret leakage, or executable authority',
'Any unauthorized read, mutated receipt, invented execution price, or unverified production promotion',
100,10,'NONE','ISOLATED',false,
'Disable bridge route, preserve append-only receipts, no legacy runtime changes')
on conflict (experiment_key) do nothing;
