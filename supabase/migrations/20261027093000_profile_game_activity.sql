alter table public.id_profiles
 add column if not exists game_activity_public boolean not null default false;

create table if not exists public.aurvex_game_activity_daily(
 user_id uuid not null references auth.users(id) on delete cascade,
 game_id text not null check(game_id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
 activity_date date not null,
 total_seconds integer not null default 0 check(total_seconds between 0 and 86400),
 primary key(user_id,game_id,activity_date)
);
alter table public.aurvex_game_activity_daily enable row level security;
revoke all on public.aurvex_game_activity_daily from public,anon,authenticated;

create or replace function public.aurvex_game_session_heartbeat(p_session_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=public.aurvex_shop_actor();
 v_game text;v_now timestamptz:=clock_timestamp();v_delta integer;
begin
 select s.game_id,greatest(0,least(300,floor(extract(epoch from(v_now-s.heartbeat_at))::numeric))::integer)
 into v_game,v_delta from public.aurvex_game_sessions s
 where s.id=p_session_id and s.user_id=v_user and s.ended_at is null for update;
 if v_game is null then return 0;end if;
 update public.aurvex_game_sessions set heartbeat_at=v_now where id=p_session_id and user_id=v_user;
 update public.aurvex_game_playtime set total_seconds=total_seconds+v_delta,last_played_at=v_now
 where user_id=v_user and game_id=v_game;
 if v_delta>0 then
  insert into public.aurvex_game_activity_daily(user_id,game_id,activity_date,total_seconds)
  values(v_user,v_game,(v_now at time zone 'UTC')::date,v_delta)
  on conflict(user_id,game_id,activity_date) do update
   set total_seconds=least(86400,public.aurvex_game_activity_daily.total_seconds+excluded.total_seconds);
 end if;
 return v_delta;
end $$;

create or replace function public.aurvex_game_session_end(p_session_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=public.aurvex_shop_actor();
 v_game text;v_now timestamptz:=clock_timestamp();v_delta integer;
begin
 select s.game_id,greatest(0,least(300,floor(extract(epoch from(v_now-s.heartbeat_at))::numeric))::integer)
 into v_game,v_delta from public.aurvex_game_sessions s
 where s.id=p_session_id and s.user_id=v_user and s.ended_at is null for update;
 if v_game is null then return 0;end if;
 update public.aurvex_game_sessions set ended_at=v_now,heartbeat_at=v_now where id=p_session_id and user_id=v_user;
 update public.aurvex_game_playtime set total_seconds=total_seconds+v_delta,last_played_at=v_now
 where user_id=v_user and game_id=v_game;
 if v_delta>0 then
  insert into public.aurvex_game_activity_daily(user_id,game_id,activity_date,total_seconds)
  values(v_user,v_game,(v_now at time zone 'UTC')::date,v_delta)
  on conflict(user_id,game_id,activity_date) do update
   set total_seconds=least(86400,public.aurvex_game_activity_daily.total_seconds+excluded.total_seconds);
 end if;
 return v_delta;
end $$;

create or replace function public.aurvex_set_game_activity_public(show_activity boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=public.aurvex_shop_actor();
begin
 if show_activity is null then raise exception 'ACTIVITY_VISIBILITY_INVALID';end if;
 update public.id_profiles set game_activity_public=show_activity where id=v_user;
 if not found then raise exception 'PROFILE_NOT_FOUND';end if;
 return show_activity;
end $$;

create or replace function public.aurvex_public_game_activity(target_player uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if target_player is null then return jsonb_build_object('visible',false);end if;
 if not exists(select 1 from public.id_profiles p where p.id=target_player
               and p.nickname is not null and p.game_activity_public=true) then
  return jsonb_build_object('visible',false);
 end if;
 with recent as(
   select d.game_id,sum(d.total_seconds)::bigint as recent_seconds
   from public.aurvex_game_activity_daily d
   where d.user_id=target_player and d.activity_date>=(now() at time zone 'UTC')::date-29
   group by d.game_id
 ), games as(
   select p.game_id,p.total_seconds,p.last_played_at,coalesce(r.recent_seconds,0) as recent_seconds
   from public.aurvex_game_playtime p left join recent r using(game_id)
   where p.user_id=target_player and p.last_played_at>=now()-interval '30 days'
   order by p.last_played_at desc limit 5
 )
 select jsonb_build_object(
   'visible',true,
   'recent_30_days_seconds',coalesce((select sum(recent_seconds) from recent),0),
   'games',coalesce((select jsonb_agg(jsonb_build_object('game_id',game_id,'total_seconds',total_seconds,
      'last_played_at',last_played_at,'recent_seconds',recent_seconds) order by last_played_at desc) from games),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;
revoke all on function public.aurvex_set_game_activity_public(boolean) from public,anon;
revoke all on function public.aurvex_public_game_activity(uuid) from public;
grant execute on function public.aurvex_set_game_activity_public(boolean) to authenticated;
grant execute on function public.aurvex_public_game_activity(uuid) to anon,authenticated;
