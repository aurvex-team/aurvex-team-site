create table if not exists public.aurvex_game_playtime (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  total_seconds bigint not null default 0 check (total_seconds >= 0),
  launch_count integer not null default 0 check (launch_count >= 0),
  first_played_at timestamptz,
  last_played_at timestamptz,
  primary key (user_id, game_id)
);

create table if not exists public.aurvex_game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  started_at timestamptz not null default clock_timestamp(),
  heartbeat_at timestamptz not null default clock_timestamp(),
  ended_at timestamptz
);

alter table public.aurvex_game_playtime enable row level security;
alter table public.aurvex_game_sessions enable row level security;
revoke all on public.aurvex_game_playtime, public.aurvex_game_sessions from public, anon, authenticated;

create or replace function public.aurvex_game_library_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
  v_games jsonb;
begin
  with owned as (
    select e.product_id as game_id, e.created_at as acquired_at
      from public.id_entitlements e where e.user_id = v_user
    union
    select g.game_id, min(g.acquired_at) as acquired_at
      from public.aurvex_game_inventory g where g.owner_id = v_user group by g.game_id
  ), combined as (
    select o.game_id, min(o.acquired_at) as acquired_at,
      coalesce(p.total_seconds, 0) as total_seconds,
      coalesce(p.launch_count, 0) as launch_count,
      p.first_played_at, p.last_played_at
    from owned o left join public.aurvex_game_playtime p
      on p.user_id = v_user and p.game_id = o.game_id
    group by o.game_id,p.total_seconds,p.launch_count,p.first_played_at,p.last_played_at
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_id',game_id,'acquired_at',acquired_at,'total_seconds',total_seconds,
    'launch_count',launch_count,'first_played_at',first_played_at,'last_played_at',last_played_at
  ) order by last_played_at desc nulls last,acquired_at desc),'[]'::jsonb)
  into v_games from combined;
  return jsonb_build_object('games',v_games);
end;
$$;

create or replace function public.aurvex_game_session_start(p_game_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
  v_session uuid;
begin
  if p_game_id is null or p_game_id !~ '^[a-z0-9][a-z0-9_-]{1,63}$' then
    raise exception 'Invalid game';
  end if;
  if not exists (select 1 from public.id_entitlements e where e.user_id=v_user and e.product_id=p_game_id)
     and not exists (select 1 from public.aurvex_game_inventory g where g.owner_id=v_user and g.game_id=p_game_id) then
    raise exception 'Game is not owned by this account';
  end if;
  update public.aurvex_game_sessions set ended_at=clock_timestamp()
    where user_id=v_user and ended_at is null;
  insert into public.aurvex_game_sessions(user_id,game_id) values(v_user,p_game_id) returning id into v_session;
  insert into public.aurvex_game_playtime(user_id,game_id,launch_count,first_played_at,last_played_at)
    values(v_user,p_game_id,1,clock_timestamp(),clock_timestamp())
    on conflict(user_id,game_id) do update set launch_count=public.aurvex_game_playtime.launch_count+1,
      first_played_at=coalesce(public.aurvex_game_playtime.first_played_at,excluded.first_played_at),
      last_played_at=excluded.last_played_at;
  return v_session;
end;
$$;

create or replace function public.aurvex_game_session_heartbeat(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
  v_game text;
  v_now timestamptz := clock_timestamp();
  v_delta integer;
begin
  select s.game_id,greatest(0,least(300,floor(extract(epoch from (v_now-s.heartbeat_at))::numeric))::integer)
    into v_game,v_delta from public.aurvex_game_sessions s
    where s.id=p_session_id and s.user_id=v_user and s.ended_at is null for update;
  if v_game is null then return 0; end if;
  update public.aurvex_game_sessions set heartbeat_at=v_now where id=p_session_id and user_id=v_user;
  update public.aurvex_game_playtime set total_seconds=total_seconds+v_delta,last_played_at=v_now
    where user_id=v_user and game_id=v_game;
  return v_delta;
end;
$$;

create or replace function public.aurvex_game_session_end(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := public.aurvex_shop_actor();
  v_game text;
  v_now timestamptz := clock_timestamp();
  v_delta integer;
begin
  select s.game_id,greatest(0,least(300,floor(extract(epoch from (v_now-s.heartbeat_at))::numeric))::integer)
    into v_game,v_delta from public.aurvex_game_sessions s
    where s.id=p_session_id and s.user_id=v_user and s.ended_at is null for update;
  if v_game is null then return 0; end if;
  update public.aurvex_game_sessions set ended_at=v_now,heartbeat_at=v_now where id=p_session_id and user_id=v_user;
  update public.aurvex_game_playtime set total_seconds=total_seconds+v_delta,last_played_at=v_now
    where user_id=v_user and game_id=v_game;
  return v_delta;
end;
$$;

revoke all on function public.aurvex_game_library_state() from public, anon;
revoke all on function public.aurvex_game_session_start(text) from public, anon;
revoke all on function public.aurvex_game_session_heartbeat(uuid) from public, anon;
revoke all on function public.aurvex_game_session_end(uuid) from public, anon;
grant execute on function public.aurvex_game_library_state() to authenticated;
grant execute on function public.aurvex_game_session_start(text) to authenticated;
grant execute on function public.aurvex_game_session_heartbeat(uuid) to authenticated;
grant execute on function public.aurvex_game_session_end(uuid) to authenticated;