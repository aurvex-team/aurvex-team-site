-- AURVEX Stars payout integrity and new cosmetics (2026-10-23)
-- Permit owner-sale ledger entries, tie each payout to its purchase, backfill older spends,
-- and keep future purchases atomic and auditable.
alter table public.aurvex_shop_ledger
  add column if not exists related_ledger_id bigint
  references public.aurvex_shop_ledger(id);

alter table public.aurvex_shop_ledger
  drop constraint if exists aurvex_shop_ledger_reason_check;
alter table public.aurvex_shop_ledger
  add constraint aurvex_shop_ledger_reason_check
  check (reason = any (array['welcome'::text, 'purchase'::text, 'topup'::text, 'sale_payout'::text]));

create unique index if not exists aurvex_shop_ledger_related_purchase_uidx
  on public.aurvex_shop_ledger(related_ledger_id)
  where related_ledger_id is not null;

insert into public.aurvex_shop_wallets(user_id, balance)
values ('3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid, 0)
on conflict (user_id) do nothing;

with backfilled as (
  insert into public.aurvex_shop_ledger(user_id, points_delta, reason, item_id, related_ledger_id)
  select
    '3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid,
    -purchase.points_delta,
    'sale_payout',
    purchase.item_id,
    purchase.id
  from public.aurvex_shop_ledger purchase
  where purchase.reason = 'purchase'
    and purchase.points_delta < 0
    and purchase.user_id <> '3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid
    and not exists (
      select 1 from public.aurvex_shop_ledger payout
      where payout.related_ledger_id = purchase.id
    )
  on conflict (related_ledger_id) where related_ledger_id is not null do nothing
  returning points_delta
)
update public.aurvex_shop_wallets owner_wallet
set balance = owner_wallet.balance + (select coalesce(sum(points_delta), 0) from backfilled)
where owner_wallet.user_id = '3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid;

insert into public.aurvex_shop_items(id, kind, theme, price_points, price_uah_kop) values
  ('avatar_nebula', 'avatar', 'cosmic', 300, 8900),
  ('avatar_aurora', 'avatar', 'emerald', 275, 7900),
  ('profile_solarflare', 'profile', 'gold', 450, 12900),
  ('profile_voidglass', 'profile', 'violet', 425, 11900)
on conflict (id) do nothing;

create or replace function public.aurvex_shop_buy_points(product text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  who uuid;
  item record;
  current_balance integer;
  purchase_ledger_id bigint;
  platform_owner constant uuid := '3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid;
begin
  who := public.aurvex_shop_actor();
  if product is null or length(product) > 48 then
    raise exception 'INVALID_ITEM';
  end if;

  perform public.aurvex_shop_bootstrap();
  select i.id, i.price_points into item
  from public.aurvex_shop_items i
  where i.id = product and i.active;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;

  select w.balance into current_balance
  from public.aurvex_shop_wallets w
  where w.user_id = who
  for update;

  if exists (
    select 1 from public.aurvex_shop_inventory x
    where x.user_id = who and x.item_id = product
  ) then
    raise exception 'ITEM_ALREADY_OWNED';
  end if;
  if current_balance < item.price_points then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  update public.aurvex_shop_wallets
  set balance = balance - item.price_points
  where user_id = who;
  insert into public.aurvex_shop_inventory(user_id, item_id, obtained_by)
  values (who, product, 'points');
  insert into public.aurvex_shop_ledger(user_id, points_delta, reason, item_id)
  values (who, -item.price_points, 'purchase', product)
  returning id into purchase_ledger_id;

  if who <> platform_owner then
    insert into public.aurvex_shop_wallets(user_id, balance)
    values (platform_owner, 0)
    on conflict (user_id) do nothing;

    update public.aurvex_shop_wallets
    set balance = balance + item.price_points
    where user_id = platform_owner;

    insert into public.aurvex_shop_ledger(user_id, points_delta, reason, item_id, related_ledger_id)
    values (platform_owner, item.price_points, 'sale_payout', product, purchase_ledger_id);
  end if;

  return jsonb_build_object('item_id', product, 'balance', current_balance - item.price_points);
end
$function$;

revoke all on function public.aurvex_shop_buy_points(text) from public, anon;
grant execute on function public.aurvex_shop_buy_points(text) to authenticated;
