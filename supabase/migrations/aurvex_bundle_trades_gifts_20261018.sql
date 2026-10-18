-- AURVEX Trading v2: item bundles, optional empty return (gift), whole tradable inventory selection.
-- A trade records an immutable explicit list: later-acquired items are NEVER added automatically.
alter table public.aurvex_trade_offers
 add column if not exists offered_items jsonb,
 add column if not exists requested_items jsonb;
alter table public.aurvex_trade_offers
 alter column offered_kind drop not null,
 alter column offered_ref drop not null,
 alter column requested_kind drop not null,
 alter column requested_ref drop not null;

create or replace function public.aurvex_trade_validate_bundle(items jsonb,allow_empty boolean)
returns void language plpgsql immutable security invoker set search_path='' as $$
declare entry jsonb; k text; r text;
begin
 if items is null or jsonb_typeof(items)<>'array' then raise exception 'TRADE_INVALID_BUNDLE';end if;
 if (not allow_empty and jsonb_array_length(items)=0) or jsonb_array_length(items)>500 then
  raise exception 'TRADE_BUNDLE_SIZE';end if;
 if (select count(*) from (select x->>'kind' k,x->>'ref' r
     from jsonb_array_elements(items) x group by 1,2) v)<>jsonb_array_length(items) then
  raise exception 'TRADE_DUPLICATE_ITEM';end if;
 for entry in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(entry)<>'object' or jsonb_typeof(entry->'kind')<>'string'
     or jsonb_typeof(entry->'ref')<>'string' then raise exception 'TRADE_INVALID_ITEM';end if;
  k:=entry->>'kind';r:=entry->>'ref';
  if (k='cosmetic' and r !~ '^[a-z0-9_-]{3,48}$') or
     (k='game' and r !~ '^[a-f0-9-]{36}$') or
     k not in ('cosmetic','game') then raise exception 'TRADE_INVALID_ITEM';end if;
 end loop;
end $$;
revoke all on function public.aurvex_trade_validate_bundle(jsonb,boolean) from public,anon,authenticated;

create or replace function public.aurvex_trade_create_bundle(
 target_player uuid, offered_items jsonb, requested_items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; new_id uuid; it record;
begin
 who:=public.aurvex_shop_actor();
 if target_player is null or target_player=who then raise exception 'TRADE_INVALID_TARGET';end if;
 perform public.aurvex_trade_validate_bundle(offered_items,false);
 perform public.aurvex_trade_validate_bundle(requested_items,true);
 if not public.aurvex_trade_are_friends(who,target_player) then
   raise exception 'TRADE_FRIEND_REQUIRED';end if;
 if exists(select 1 from jsonb_array_elements(offered_items) a
    join jsonb_array_elements(requested_items) b
      on a->>'kind'=b->>'kind' and a->>'ref'=b->>'ref') then
    raise exception 'TRADE_DUPLICATE_ITEM';end if;
 for it in
  select who as owner_id,e->>'kind' kind,e->>'ref' ref from jsonb_array_elements(offered_items) e
  union all
  select target_player,e->>'kind',e->>'ref' from jsonb_array_elements(requested_items) e
 loop
  if not public.aurvex_trade_owned(it.owner_id,it.kind,it.ref) then
    raise exception 'TRADE_ITEM_NOT_OWNED';end if;
 end loop;
 if (select count(*) from public.aurvex_trade_offers
     where sender_id=who and status='pending' and expires_at>now())>=10 then
   raise exception 'TRADE_TOO_MANY';end if;
 insert into public.aurvex_trade_offers(sender_id,receiver_id,
   offered_items,requested_items,offered_kind,offered_ref,requested_kind,requested_ref)
 values(who,target_player,offered_items,requested_items,null,null,null,null)
 returning id into new_id;
 return new_id;
end $$;
revoke all on function public.aurvex_trade_create_bundle(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.aurvex_trade_create_bundle(uuid,jsonb,jsonb) to authenticated;

-- The complete offer is returned only to its two participants.
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
   from (select o.id,o.sender_id,o.receiver_id,
       o.offered_kind,o.offered_ref,o.requested_kind,o.requested_ref,
       coalesce(o.offered_items,case when o.offered_kind is not null
         then jsonb_build_array(jsonb_build_object('kind',o.offered_kind,'ref',o.offered_ref))
         else '[]'::jsonb end) as offered_items,
       coalesce(o.requested_items,case when o.requested_kind is not null
         then jsonb_build_array(jsonb_build_object('kind',o.requested_kind,'ref',o.requested_ref))
         else '[]'::jsonb end) as requested_items,
       o.status,o.created_at,o.expires_at,
       p.nickname as peer_nickname
     from public.aurvex_trade_offers o
     left join public.id_profiles p
       on p.id=case when o.sender_id=who then o.receiver_id else o.sender_id end
     where (o.sender_id=who or o.receiver_id=who)
       and (o.status='pending' or o.created_at>now()-interval '14 days')
     order by o.created_at desc limit 40) x),'[]'::jsonb)
 );
end $$;
revoke all on function public.aurvex_inventory_state() from public,anon;
grant execute on function public.aurvex_inventory_state() to authenticated;

-- Recheck every selected item under inventory locks, then move ALL in the same transaction.
create or replace function public.aurvex_trade_action(offer_id uuid,decision text)
returns text language plpgsql security definer set search_path='' as $$
declare who uuid; o public.aurvex_trade_offers%rowtype;
 sender_items jsonb; receiver_items jsonb; it record;
begin
 who:=public.aurvex_shop_actor();
 if decision not in ('accept','decline','cancel') or offer_id is null then
  raise exception 'INVALID_TRADE_ACTION';end if;
 select * into o from public.aurvex_trade_offers where id=offer_id for update;
 if not found or o.status<>'pending' then raise exception 'TRADE_NOT_PENDING';end if;
 if o.expires_at<=now() then raise exception 'TRADE_EXPIRED';end if;
 if (decision='cancel' and who<>o.sender_id) or
    (decision in ('accept','decline') and who<>o.receiver_id) then
    raise exception 'TRADE_NOT_ALLOWED';end if;
 if decision='accept' then
   if not public.aurvex_trade_are_friends(o.sender_id,o.receiver_id) then
     raise exception 'TRADE_FRIEND_REQUIRED';end if;
   sender_items:=coalesce(o.offered_items,case when o.offered_kind is not null
       then jsonb_build_array(jsonb_build_object('kind',o.offered_kind,'ref',o.offered_ref))
       else '[]'::jsonb end);
   receiver_items:=coalesce(o.requested_items,case when o.requested_kind is not null
       then jsonb_build_array(jsonb_build_object('kind',o.requested_kind,'ref',o.requested_ref))
       else '[]'::jsonb end);
   perform public.aurvex_trade_validate_bundle(sender_items,false);
   perform public.aurvex_trade_validate_bundle(receiver_items,true);
   -- Lock both players' tradable and nontradable inventory rows in a stable order.
   perform 1 from public.aurvex_shop_inventory i
     where i.user_id in (o.sender_id,o.receiver_id)
     order by i.user_id,i.item_id for update;
   perform 1 from public.aurvex_game_inventory g
     where g.owner_id in (o.sender_id,o.receiver_id)
     order by g.id for update;
   -- Validate every movement BEFORE applying any, so no partial/gift surprise.
   for it in
    select o.sender_id as src,o.receiver_id as dest,
      e->>'kind' as kind,e->>'ref' as ref from jsonb_array_elements(sender_items) e
    union all
    select o.receiver_id,o.sender_id,
      e->>'kind',e->>'ref' from jsonb_array_elements(receiver_items) e
   loop
    if not public.aurvex_trade_owned(it.src,it.kind,it.ref) then
      raise exception 'TRADE_ITEM_NOT_OWNED';end if;
    if it.kind='cosmetic' and exists(select 1 from public.aurvex_shop_inventory
       where user_id=it.dest and item_id=it.ref) then
      raise exception 'TRADE_ALREADY_OWNED';end if;
   end loop;
   for it in
    select o.sender_id as src,o.receiver_id as dest,
      e->>'kind' as kind,e->>'ref' as ref from jsonb_array_elements(sender_items) e
    union all
    select o.receiver_id,o.sender_id,
      e->>'kind',e->>'ref' from jsonb_array_elements(receiver_items) e
   loop
    if it.kind='cosmetic' then
     update public.aurvex_shop_inventory
       set user_id=it.dest,acquired_at=now()
       where user_id=it.src and item_id=it.ref;
     if not found then raise exception 'TRADE_ITEM_MOVED';end if;
     update public.aurvex_shop_equipped set avatar_item=null
       where user_id=it.src and avatar_item=it.ref;
     update public.aurvex_shop_equipped set profile_item=null
       where user_id=it.src and profile_item=it.ref;
    else
     update public.aurvex_game_inventory
       set owner_id=it.dest,acquired_at=now()
       where owner_id=it.src and id::text=it.ref and tradable;
     if not found then raise exception 'TRADE_ITEM_MOVED';end if;
    end if;
   end loop;
 end if;
 update public.aurvex_trade_offers set status=case when decision='accept' then 'accepted'
   when decision='decline' then 'declined' else 'cancelled' end,
   decided_at=now() where id=offer_id;
 return decision;
end $$;
revoke all on function public.aurvex_trade_action(uuid,text) from public,anon;
grant execute on function public.aurvex_trade_action(uuid,text) to authenticated;
