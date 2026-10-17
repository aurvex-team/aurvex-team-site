-- AURVEX Social v3.7: opt-in online, blocking, in-app notifications.
-- All sensitive APIs require server-verified AAL2. No direct table grants.
create table if not exists public.id_social_blocks(
 blocker uuid not null references auth.users(id) on delete cascade,
 blocked uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker,blocked),check(blocker<>blocked)
);
create table if not exists public.id_social_presence(
 user_id uuid primary key references auth.users(id) on delete cascade,
 show_online boolean not null default false,
 last_seen timestamptz
);
create table if not exists public.id_social_notifications(
 id uuid primary key default gen_random_uuid(),
 recipient uuid not null references auth.users(id) on delete cascade,
 actor uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in('friend_request','family_invite')),
 family_id uuid references public.id_families(id) on delete cascade,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 expires_at timestamptz,
 check(actor<>recipient),
 check((kind='friend_request' and family_id is null) or
       (kind='family_invite' and family_id is not null))
);
create unique index if not exists id_social_unique_friend_request
 on public.id_social_notifications(recipient,actor)
 where kind='friend_request';
create unique index if not exists id_social_unique_family_invite
 on public.id_social_notifications(recipient,actor,family_id)
 where kind='family_invite';
create index if not exists id_social_notifications_recipient
 on public.id_social_notifications(recipient,created_at desc);
create index if not exists id_social_blocks_blocked on public.id_social_blocks(blocked);

alter table public.id_social_blocks enable row level security;
alter table public.id_social_presence enable row level security;
alter table public.id_social_notifications enable row level security;
revoke all on public.id_social_blocks,public.id_social_presence,
 public.id_social_notifications from public,anon,authenticated;

-- Keep family membership invite-only and bind targeted invitation tokens to
-- the intended recipient. Existing general invitation links remain valid.
alter table public.id_family_invites
 add column if not exists recipient_id uuid references auth.users(id) on delete cascade;

create or replace function public.aurvex_social_set_visibility(enable_online boolean)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 insert into public.id_social_presence(user_id,show_online,last_seen)
 values(who,coalesce(enable_online,false),
   case when enable_online then now() else null end)
 on conflict(user_id) do update set show_online=excluded.show_online,
 last_seen=excluded.last_seen;
end $$;
create or replace function public.aurvex_social_heartbeat()
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 update public.id_social_presence set last_seen=now()
 where user_id=who and show_online=true
 and (last_seen is null or last_seen<now()-interval '20 seconds');
end $$;

create or replace function public.aurvex_social_snapshot()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid; ret jsonb;
begin
 who:=public.aurvex_friends_require_mfa();
 select jsonb_build_object(
   'show_online',coalesce((select p.show_online from public.id_social_presence p where p.user_id=who),false),
   'online_friends',coalesce((select jsonb_agg(peer.id)
      from (select case when f.user_a=who then f.user_b else f.user_a end as id
        from public.id_friendships f
        where who in(f.user_a,f.user_b) and f.status='accepted'
        and not exists(select 1 from public.id_social_blocks b where
          (b.blocker=who and b.blocked in(f.user_a,f.user_b))
           or (b.blocked=who and b.blocker in(f.user_a,f.user_b)))
      ) peer join public.id_social_presence p on p.user_id=peer.id
      where p.show_online and p.last_seen>now()-interval '110 seconds'),'[]'::jsonb),
   'blocked',coalesce((select jsonb_agg(jsonb_build_object(
       'id',b.blocked,'nickname',coalesce(p.nickname,'AURVEX player')))
       from public.id_social_blocks b
       left join public.id_profiles p on p.id=b.blocked where b.blocker=who),'[]'::jsonb),
   'notifications',coalesce((select jsonb_agg(jsonb_build_object(
      'id',n.id,'kind',n.kind,'actor_id',n.actor,
      'nickname',coalesce(p.nickname,'AURVEX player'),
      'avatar_path',p.avatar_path,'family_id',n.family_id,
      'created_at',n.created_at,'read',n.read_at is not null)
      order by n.created_at desc)
      from (select * from public.id_social_notifications x where x.recipient=who
        and (x.expires_at is null or x.expires_at>now())
        and not exists(select 1 from public.id_social_blocks b
          where (b.blocker=who and b.blocked=x.actor)
          or(b.blocker=x.actor and b.blocked=who))
       order by x.created_at desc limit 50) n
      left join public.id_profiles p on p.id=n.actor),'[]'::jsonb)
 ) into ret;
 return ret;
end $$;

create or replace function public.aurvex_social_block(target_player uuid,block_on boolean)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 if target_player is null or target_player=who then
   raise exception 'Invalid user' using errcode='22023'; end if;
 if block_on then
   insert into public.id_social_blocks(blocker,blocked) values(who,target_player)
   on conflict do nothing;
   delete from public.id_friendships f where
     f.user_a=least(who,target_player) and f.user_b=greatest(who,target_player);
   delete from public.id_social_notifications n where
     (n.recipient=who and n.actor=target_player) or
     (n.recipient=target_player and n.actor=who);
 else
   delete from public.id_social_blocks where blocker=who and blocked=target_player;
 end if;
end $$;

create or replace function public.aurvex_social_mark_read(notification_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 update public.id_social_notifications set read_at=now()
 where id=notification_id and recipient=who;
end $$;

create or replace function public.aurvex_social_invite_friend(target_friend uuid)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; sent_count int;
begin
 who:=public.aurvex_friends_require_mfa();
 if target_friend is null or target_friend=who then raise exception 'Invalid player' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text,1441));
 select f.id into fid from public.id_families f where f.owner_id=who for update;
 if fid is null then raise exception 'Only the family owner can invite friends' using errcode='42501';end if;
 if (select count(*) from public.id_family_members where family_id=fid)>=6 then
   raise exception 'Family is full' using errcode='22023';end if;
 if exists(select 1 from public.id_family_members where user_id=target_friend) then
   raise exception 'Player already belongs to a family' using errcode='22023';end if;
 if not exists(select 1 from public.id_friendships f where
    f.user_a=least(who,target_friend) and f.user_b=greatest(who,target_friend)
    and f.status='accepted') then
   raise exception 'You can invite accepted friends only' using errcode='42501';end if;
 if exists(select 1 from public.id_social_blocks b where
    (b.blocker=who and b.blocked=target_friend) or
    (b.blocker=target_friend and b.blocked=who)) then
   raise exception 'Player unavailable' using errcode='42501';end if;
 select count(*) into sent_count from public.id_social_notifications
 where actor=who and kind='family_invite' and created_at>now()-interval '24 hours';
 if sent_count>=10 then raise exception 'Daily invitation limit reached' using errcode='22023';end if;
 insert into public.id_social_notifications(recipient,actor,kind,family_id,expires_at)
 values(target_friend,who,'family_invite',fid,now()+interval '7 days')
 on conflict(recipient,actor,family_id) where(kind='family_invite')
 do update set created_at=now(),read_at=null,expires_at=now()+interval '7 days';
end $$;

-- No plaintext invite token is stored in notification rows. On clicking the
-- notification, recipient obtains their OWN short-lived opaque URL.
create or replace function public.aurvex_social_open_invite(notification_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare who uuid; n public.id_social_notifications%rowtype; token text; count_members int;
begin
 who:=public.aurvex_friends_require_mfa();
 select * into n from public.id_social_notifications
 where id=notification_id and recipient=who and kind='family_invite'
 and expires_at>now() for update;
 if not found then raise exception 'Invitation unavailable' using errcode='22023';end if;
 if not exists(select 1 from public.id_families f where f.id=n.family_id and f.owner_id=n.actor) then
   raise exception 'Family no longer exists' using errcode='22023'; end if;
 if exists(select 1 from public.id_social_blocks b where
    (b.blocker=who and b.blocked=n.actor) or
    (b.blocker=n.actor and b.blocked=who)) then
   raise exception 'Invitation unavailable' using errcode='42501';end if;
 if exists(select 1 from public.id_family_members where user_id=who) then
   raise exception 'Already in a family' using errcode='22023';end if;
 select count(*) into count_members from public.id_family_members where family_id=n.family_id;
 if count_members>=6 then raise exception 'Family is full' using errcode='22023';end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.id_family_invites(family_id,token_hash,expires_at,recipient_id)
 values(n.family_id,encode(extensions.digest(token,'sha256'),'hex'),
   least(n.expires_at,now()+interval '15 minutes'),who);
 update public.id_social_notifications set read_at=now() where id=n.id;
 return token;
end $$;

-- A notification for a newly sent request, with cleanup when responded to.
create or replace function public.aurvex_social_friend_notify()
returns trigger language plpgsql security definer set search_path='' as $$
declare rec uuid;
begin
 if tg_op='DELETE' or (tg_op='UPDATE' and new.status<>'pending') then
  delete from public.id_social_notifications n where n.kind='friend_request'
   and n.actor=old.requester
   and n.recipient=(case when old.user_a=old.requester then old.user_b else old.user_a end);
  return case when tg_op='DELETE' then old else new end;
 end if;
 if new.status='pending' then
  rec:=case when new.user_a=new.requester then new.user_b else new.user_a end;
  if not exists(select 1 from public.id_social_blocks b where
    (b.blocker=new.requester and b.blocked=rec)
     or (b.blocker=rec and b.blocked=new.requester)) then
    insert into public.id_social_notifications(recipient,actor,kind)
    values(rec,new.requester,'friend_request')
    on conflict(recipient,actor) where(kind='friend_request')
    do update set created_at=now(),read_at=null;
  end if;
 end if;
 return new;
end $$;
drop trigger if exists aurvex_friend_notify_trigger on public.id_friendships;
create trigger aurvex_friend_notify_trigger
after insert or update or delete on public.id_friendships
for each row execute function public.aurvex_social_friend_notify();

-- Existing pending requests get inbox items too, unless blocked.
insert into public.id_social_notifications(recipient,actor,kind)
select case when f.user_a=f.requester then f.user_b else f.user_a end,
 f.requester,'friend_request' from public.id_friendships f
 where f.status='pending'
 and not exists(select 1 from public.id_social_blocks b where
 (b.blocker=f.requester and b.blocked in(f.user_a,f.user_b))
 or (b.blocked=f.requester and b.blocker in(f.user_a,f.user_b)))
on conflict(recipient,actor) where(kind='friend_request') do nothing;

-- Enable only typed, AAL2-secured operations from web clients.
do $$
declare r record;
begin
 for r in select p.oid::regprocedure as signature from pg_proc p
 join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in
 ('aurvex_social_set_visibility','aurvex_social_heartbeat',
 'aurvex_social_snapshot','aurvex_social_block',
 'aurvex_social_mark_read','aurvex_social_invite_friend','aurvex_social_open_invite')
 loop
  execute format('revoke all on function %s from public,anon',r.signature);
  execute format('grant execute on function %s to authenticated',r.signature);
 end loop;
end $$;

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
    and not exists(select 1 from public.id_social_blocks b where
      (b.blocker=who and b.blocked=p.id) or (b.blocker=p.id and b.blocked=who))
    and left(lower(p.nickname),length(q))=lower(q)
  order by lower(p.nickname),p.id limit 15;
end $$;

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
   and not exists(select 1 from public.id_social_blocks b where
     (b.blocker=who and b.blocked=p.id) or (b.blocker=p.id and b.blocked=who))
  order by case when f.status='pending' and f.requester<>who then 0
    when f.status='accepted' then 1 else 2 end,
    f.created_at desc
  limit 200;
end $$;

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
  if exists(select 1 from public.id_social_blocks b where
    (b.blocker=who and b.blocked=target_player) or
    (b.blocker=target_player and b.blocked=who)) then
    raise exception 'Player unavailable' using errcode='42501';
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

create or replace function public.aurvex_family_join(invite_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; token_hash text;
begin
 who:=public.aurvex_friends_require_mfa();
 if exists(select 1 from public.id_family_members where user_id=who) then
   raise exception 'Leave the current family first' using errcode='22023';
 end if;
 if invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then
   raise exception 'Invalid invitation link' using errcode='22023';
 end if;
 token_hash:=encode(extensions.digest(invite_token,'sha256'),'hex');
 select i.family_id into fid from public.id_family_invites i
   where i.token_hash=token_hash and not i.revoked and i.expires_at>now() and (i.recipient_id is null or i.recipient_id=who);
 if fid is null then raise exception 'Invitation expired or revoked' using errcode='22023'; end if;
 -- Serialize joins to enforce the six-member cap under concurrent invitations.
 perform 1 from public.id_families f where f.id=fid for update;
 if (select count(*) from public.id_family_members where family_id=fid)>=6 then
   raise exception 'This family is full (maximum 6)' using errcode='22023';
 end if;
 insert into public.id_family_members(family_id,user_id) values(fid,who);
 -- One-time, recipient-bound token cannot be reused after successful join.
 update public.id_family_invites set revoked=true where token_hash=encode(extensions.digest(invite_token,'sha256'),'hex');
 update public.id_social_notifications set read_at=now()
  where recipient=who and family_id=fid and kind='family_invite';
 return fid;
end $$;
