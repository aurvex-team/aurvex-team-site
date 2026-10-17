-- AURVEX ID public profile v1: public identity projection only.
alter table public.id_profiles
 add column if not exists public_links jsonb not null default '[]'::jsonb,
 add column if not exists wishlist_public boolean not null default false;

create or replace function public.aurvex_valid_links(input jsonb)
returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(input) <> 'array' or jsonb_array_length(input)>3 then false
   else not exists (
    select 1 from jsonb_array_elements(input) as item(v)
    where jsonb_typeof(item.v) <> 'object'
      or (select count(*) from jsonb_object_keys(item.v)) <> 2
      or not (item.v ? 'title' and item.v ? 'url')
      or jsonb_typeof(item.v->'title') <> 'string'
      or jsonb_typeof(item.v->'url') <> 'string'
      or length(item.v->>'title') not between 1 and 40
      or length(item.v->>'url') not between 9 and 220
      or (item.v->>'url') !~* '^https://[A-Za-z0-9.-]+(:[0-9]{2,5})?(/[^[:space:]]*)?$'
      or (item.v->>'url') ~* '[<>"'']'
   )
  end
$$;
alter table public.id_profiles
 drop constraint if exists id_profiles_valid_public_links;
alter table public.id_profiles
 add constraint id_profiles_valid_public_links check(public.aurvex_valid_links(public_links));

-- This RPC never exposes auth.users, email, MFA codes, entitlements, friend
-- records or non-public Wishlist. No direct public SELECT is granted.
create or replace function public.aurvex_public_profile(target_player uuid)
returns table(player_id uuid,nickname text,avatar_path text,banner_path text,
   joined_at timestamptz,public_links jsonb,wishlist_visible boolean,wishlist_products text[])
language plpgsql stable security definer set search_path=''
as $$
begin
 if target_player is null then return; end if;
 return query
 select p.id,p.nickname,p.avatar_path,p.banner_path,p.created_at,p.public_links,p.wishlist_public,
   case when p.wishlist_public then
     coalesce((select array_agg(w.product_id order by w.product_id)
       from public.id_wishlist w where w.user_id=p.id),array[]::text[])
   else array[]::text[] end
 from public.id_profiles p
 where p.id=target_player and p.nickname is not null;
end $$;
revoke all on function public.aurvex_public_profile(uuid) from public;
grant execute on function public.aurvex_public_profile(uuid) to anon,authenticated;
