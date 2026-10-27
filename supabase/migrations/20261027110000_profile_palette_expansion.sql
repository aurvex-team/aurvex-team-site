create or replace function public.aurvex_valid_appearance(config jsonb)
returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(config)='object'
 and not exists(select 1 from jsonb_object_keys(config) key
 where key not in ('font','avatar_frame','profile_frame','glow_color','glow_avatar','glow_banner','glow_name','glow_links','glow_profile','profile_theme','inner_color','transparent'))
 and (not(config ? 'font') or config->>'font' in ('system','modern','rounded','mono','serif'))
 and (not(config ? 'avatar_frame') or config->>'avatar_frame' in ('none','violet','red','cyan','emerald','gold'))
 and (not(config ? 'profile_frame') or config->>'profile_frame' in ('none','violet','red','cyan','emerald','gold'))
 and (not(config ? 'glow_color') or config->>'glow_color' in ('violet','red','cyan','emerald','gold'))
 and (not(config ? 'glow_avatar') or config->'glow_avatar' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_banner') or config->'glow_banner' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_name') or config->'glow_name' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_links') or config->'glow_links' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'glow_profile') or config->'glow_profile' in ('true'::jsonb,'false'::jsonb))
 and (not(config ? 'profile_theme') or config->>'profile_theme' in ('galaxy','summer','winter','aurora','neon','ocean','sunset','forest','rose','midnight'))
 and (not(config ? 'inner_color') or config->>'inner_color' in ('rose','violet','blue','gold','emerald','cyan','red','orange','white'))
 and (not(config ? 'transparent') or config->'transparent' in ('true'::jsonb,'false'::jsonb))
$$;
