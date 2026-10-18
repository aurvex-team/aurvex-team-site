create table if not exists public.aurvex_site_admins(
 user_id uuid primary key references auth.users(id) on delete cascade,
 added_at timestamptz not null default now()
);
create table if not exists public.aurvex_site_bans(
 user_id uuid primary key references auth.users(id) on delete cascade,
 banned_until timestamptz not null,
 reason text not null default 'Community rules violation',
 banned_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.aurvex_site_admins enable row level security;
alter table public.aurvex_site_bans enable row level security;
revoke all on public.aurvex_site_admins,public.aurvex_site_bans from public,anon,authenticated;
