-- Official titles can be hidden publicly without losing their assignment.
-- The owner's complete set is accessible only after AAL2 verification.
create or replace function public.aurvex_own_titles()
returns text[] language plpgsql stable security definer set search_path='' as $$
declare who uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 return coalesce((select array_agg(t.title_code order by t.title_code)
 from public.id_profile_titles t where t.user_id=who),'{}'::text[]);
end $$;
revoke all on function public.aurvex_own_titles() from public,anon;
grant execute on function public.aurvex_own_titles() to authenticated;
revoke all on public.id_profile_titles from public,anon,authenticated;
drop policy if exists "aurvex_profile_titles_public_read" on public.id_profile_titles;
