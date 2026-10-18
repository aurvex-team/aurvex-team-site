-- AURVEX Profile Studio 3.14 — safe public bio and manually selected status.
-- No presence tracking, geolocation, HTML, links or new exposure of private fields.
alter table public.id_profiles
 add column if not exists profile_bio text not null default '',
 add column if not exists profile_status text not null default 'building';
alter table public.id_profiles
 drop constraint if exists aurvex_profile_bio_length;
alter table public.id_profiles
 add constraint aurvex_profile_bio_length
 check(char_length(profile_bio)<=240 and profile_bio=trim(profile_bio));
alter table public.id_profiles
 drop constraint if exists aurvex_profile_status_allowed;
alter table public.id_profiles
 add constraint aurvex_profile_status_allowed
 check(profile_status in ('building','open','busy','chilling'));

-- Public only returns two explicitly approved public profile fields.
create or replace function public.aurvex_public_profile_about(target_player uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('bio',p.profile_bio,'status',p.profile_status)
   from public.id_profiles p where p.id=target_player and p.nickname is not null),null::jsonb)
$$;
revoke all on function public.aurvex_public_profile_about(uuid) from public;
grant execute on function public.aurvex_public_profile_about(uuid) to anon,authenticated;

-- Validate owner, AAL2 and inputs on the server. All other profile attributes remain unchanged.
create or replace function public.aurvex_profile_save_about(new_bio text,new_status text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; bio_text text; result jsonb;
begin
 who:=public.aurvex_shop_actor();
 bio_text:=trim(coalesce(new_bio,''));
 if char_length(bio_text)>240 or new_status not in ('building','open','busy','chilling') then
   raise exception 'PROFILE_ABOUT_INVALID';
 end if;
 insert into public.id_profiles(id,profile_bio,profile_status)
 values(who,bio_text,new_status)
 on conflict(id) do update set profile_bio=excluded.profile_bio,
  profile_status=excluded.profile_status,updated_at=now();
 return jsonb_build_object('bio',bio_text,'status',new_status);
end $$;
revoke all on function public.aurvex_profile_save_about(text,text) from public,anon;
grant execute on function public.aurvex_profile_save_about(text,text) to authenticated;
