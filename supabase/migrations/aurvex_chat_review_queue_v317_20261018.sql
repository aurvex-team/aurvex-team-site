create or replace function public.aurvex_chat_moderation_queue()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
    and not exists(select 1 from public.aurvex_site_admins where user_id=who)
   then raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
   'id',m.id,'authorId',m.author_id,'nickname',coalesce(p.nickname,'AURVEX Player'),
   'body',m.body,'status',m.status,'reports',(select count(*) from public.aurvex_chat_reports r where r.message_id=m.id),
   'createdAt',m.created_at) order by m.id desc)
   from (select * from public.aurvex_chat_messages where status='held'
     or exists(select 1 from public.aurvex_chat_reports r where r.message_id=aurvex_chat_messages.id)
      order by id desc limit 60) m
   left join public.id_profiles p on p.id=m.author_id),'[]'::jsonb);
end $$;
revoke all on function public.aurvex_chat_moderation_queue() from public,anon;
grant execute on function public.aurvex_chat_moderation_queue() to authenticated;