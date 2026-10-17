-- AURVEX first-party team titles. Visual profile labels only:
-- NEVER grant admin, database writes, billing, moderator, or release powers.
-- The public can READ the two audited role codes; only database owner/service
-- migration can INSERT or UPDATE them. There is no user-facing setter.
create table if not exists public.id_profile_titles (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_code text not null check(title_code in ('aurvex_ceo','site_launcher_developer')),
  created_at timestamptz not null default now(),
  primary key (user_id,title_code)
);
create index if not exists id_profile_titles_code_idx
  on public.id_profile_titles(title_code);

alter table public.id_profile_titles enable row level security;
revoke all on public.id_profile_titles from public,anon,authenticated;
grant select(user_id,title_code) on public.id_profile_titles to anon,authenticated;

drop policy if exists "aurvex_profile_titles_public_read" on public.id_profile_titles;
create policy "aurvex_profile_titles_public_read" on public.id_profile_titles
 for select to anon,authenticated using(true);

-- Assign exclusively to AURVEX's known original 'fleki' developer account.
-- Both identity (immutable UUID) and current public nickname must match; a
-- similarly named or later account gets nothing. Nickname may change later.
insert into public.id_profile_titles(user_id,title_code)
select p.id,title.title_code
 from public.id_profiles p
 cross join (values ('aurvex_ceo'),('site_launcher_developer')) as title(title_code)
 where p.id='3e8ddb4b-2815-4863-9594-8ae11ed8e803'::uuid
   and p.nickname='fleki'
on conflict (user_id,title_code) do nothing;
