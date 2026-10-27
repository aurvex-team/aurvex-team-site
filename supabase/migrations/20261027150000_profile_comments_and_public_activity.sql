alter table public.id_profiles add column if not exists profile_comments_visibility text not null default 'friends' check (profile_comments_visibility in ('off','friends','everyone'));
create table if not exists public.id_profile_comments (id uuid primary key default gen_random_uuid(),profile_id uuid not null references auth.users(id) on delete cascade,author_id uuid not null references auth.users(id) on delete cascade,body text not null check (char_length(body) between 1 and 500 and body=btrim(body)),created_at timestamptz not null default now());
create index if not exists id_profile_comments_profile_created_idx on public.id_profile_comments(profile_id,created_at desc);
create index if not exists id_profile_comments_author_created_idx on public.id_profile_comments(author_id,created_at desc);
alter table public.id_profile_comments enable row level security;
revoke all on table public.id_profile_comments from anon,authenticated;
drop policy if exists id_profile_comments_no_direct_access on public.id_profile_comments;
create policy id_profile_comments_no_direct_access on public.id_profile_comments for all to anon,authenticated using(false) with check(false);

create or replace function public.aurvex_profile_comments(target_player uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $function$
declare v_mode text; v_actor uuid:=auth.uid(); v_friend boolean:=false; v_blocked boolean:=false; v_visible boolean:=false; v_can_comment boolean:=false; v_items jsonb:='[]'::jsonb;
begin
 if target_player is null then return jsonb_build_object('visibility','off','visible',false,'can_comment',false,'comments',v_items); end if;
 select p.profile_comments_visibility into v_mode from public.id_profiles p where p.id=target_player and p.nickname is not null;
 if not found then return jsonb_build_object('visibility','off','visible',false,'can_comment',false,'comments',v_items); end if;
 if v_actor is not null then
  select exists(select 1 from public.id_friendships f where f.status='accepted' and ((f.user_a=v_actor and f.user_b=target_player) or (f.user_b=v_actor and f.user_a=target_player))) into v_friend;
  select exists(select 1 from public.id_social_blocks b where (b.blocker=v_actor and b.blocked=target_player) or (b.blocker=target_player and b.blocked=v_actor)) into v_blocked;
 end if;
 v_visible:=coalesce(v_actor=target_player,false) or (not v_blocked and (v_mode='everyone' or (v_mode='friends' and v_friend)));
 v_can_comment:=v_actor is not null and v_actor<>target_player and not v_blocked and (v_mode='everyone' or (v_mode='friends' and v_friend));
 if v_visible then
  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'author_id',c.author_id,'author_nickname',ap.nickname,'avatar_path',ap.avatar_path,'body',c.body,'created_at',c.created_at) order by c.created_at desc),'[]'::jsonb)
   into v_items from public.id_profile_comments c join public.id_profiles ap on ap.id=c.author_id where c.profile_id=target_player;
 end if;
 return jsonb_build_object('visibility',v_mode,'visible',v_visible,'can_comment',v_can_comment,'comments',v_items);
end $function$;

revoke all on function public.aurvex_profile_comments(uuid) from public;grant execute on function public.aurvex_profile_comments(uuid) to anon,authenticated;
create or replace function public.aurvex_profile_comment_add(target_player uuid, comment_body text)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_actor uuid:=auth.uid(); v_mode text; v_friend boolean:=false; v_blocked boolean:=false; v_id uuid; v_body text:=btrim(coalesce(comment_body,''));
begin
 if v_actor is null or (auth.jwt()->>'aal') is distinct from 'aal2' then raise exception 'AUTH_MFA_REQUIRED'; end if;
 if target_player is null or target_player=v_actor or char_length(v_body)<1 or char_length(v_body)>500 then raise exception 'PROFILE_COMMENT_INVALID'; end if;
 select p.profile_comments_visibility into v_mode from public.id_profiles p where p.id=target_player and p.nickname is not null;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 select exists(select 1 from public.id_friendships f where f.status='accepted' and ((f.user_a=v_actor and f.user_b=target_player) or (f.user_b=v_actor and f.user_a=target_player))) into v_friend;
 select exists(select 1 from public.id_social_blocks b where (b.blocker=v_actor and b.blocked=target_player) or (b.blocker=target_player and b.blocked=v_actor)) into v_blocked;
 if v_blocked or not (v_mode='everyone' or (v_mode='friends' and v_friend)) then raise exception 'PROFILE_COMMENTS_CLOSED'; end if;
 if (select count(*) from public.id_profile_comments c where c.author_id=v_actor and c.created_at>now()-interval '1 minute')>=5 then raise exception 'PROFILE_COMMENT_RATE_LIMIT'; end if;
 insert into public.id_profile_comments(profile_id,author_id,body) values(target_player,v_actor,v_body) returning id into v_id;
 return v_id;
end $function$;

create or replace function public.aurvex_profile_comment_delete(comment_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $function$
declare v_actor uuid:=auth.uid();
begin
 if v_actor is null or (auth.jwt()->>'aal') is distinct from 'aal2' then raise exception 'AUTH_MFA_REQUIRED'; end if;
 delete from public.id_profile_comments c where c.id=comment_id and (c.author_id=v_actor or c.profile_id=v_actor);
 return found;
end $function$;

revoke all on function public.aurvex_profile_comments(uuid) from public;
grant execute on function public.aurvex_profile_comments(uuid) to anon,authenticated;
revoke all on function public.aurvex_profile_comment_add(uuid,text) from public;
grant execute on function public.aurvex_profile_comment_add(uuid,text) to authenticated;
revoke all on function public.aurvex_profile_comment_delete(uuid) from public;
grant execute on function public.aurvex_profile_comment_delete(uuid) to authenticated;

create or replace function public.aurvex_public_profile_friends(target_player uuid)
returns table(player_id uuid,nickname text,avatar_path text)
language plpgsql stable security definer set search_path=''
as $function$
declare v_actor uuid:=auth.uid();
begin
 if target_player is null or not exists(select 1 from public.id_profiles p where p.id=target_player and p.nickname is not null) then return; end if;
 if v_actor is not null and exists(select 1 from public.id_social_blocks b where (b.blocker=target_player and b.blocked=v_actor) or (b.blocker=v_actor and b.blocked=target_player)) then return; end if;
 return query
 select p.id,p.nickname,p.avatar_path from public.id_friendships f
 join public.id_profiles p on p.id=case when f.user_a=target_player then f.user_b else f.user_a end
 where f.status='accepted' and (f.user_a=target_player or f.user_b=target_player) and p.nickname is not null
 and not exists(select 1 from public.id_social_blocks b where (b.blocker=target_player and b.blocked=p.id) or (b.blocker=p.id and b.blocked=target_player))
 order by lower(p.nickname),p.nickname;
end $function$;
revoke all on function public.aurvex_public_profile_friends(uuid) from public;
grant execute on function public.aurvex_public_profile_friends(uuid) to anon,authenticated;



create or replace function public.aurvex_public_game_activity(target_player uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $function$
declare v_games_visible boolean:=false; v_setting_visible boolean:=false; v_recent_seconds bigint:=0; v_games_played bigint:=0; v_games jsonb:='[]'::jsonb;
begin
 if target_player is null or not exists(select 1 from public.id_profiles p where p.id=target_player and p.nickname is not null) then
  return jsonb_build_object('visible',false,'games_visible',false,'setting_visible',false,'recent_30_days_seconds',0,'games_played',0,'games','[]'::jsonb);
 end if;
 select (coalesce(auth.uid()=target_player,false) or coalesce(p.game_activity_public,false)),coalesce(p.game_activity_public,false)
 into v_games_visible,v_setting_visible from public.id_profiles p where p.id=target_player;
 with recent as(select d.game_id,sum(d.total_seconds)::bigint recent_seconds from public.aurvex_game_activity_daily d where d.user_id=target_player and d.activity_date>=(now() at time zone 'UTC')::date-29 group by d.game_id)
 select coalesce(sum(recent_seconds),0) into v_recent_seconds from recent;
 select count(*) into v_games_played from public.aurvex_game_playtime p where p.user_id=target_player;
 if v_games_visible then
  with recent as(select d.game_id,sum(d.total_seconds)::bigint recent_seconds from public.aurvex_game_activity_daily d where d.user_id=target_player and d.activity_date>=(now() at time zone 'UTC')::date-29 group by d.game_id),
  games as(select p.game_id,p.total_seconds,p.last_played_at,coalesce(r.recent_seconds,0) recent_seconds from public.aurvex_game_playtime p left join recent r using(game_id) where p.user_id=target_player and p.last_played_at>=now()-interval '30 days' order by p.last_played_at desc limit 5)
  select coalesce(jsonb_agg(jsonb_build_object('game_id',game_id,'total_seconds',total_seconds,'last_played_at',last_played_at,'recent_seconds',recent_seconds) order by last_played_at desc),'[]'::jsonb) into v_games from games;
 end if;
 return jsonb_build_object('visible',v_games_visible,'games_visible',v_games_visible,'setting_visible',v_setting_visible,'recent_30_days_seconds',v_recent_seconds,'games_played',v_games_played,'games',v_games);
end $function$;
revoke all on function public.aurvex_public_game_activity(uuid) from public;
grant execute on function public.aurvex_public_game_activity(uuid) to anon,authenticated;