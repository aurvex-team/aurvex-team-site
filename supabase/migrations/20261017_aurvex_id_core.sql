-- AURVEX ID initial production schema for a NEW dedicated Supabase project.
-- Do not apply to the existing XONI Mail Supabase project.
-- Authorization must be through Supabase Auth; do NOT authenticate by nickname or email strings.
-- All ownership checks use verified auth.uid(), never caller-submitted identity claims.

create table if not exists public.id_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname text null check (nickname is null or nickname ~ '^[A-Za-z0-9_]{3,24}$'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create unique index if not exists id_profiles_nickname_lower_unique
 on public.id_profiles (lower(nickname)) where nickname is not null;

alter table public.id_profiles enable row level security;
revoke all on public.id_profiles from public, anon;
grant select, insert, update on public.id_profiles to authenticated;
drop policy if exists "profiles_read_own" on public.id_profiles;
drop policy if exists "profiles_insert_own" on public.id_profiles;
drop policy if exists "profiles_update_own" on public.id_profiles;
create policy "profiles_read_own" on public.id_profiles for select to authenticated
 using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.id_profiles for insert to authenticated
 with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.id_profiles for update to authenticated
 using ((select auth.uid()) = id)
 with check ((select auth.uid()) = id);

create table if not exists public.id_wishlist (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null check (product_id in ('devive')),
 created_at timestamptz not null default now(),
 primary key(user_id,product_id)
);
create index if not exists id_wishlist_user_idx on public.id_wishlist(user_id);
alter table public.id_wishlist enable row level security;
revoke all on public.id_wishlist from public, anon;
grant select, insert, delete on public.id_wishlist to authenticated;
revoke update on public.id_wishlist from authenticated;
drop policy if exists "wishlist_read_own" on public.id_wishlist;
drop policy if exists "wishlist_insert_own" on public.id_wishlist;
drop policy if exists "wishlist_delete_own" on public.id_wishlist;
create policy "wishlist_read_own" on public.id_wishlist for select to authenticated
 using ((select auth.uid()) = user_id);
create policy "wishlist_insert_own" on public.id_wishlist for insert to authenticated
 with check ((select auth.uid()) = user_id);
create policy "wishlist_delete_own" on public.id_wishlist for delete to authenticated
 using ((select auth.uid()) = user_id);

-- Launcher library entitlements must ONLY be minted by a trusted backend.
-- No client-side INSERT/UPDATE/DELETE grants or policies.
create table if not exists public.id_entitlements (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null,
 source text not null check (source in ('free_grant','purchase','developer')),
 created_at timestamptz not null default now(),
 primary key(user_id,product_id)
);
create index if not exists id_entitlements_user_idx on public.id_entitlements(user_id);
alter table public.id_entitlements enable row level security;
revoke all on public.id_entitlements from public, anon, authenticated;
grant select on public.id_entitlements to authenticated;
drop policy if exists "entitlements_read_own" on public.id_entitlements;
create policy "entitlements_read_own" on public.id_entitlements for select to authenticated
 using ((select auth.uid()) = user_id);

-- Optional: update timestamps may be managed by a future trusted API.
-- No policy allows the frontend to award itself purchased games.
