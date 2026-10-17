-- Make publicly saved HTTPS links compatible with real share URLs,
-- including query strings/fragments immediately after a domain.
-- Preserve max 3 links, explicit title+URL, length limits and HTTPS-only rule.
create or replace function public.aurvex_valid_links(input jsonb)
returns boolean language sql immutable set search_path='' as $$
  select case when jsonb_typeof(input) <> 'array' or jsonb_array_length(input)>3 then false
   else not exists (
    select 1 from jsonb_array_elements(input) as item(v)
    where jsonb_typeof(item.v) <> 'object'
      or (select count(*) from jsonb_object_keys(item.v)) <> 2
      or not (item.v ? 'title' and item.v ? 'url')
      or jsonb_typeof(item.v->'title') <> 'string'
      or jsonb_typeof(item.v->'url') <> 'string'
      or length(item.v->>'title') not between 1 and 40
      or (item.v->>'title') ~ '[[:cntrl:]<>]'
      or length(item.v->>'url') not between 9 and 220
      or (item.v->>'url') !~* '^https://[a-z0-9][a-z0-9.-]*(:[0-9]{2,5})?([/?#][^[:space:]]*)?$'
      or (item.v->>'url') ~ '[[:cntrl:]<>"'']'
   )
  end
$$;
