-- AURVEX payments 0.1: provider-neutral orders and server-only fulfillment.
-- All 37 display currencies are defined. Real gateway currency support is opt-in per merchant.
create table if not exists public.aurvex_payment_currencies(
 code text primary key check(code ~ '^[A-Z]{3}$'),
 minor_units smallint not null check(minor_units between 0 and 3),
 checkout_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.aurvex_payment_currencies(code,minor_units) values
 ('UAH',2),('USD',2),('EUR',2),('GBP',2),('PLN',2),('CHF',2),('CAD',2),
 ('AUD',2),('JPY',0),('CNY',2),('KRW',0),('SEK',2),('NOK',2),('DKK',2),
 ('CZK',2),('HUF',2),('RON',2),('TRY',2),('INR',2),('BRL',2),('MXN',2),
 ('AED',2),('SAR',2),('ILS',2),('ZAR',2),('SGD',2),('HKD',2),
 ('NZD',2),('THB',2),('IDR',2),('MYR',2),('PHP',2),('VND',0),
 ('KZT',2),('GEL',2),('MDL',2),('AZN',2)
on conflict(code) do nothing;
-- UAH can be the eventual settlement fallback, but charging is disabled globally.
update public.aurvex_payment_currencies set checkout_enabled=true where code='UAH';

create table if not exists public.aurvex_payment_rates(
 currency text primary key references public.aurvex_payment_currencies(code),
 per_uah numeric(24,12) not null check(per_uah>0),
 source text not null check(length(source) between 2 and 80),
 fetched_at timestamptz not null default now()
);
insert into public.aurvex_payment_rates(currency,per_uah,source)
 values('UAH',1,'fixed-parity') on conflict(currency) do nothing;
create table if not exists public.aurvex_stars_packs(
 id text primary key check(id ~ '^stars_[0-9]{2,5}$'),
 stars integer not null unique check(stars between 50 and 100000),
 price_uah_kop integer not null check(price_uah_kop between 100 and 10000000),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
insert into public.aurvex_stars_packs(id,stars,price_uah_kop) values
 ('stars_100',100,3900),('stars_350',350,11900),('stars_800',800,24900),
 ('stars_1800',1800,49900)
on conflict(id) do update set stars=excluded.stars, price_uah_kop=excluded.price_uah_kop;

create table if not exists public.aurvex_payment_orders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('stars','cosmetic')),
 sku text not null check(length(sku) between 3 and 64),
 stars integer not null default 0 check(stars between 0 and 100000),
 base_uah_kop integer not null check(base_uah_kop>0),
 selected_currency text not null references public.aurvex_payment_currencies(code),
 charge_currency text not null references public.aurvex_payment_currencies(code),
 charge_minor bigint not null check(charge_minor between 1 and 100000000000),
 fx_per_uah numeric(24,12) not null check(fx_per_uah>0),
 fx_source text not null,
 quote_expires_at timestamptz not null,
 gateway text not null default 'fondy' check(gateway in ('fondy')),
 gateway_id text,
 status text not null default 'created'
   check(status in ('created','redirected','paid','failed','expired','refund_review','refunded','disputed')),
 client_request_id uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 fulfilled_at timestamptz,
 unique(user_id,client_request_id)
);
create unique index if not exists aurvex_payment_gateway_unique
 on public.aurvex_payment_orders(gateway,gateway_id) where gateway_id is not null;
create index if not exists aurvex_payment_orders_owner_idx
 on public.aurvex_payment_orders(user_id,created_at desc);
create table if not exists public.aurvex_payment_events(
 id bigserial primary key,
 order_id uuid not null references public.aurvex_payment_orders(id),
 gateway text not null check(gateway in ('fondy')),
 event_fingerprint text not null check(event_fingerprint ~ '^[a-f0-9]{64}$'),
 payment_ref text not null,
 event_type text not null,
 handled_at timestamptz not null default now(),
 unique(gateway,event_fingerprint)
);
create index if not exists aurvex_payment_events_order_idx on public.aurvex_payment_events(order_id);

alter table public.aurvex_payment_currencies enable row level security;
alter table public.aurvex_payment_rates enable row level security;
alter table public.aurvex_stars_packs enable row level security;
alter table public.aurvex_payment_orders enable row level security;
alter table public.aurvex_payment_events enable row level security;
revoke all on public.aurvex_payment_currencies,public.aurvex_payment_rates,
 public.aurvex_stars_packs,public.aurvex_payment_orders,public.aurvex_payment_events
 from public,anon,authenticated;
-- Public configuration contains no merchant secrets, orders and events are never directly exposed.
grant select(code,minor_units,checkout_enabled) on public.aurvex_payment_currencies to anon,authenticated;
grant select(id,stars,price_uah_kop,active) on public.aurvex_stars_packs to anon,authenticated;
create policy aurvex_payment_currency_read on public.aurvex_payment_currencies
 for select to anon,authenticated using(true);
create policy aurvex_payment_packs_read on public.aurvex_stars_packs
 for select to anon,authenticated using(active);

-- Only actual gateway confirmation may mint Stars; ledger records the provenance.
alter table public.aurvex_shop_ledger drop constraint if exists aurvex_shop_ledger_reason_check;
alter table public.aurvex_shop_ledger add constraint aurvex_shop_ledger_reason_check
 check(reason in ('welcome','purchase','topup'));
create unique index if not exists aurvex_one_stars_topup_per_order
 on public.aurvex_shop_ledger(user_id,item_id,id) where reason='topup';
-- Payment purchase id is tracked in payment_orders and locked for exact-once fulfillment.

create or replace function public.aurvex_payment_prepare(
 requested_kind text, requested_sku text, display_currency text,
 request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; price integer; units integer; charge text;
 rate numeric(24,12); source_name text; current_order public.aurvex_payment_orders%rowtype;
 star_count integer; ord_id uuid; valid_currency text;
begin
 who:=public.aurvex_shop_actor();
 if request_id is null or requested_kind not in ('stars','cosmetic') or
    requested_sku is null or length(requested_sku)>64 or
    display_currency is null or display_currency !~ '^[A-Z]{3}$' then
  raise exception 'PAYMENT_BAD_REQUEST';
 end if;
 if not exists(select 1 from public.aurvex_payment_currencies where code=display_currency) then
  raise exception 'PAYMENT_CURRENCY_UNSUPPORTED';end if;
 select * into current_order from public.aurvex_payment_orders
  where user_id=who and client_request_id=request_id;
 if found then
  if current_order.kind<>requested_kind or current_order.sku<>requested_sku or
    current_order.selected_currency<>display_currency then
   raise exception 'PAYMENT_IDEMPOTENCY_CONFLICT';end if;
  return jsonb_build_object('id',current_order.id,'currency',current_order.charge_currency,
   'selectedCurrency',current_order.selected_currency,'amountMinor',current_order.charge_minor,
   'expiresAt',current_order.quote_expires_at,'status',current_order.status);
 end if;
 perform public.aurvex_shop_bootstrap();
 if requested_kind='stars' then
  select p.price_uah_kop,p.stars into price,star_count
  from public.aurvex_stars_packs p where p.id=requested_sku and p.active;
 else
  select s.price_uah_kop,0 into price,star_count
  from public.aurvex_shop_items s where s.id=requested_sku and s.active;
  if exists(select 1 from public.aurvex_shop_inventory i
     where i.user_id=who and i.item_id=requested_sku) then
   raise exception 'PAYMENT_ITEM_ALREADY_OWNED';end if;
 end if;
 if price is null then raise exception 'PAYMENT_ITEM_NOT_FOUND';end if;
 if (select count(*) from public.aurvex_payment_orders
   where user_id=who and status in ('created','redirected')
   and created_at>now()-interval '15 minutes')>=5 then
  raise exception 'PAYMENT_TOO_MANY_PENDING';end if;
 -- Checkout FX is configured ONLY on the server. Unsupported payer currencies fallback to UAH.
 charge:=case when exists(select 1 from public.aurvex_payment_currencies
   where code=display_currency and checkout_enabled) then display_currency else 'UAH' end;
 select c.minor_units, r.per_uah,r.source into units,rate,source_name
 from public.aurvex_payment_currencies c join public.aurvex_payment_rates r on r.currency=c.code
 where c.code=charge and c.checkout_enabled
   and (r.currency='UAH' or r.fetched_at>now()-interval '36 hours');
 if rate is null then raise exception 'PAYMENT_FX_NOT_READY';end if;
 insert into public.aurvex_payment_orders(user_id,kind,sku,stars,base_uah_kop,
   selected_currency,charge_currency,charge_minor,fx_per_uah,fx_source,
   quote_expires_at,client_request_id)
 values(who,requested_kind,requested_sku,star_count,price,
   display_currency,charge,greatest(1,round((price::numeric/100)*rate*(10^units))::bigint),
   rate,source_name,now()+interval '20 minutes',request_id) returning id into ord_id;
 return jsonb_build_object('id',ord_id,'currency',charge,'selectedCurrency',display_currency,
   'amountMinor',greatest(1,round((price::numeric/100)*rate*(10^units))::bigint),
   'expiresAt',now()+interval '20 minutes','status','created');
end $$;
revoke all on function public.aurvex_payment_prepare(text,text,text,uuid) from public,anon;
grant execute on function public.aurvex_payment_prepare(text,text,text,uuid) to authenticated;

-- No direct browser access: only a verified gateway webhook server role may call this.
create or replace function public.aurvex_payment_settle(
 order_uuid uuid, charged_currency text, charged_minor bigint,
 provider_payment text, event_sha256 text)
returns text language plpgsql security definer set search_path='' as $$
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
 else
   insert into public.aurvex_shop_inventory(user_id,item_id,obtained_by)
    values(o.user_id,o.sku,'uah');
 end if;
 update public.aurvex_payment_orders set status='paid',gateway_id=provider_payment,
  fulfilled_at=now(),updated_at=now() where id=o.id;
 insert into public.aurvex_payment_events(order_id,gateway,event_fingerprint,payment_ref,event_type)
   values(o.id,o.gateway,event_sha256,provider_payment,'paid');
 return 'paid';
end $$;
revoke all on function public.aurvex_payment_settle(uuid,text,bigint,text,text)
 from public,anon,authenticated;
grant execute on function public.aurvex_payment_settle(uuid,text,bigint,text,text) to service_role;

-- Authenticated customers can only see their own order status, not provider secrets.
create or replace function public.aurvex_payment_my_orders()
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'sku',sku,
  'kind',kind,'stars',stars,'amountMinor',charge_minor,'chargeCurrency',charge_currency,
  'selectedCurrency',selected_currency,'status',status,'createdAt',created_at)
  order by created_at desc)
  from (select * from public.aurvex_payment_orders where user_id=who
    order by created_at desc limit 30) o),'[]'::jsonb);
end $$;
revoke all on function public.aurvex_payment_my_orders() from public,anon;
grant execute on function public.aurvex_payment_my_orders() to authenticated;
