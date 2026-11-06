CREATE OR REPLACE FUNCTION public.atlas_market_intake_preflight_v15(p_source_key text, p_source_quote_at timestamp with time zone, p_observed_at timestamp with time zone, p_event_start_at timestamp with time zone, p_odds_american integer, p_source_url text, p_market text, p_selection text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
    or p_market is null or p_source_url is null or p_selection is null
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
$function$

