create or replace function public.aurvex_chat_staff_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid; is_admin boolean; is_mod boolean;
begin
 who:=public.aurvex_shop_actor();
 select exists(select 1 from public.aurvex_site_admins where user_id=who) into is_admin;
 select exists(select 1 from public.aurvex_chat_moderators where user_id=who) into is_mod;
 return jsonb_build_object('moderator',is_admin or is_mod,'siteAdmin',is_admin);
end $$;
revoke all on function public.aurvex_chat_staff_state() from public,anon;
grant execute on function public.aurvex_chat_staff_state() to authenticated;