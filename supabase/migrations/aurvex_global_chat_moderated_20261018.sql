-- AURVEX Community Chat v1. Public read-only feed; posting requires verified email, AAL2 and server authorization.
create table if not exists public.aurvex_chat_messages (
 id bigint generated always as identity primary key,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 500 and body=btrim(body)),
 created_at timestamptz not null default now(),
 status text not null default 'visible' check(status in ('visible','held','removed')),
 client_request uuid not null,
 unique(author_id,client_request)
);
create index if not exists aurvex_chat_recent on public.aurvex_chat_messages(id desc) where status='visible';
create index if not exists aurvex_chat_author_time on public.aurvex_chat_messages(author_id,created_at desc);

create table if not exists public.aurvex_chat_controls (
 user_id uuid primary key references auth.users(id) on delete cascade,
 banned_until timestamptz,
 muted_until timestamptz,
 last_sent_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.aurvex_chat_reports (
 id bigint generated always as identity primary key,
 message_id bigint not null references public.aurvex_chat_messages(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('spam','harassment','unsafe','privacy','other')),
 created_at timestamptz not null default now(),
 unique(message_id,reporter_id)
);
create index if not exists aurvex_chat_reports_message on public.aurvex_chat_reports(message_id);
create index if not exists aurvex_chat_reports_reporter on public.aurvex_chat_reports(reporter_id,created_at desc);
create table if not exists public.aurvex_chat_moderators (
 user_id uuid primary key references auth.users(id) on delete cascade,
 added_at timestamptz not null default now()
);
-- Minimal public change-notification table. Never broadcasts message bodies or private profile information.
create table if not exists public.aurvex_chat_pulses (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now()
);
create index if not exists aurvex_chat_pulses_recent on public.aurvex_chat_pulses(id desc);
alter table public.aurvex_chat_messages enable row level security;
alter table public.aurvex_chat_controls enable row level security;
alter table public.aurvex_chat_reports enable row level security;
alter table public.aurvex_chat_moderators enable row level security;
alter table public.aurvex_chat_pulses enable row level security;
revoke all on public.aurvex_chat_messages,public.aurvex_chat_controls,
 public.aurvex_chat_reports,public.aurvex_chat_moderators,public.aurvex_chat_pulses
 from public,anon,authenticated;
grant select on public.aurvex_chat_pulses to anon,authenticated;
create policy aurvex_chat_pulse_read on public.aurvex_chat_pulses for select to anon,authenticated using(true);
-- Service-triggered pulse only: clients cannot insert spoofed realtime notifications.
create or replace function public.aurvex_chat_notify()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.aurvex_chat_pulses default values;
 return new;
end $$;
revoke all on function public.aurvex_chat_notify() from public,anon,authenticated;
drop trigger if exists aurvex_chat_message_pulse on public.aurvex_chat_messages;
create trigger aurvex_chat_message_pulse after insert or update of status
 on public.aurvex_chat_messages for each row execute function public.aurvex_chat_notify();

-- Read-only, intentionally restricted fields; no email, unverified account information or private columns.
create or replace function public.aurvex_chat_feed()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((
   select jsonb_agg(jsonb_build_object(
     'id',m.id,'authorId',m.author_id,'nickname',coalesce(p.nickname,'AURVEX Player'),
     'avatarPath',p.avatar_path,'body',m.body,'createdAt',m.created_at)
     order by m.id)
   from (
     select id,author_id,body,created_at from public.aurvex_chat_messages
     where status='visible' order by id desc limit 60
   ) m
   left join public.id_profiles p on p.id=m.author_id
 ),'[]'::jsonb)
$$;
revoke all on function public.aurvex_chat_feed() from public;
grant execute on function public.aurvex_chat_feed() to anon,authenticated;

-- Author identity always comes from server JWT; nickname comes from trusted profile row.
create or replace function public.aurvex_chat_send(message_text text,request_id uuid)
returns bigint language plpgsql security definer set search_path='' as $$
declare who uuid; clean_text text; posted_id bigint; c public.aurvex_chat_controls%rowtype;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from auth.users u where u.id=who and u.email_confirmed_at is not null)
   then raise exception 'CHAT_VERIFICATION_REQUIRED';end if;
 if not exists(select 1 from public.id_profiles p where p.id=who and p.nickname is not null)
   then raise exception 'CHAT_PROFILE_REQUIRED';end if;
 if request_id is null then raise exception 'CHAT_INVALID_REQUEST';end if;
 clean_text:=btrim(coalesce(message_text,''));
 if length(clean_text)<1 or length(clean_text)>500 or
    clean_text ~ '[[:cntrl:]]' or clean_text ~* '(https?://|www[.]|[[:alnum:]._%-]+@[[:alnum:].-]+[.][a-z]{2,})'
    then raise exception 'CHAT_MESSAGE_INVALID_OR_LINK';end if;
 insert into public.aurvex_chat_controls(user_id) values(who)
 on conflict(user_id) do nothing;
 select * into c from public.aurvex_chat_controls where user_id=who for update;
 if c.banned_until is not null and c.banned_until>now() then raise exception 'CHAT_ACCOUNT_BANNED';end if;
 if c.muted_until is not null and c.muted_until>now() then raise exception 'CHAT_ACCOUNT_MUTED';end if;
 -- Idempotent submission within the same verified account.
 select id into posted_id from public.aurvex_chat_messages
 where author_id=who and client_request=request_id;
 if found then return posted_id;end if;
 if c.last_sent_at is not null and c.last_sent_at>now()-interval '12 seconds'
   then raise exception 'CHAT_SLOW_MODE_12_SECONDS';end if;
 if (select count(*) from public.aurvex_chat_messages
      where author_id=who and created_at>now()-interval '10 minutes')>=20
    then raise exception 'CHAT_RATE_LIMIT_10_MIN';end if;
 if (select count(*) from public.aurvex_chat_messages
      where author_id=who and created_at>now()-interval '24 hours')>=120
    then raise exception 'CHAT_DAILY_LIMIT';end if;
 insert into public.aurvex_chat_messages(author_id,body,client_request)
 values(who,clean_text,request_id) returning id into posted_id;
 update public.aurvex_chat_controls set last_sent_at=now() where user_id=who;
 return posted_id;
end $$;
revoke all on function public.aurvex_chat_send(text,uuid) from public,anon;
grant execute on function public.aurvex_chat_send(text,uuid) to authenticated;

-- Reports require the same verified identity. Three distinct complaints hold content pending moderator review.
create or replace function public.aurvex_chat_report(target_message bigint,report_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare who uuid; target_owner uuid; active_status text; total int;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from auth.users u where u.id=who and u.email_confirmed_at is not null)
  then raise exception 'CHAT_VERIFICATION_REQUIRED';end if;
 if report_reason not in ('spam','harassment','unsafe','privacy','other')
    then raise exception 'CHAT_INVALID_REPORT';end if;
 if (select count(*) from public.aurvex_chat_reports
    where reporter_id=who and created_at>now()-interval '24 hours')>=15
    then raise exception 'CHAT_REPORT_LIMIT';end if;
 select author_id,status into target_owner,active_status
  from public.aurvex_chat_messages where id=target_message for update;
 if not found or active_status<>'visible' then raise exception 'CHAT_MESSAGE_NOT_AVAILABLE';end if;
 if target_owner=who then raise exception 'CHAT_CANNOT_REPORT_OWN';end if;
 insert into public.aurvex_chat_reports(message_id,reporter_id,reason)
  values(target_message,who,report_reason) on conflict(message_id,reporter_id) do nothing;
 select count(*) into total from public.aurvex_chat_reports where message_id=target_message;
 if total>=3 then
  update public.aurvex_chat_messages set status='held'
    where id=target_message and status='visible';
  return 'held';
 end if;
 return 'reported';
end $$;
revoke all on function public.aurvex_chat_report(bigint,text) from public,anon;
grant execute on function public.aurvex_chat_report(bigint,text) to authenticated;

-- Moderators are assigned manually by a trusted server operator, not by a browser token.
create or replace function public.aurvex_chat_moderate_message(target_message bigint,decision text)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
   then raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 if decision not in ('visible','held','removed') then raise exception 'CHAT_INVALID_DECISION';end if;
 update public.aurvex_chat_messages set status=decision where id=target_message;
 if not found then raise exception 'CHAT_MESSAGE_NOT_FOUND';end if;
end $$;
revoke all on function public.aurvex_chat_moderate_message(bigint,text) from public,anon;
grant execute on function public.aurvex_chat_moderate_message(bigint,text) to authenticated;

create or replace function public.aurvex_chat_moderate_user(target_user uuid,decision text)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
   then raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 if target_user=who or target_user is null then raise exception 'CHAT_INVALID_TARGET';end if;
 if decision not in ('mute_1d','ban_7d','unban') then raise exception 'CHAT_INVALID_DECISION';end if;
 insert into public.aurvex_chat_controls(user_id) values(target_user)
  on conflict(user_id) do nothing;
 update public.aurvex_chat_controls
  set muted_until=case when decision='mute_1d' then now()+interval '1 day'
                       when decision='unban' then null else muted_until end,
      banned_until=case when decision='ban_7d' then now()+interval '7 days'
                        when decision='unban' then null else banned_until end
 where user_id=target_user;
end $$;
revoke all on function public.aurvex_chat_moderate_user(uuid,text) from public,anon;
grant execute on function public.aurvex_chat_moderate_user(uuid,text) to authenticated;

-- Only the pulse sequence is distributed; the contents are fetched from a filtered RPC.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
   select 1 from pg_publication_tables where pubname='supabase_realtime'
     and schemaname='public' and tablename='aurvex_chat_pulses') then
   alter publication supabase_realtime add table public.aurvex_chat_pulses;
 end if;
end $$;
