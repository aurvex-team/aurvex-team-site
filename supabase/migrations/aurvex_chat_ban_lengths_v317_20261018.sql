create or replace function public.aurvex_chat_moderate_user(target_user uuid,decision text)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
    and not exists(select 1 from public.aurvex_site_admins where user_id=who) then
   raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 if target_user=who or target_user is null
    or exists(select 1 from public.aurvex_site_admins where user_id=target_user) then
   raise exception 'CHAT_PROTECTED_USER' using errcode='42501';end if;
 if decision not in ('mute_1h','mute_1d','ban_1d','ban_7d','ban_30d','ban_permanent','unban')
   then raise exception 'CHAT_INVALID_DECISION';end if;
 insert into public.aurvex_chat_controls(user_id) values(target_user) on conflict(user_id) do nothing;
 update public.aurvex_chat_controls
 set muted_until=case when decision='mute_1h' then now()+interval '1 hour'
                      when decision='mute_1d' then now()+interval '1 day'
                      when decision='unban' then null else muted_until end,
     banned_until=case when decision='ban_1d' then now()+interval '1 day'
                       when decision='ban_7d' then now()+interval '7 days'
                       when decision='ban_30d' then now()+interval '30 days'
                       when decision='ban_permanent' then '9999-12-31 23:59:59+00'::timestamptz
                       when decision='unban' then null else banned_until end
 where user_id=target_user;
 if decision like 'ban_%' then
   update public.aurvex_chat_messages set status='removed' where author_id=target_user and status='visible';
 end if;
end $$;
revoke all on function public.aurvex_chat_moderate_user(uuid,text) from public,anon;
grant execute on function public.aurvex_chat_moderate_user(uuid,text) to authenticated;