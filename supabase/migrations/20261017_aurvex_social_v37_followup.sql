-- Avoid ambiguity with the original PL/pgSQL token_hash variable.
create or replace function public.aurvex_family_join(invite_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid; hashed_token text;
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
 perform 1 from public.id_families f where f.id=fid for update;
 if (select count(*) from public.id_family_members where family_id=fid)>=6 then
  raise exception 'This family is full (maximum 6)' using errcode='22023'; end if;
 insert into public.id_family_members(family_id,user_id) values(fid,who);
 update public.id_family_invites i set revoked=true where i.token_hash=hashed_token;
 update public.id_social_notifications set read_at=now()
  where recipient=who and family_id=fid and kind='family_invite';
 return fid;
end $$;

create or replace function public.aurvex_social_can_invite()
returns boolean language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 return exists(select 1 from public.id_families f where f.owner_id=who);
end $$;
revoke all on function public.aurvex_social_can_invite() from public,anon;
grant execute on function public.aurvex_social_can_invite() to authenticated;
