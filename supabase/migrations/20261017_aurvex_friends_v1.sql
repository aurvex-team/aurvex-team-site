-- AURVEX ID Friends v1. Designed for isolated AURVEX Supabase project only.
-- Friend names / avatar paths are discoverable via narrow, rate-limited RPCs.
-- No public read access to private id_profiles, auth.users or emails.

create table if not exists public.id_friendships (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  requester uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_a,user_b),
  constraint id_friendships_order check (user_a<user_b),
  constraint id_friendships_requester check (requester in (user_a,user_b))
);
create index if not exists id_friendships_user_b_idx on public.id_friendships(user_b);
create index if not exists id_friendships_requester_time_idx on public.id_friendships(requester,created_at);

create table if not exists public.id_friend_attempts (
  actor uuid not null references auth.users(id) on delete cascade,
  target uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists id_friend_attempts_actor_time on public.id_friend_attempts(actor,created_at);

alter table public.id_friendships enable row level security;
alter table public.id_friend_attempts enable row level security;
revoke all on public.id_friendships from public,anon,authenticated;
revoke all on public.id_friend_attempts from public,anon,authenticated;
-- No RLS policies: only vetted security-definer RPC functions can read/write.

create or replace function public.aurvex_friends_require_mfa()
returns uuid
language plpgsql stable security definer set search_path=''
as $$
declare who uuid;
begin
  who:=auth.uid();
  if who is null or (auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'Two-factor verification required' using errcode='42501';
  end if;
  return who;
end $$;
revoke all on function public.aurvex_friends_require_mfa() from public,anon,authenticated;

create or replace function public.aurvex_search_players(search_text text)
returns table(player_id uuid,nickname text,avatar_path text,relation text)
language plpgsql stable security definer set search_path=''
as $$
declare
  who uuid;
  q text:=btrim(coalesce(search_text,''));
begin
  who:=public.aurvex_friends_require_mfa();
  if length(q)<3 or length(q)>24 or q !~ '^[A-Za-z0-9_]+$' then
    return;
  end if;
  return query
  select p.id,p.nickname,p.avatar_path,
   case
     when f.status='accepted' then 'friend'
     when f.status='pending' and f.requester=who then 'outgoing'
     when f.status='pending' then 'incoming'
     when f.status='cancelled' and f.updated_at > now()-interval '24 hours' then 'cooldown'
     when f.status='declined' then 'unavailable'
     else 'none'
   end as relation
  from public.id_profiles p
  left join public.id_friendships f
    on f.user_a=least(p.id,who) and f.user_b=greatest(p.id,who)
  where p.nickname is not null
    and p.id<>who
    and left(lower(p.nickname),length(q))=lower(q)
  order by lower(p.nickname),p.id limit 15;
end $$;
revoke all on function public.aurvex_search_players(text) from public,anon;
grant execute on function public.aurvex_search_players(text) to authenticated;

create or replace function public.aurvex_friends_list()
returns table(request_id text,peer_id uuid,nickname text,avatar_path text,relation text,created_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
declare who uuid;
begin
  who:=public.aurvex_friends_require_mfa();
  return query
  select (f.user_a::text||':'||f.user_b::text),
    p.id,p.nickname,p.avatar_path,
    case
      when f.status='accepted' then 'friend'
      when f.requester=who then 'outgoing'
      else 'incoming'
    end as relation, f.created_at
  from public.id_friendships f
  join public.id_profiles p
   on p.id=(case when f.user_a=who then f.user_b else f.user_a end)
  where who in(f.user_a,f.user_b)
   and f.status in ('pending','accepted')
  order by case when f.status='pending' and f.requester<>who then 0
    when f.status='accepted' then 1 else 2 end,
    f.created_at desc
  limit 200;
end $$;
revoke all on function public.aurvex_friends_list() from public,anon;
grant execute on function public.aurvex_friends_list() to authenticated;

create or replace function public.aurvex_friend_send(target_player uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare
  who uuid;
  prior public.id_friendships%rowtype;
begin
  who:=public.aurvex_friends_require_mfa();
  if target_player is null or target_player=who then
    raise exception 'Invalid player' using errcode='22023';
  end if;
  -- Only players with an explicit unique nickname are visible/discoverable.
  if not exists (select 1 from public.id_profiles p where p.id=target_player and p.nickname is not null)
    or not exists (select 1 from public.id_profiles p where p.id=who and p.nickname is not null) then
    raise exception 'Set a nickname to use friends' using errcode='22023';
  end if;
  -- Serialize actions per sender so flood checks cannot be bypassed by
  -- racing many concurrent requests. Doesn't lock unrelated senders.
  perform pg_advisory_xact_lock(hashtextextended(who::text,918));
  if (select count(*) from public.id_friend_attempts
      where actor=who and created_at>now()-interval '24 hours')>=10 then
    raise exception 'Daily request limit reached' using errcode='22023';
  end if;
  if (select count(*) from public.id_friendships
      where requester=who and status='pending')>=30 then
    raise exception 'Too many pending requests' using errcode='22023';
  end if;
  select * into prior from public.id_friendships f
    where f.user_a=least(who,target_player)
      and f.user_b=greatest(who,target_player) for update;
  if found then
    if prior.status='cancelled' and prior.updated_at<now()-interval '24 hours' then
      update public.id_friendships set requester=who,status='pending',
        created_at=now(),updated_at=now()
      where user_a=least(who,target_player) and user_b=greatest(who,target_player);
    else
      raise exception 'Request already exists or cannot be sent' using errcode='22023';
    end if;
  else
    insert into public.id_friendships(user_a,user_b,requester,status)
      values(least(who,target_player),greatest(who,target_player),who,'pending');
  end if;
  insert into public.id_friend_attempts(actor,target) values(who,target_player);
end $$;
revoke all on function public.aurvex_friend_send(uuid) from public,anon;
grant execute on function public.aurvex_friend_send(uuid) to authenticated;

create or replace function public.aurvex_friend_action(other_player uuid,action text)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare
  who uuid;
  f public.id_friendships%rowtype;
begin
  who:=public.aurvex_friends_require_mfa();
  if other_player is null or other_player=who or action not in ('accept','decline','cancel','remove') then
    raise exception 'Invalid friend action' using errcode='22023';
  end if;
  select * into f from public.id_friendships x
   where x.user_a=least(who,other_player)
     and x.user_b=greatest(who,other_player) for update;
  if not found then
    raise exception 'Friend request not found' using errcode='22023';
  end if;
  if action='accept' and f.status='pending' and f.requester<>who then
    update public.id_friendships set status='accepted',updated_at=now()
      where user_a=f.user_a and user_b=f.user_b;
  elsif action='decline' and f.status='pending' and f.requester<>who then
    update public.id_friendships set status='declined',updated_at=now()
      where user_a=f.user_a and user_b=f.user_b;
  elsif action='cancel' and f.status='pending' and f.requester=who then
    update public.id_friendships set status='cancelled',updated_at=now()
      where user_a=f.user_a and user_b=f.user_b;
  elsif action='remove' and f.status='accepted' and who in(f.user_a,f.user_b) then
    delete from public.id_friendships where user_a=f.user_a and user_b=f.user_b;
  else
    raise exception 'Not allowed to change this request' using errcode='42501';
  end if;
end $$;
revoke all on function public.aurvex_friend_action(uuid,text) from public,anon;
grant execute on function public.aurvex_friend_action(uuid,text) to authenticated;

-- No public Realtime publication is required: client refetches safe RPC output
-- on page focus and periodically while visible; no email/ID rows are broadcast.
