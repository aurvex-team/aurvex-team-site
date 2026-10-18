create or replace function public.aurvex_chat_staff_find_users(search_text text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid; term text;
begin
 who:=public.aurvex_shop_actor();
 if not exists(select 1 from public.aurvex_chat_moderators where user_id=who)
  and not exists(select 1 from public.aurvex_site_admins where user_id=who)
  then raise exception 'CHAT_NOT_MODERATOR' using errcode='42501';end if;
 term:=btrim(coalesce(search_text,''));
 if char_length(term)<3 or char_length(term)>40 then raise exception 'CHAT_SEARCH_INVALID';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('userId',x.id,'nickname',x.nickname))
   from (select id,nickname from public.id_profiles where nickname is not null
     and (strpos(lower(nickname),lower(term))>0 or id::text=term)
     order by nickname limit 12) x),'[]'::jsonb);
end $$;
revoke all on function public.aurvex_chat_staff_find_users(text) from public,anon;
grant execute on function public.aurvex_chat_staff_find_users(text) to authenticated;