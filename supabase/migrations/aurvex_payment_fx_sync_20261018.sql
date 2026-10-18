-- Server-side FX cache. Values from a remote rate source are never trusted to the browser.
create or replace function public.aurvex_payment_store_rates(
 rates jsonb,source_timestamp timestamptz)
returns integer language plpgsql security definer set search_path='' as $$
declare item record; count_updated integer:=0; quote numeric;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'PAYMENT_SERVER_ONLY' using errcode='42501';end if;
 if jsonb_typeof(rates)<>'object' or source_timestamp<now()-interval '48 hours'
 or source_timestamp>now()+interval '20 minutes' then raise exception 'PAYMENT_BAD_FX';end if;
 for item in select key,value from jsonb_each_text(rates) loop
   if item.key !~ '^[A-Z]{3}$' or item.value !~ '^[0-9]+(\.[0-9]+)?$' then
    continue;end if;
   quote:=item.value::numeric;
   if quote<=0 or quote>100000 then continue;end if;
   if item.key='UAH' and quote<>1 then raise exception 'PAYMENT_BAD_FX_BASE';end if;
   insert into public.aurvex_payment_rates(currency,per_uah,source,fetched_at)
    select c.code,quote,'open.er-api.com',source_timestamp
    from public.aurvex_payment_currencies c where c.code=item.key
    on conflict(currency) do update set per_uah=excluded.per_uah,
      source=excluded.source,fetched_at=excluded.fetched_at;
   if found then count_updated:=count_updated+1;end if;
 end loop;
 if count_updated<35 then raise exception 'PAYMENT_INCOMPLETE_FX';end if;
 return count_updated;
end $$;
revoke all on function public.aurvex_payment_store_rates(jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.aurvex_payment_store_rates(jsonb,timestamptz) to service_role;

create or replace function public.aurvex_payment_public_readiness()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'enabled',coalesce((select checkout_enabled and merchant_verified
   from public.aurvex_payment_settings where singleton),false),
 'currencies',coalesce((select jsonb_agg(code order by code)
   from public.aurvex_payment_currencies where checkout_enabled),'[]'::jsonb),
 'displayCurrencyCount',(select count(*) from public.aurvex_payment_currencies),
 'rateCount',(select count(*) from public.aurvex_payment_rates where
   currency='UAH' or fetched_at>now()-interval '36 hours')
 );
$$;
revoke all on function public.aurvex_payment_public_readiness() from public;
grant execute on function public.aurvex_payment_public_readiness() to anon,authenticated;
