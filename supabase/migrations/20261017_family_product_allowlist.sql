-- Family licensing: explicit publisher-admin allowlist; disabled by default.
-- No client or public grants; product publishing enables approved licenses.
create table if not exists public.id_family_eligible_products(
 product_id text primary key,
 enabled boolean not null default false
);
alter table public.id_family_eligible_products enable row level security;
revoke all on public.id_family_eligible_products from public,anon,authenticated;

create or replace function public.aurvex_family_share(product text,share_on boolean)
returns void language plpgsql security definer set search_path='' as $$
declare who uuid; fid uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then raise exception 'Join a family first' using errcode='22023'; end if;
 if product is null or length(product)>80 or product !~ '^[a-z0-9_-]+$' then
   raise exception 'Invalid game' using errcode='22023';
 end if;
 if share_on then
  -- Only PAID confirmed first-party purchases can be lent.
  -- Gifts/shared licenses never recursively grant sharing rights.
  if not exists(select 1 from public.id_entitlements e where
        e.user_id=who and e.product_id=product and e.source='purchase' and exists(select 1 from public.id_family_eligible_products x where x.product_id=product and x.enabled)) then
    raise exception 'Only your purchased, shareable games can be shared' using errcode='42501';
  end if;
  insert into public.id_family_shares(family_id,owner_id,product_id)
    values(fid,who,product) on conflict do nothing;
 else
  delete from public.id_family_shares where family_id=fid and owner_id=who and product_id=product;
 end if;
end $$;

create or replace function public.aurvex_family_access()
returns table(product_id text, shared_by uuid, source text)
language plpgsql stable security definer set search_path='' as $$
declare who uuid; fid uuid;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then return; end if;
 return query
 select s.product_id,s.owner_id,'family_shared'::text
 from public.id_family_shares s
 join public.id_family_members m on m.family_id=s.family_id and m.user_id=s.owner_id
 join public.id_entitlements e on e.user_id=s.owner_id
  and e.product_id=s.product_id and e.source='purchase'
 where s.family_id=fid and s.owner_id<>who
  and exists(select 1 from public.id_family_eligible_products x where x.product_id=s.product_id and x.enabled);
end $$;

create or replace function public.aurvex_family_overview()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid; fid uuid; family jsonb;
begin
 who:=public.aurvex_friends_require_mfa();
 select m.family_id into fid from public.id_family_members m where m.user_id=who;
 if fid is null then return null; end if;
 select jsonb_build_object(
   'id',f.id,'name',f.name,'owner_id',f.owner_id,'created_at',f.created_at,
   'members',coalesce((select jsonb_agg(jsonb_build_object(
       'id',m.user_id,'nickname',coalesce(p.nickname,'AURVEX player'),
       'avatar_path',p.avatar_path,'joined_at',m.joined_at,
       'is_owner',(m.user_id=f.owner_id)) order by m.joined_at)
     from public.id_family_members m left join public.id_profiles p on p.id=m.user_id
     where m.family_id=f.id),'[]'::jsonb),
   'shares',coalesce((select jsonb_agg(jsonb_build_object(
      'owner_id',s.owner_id,'product_id',s.product_id) order by s.product_id)
      from public.id_family_shares s
      join public.id_family_members m on m.family_id=s.family_id and m.user_id=s.owner_id
      join public.id_entitlements e on e.user_id=s.owner_id
       and e.product_id=s.product_id and e.source='purchase'
       and exists(select 1 from public.id_family_eligible_products x where x.product_id=s.product_id and x.enabled)
      where s.family_id=f.id),'[]'::jsonb),
   'owned_shareable',coalesce((select jsonb_agg(e.product_id order by e.product_id)
      from public.id_entitlements e where e.user_id=who and e.source='purchase'
       and exists(select 1 from public.id_family_eligible_products x where x.product_id=e.product_id and x.enabled)),'[]'::jsonb)
  ) into family from public.id_families f where f.id=fid;
 return family;
end $$;

