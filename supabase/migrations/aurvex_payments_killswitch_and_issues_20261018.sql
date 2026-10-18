-- Explicit production activation switch, kept server-only.
create table if not exists public.aurvex_payment_settings(
 singleton boolean primary key default true check(singleton),
 checkout_enabled boolean not null default false,
 provider text not null default 'fondy' check(provider in ('fondy')),
 merchant_verified boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.aurvex_payment_settings(singleton,checkout_enabled,merchant_verified)
 values(true,false,false) on conflict(singleton) do nothing;
alter table public.aurvex_payment_settings enable row level security;
revoke all on public.aurvex_payment_settings from public,anon,authenticated;
-- AAL2 payment RPC must not create orders unless a verified merchant is enabled.
create or replace function public.aurvex_payment_guard()
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.aurvex_payment_settings s
  where s.singleton and s.checkout_enabled and s.merchant_verified) then
  raise exception 'PAYMENTS_DISABLED' using errcode='P0001';
 end if;
end $$;
revoke all on function public.aurvex_payment_guard() from public,anon,authenticated;

-- Remove the old prepare function body in a safe, exact wrapper:
-- This guard runs before preparing orders and does not bypass RLS or MFA.
-- Rename legacy preparer to a server-only private entry point.
alter function public.aurvex_payment_prepare(text,text,text,uuid)
 rename to aurvex_payment_prepare_internal;
revoke all on function public.aurvex_payment_prepare_internal(text,text,text,uuid)
 from public,anon,authenticated;
create or replace function public.aurvex_payment_prepare(
 requested_kind text,requested_sku text,display_currency text,request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public.aurvex_payment_guard();
 return public.aurvex_payment_prepare_internal(requested_kind,requested_sku,display_currency,request_id);
end $$;
revoke all on function public.aurvex_payment_prepare(text,text,text,uuid) from public,anon;
grant execute on function public.aurvex_payment_prepare(text,text,text,uuid) to authenticated;

-- Status updates do not manufacture revenue or grant items.
create or replace function public.aurvex_payment_mark_issue(
 order_uuid uuid,provider_payment text,issue_type text,event_sha256 text)
returns text language plpgsql security definer set search_path='' as $$
declare o public.aurvex_payment_orders%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'PAYMENT_SERVER_ONLY' using errcode='42501';end if;
 if issue_type not in ('failed','refunded','disputed') or
    event_sha256 !~ '^[a-f0-9]{64}$' or provider_payment is null or
    length(provider_payment)>120 then raise exception 'PAYMENT_INVALID_EVENT';end if;
 select * into o from public.aurvex_payment_orders where id=order_uuid for update;
 if not found then raise exception 'PAYMENT_UNKNOWN_ORDER';end if;
 if o.gateway_id is not null and o.gateway_id<>provider_payment then
  raise exception 'PAYMENT_PROVIDER_CONFLICT';end if;
 if exists(select 1 from public.aurvex_payment_events
   where gateway=o.gateway and event_fingerprint=event_sha256) then
   return 'duplicate_event';end if;
 if issue_type='failed' and o.status='paid' then return 'ignored_paid';end if;
 update public.aurvex_payment_orders
  set status=case when issue_type='failed' then
     case when o.status in ('created','redirected') then 'failed' else o.status end
     when issue_type='refunded' then 'refunded'
     else 'disputed' end,
     gateway_id=coalesce(gateway_id,provider_payment),updated_at=now()
 where id=o.id;
 insert into public.aurvex_payment_events(order_id,gateway,event_fingerprint,payment_ref,event_type)
 values(o.id,o.gateway,event_sha256,provider_payment,issue_type);
 -- Top-ups whose payments are refunded/disputed require manual financial and wallet review.
 -- Do NOT silently remove spent Stars or automatically mint/adjust any balances here.
 return issue_type;
end $$;
revoke all on function public.aurvex_payment_mark_issue(uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.aurvex_payment_mark_issue(uuid,text,text,text) to service_role;
