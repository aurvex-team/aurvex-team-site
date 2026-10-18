-- AURVEX Inventory & 1:1 trade v1. No client-side minting or payment.
-- Legacy price_points/obtained_by labels stay for compatibility; consumer currency is Stars.
create table if not exists public.aurvex_game_inventory(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 game_id text not null check(game_id ~ '^[a-z0-9_-]{2,60}$'),
 item_code text not null check(item_code ~ '^[a-z0-9_-]{2,80}$'),
 display_name text not null check(char_length(display_name) between 2 and 90 and display_name !~ '[<>[:cntrl:]]'),
 tradable boolean not null default false,
 acquired_at timestamptz not null default now()
);
create index if not exists aurvex_game_inventory_owner on public.aurvex_game_inventory(owner_id);
create table if not exists public.aurvex_trade_offers(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 receiver_id uuid not null references auth.users(id) on delete cascade,
 offered_kind text not null check(offered_kind in ('cosmetic','game')),
 offered_ref text not null check(char_length(offered_ref) between 3 and 80),
 requested_kind text not null check(requested_kind in ('cosmetic','game')),
 requested_ref text not null check(char_length(requested_ref) between 3 and 80),
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '48 hours'),
 decided_at timestamptz,
 constraint aurvex_trade_distinct_people check(sender_id<>receiver_id),
 constraint aurvex_trade_nonidentical check(not(offered_kind=requested_kind and offered_ref=requested_ref))
);
create index if not exists aurvex_trade_sender_idx on public.aurvex_trade_offers(sender_id,created_at desc);
create index if not exists aurvex_trade_receiver_idx on public.aurvex_trade_offers(receiver_id,created_at desc);
alter table public.aurvex_game_inventory enable row level security;
alter table public.aurvex_trade_offers enable row level security;
revoke all on public.aurvex_game_inventory,public.aurvex_trade_offers from public,anon,authenticated;

-- Helper functions are deliberately unavailable to browser roles.
create or replace function public.aurvex_trade_are_friends(a uuid,b uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.id_friendships f where f.user_a=least(a,b) and
 f.user_b=greatest(a,b) and f.status='accepted')
 and not exists(select 1 from public.id_social_blocks bl
   where (bl.blocker=a and bl.blocked=b) or (bl.blocker=b and bl.blocked=a));
$$;
revoke all on function public.aurvex_trade_are_friends(uuid,uuid) from public,anon,authenticated;

create or replace function public.aurvex_trade_owned(who uuid,item_kind text,ref text)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if item_kind='cosmetic' then
   return exists(select 1 from public.aurvex_shop_inventory i
     join public.aurvex_shop_items s on s.id=i.item_id
     where i.user_id=who and i.item_id=ref and s.active);
 elsif item_kind='game' then
   return exists(select 1 from public.aurvex_game_inventory g
     where g.owner_id=who and g.id::text=ref and g.tradable);
 end if;
 return false;
end $$;
revoke all on function public.aurvex_trade_owned(uuid,text,text) from public,anon,authenticated;

create or replace function public.aurvex_inventory_state()
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 return jsonb_build_object(
  'gameItems',coalesce((select jsonb_agg(jsonb_build_object(
    'id',g.id::text,'game_id',g.game_id,'item_code',g.item_code,
    'name',g.display_name,'tradable',g.tradable) order by g.acquired_at desc)
     from public.aurvex_game_inventory g where g.owner_id=who),'[]'::jsonb),
  'offers',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc)
   from (select o.id,o.sender_id,o.receiver_id,o.offered_kind,o.offered_ref,
       o.requested_kind,o.requested_ref,o.status,o.created_at,o.expires_at,
       p.nickname as peer_nickname
     from public.aurvex_trade_offers o
     left join public.id_profiles p on p.id=case when o.sender_id=who then o.receiver_id else o.sender_id end
     where (o.sender_id=who or o.receiver_id=who)
       and (o.status='pending' or o.created_at>now()-interval '14 days')
     order by o.created_at desc limit 40) x),'[]'::jsonb)
 );
end $$;
revoke all on function public.aurvex_inventory_state() from public,anon;
grant execute on function public.aurvex_inventory_state() to authenticated;

create or replace function public.aurvex_trade_create(
 target_player uuid, offered_kind text, offered_ref text,
 requested_kind text, requested_ref text)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; new_id uuid;
begin
 who:=public.aurvex_shop_actor();
 if target_player is null or target_player=who or
   offered_kind not in ('cosmetic','game') or requested_kind not in ('cosmetic','game') or
   offered_ref is null or requested_ref is null or
   length(offered_ref) not between 3 and 80 or length(requested_ref) not between 3 and 80 or
   (offered_kind=requested_kind and offered_ref=requested_ref) then
     raise exception 'INVALID_TRADE';
 end if;
 if not public.aurvex_trade_are_friends(who,target_player) then raise exception 'TRADE_FRIEND_REQUIRED'; end if;
 if not public.aurvex_trade_owned(who,offered_kind,offered_ref) or
    not public.aurvex_trade_owned(target_player,requested_kind,requested_ref) then
   raise exception 'TRADE_ITEM_NOT_OWNED';
 end if;
 if (select count(*) from public.aurvex_trade_offers
    where sender_id=who and status='pending' and expires_at>now())>=10
    then raise exception 'TRADE_TOO_MANY'; end if;
 insert into public.aurvex_trade_offers(sender_id,receiver_id,
   offered_kind,offered_ref,requested_kind,requested_ref)
 values(who,target_player,offered_kind,offered_ref,requested_kind,requested_ref)
 returning id into new_id;
 return new_id;
end $$;
revoke all on function public.aurvex_trade_create(uuid,text,text,text,text) from public,anon;
grant execute on function public.aurvex_trade_create(uuid,text,text,text,text) to authenticated;

create or replace function public.aurvex_trade_action(offer_id uuid,decision text)
returns text language plpgsql security definer set search_path='' as $$
declare who uuid; o public.aurvex_trade_offers%rowtype;
begin
 who:=public.aurvex_shop_actor();
 if decision not in ('accept','decline','cancel') or offer_id is null then
  raise exception 'INVALID_TRADE_ACTION'; end if;
 select * into o from public.aurvex_trade_offers where id=offer_id for update;
 if not found or o.status<>'pending' then raise exception 'TRADE_NOT_PENDING'; end if;
 if o.expires_at<=now() then raise exception 'TRADE_EXPIRED'; end if;
 if (decision='cancel' and who<>o.sender_id) or
    (decision in ('accept','decline') and who<>o.receiver_id) then
    raise exception 'TRADE_NOT_ALLOWED'; end if;
 if decision='accept' then
   if not public.aurvex_trade_are_friends(o.sender_id,o.receiver_id) then raise exception 'TRADE_FRIEND_REQUIRED'; end if;
   -- Lock inventory entries in a consistent order before checking and moving ownership.
   perform 1 from public.aurvex_shop_inventory i
     where (o.offered_kind='cosmetic' and i.user_id=o.sender_id and i.item_id=o.offered_ref)
        or (o.requested_kind='cosmetic' and i.user_id=o.receiver_id and i.item_id=o.requested_ref)
     order by i.user_id,i.item_id for update;
   perform 1 from public.aurvex_game_inventory g
     where (o.offered_kind='game' and g.owner_id=o.sender_id and g.id::text=o.offered_ref)
        or (o.requested_kind='game' and g.owner_id=o.receiver_id and g.id::text=o.requested_ref)
     order by g.id for update;
   if not public.aurvex_trade_owned(o.sender_id,o.offered_kind,o.offered_ref) or
      not public.aurvex_trade_owned(o.receiver_id,o.requested_kind,o.requested_ref) then
      raise exception 'TRADE_ITEM_NOT_OWNED'; end if;
   if (o.offered_kind='cosmetic' and exists(select 1 from public.aurvex_shop_inventory
          where user_id=o.receiver_id and item_id=o.offered_ref)) or
      (o.requested_kind='cosmetic' and exists(select 1 from public.aurvex_shop_inventory
          where user_id=o.sender_id and item_id=o.requested_ref)) then
      raise exception 'TRADE_ALREADY_OWNED'; end if;
   -- Both ownership changes and offer confirmation commit atomically.
   if o.offered_kind='cosmetic' then
     update public.aurvex_shop_inventory set user_id=o.receiver_id,acquired_at=now()
       where user_id=o.sender_id and item_id=o.offered_ref;
     update public.aurvex_shop_equipped set avatar_item=null where user_id=o.sender_id and avatar_item=o.offered_ref;
     update public.aurvex_shop_equipped set profile_item=null where user_id=o.sender_id and profile_item=o.offered_ref;
   else
     update public.aurvex_game_inventory set owner_id=o.receiver_id,acquired_at=now()
       where owner_id=o.sender_id and id::text=o.offered_ref;
   end if;
   if o.requested_kind='cosmetic' then
     update public.aurvex_shop_inventory set user_id=o.sender_id,acquired_at=now()
       where user_id=o.receiver_id and item_id=o.requested_ref;
     update public.aurvex_shop_equipped set avatar_item=null where user_id=o.receiver_id and avatar_item=o.requested_ref;
     update public.aurvex_shop_equipped set profile_item=null where user_id=o.receiver_id and profile_item=o.requested_ref;
   else
     update public.aurvex_game_inventory set owner_id=o.sender_id,acquired_at=now()
       where owner_id=o.receiver_id and id::text=o.requested_ref;
   end if;
 end if;
 update public.aurvex_trade_offers set status=case when decision='accept' then 'accepted'
   when decision='decline' then 'declined' else 'cancelled' end,
   decided_at=now() where id=offer_id;
 return decision;
end $$;
revoke all on function public.aurvex_trade_action(uuid,text) from public,anon;
grant execute on function public.aurvex_trade_action(uuid,text) to authenticated;
