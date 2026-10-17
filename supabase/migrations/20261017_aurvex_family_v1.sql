-- AURVEX Family v1. Isolated AURVEX ID; server-authorized invitations
-- and explicit per-game sharing. Never derive ownership from a client checkbox.
create table if not exists public.id_families(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 3 and 40 and name !~ '[[:cntrl:]<>]'),
 owner_id uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now()
);
create table if not exists public.id_family_members(
 user_id uuid primary key references auth.users(id) on delete cascade,
 family_id uuid not null references public.id_families(id) on delete cascade,
 joined_at timestamptz not null default now()
);
create index if not exists id_family_members_family on public.id_family_members(family_id);
create table if not exists public.id_family_invites(
 family_id uuid not null references public.id_families(id) on delete cascade,
 token_hash text primary key,
 expires_at timestamptz not null,
 revoked boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists id_family_invites_family on public.id_family_invites(family_id);
create table if not exists public.id_family_shares(
 family_id uuid not null references public.id_families(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null,
 created_at timestamptz not null default now(),
 primary key(family_id,owner_id,product_id)
);
create index if not exists id_family_shares_owner on public.id_family_shares(owner_id);

alter table public.id_families enable row level security;
alter table public.id_family_members enable row level security;
alter table public.id_family_invites enable row level security;
alter table public.id_family_shares enable row level security;
revoke all on public.id_families,public.id_family_members,
 public.id_family_invites,public.id_family_shares from public,anon,authenticated;
-- No user-facing direct policies; all access is in these vetted AAL2 RPCs.

create or replace function public.aurvex_family_create(family_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; clean text:=btrim(coalesce(family_name,''));
begin
 who:=public.aurvex_friends_require_mfa();
 if length(clean) not between 3 and 40 or clean ~ '[[:cntrl:]<>]' then
   raise exception 'Invalid family name' using errcode='22023';
 end if;
 if exists(select 1 from public.id_family_members where user_id=who) then
   raise exception 'You already belong to a family' using errcode='22023';
 end if;
 insert into public.id_families(name,owner_id) values(clean,who) returning id into fid;
 insert into public.id_family_members(family_id,user_id) values(fid,who);
 return fid;
end $$;

create or replace function public.aurvex_family_new_invite()
returns text language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; token text;
begin
 who:=public.aurvex_friends_require_mfa();
 select f.id into fid from public.id_families f where f.owner_id=who for update;
 if fid is null then raise exception 'Only the family owner can invite' using errcode='42501'; end if;
 -- Rotate; previously generated links immediately stop working.
 update public.id_family_invites set revoked=true where family_id=fid;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.id_family_invites(family_id,token_hash,expires_at)
 values(fid,encode(extensions.digest(token,'sha256'),'hex'),now()+interval '7 days');
 return token; -- One-time display; raw token is never stored.
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
   where i.token_hash=token_hash and not i.revoked and i.expires_at>now();
 if fid is null then raise exception 'Invitation expired or revoked' using errcode='22023'; end if;
 -- Serialize joins to enforce the six-member cap under concurrent invitations.
 perform 1 from public.id_families f where f.id=fid for update;
 if (select count(*) from public.id_family_members where family_id=fid)>=6 then
   raise exception 'This family is full (maximum 6)' using errcode='22023';
 end if;
 insert into public.id_family_members(family_id,user_id) values(fid,who);
 return fid;
end $$;

create or replace function public.aurvex_family_leave()
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; own uuid; members int;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then raise exception 'Not a family member' using errcode='22023'; end if;
 select f.owner_id into own from public.id_families f where f.id=fid for update;
 select count(*) into members from public.id_family_members where family_id=fid;
 if own=who and members>1 then
   raise exception 'Owner must remove other members before closing family' using errcode='22023';
 end if;
 delete from public.id_family_shares where owner_id=who and family_id=fid;
 delete from public.id_family_members where user_id=who;
 if own=who then delete from public.id_families where id=fid; end if;
end $$;

create or replace function public.aurvex_family_remove_member(target_player uuid)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 select f.id into fid from public.id_families f where f.owner_id=who for update;
 if fid is null or target_player=who then
   raise exception 'Only an owner can remove other members' using errcode='42501';
 end if;
 if not exists(select 1 from public.id_family_members m where m.family_id=fid and m.user_id=target_player) then
   raise exception 'Not a member' using errcode='22023';
 end if;
 delete from public.id_family_shares where owner_id=target_player and family_id=fid;
 delete from public.id_family_members where user_id=target_player and family_id=fid;
end $$;

create or replace function public.aurvex_family_share(product text,share_on boolean)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then raise exception 'Join a family first' using errcode='22023'; end if;
 if product is null or length(product)>80 or product !~ '^[a-z0-9_-]+$' then
   raise exception 'Invalid game' using errcode='22023';
 end if;
 if share_on then
  -- Only PAID confirmed first-party purchases can be lent.
  -- Gifts/shared licenses never recursively grant sharing rights.
  if not exists(select 1 from public.id_entitlements e where
        e.user_id=who and e.product_id=product and e.source='purchase') then
    raise exception 'Only your purchased, shareable games can be shared' using errcode='42501';
  end if;
  insert into public.id_family_shares(family_id,owner_id,product_id)
    values(fid,who,product) on conflict do nothing;
 else
  delete from public.id_family_shares where family_id=fid and owner_id=who and product_id=product;
 end if;
end $$;

create or replace function public.aurvex_family_access()
returns table(product_id text, shared_by uuid, source text)
language plpgsql stable security definer set search_path='' as $$
declare who uuid; fid uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then return; end if;
 return query
 select s.product_id,s.owner_id,'family_shared'::text
 from public.id_family_shares s
 join public.id_family_members m on m.family_id=s.family_id and m.user_id=s.owner_id
 join public.id_entitlements e on e.user_id=s.owner_id
  and e.product_id=s.product_id and e.source='purchase'
 where s.family_id=fid and s.owner_id<>who;
end $$;

create or replace function public.aurvex_family_overview()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid; fid uuid; family jsonb;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then return null; end if;
 select jsonb_build_object(
   'id',f.id,'name',f.name,'owner_id',f.owner_id,'created_at',f.created_at,
   'members',coalesce((select jsonb_agg(jsonb_build_object(
       'id',m.user_id,'nickname',coalesce(p.nickname,'AURVEX player'),
       'avatar_path',p.avatar_path,'joined_at',m.joined_at,
       'is_owner',(m.user_id=f.owner_id)) order by m.joined_at)
     from public.id_family_members m left join public.id_profiles p on p.id=m.user_id
     where m.family_id=f.id),'[]'::jsonb),
   'shares',coalesce((select jsonb_agg(jsonb_build_object(
      'owner_id',s.owner_id,'product_id',s.product_id) order by s.product_id)
      from public.id_family_shares s
      join public.id_family_members m on m.family_id=s.family_id and m.user_id=s.owner_id
      join public.id_entitlements e on e.user_id=s.owner_id
       and e.product_id=s.product_id and e.source='purchase'
      where s.family_id=f.id),'[]'::jsonb),
   'owned_shareable',coalesce((select jsonb_agg(e.product_id order by e.product_id)
      from public.id_entitlements e where e.user_id=who and e.source='purchase'),'[]'::jsonb)
  ) into family from public.id_families f where f.id=fid;
 return family;
end $$;

do $$
declare entry record;
begin
 for entry in select p.oid::regprocedure as signature from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in
   ('aurvex_family_create','aurvex_family_new_invite','aurvex_family_join',
    'aurvex_family_leave','aurvex_family_remove_member','aurvex_family_share',
    'aurvex_family_access','aurvex_family_overview')
 loop
  execute format('revoke all on function %s from public,anon',entry.signature);
  execute format('grant execute on function %s to authenticated',entry.signature);
 end loop;
end $$;
