alter table public.id_profiles
 add column if not exists profile_appearance jsonb not null default '{}'::jsonb,
 add column if not exists hidden_title_codes text[] not null default '{}'::text[];

create or replace function public.aurvex_valid_appearance(config jsonb)
returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(config)='object'
 and not exists(select 1 from jsonb_object_keys(config) key
 where key not in ('font','avatar_frame','profile_frame','glow_color','glow_avatar',
                   'glow_banner','glow_name','glow_links','glow_profile'))
 and (not(config ? 'font') or config->>'font' in ('system','modern','rounded','mono','serif'))
 and (not(config ? 'avatar_frame') or config->>'avatar_frame' in ('none','violet','red','cyan','emerald','gold'))
 and (not(config ? 'profile_frame') or config->>'profile_frame' in ('none','violet','red','cyan','emerald','gold'))
 and (not(config ? 'glow_color') or config->>'glow_color' in ('violet','red','cyan','emerald','gold'))
 and (not(config ? 'glow_avatar') or config->'glow_avatar' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_banner') or config->'glow_banner' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_name') or config->'glow_name' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_links') or config->'glow_links' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_profile') or config->'glow_profile' in ('true'::jsonb,'false'::jsonb))
$$;
alter table public.id_profiles drop constraint if exists id_profiles_appearance_valid;
alter table public.id_profiles add constraint id_profiles_appearance_valid
 check (public.aurvex_valid_appearance(profile_appearance));
alter table public.id_profiles drop constraint if exists id_profiles_hidden_titles_valid;
alter table public.id_profiles add constraint id_profiles_hidden_titles_valid
 check (cardinality(hidden_title_codes)<=2
 and hidden_title_codes <@ array['aurvex_ceo','site_launcher_developer']::text[]
 and hidden_title_codes is not null);

create or replace function public.aurvex_valid_links(input jsonb)
returns boolean language sql immutable set search_path='' as $$
 select case when jsonb_typeof(input)<>'array' or jsonb_array_length(input)>3 then false
 else not exists (select 1 from jsonb_array_elements(input) as item(v)
 where jsonb_typeof(item.v)<>'object'
 or not(item.v ? 'title' and item.v ? 'url')
 or exists(select 1 from jsonb_object_keys(item.v) k where k not in ('title','url','slot','align'))
 or jsonb_typeof(item.v->'title')<>'string' or jsonb_typeof(item.v->'url')<>'string'
 or length(item.v->>'title') not between 1 and 40
 or length(item.v->>'url') not between 9 and 220
 or (item.v->>'title') ~ '[[:cntrl:]<>]'
 or (item.v->>'url') !~* '^https://[a-z0-9][a-z0-9.-]*(:[0-9]{2,5})?([/?#][^[:space:]]*)?$'
 or (item.v->>'url') ~ '[[:cntrl:]<>"'']'
 or ((item.v ? 'slot') and item.v->>'slot' not in ('header','main','footer'))
 or ((item.v ? 'align') and item.v->>'align' not in ('left','center','right'))
 ) end
$$;

create or replace function public.aurvex_visible_titles(target_player uuid)
returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(t.title_code order by t.title_code),'{}'::text[])
 from public.id_profile_titles t join public.id_profiles p on p.id=t.user_id
 where t.user_id=target_player and not(t.title_code=any(p.hidden_title_codes))
$$;
grant execute on function public.aurvex_visible_titles(uuid) to anon,authenticated;

create or replace function public.aurvex_public_appearance(target_player uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select p.profile_appearance from public.id_profiles p
 where p.id=target_player and p.nickname is not null
$$;
grant execute on function public.aurvex_public_appearance(uuid) to anon,authenticated;
