-- Ensure anonymous visitors can retrieve the read-only catalog through PostgREST.
grant select on public.aurvex_shop_items to anon,authenticated;
-- Keep all wallet and inventory mutations exclusively server-owned.
revoke all on public.aurvex_shop_wallets,public.aurvex_shop_ledger,
 public.aurvex_shop_inventory,public.aurvex_shop_equipped from public,anon,authenticated;

create or replace function public.aurvex_shop_equip(product text,kind_requested text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; item_kind text; av text; pf text;
begin
 who:=public.aurvex_shop_actor();
 if kind_requested is null or kind_requested not in ('avatar','profile') then
   raise exception 'INVALID_KIND';
 end if;
 if product is not null then
  select s.kind into item_kind from public.aurvex_shop_items s
   join public.aurvex_shop_inventory i on i.item_id=s.id
   where s.id=product and s.active and i.user_id=who;
  if item_kind is distinct from kind_requested then
    raise exception 'ITEM_NOT_OWNED';
  end if;
 end if;
 insert into public.aurvex_shop_equipped as e(user_id,avatar_item,profile_item)
 values(who,case when kind_requested='avatar' then product else null end,
  case when kind_requested='profile' then product else null end)
 on conflict(user_id) do update set
 avatar_item=case when kind_requested='avatar' then excluded.avatar_item else e.avatar_item end,
 profile_item=case when kind_requested='profile' then excluded.profile_item else e.profile_item end,
 updated_at=now();
 select avatar_item,profile_item into av,pf from public.aurvex_shop_equipped where user_id=who;
 return jsonb_build_object('avatar',av,'profile',pf);
end $$;
revoke all on function public.aurvex_shop_equip(text,text) from public,anon;
grant execute on function public.aurvex_shop_equip(text,text) to authenticated;
