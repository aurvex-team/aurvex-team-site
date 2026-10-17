-- AURVEX ID social-style profile media + wishlist synchronization.
-- Only apply to the standalone aurvex-id Supabase project.
-- Public uploads will be readable by anyone with their URL. Never put private photos here.

alter table public.id_profiles
  add column if not exists avatar_path text,
  add column if not exists banner_path text;

-- The path must always belong to the profile owner. Do not allow a user to
-- reference another account's storage files as their own.
alter table public.id_profiles
  drop constraint if exists id_profiles_avatar_path_owner;
alter table public.id_profiles
  add constraint id_profiles_avatar_path_owner
  check (avatar_path is null or (
    split_part(avatar_path,'/',1)=id::text and
    split_part(avatar_path,'/',2) ~ '^avatar-[0-9a-f-]{36}\.(jpg|png|webp)$'
  ));
alter table public.id_profiles
  drop constraint if exists id_profiles_banner_path_owner;
alter table public.id_profiles
  add constraint id_profiles_banner_path_owner
  check (banner_path is null or (
    split_part(banner_path,'/',1)=id::text and
    split_part(banner_path,'/',2) ~ '^banner-[0-9a-f-]{36}\.(jpg|png|webp|gif)$'
  ));

-- Constrain uploads to raster images, GIFs and 8 MB at the bucket level.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('aurvex-profile-media','aurvex-profile-media',true,8388608,
  array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Users may create/remove only their own avatar/banner files.
-- NO anonymous writes, NO user overwrites of another user's files.
drop policy if exists "aurvex_media_insert_own" on storage.objects;
drop policy if exists "aurvex_media_delete_own" on storage.objects;
create policy "aurvex_media_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id='aurvex-profile-media'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and storage.filename(name) ~ '^(avatar|banner)-[0-9a-f-]{36}\.(jpg|png|webp|gif)$'
  and (
    (storage.filename(name) ~ '^avatar-' and storage.filename(name) !~ '\.gif$') or
    (storage.filename(name) ~ '^banner-')
  )
);
create policy "aurvex_media_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id='aurvex-profile-media'
  and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- Storage DELETE requires select visibility under RLS.
drop policy if exists "aurvex_media_select_own" on storage.objects;
create policy "aurvex_media_select_own"
on storage.objects for select to authenticated
using (
  bucket_id='aurvex-profile-media'
  and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- Realtime change events for owner-scoped wishlist, with RLS on the table.
do $$
begin
  if not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public' and tablename='id_wishlist'
  ) then
    alter publication supabase_realtime add table public.id_wishlist;
  end if;
end $$;
