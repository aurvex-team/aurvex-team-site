-- Friend-only inventory preview; no wallet or private data is exposed.
create or replace function public.aurvex_trade_peer_items(target_player uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if target_player is null or target_player=who or
    not public.aurvex_trade_are_friends(who,target_player) then
    raise exception 'TRADE_FRIEND_REQUIRED';
 end if;
 return coalesce((
 select jsonb_agg(x.obj order by x.sort_key) from (
  select 1 as sort_key,jsonb_build_object('kind','cosmetic','ref',i.item_id,
    'name',i.item_id,'tradable',true) as obj
    from public.aurvex_shop_inventory i
    join public.aurvex_shop_items s on s.id=i.item_id and s.active
    where i.user_id=target_player
  union all
  select 2 as sort_key,jsonb_build_object('kind','game','ref',g.id::text,
    'name',g.display_name,'game_id',g.game_id,'tradable',true) as obj
    from public.aurvex_game_inventory g
    where g.owner_id=target_player and g.tradable
 ) x),'[]'::jsonb);
end $$;
revoke all on function public.aurvex_trade_peer_items(uuid) from public,anon;
grant execute on function public.aurvex_trade_peer_items(uuid) to authenticated;
