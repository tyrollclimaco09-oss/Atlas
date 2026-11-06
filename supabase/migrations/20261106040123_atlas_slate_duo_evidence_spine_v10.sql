-- ATLAS V10: canonical slate orchestration receipts, not a parallel decision or betting engine.
create table if not exists public.atlas_slate_research_runs_v10 (
  run_key text primary key check(length(run_key) between 12 and 128),
  slate_date date not null,
  timezone text not null default 'America/Chicago' check(timezone='America/Chicago'),
  league text not null check(league in ('NBA','NFL')),
  source_system text not null,
  source_observed_at timestamptz not null,
  source_reference text not null,
  event_manifest jsonb not null check(jsonb_typeof(event_manifest)='array'),
  event_count integer not null check(event_count between 0 and 30),
  outcome_status text not null default 'WATCH' check(outcome_status in ('WATCH','RESEARCH_ONLY','BLOCKED')),
  published_forecast boolean not null default false check(published_forecast=false),
  production_authority boolean not null default false check(production_authority=false),
  real_betting_authority boolean not null default false check(real_betting_authority=false),
  created_at timestamptz not null default now()
);
create table if not exists public.atlas_slate_node_receipts_v10 (
  receipt_key text primary key check(length(receipt_key) between 12 and 180),
  run_key text not null references public.atlas_slate_research_runs_v10(run_key) on delete restrict,
  node_key text not null check(node_key in (
    'SCOUT','FILTER_VERIFY','EDGE_THIEF','ORACLE','PRICING','KAIROS',
    'SENTINEL','TACTICIAN','HUMAN_FINAL_GATE','LEDGER','FORENSICS','CALIBRATOR'
  )),
  candidate_key text,
  state text not null check(state in ('WATCH','BLOCKED','RESEARCH_ONLY','POSTGAME_PENDING','EXPIRED')),
  evidence_source text not null,
  evidence_observed_at timestamptz not null,
  decision_cutoff timestamptz,
  payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),
  provenance_label text not null check(provenance_label in ('SPORTS_DATA_SCHEDULE','UNVERIFIED_RESEARCH','VERIFIED_SOURCE','MISSING_EVIDENCE')),
  production_authority boolean not null default false check(production_authority=false),
  real_betting_authority boolean not null default false check(real_betting_authority=false),
  created_at timestamptz not null default now()
);
create index if not exists atlas_slate_node_receipts_v10_run_idx on public.atlas_slate_node_receipts_v10(run_key,node_key,created_at desc);
create or replace function public.atlas_slate_v10_append_only_guard()
returns trigger language plpgsql security invoker
set search_path = pg_catalog,public as $body$
begin
  raise exception 'ATLAS V10 research slate receipts are append-only';
end
$body$;
revoke all on function public.atlas_slate_v10_append_only_guard() from public,anon,authenticated;
drop trigger if exists atlas_slate_research_runs_v10_immutable on public.atlas_slate_research_runs_v10;
create trigger atlas_slate_research_runs_v10_immutable
before update or delete on public.atlas_slate_research_runs_v10
for each row execute function public.atlas_slate_v10_append_only_guard();
drop trigger if exists atlas_slate_node_receipts_v10_immutable on public.atlas_slate_node_receipts_v10;
create trigger atlas_slate_node_receipts_v10_immutable
before update or delete on public.atlas_slate_node_receipts_v10
for each row execute function public.atlas_slate_v10_append_only_guard();
alter table public.atlas_slate_research_runs_v10 enable row level security;
alter table public.atlas_slate_node_receipts_v10 enable row level security;
revoke all on public.atlas_slate_research_runs_v10 from public,anon,authenticated;
revoke all on public.atlas_slate_node_receipts_v10 from public,anon,authenticated;
grant select,insert on public.atlas_slate_research_runs_v10 to service_role;
grant select,insert on public.atlas_slate_node_receipts_v10 to service_role;
