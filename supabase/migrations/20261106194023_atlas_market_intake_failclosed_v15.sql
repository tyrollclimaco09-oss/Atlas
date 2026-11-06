-- ATLAS V15: safe market-data preflight. Does not fetch from or spend on any provider.
create table if not exists public.atlas_market_intake_controls_v15 (
  source_key text primary key,
  provider_name text not null,
  source_class text not null check (source_class in ('PUBLIC_REFERENCE','PAID_ODDS')),
  mode text not null check (mode in ('MANUAL_REFERENCE','DISABLED')),
  network_calls_enabled boolean not null default false check (network_calls_enabled=false),
  daily_paid_credit_budget integer not null default 0 check (daily_paid_credit_budget=0),
  execution_grade_allowed boolean not null default false check (execution_grade_allowed=false),
  approval_reference text,
  notes text not null,
  registered_at timestamptz not null default now()
);
alter table public.atlas_market_intake_controls_v15 enable row level security;
revoke all on public.atlas_market_intake_controls_v15 from public,anon,authenticated;
grant select on public.atlas_market_intake_controls_v15 to service_role;
insert into public.atlas_market_intake_controls_v15
 (source_key,provider_name,source_class,mode,network_calls_enabled,daily_paid_credit_budget,execution_grade_allowed,notes)
values
 ('ATLAS_WEB_REFERENCE','ATLAS Web Reference','PUBLIC_REFERENCE','MANUAL_REFERENCE',false,0,false,'Manual public reference capture only. Never an executable account quote.'),
 ('THE_ODDS_API','The Odds API','PAID_ODDS','DISABLED',false,0,false,'Retired paid network ingestion remains disabled. Separate approval required before changes.')
on conflict (source_key) do nothing;

create or replace function public.atlas_market_intake_preflight_v15(
 p_source_key text,
 p_source_quote_at timestamptz,
 p_observed_at timestamptz,
 p_event_start_at timestamptz,
 p_odds_american integer,
 p_source_url text,
 p_market text,
 p_selection text)
returns jsonb language plpgsql stable security invoker
set search_path = pg_catalog, public
as $body$
declare v_source public.atlas_market_intake_controls_v15%rowtype;
        v_status text;
begin
 select * into v_source from public.atlas_market_intake_controls_v15
 where source_key=p_source_key;
 if not found then v_status:='SOURCE_NOT_REGISTERED';
 elsif v_source.mode='DISABLED' or v_source.source_class='PAID_ODDS' then
   v_status:='PAID_CONNECTOR_DISABLED';
 elsif p_source_quote_at is null or p_observed_at is null
    or p_event_start_at is null or p_odds_american is null
    or (p_odds_american between -99 and 99)
    or p_market not in ('moneyline','spread','total','player_prop')
    or nullif(btrim(p_selection),'') is null
    or p_source_url !~ '^https://[^[:space:]]+$' then
   v_status:='REFERENCE_IDENTITY_INVALID';
 elsif p_source_quote_at>p_observed_at
    or p_observed_at>now()+interval '30 seconds'
    or p_source_quote_at>=p_event_start_at
    or p_observed_at>=p_event_start_at then
   v_status:='REFERENCE_TIME_INVALID_OR_EXPIRED';
 elsif p_source_quote_at<now()-interval '15 minutes' then
   v_status:='STALE_PUBLIC_REFERENCE';
 else
   v_status:='MANUAL_RESEARCH_REFERENCE_ONLY';
 end if;
 return jsonb_build_object('status',v_status,
  'source_key',p_source_key,'provider_name',v_source.provider_name,
  'network_request_performed',false,'paid_credits_consumed',0,
  'execution_grade',false,'account_price_verified',false,
  'independent_fair_probability',null,'expected_value',null,
  'production_authority',false,'betting_authority',false,
  'human_final_gate_required',true);
end;
$body$;
revoke all on function public.atlas_market_intake_preflight_v15(text,timestamptz,timestamptz,timestamptz,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.atlas_market_intake_preflight_v15(text,timestamptz,timestamptz,timestamptz,integer,text,text,text) to service_role;
