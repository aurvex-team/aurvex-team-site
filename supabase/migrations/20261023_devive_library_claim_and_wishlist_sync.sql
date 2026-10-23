create or replace function public.aurvex_can_wishlist_devive()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
begin
  return not exists (
    select 1 from public.id_entitlements e
    where e.user_id = v_user and e.product_id = 'devive'
  ) and not exists (
    select 1 from public.aurvex_game_inventory g
    where g.owner_id = v_user and g.game_id = 'devive'
  );
end;
$$;

create or replace function public.aurvex_claim_devive()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
  v_added boolean := false;
begin
  if not exists (
    select 1 from public.id_entitlements e
    where e.user_id = v_user and e.product_id = 'devive'
  ) and not exists (
    select 1 from public.aurvex_game_inventory g
    where g.owner_id = v_user and g.game_id = 'devive'
  ) then
    insert into public.id_entitlements (user_id, product_id, source)
    values (v_user, 'devive', 'free_grant')
    on conflict (user_id, product_id) do nothing;
    v_added := found;
  end if;

  delete from public.id_wishlist
  where user_id = v_user and product_id = 'devive';

  return jsonb_build_object('game_id', 'devive', 'owned', true, 'added', v_added);
end;
$$;

drop policy if exists aurvex_wishlist_require_mfa on public.id_wishlist;
create policy aurvex_wishlist_require_mfa
on public.id_wishlist as restrictive
for all to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2')
with check ((select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists wishlist_insert_own on public.id_wishlist;
create policy wishlist_insert_own
on public.id_wishlist
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and public.aurvex_can_wishlist_devive()
);

revoke all on function public.aurvex_can_wishlist_devive() from public, anon;
revoke all on function public.aurvex_claim_devive() from public, anon;
grant execute on function public.aurvex_can_wishlist_devive() to authenticated;
grant execute on function public.aurvex_claim_devive() to authenticated;