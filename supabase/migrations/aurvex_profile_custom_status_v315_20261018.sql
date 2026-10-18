-- Profile Studio 3.15: manually chosen short emoji status, text, server duration.
-- The former profile_status column is retained for compatibility, but new UI uses only custom status.
alter table public.id_profiles
 add column if not exists profile_status_text text not null default '',
 add column if not exists profile_status_emoji text not null default '',
 add column if not exists profile_status_expires_at timestamptz;
alter table public.id_profiles drop constraint if exists aurvex_status_text_limit;
alter table public.id_profiles add constraint aurvex_status_text_limit
 check(char_length(profile_status_text)<=80 and profile_status_text=trim(profile_status_text));
alter table public.id_profiles drop constraint if exists aurvex_status_emoji_known;
alter table public.id_profiles add constraint aurvex_status_emoji_known
 check(profile_status_emoji in ('', '😀','😎','💻','🎮','🔥','💜','✨','🚀','🌙','🎧','🛠️','☕','💤','❤️','🌸','👾','🧠','🎨','✅','💬'));
alter table public.id_profiles drop constraint if exists aurvex_status_empty_deadline;
alter table public.id_profiles add constraint aurvex_status_empty_deadline
 check(profile_status_text<>'' or profile_status_emoji<>'' or profile_status_expires_at is null);

create or replace function public.aurvex_profile_set_custom_status(
 new_text text, new_emoji text, duration text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid; clean_text text; clean_emoji text; exp timestamptz;
begin
 who:=public.aurvex_shop_actor();
 clean_text:=btrim(coalesce(new_text,''));
 clean_emoji:=coalesce(new_emoji,'');
 if char_length(clean_text)>80 or clean_text ~ '[[:cntrl:]]' or
    clean_emoji not in ('', '😀','😎','💻','🎮','🔥','💜','✨','🚀','🌙','🎧','🛠️','☕','💤','❤️','🌸','👾','🧠','🎨','✅','💬') or
    duration not in ('30m','1h','4h','1d','7d','never') then
   raise exception 'PROFILE_CUSTOM_STATUS_INVALID';
 end if;
 if clean_text='' and clean_emoji='' then
   exp:=null;
 else
   exp:=case duration
      when '30m' then now()+interval '30 minutes'
      when '1h' then now()+interval '1 hour'
      when '4h' then now()+interval '4 hours'
      when '1d' then now()+interval '1 day'
      when '7d' then now()+interval '7 days'
      else null end;
 end if;
 insert into public.id_profiles(id,profile_status_text,profile_status_emoji,profile_status_expires_at)
 values(who,clean_text,clean_emoji,exp)
 on conflict(id) do update set
   profile_status_text=excluded.profile_status_text,
   profile_status_emoji=excluded.profile_status_emoji,
   profile_status_expires_at=excluded.profile_status_expires_at,
   updated_at=now();
 return jsonb_build_object('text',clean_text,'emoji',clean_emoji,'expiresAt',exp);
end $$;
revoke all on function public.aurvex_profile_set_custom_status(text,text,text) from public,anon;
grant execute on function public.aurvex_profile_set_custom_status(text,text,text) to authenticated;

-- Public bio and status are explicitly allowlisted; expired status is filtered by DB clock.
create or replace function public.aurvex_public_profile_about(target_player uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select (select jsonb_build_object(
    'bio',p.profile_bio,
    'status',p.profile_status,
    'customText',case when p.profile_status_expires_at is null
         or p.profile_status_expires_at>now()
       then p.profile_status_text else '' end,
    'customEmoji',case when p.profile_status_expires_at is null
         or p.profile_status_expires_at>now()
       then p.profile_status_emoji else '' end,
    'customExpiresAt',case when p.profile_status_expires_at is null
         or p.profile_status_expires_at>now()
       then p.profile_status_expires_at else null end)
   from public.id_profiles p where p.id=target_player and p.nickname is not null)
$$;
revoke all on function public.aurvex_public_profile_about(uuid) from public;
grant execute on function public.aurvex_public_profile_about(uuid) to anon,authenticated;
