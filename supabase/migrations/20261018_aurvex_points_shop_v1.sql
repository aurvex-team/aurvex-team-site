-- AURVEX Points Shop 0.1: safe server-owned cosmetic wallet and inventory.
-- The money price is a catalog listing ONLY. Live UAH checkout is disabled
-- until an adult-operated merchant provider and verified server webhook exist.
create table if not exists public.aurvex_shop_items(
  id text primary key check(id ~ '^[a-z0-9_-]{3,48}$'),
  kind text not null check(kind in ('avatar','profile')),
  theme text not null check(theme in ('violet','ruby','cyan','emerald','gold','cosmic','frost','flame')),
  price_points integer not null check(price_points between 1 and 100000),
  price_uah_kop integer not null check(price_uah_kop between 100 and 1000000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.aurvex_shop_items(id,kind,theme,price_points,price_uah_kop) values
 ('avatar_violet','avatar','violet',150,4900),
 ('avatar_ruby','avatar','ruby',200,5900),
 ('avatar_cyan','avatar','cyan',250,6900),
 ('avatar_gold','avatar','gold',350,9900),
 ('profile_emerald','profile','emerald',225,6900),
 ('profile_cosmic','profile','cosmic',325,9900),
 ('profile_frost','profile','frost',275,7900),
 ('profile_flame','profile','flame',400,11900)
on conflict(id) do nothing;

create table if not exists public.aurvex_shop_wallets(
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance integer not null default 0 check(balance>=0 and balance<=1000000),
 created_at timestamptz not null default now()
);
create table if not exists public.aurvex_shop_ledger(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 points_delta integer not null check(points_delta<>0 and points_delta between -100000 and 100000),
 reason text not null check(reason in ('welcome','purchase')),
 item_id text references public.aurvex_shop_items(id),
 created_at timestamptz not null default now()
);
create index if not exists aurvex_shop_ledger_owner_idx on public.aurvex_shop_ledger(user_id,id desc);
create unique index if not exists aurvex_shop_one_welcome on public.aurvex_shop_ledger(user_id) where reason='welcome';

create table if not exists public.aurvex_shop_inventory(
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null references public.aurvex_shop_items(id),
 obtained_by text not null check(obtained_by in ('points','uah')),
 acquired_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create table if not exists public.aurvex_shop_equipped(
 user_id uuid primary key references auth.users(id) on delete cascade,
 avatar_item text references public.aurvex_shop_items(id),
 profile_item text references public.aurvex_shop_items(id),
 updated_at timestamptz not null default now()
);

alter table public.aurvex_shop_items enable row level security;
alter table public.aurvex_shop_wallets enable row level security;
alter table public.aurvex_shop_ledger enable row level security;
alter table public.aurvex_shop_inventory enable row level security;
alter table public.aurvex_shop_equipped enable row level security;

revoke all on public.aurvex_shop_items,public.aurvex_shop_wallets,
 public.aurvex_shop_ledger,public.aurvex_shop_inventory,public.aurvex_shop_equipped
 from public,anon,authenticated;
grant select(id,kind,theme,price_points,price_uah_kop,active) on public.aurvex_shop_items to anon,authenticated;
drop policy if exists aurvex_shop_active_catalog on public.aurvex_shop_items;
create policy aurvex_shop_active_catalog on public.aurvex_shop_items
 for select to anon,authenticated using(active);

-- All mutable operations exclusively through AAL2-gated RPCs.
create or replace function public.aurvex_shop_actor()
returns uuid language plpgsql stable security invoker set search_path='' as $$
declare who uuid;
begin
 who:=auth.uid();
 if who is null or (auth.jwt()->>'aal') is distinct from 'aal2' then
   raise exception 'AURVEX_SHOP_MFA_REQUIRED' using errcode='42501';
 end if;
 return who;
end $$;
revoke all on function public.aurvex_shop_actor() from public,anon;
grant execute on function public.aurvex_shop_actor() to authenticated;

-- First verified entry creates exactly one 500 Points welcome allocation.
create or replace function public.aurvex_shop_bootstrap()
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; inserted uuid;
begin
 who:=public.aurvex_shop_actor();
 insert into public.aurvex_shop_wallets(user_id,balance) values(who,500)
 on conflict(user_id) do nothing returning user_id into inserted;
 if inserted is not null then
   insert into public.aurvex_shop_ledger(user_id,points_delta,reason)
   values(who,500,'welcome');
 end if;
end $$;
revoke all on function public.aurvex_shop_bootstrap() from public,anon;
grant execute on function public.aurvex_shop_bootstrap() to authenticated;

create or replace function public.aurvex_shop_state()
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; result jsonb;
begin
 who:=public.aurvex_shop_actor();
 perform public.aurvex_shop_bootstrap();
 select jsonb_build_object(
  'balance',w.balance,
  'inventory',coalesce((select jsonb_agg(jsonb_build_object('item_id',i.item_id,'obtained_by',i.obtained_by)
    order by i.acquired_at) from public.aurvex_shop_inventory i where i.user_id=who),'[]'::jsonb),
  'equipped',coalesce((select jsonb_build_object('avatar',e.avatar_item,'profile',e.profile_item)
    from public.aurvex_shop_equipped e where e.user_id=who),
    '{"avatar":null,"profile":null}'::jsonb),
  'history',coalesce((select jsonb_agg(to_jsonb(l) order by l.id desc)
    from (select points_delta,reason,item_id,created_at,id
      from public.aurvex_shop_ledger where user_id=who order by id desc limit 15) l),'[]'::jsonb)
 ) into result from public.aurvex_shop_wallets w where w.user_id=who;
 return coalesce(result,'{}'::jsonb);
end $$;
revoke all on function public.aurvex_shop_state() from public,anon;
grant execute on function public.aurvex_shop_state() to authenticated;

create or replace function public.aurvex_shop_buy_points(product text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; item record; current_balance integer;
begin
 who:=public.aurvex_shop_actor();
 if product is null or length(product)>48 then raise exception 'INVALID_ITEM';end if;
 perform public.aurvex_shop_bootstrap();
 select i.id,i.price_points from public.aurvex_shop_items i
 where i.id=product and i.active into item;
 if not found then raise exception 'ITEM_NOT_FOUND';end if;
 -- Serialize every purchase per user, including repeated clicks/devices.
 select w.balance into current_balance from public.aurvex_shop_wallets w
 where w.user_id=who for update;
 if exists(select 1 from public.aurvex_shop_inventory x where x.user_id=who and x.item_id=product) then
   raise exception 'ITEM_ALREADY_OWNED';
 end if;
 if current_balance<item.price_points then raise exception 'INSUFFICIENT_POINTS';end if;
 update public.aurvex_shop_wallets set balance=balance-item.price_points where user_id=who;
 insert into public.aurvex_shop_inventory(user_id,item_id,obtained_by) values(who,product,'points');
 insert into public.aurvex_shop_ledger(user_id,points_delta,reason,item_id)
 values(who,-item.price_points,'purchase',product);
 return jsonb_build_object('item_id',product,'balance',current_balance-item.price_points);
end $$;
revoke all on function public.aurvex_shop_buy_points(text) from public,anon;
grant execute on function public.aurvex_shop_buy_points(text) to authenticated;

create or replace function public.aurvex_shop_equip(product text,kind_requested text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; item_kind text; av text; pf text;
begin
 who:=public.aurvex_shop_actor();
 if kind_requested not in ('avatar','profile') then raise exception 'INVALID_KIND';end if;
 if product is not null then
  select s.kind into item_kind from public.aurvex_shop_items s
   join public.aurvex_shop_inventory i on i.item_id=s.id
   where s.id=product and s.active and i.user_id=who;
  if item_kind is distinct from kind_requested then raise exception 'ITEM_NOT_OWNED';end if;
 end if;
 insert into public.aurvex_shop_equipped(user_id,avatar_item,profile_item)
 values(who,case when kind_requested='avatar' then product else null end,
  case when kind_requested='profile' then product else null end)
 on conflict(user_id) do update set
 avatar_item=case when kind_requested='avatar' then excluded.avatar_item else aurvex_shop_equipped.avatar_item end,
 profile_item=case when kind_requested='profile' then excluded.profile_item else aurvex_shop_equipped.profile_item end,
 updated_at=now();
 select avatar_item,profile_item into av,pf from public.aurvex_shop_equipped where user_id=who;
 return jsonb_build_object('avatar',av,'profile',pf);
end $$;
revoke all on function public.aurvex_shop_equip(text,text) from public,anon;
grant execute on function public.aurvex_shop_equip(text,text) to authenticated;

-- Public read only of equipped cosmetics; wallet & purchases stay private.
create or replace function public.aurvex_shop_public_equipped(target_player uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'avatar',(select s.id from public.aurvex_shop_inventory i
   join public.aurvex_shop_items s on s.id=i.item_id
   where i.user_id=target_player and s.active and s.kind='avatar' and
     s.id=e.avatar_item limit 1),
 'profile',(select s.id from public.aurvex_shop_inventory i
   join public.aurvex_shop_items s on s.id=i.item_id
   where i.user_id=target_player and s.active and s.kind='profile' and
     s.id=e.profile_item limit 1))
 from public.aurvex_shop_equipped e
 join public.id_profiles p on p.id=e.user_id
 where e.user_id=target_player and p.nickname is not null
$$;
revoke all on function public.aurvex_shop_public_equipped(uuid) from public;
grant execute on function public.aurvex_shop_public_equipped(uuid) to anon,authenticated;

-- Payments in UAH MUST be fulfilled only after a verified merchant-side
-- webhook in a future release; no browser RPC for granting UAH inventory.
