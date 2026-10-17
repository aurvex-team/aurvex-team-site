create or replace function public.aurvex_family_join(invite_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; hashed_token text; invite_owner uuid; target_only uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 if exists(select 1 from public.id_family_members where user_id=who) then
  raise exception 'Leave the current family first' using errcode='22023'; end if;
 if invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then
  raise exception 'Invalid invitation link' using errcode='22023'; end if;
 hashed_token:=encode(extensions.digest(invite_token,'sha256'),'hex');
 select i.family_id into fid from public.id_family_invites i
  where i.token_hash=hashed_token and not i.revoked and i.expires_at>now()
  and (i.recipient_id is null or i.recipient_id=who);
 if fid is null then raise exception 'Invitation expired or revoked' using errcode='22023'; end if;
 select f.owner_id into invite_owner from public.id_families f where f.id=fid;
 if exists(select 1 from public.id_social_blocks b where
   (b.blocker=who and b.blocked=invite_owner) or
   (b.blocker=invite_owner and b.blocked=who)) then
   raise exception 'Invitation unavailable' using errcode='42501'; end if;
 select i.recipient_id into target_only from public.id_family_invites i
  where i.token_hash=hashed_token;
 if target_only is not null and not exists(select 1 from public.id_friendships f
   where f.user_a=least(who,invite_owner) and f.user_b=greatest(who,invite_owner)
    and f.status='accepted') then
   raise exception 'This friend invitation is no longer valid' using errcode='42501'; end if;
 perform 1 from public.id_families f where f.id=fid for update;
 if (select count(*) from public.id_family_members where family_id=fid)>=6 then
  raise exception 'This family is full (maximum 6)' using errcode='22023'; end if;
 insert into public.id_family_members(family_id,user_id) values(fid,who);
 update public.id_family_invites i set revoked=true where i.token_hash=hashed_token;
 update public.id_social_notifications set read_at=now()
  where recipient=who and family_id=fid and kind='family_invite';
 return fid;
end $$;

-- Recipient cannot redeem an invitation once they are no longer friends.
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
 if not exists(select 1 from public.id_friendships f where
   f.user_a=least(who,n.actor) and f.user_b=greatest(who,n.actor)
   and f.status='accepted') then
   raise exception 'Only current friends can redeem invitation' using errcode='42501'; end if;
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
