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
 -- Prevent repeated API calls from minting unlimited short-lived tokens.
 if exists(select 1 from public.id_family_invites i
   where i.family_id=n.family_id and i.recipient_id=who
     and i.created_at>now()-interval '40 seconds') then
   raise exception 'Please wait before requesting another invitation' using errcode='22023';
 end if;
 update public.id_family_invites i set revoked=true
   where i.family_id=n.family_id and i.recipient_id=who and not i.revoked;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.id_family_invites(family_id,token_hash,expires_at,recipient_id)
 values(n.family_id,encode(extensions.digest(token,'sha256'),'hex'),
   least(n.expires_at,now()+interval '15 minutes'),who);
 update public.id_social_notifications set read_at=now() where id=n.id;
 return token;
end $$;
