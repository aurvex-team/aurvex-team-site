create or replace function public.aurvex_chat_staff_roster()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
    and not exists(select 1 from public.aurvex_site_admins where user_id=who)
  then raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
    'userId',s.author_id,'nickname',coalesce(p.nickname,'AURVEX Player'),
    'lastMessage',s.last_message,'chatBan',coalesce(c.banned_until>now(),false),
    'siteBan',coalesce(b.banned_until>now(),false)) order by s.last_message desc)
   from (select author_id,max(created_at) as last_message
      from public.aurvex_chat_messages group by author_id
      order by max(created_at) desc limit 50) s
   left join public.id_profiles p on p.id=s.author_id
   left join public.aurvex_chat_controls c on c.user_id=s.author_id
   left join public.aurvex_site_bans b on b.user_id=s.author_id),'[]'::jsonb);
end $$;
revoke all on function public.aurvex_chat_staff_roster() from public,anon;
grant execute on function public.aurvex_chat_staff_roster() to authenticated;