create or replace function public.aurvex_chat_site_action(target_user uuid,decision text,ban_reason text default 'Community rules violation')
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; until_at timestamptz; clean_reason text;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_site_admins where user_id=who) then
  raise exception 'SITE_ADMIN_REQUIRED' using errcode='42501';end if;
 if target_user is null or target_user=who
   or exists(select 1 from public.aurvex_site_admins where user_id=target_user)
  then raise exception 'SITE_PROTECTED_USER' using errcode='42501';end if;
 if decision not in ('ban_site','unban_site') then raise exception 'SITE_INVALID_DECISION';end if;
 if not exists(select 1 from auth.users where id=target_user) then raise exception 'SITE_USER_NOT_FOUND';end if;
 clean_reason:=left(btrim(coalesce(ban_reason,'')),200);
 if clean_reason='' then clean_reason:='Community rules violation';end if;
 if decision='ban_site' then
  until_at:=now()+interval '100 years';
  insert into public.aurvex_site_bans(user_id,banned_until,reason,banned_by)
   values(target_user,until_at,clean_reason,who)
   on conflict(user_id) do update set banned_until=excluded.banned_until,
     reason=excluded.reason,banned_by=excluded.banned_by,updated_at=now();
  insert into public.aurvex_chat_controls(user_id,banned_until)
    values(target_user,until_at) on conflict(user_id) do update set banned_until=excluded.banned_until;
  update public.aurvex_chat_messages set status='removed'
    where author_id=target_user and status='visible';
 else
  delete from public.aurvex_site_bans where user_id=target_user;
  update public.aurvex_chat_controls set banned_until=null where user_id=target_user;
 end if;
 insert into public.aurvex_site_ban_audit(actor_id,target_user,action,reason)
   values(who,target_user,decision,clean_reason);
 return jsonb_build_object('success',true,'decision',decision);
end $$;
revoke all on function public.aurvex_chat_site_action(uuid,text,text) from public,anon;
grant execute on function public.aurvex_chat_site_action(uuid,text,text) to authenticated;