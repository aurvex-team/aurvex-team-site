create or replace function public.aurvex_shop_actor()
returns uuid language plpgsql stable set search_path='' as $$
declare who uuid;
begin
 who:=auth.uid();
 if who is null or (auth.jwt()->>'aal') is distinct from 'aal2' then
   raise exception 'AURVEX_SHOP_MFA_REQUIRED' using errcode='42501';
 end if;
 if exists(select 1 from public.aurvex_site_bans b where b.user_id=who and b.banned_until>now()) then
   raise exception 'AURVEX_ACCOUNT_SUSPENDED' using errcode='42501';
 end if;
 return who;
end $$;