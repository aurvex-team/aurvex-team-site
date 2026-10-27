-- One-time AURVEX developer Stars grant, recorded separately from purchases and sale payouts.
-- The official title check prevents the grant from landing on an unrelated profile.
alter table public.aurvex_shop_ledger
  drop constraint if exists aurvex_shop_ledger_reason_check;
alter table public.aurvex_shop_ledger
  add constraint aurvex_shop_ledger_reason_check
  check (reason = any (array[
    'welcome'::text,'purchase'::text,'topup'::text,'sale_payout'::text,
    'developer_grant'::text
  ]));

create unique index if not exists aurvex_shop_one_developer_grant
  on public.aurvex_shop_ledger(user_id)
  where reason='developer_grant';

do $grant$
declare
  target uuid;
  current_balance integer;
begin
  select p.id into target
  from public.id_profiles p
  join public.id_profile_titles t on t.user_id=p.id
  where lower(p.nickname)=lower('fleki')
    and t.title_code='aurvex_ceo'
  for update of p;

  if target is null then
    raise exception 'Verified AURVEX developer account fleki not found';
  end if;

  insert into public.aurvex_shop_wallets(user_id,balance)
  values(target,0)
  on conflict(user_id) do nothing;

  select balance into current_balance
  from public.aurvex_shop_wallets
  where user_id=target
  for update;

  if not exists(
    select 1 from public.aurvex_shop_ledger
    where user_id=target and reason='developer_grant'
  ) then
    if current_balance > 950000 then
      raise exception 'Developer Stars grant would exceed wallet limit';
    end if;
    update public.aurvex_shop_wallets
      set balance=balance+50000
      where user_id=target;
    insert into public.aurvex_shop_ledger(user_id,points_delta,reason)
      values(target,50000,'developer_grant');
  end if;
end
$grant$;
