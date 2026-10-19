create index if not exists aurvex_game_sessions_user_open_idx
  on public.aurvex_game_sessions(user_id, ended_at);

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
    select e.product_id as game_id, e.product_id as display_name, e.created_at as acquired_at
      from public.id_entitlements e where e.user_id = v_user
    union all
    select g.game_id, max(g.display_name) as display_name, min(g.acquired_at) as acquired_at
      from public.aurvex_game_inventory g where g.owner_id = v_user group by g.game_id
  ), combined as (
    select o.game_id, max(o.display_name) as display_name, min(o.acquired_at) as acquired_at,
      coalesce(p.total_seconds, 0) as total_seconds,
      coalesce(p.launch_count, 0) as launch_count,
      p.first_played_at, p.last_played_at
    from owned o left join public.aurvex_game_playtime p
      on p.user_id = v_user and p.game_id = o.game_id
    group by o.game_id,p.total_seconds,p.launch_count,p.first_played_at,p.last_played_at
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_id',game_id,'display_name',display_name,'acquired_at',acquired_at,
    'total_seconds',total_seconds,'launch_count',launch_count,
    'first_played_at',first_played_at,'last_played_at',last_played_at
  ) order by last_played_at desc nulls last,acquired_at desc),'[]'::jsonb)
  into v_games from combined;
  return jsonb_build_object('games',v_games);
end;
$$;