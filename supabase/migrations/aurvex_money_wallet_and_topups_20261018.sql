-- AURVEX fiat balance (UAH base) / deposits preparation. No unconfirmed client credit.
create table if not exists public.aurvex_money_wallets(
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_uah_kop bigint not null default 0 check (balance_uah_kop >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.aurvex_money_ledger(
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null unique references public.aurvex_payment_orders(id),
  delta_uah_kop bigint not null check(delta_uah_kop > 0),
  reason text not null check(reason='deposit'),
  created_at timestamptz not null default now()
);
create index if not exists aurvex_money_ledger_user_idx
  on public.aurvex_money_ledger(user_id, created_at desc);
create table if not exists public.aurvex_money_deposit_packs(
  id text primary key check(id ~ '^wallet_[0-9]{2,4}$'),
  amount_uah_kop integer not null unique check(amount_uah_kop between 2000 and 100000),
  active boolean not null default true
);
insert into public.aurvex_money_deposit_packs(id,amount_uah_kop) values
 ('wallet_50',5000),('wallet_100',10000),('wallet_250',25000),
 ('wallet_500',50000),('wallet_1000',100000)
on conflict(id) do nothing;

alter table public.aurvex_money_wallets enable row level security;
alter table public.aurvex_money_ledger enable row level security;
alter table public.aurvex_money_deposit_packs enable row level security;
revoke all on public.aurvex_money_wallets,public.aurvex_money_ledger,
 public.aurvex_money_deposit_packs from public,anon,authenticated;

alter table public.aurvex_payment_orders drop constraint aurvex_payment_orders_kind_check;
alter table public.aurvex_payment_orders add constraint aurvex_payment_orders_kind_check
  check(kind in ('stars','cosmetic','wallet'));

-- Private read function: confirms user AAL2 on every invocation; never exposes another account.
create or replace function public.aurvex_money_wallet_state()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 return jsonb_build_object(
  'balanceUahKop',coalesce((select balance_uah_kop
     from public.aurvex_money_wallets where user_id=who),0),
  'entries',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'orderId',order_id,'amountUahKop',delta_uah_kop,
      'reason',reason,'createdAt',created_at) order by created_at desc)
     from (select * from public.aurvex_money_ledger where user_id=who
       order by created_at desc limit 20) items),'[]'::jsonb)
 );
end $$;
revoke all on function public.aurvex_money_wallet_state() from public,anon;
grant execute on function public.aurvex_money_wallet_state() to authenticated;

-- New fixed, server-authoritative wallet top-up quotes; no custom prices from the client.
create or replace function public.aurvex_payment_prepare_wallet(
 requested_sku text, display_currency text, request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 who uuid; price integer; units integer; charge text;
 rate numeric(24,12); src text; current_order public.aurvex_payment_orders%rowtype;
 ord_id uuid; quoted_minor bigint; expires timestamptz;
begin
 perform public.aurvex_payment_guard();
 who:=public.aurvex_shop_actor();
 if request_id is null or requested_sku is null or
    display_currency is null or display_currency !~ '^[A-Z]{3}$' then
  raise exception 'PAYMENT_BAD_REQUEST';end if;
 if not exists(select 1 from public.aurvex_payment_currencies where code=display_currency)
    then raise exception 'PAYMENT_CURRENCY_UNSUPPORTED';end if;
 select * into current_order from public.aurvex_payment_orders
  where user_id=who and client_request_id=request_id;
 if found then
  if current_order.kind<>'wallet' or current_order.sku<>requested_sku
     or current_order.selected_currency<>display_currency then
    raise exception 'PAYMENT_IDEMPOTENCY_CONFLICT';end if;
  return jsonb_build_object('id',current_order.id,'currency',current_order.charge_currency,
    'selectedCurrency',current_order.selected_currency,'amountMinor',current_order.charge_minor,
    'expiresAt',current_order.quote_expires_at,'status',current_order.status);
 end if;
 select amount_uah_kop into price from public.aurvex_money_deposit_packs
    where id=requested_sku and active;
 if price is null then raise exception 'PAYMENT_TOPUP_NOT_FOUND';end if;
 if (select count(*) from public.aurvex_payment_orders where user_id=who
     and status in ('created','redirected')
     and created_at>now()-interval '15 minutes')>=5 then
  raise exception 'PAYMENT_TOO_MANY_PENDING';end if;
 charge:=case when exists(select 1 from public.aurvex_payment_currencies
   where code=display_currency and checkout_enabled) then display_currency else 'UAH' end;
 select c.minor_units,r.per_uah,r.source into units,rate,src
 from public.aurvex_payment_currencies c
 join public.aurvex_payment_rates r on r.currency=c.code
 where c.code=charge and c.checkout_enabled
   and (r.currency='UAH' or r.fetched_at>now()-interval '36 hours');
 if rate is null then raise exception 'PAYMENT_FX_NOT_READY';end if;
 quoted_minor:=greatest(1,round((price::numeric/100)*rate*(10^units))::bigint);
 expires:=now()+interval '20 minutes';
 insert into public.aurvex_payment_orders(user_id,kind,sku,stars,base_uah_kop,
    selected_currency,charge_currency,charge_minor,fx_per_uah,fx_source,
    quote_expires_at,client_request_id)
 values(who,'wallet',requested_sku,0,price,display_currency,charge,
    quoted_minor,rate,src,expires,request_id) returning id into ord_id;
 return jsonb_build_object('id',ord_id,'currency',charge,
    'selectedCurrency',display_currency,'amountMinor',quoted_minor,
    'expiresAt',expires,'status','created');
end $$;
revoke all on function public.aurvex_payment_prepare_wallet(text,text,uuid) from public,anon;
grant execute on function public.aurvex_payment_prepare_wallet(text,text,uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.aurvex_payment_settle(order_uuid uuid, charged_currency text, charged_minor bigint, provider_payment text, event_sha256 text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.aurvex_payment_orders%rowtype;
begin
 if auth.role() is distinct from 'service_role' then
  raise exception 'PAYMENT_SERVER_ONLY' using errcode='42501';
 end if;
 if event_sha256 is null or event_sha256 !~ '^[a-f0-9]{64}$' or
    provider_payment is null or length(provider_payment)>120 then
  raise exception 'PAYMENT_INVALID_EVENT';end if;
 select * into o from public.aurvex_payment_orders where id=order_uuid for update;
 if not found then raise exception 'PAYMENT_UNKNOWN_ORDER';end if;
 if o.charge_currency<>charged_currency or o.charge_minor<>charged_minor then
  raise exception 'PAYMENT_AMOUNT_MISMATCH';end if;
 if o.status in ('paid','refund_review','refunded','disputed') then
   if o.gateway_id is distinct from provider_payment then
    raise exception 'PAYMENT_PROVIDER_CONFLICT';end if;
   return 'already_processed';
 end if;
 if o.status not in ('created','redirected') then raise exception 'PAYMENT_BAD_STATUS';end if;
 if exists(select 1 from public.aurvex_payment_events
   where gateway=o.gateway and event_fingerprint=event_sha256) then
  return 'duplicate_event';end if;
 if o.kind='cosmetic' and exists(select 1 from public.aurvex_shop_inventory
    where user_id=o.user_id and item_id=o.sku) then
  update public.aurvex_payment_orders set status='refund_review',gateway_id=provider_payment,
   updated_at=now() where id=o.id;
  insert into public.aurvex_payment_events(order_id,gateway,event_fingerprint,payment_ref,event_type)
   values(o.id,o.gateway,event_sha256,provider_payment,'refund_review');
  return 'refund_required';
 end if;
 if o.kind='stars' then
   update public.aurvex_shop_wallets
      set balance=balance+o.stars where user_id=o.user_id;
   if not found then
    insert into public.aurvex_shop_wallets(user_id,balance) values(o.user_id,o.stars);
   end if;
   insert into public.aurvex_shop_ledger(user_id,points_delta,reason)
     values(o.user_id,o.stars,'topup');
 elsif o.kind='wallet' then
   -- Only a signed, amount-matched, once-per-order confirmed PSP event reaches this branch.
   insert into public.aurvex_money_wallets(user_id,balance_uah_kop,updated_at)
     values(o.user_id,o.base_uah_kop,now())
     on conflict(user_id) do update set
       balance_uah_kop=public.aurvex_money_wallets.balance_uah_kop+excluded.balance_uah_kop,
       updated_at=now();
   insert into public.aurvex_money_ledger(user_id,order_id,delta_uah_kop,reason)
     values(o.user_id,o.id,o.base_uah_kop,'deposit');
 else
   insert into public.aurvex_shop_inventory(user_id,item_id,obtained_by)
    values(o.user_id,o.sku,'uah');
 end if;
 update public.aurvex_payment_orders set status='paid',gateway_id=provider_payment,
  fulfilled_at=now(),updated_at=now() where id=o.id;
 insert into public.aurvex_payment_events(order_id,gateway,event_fingerprint,payment_ref,event_type)
   values(o.id,o.gateway,event_sha256,provider_payment,'paid');
 return 'paid';
end $function$;
revoke all on function public.aurvex_payment_settle(uuid,text,bigint,text,text)
 from public,anon,authenticated;
grant execute on function public.aurvex_payment_settle(uuid,text,bigint,text,text) to service_role;
