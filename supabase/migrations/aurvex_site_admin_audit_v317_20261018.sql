create table if not exists public.aurvex_site_ban_audit(
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 target_user uuid not null references auth.users(id),
 action text not null check(action in ('ban_site','unban_site')),
 reason text not null,
 created_at timestamptz not null default now()
);
alter table public.aurvex_site_ban_audit enable row level security;
revoke all on public.aurvex_site_ban_audit from public,anon,authenticated;