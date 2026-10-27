-- Weekly Stars awards are claimed once per UTC Sunday by an AAL2-verified account.
-- Schedule starts 2026-11-01: 500, 500, 700, 700, then +200 per pair of weeks.
alter table public.aurvex_shop_ledger
  drop constraint if exists aurvex_shop_ledger_reason_check;
alter table public.aurvex_shop_ledger
  add constraint aurvex_shop_ledger_reason_check
  check (reason = any (array[
    'welcome'::text,'purchase'::text,'topup'::text,'sale_payout'::text,
    'developer_grant'::text,'weekly_reward'::text
  ]));

insert into public.aurvex_shop_items(id,kind,theme,price_points,price_uah_kop) values
 ('avatar_summer','avatar','gold',275,7900),
 ('avatar_frostnova','avatar','frost',325,8900),
 ('avatar_galaxy','avatar','cosmic',450,12900),
 ('profile_summer','profile','gold',475,13900),
 ('profile_winter','profile','frost',450,12900),
 ('profile_galaxy','profile','cosmic',600,16900),
 ('profile_neon','profile','flame',525,14900)
on conflict(id) do nothing;

create table if not exists public.aurvex_weekly_star_claims(
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_number integer not null check(week_number>0),
  points_awarded integer not null check(points_awarded between 1 and 100000),
  claimed_at timestamptz not null default now(),
  primary key(user_id,week_start),
  unique(user_id,week_number)
);
alter table public.aurvex_weekly_star_claims enable row level security;
revoke all on public.aurvex_weekly_star_claims from public,anon,authenticated;

create or replace function public.aurvex_weekly_star_reward_state()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  who uuid:=public.aurvex_shop_actor();
  utc_today date:=(now() at time zone 'utc')::date;
  dow integer:=extract(dow from (now() at time zone 'utc'))::integer;
  season_start constant date:='2026-11-01';
  target_sunday date;
  week_no integer;
  amount integer;
  was_claimed boolean;
begin
  target_sunday:=case when dow=0 then utc_today else utc_today+(7-dow) end;
  if target_sunday<season_start then target_sunday:=season_start; end if;
  week_no:=((target_sunday-season_start)/7)+1;
  amount:=least(100000,500+200*((week_no-1)/2));
  select exists(select 1 from public.aurvex_weekly_star_claims c
    where c.user_id=who and c.week_start=target_sunday) into was_claimed;
  return jsonb_build_object(
    'week_start',target_sunday,'week_number',week_no,'points',amount,
    'claimed',was_claimed,
    'can_claim',dow=0 and utc_today>=season_start and not was_claimed,
    'season_starts',season_start
  );
end
$$;
revoke all on function public.aurvex_weekly_star_reward_state() from public,anon;
grant execute on function public.aurvex_weekly_star_reward_state() to authenticated;

create or replace function public.aurvex_weekly_star_claim()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  who uuid:=public.aurvex_shop_actor();
  utc_today date:=(now() at time zone 'utc')::date;
  dow integer:=extract(dow from (now() at time zone 'utc'))::integer;
  season_start constant date:='2026-11-01';
  week_no integer;
  amount integer;
  current_balance integer;
begin
  if dow<>0 or utc_today<season_start then
    raise exception 'WEEKLY_REWARD_SUNDAY_ONLY' using errcode='22023';
  end if;
  week_no:=((utc_today-season_start)/7)+1;
  amount:=least(100000,500+200*((week_no-1)/2));
  perform public.aurvex_shop_bootstrap();
  select w.balance into current_balance
    from public.aurvex_shop_wallets w where w.user_id=who for update;
  if exists(select 1 from public.aurvex_weekly_star_claims c
      where c.user_id=who and c.week_start=utc_today) then
    raise exception 'WEEKLY_REWARD_ALREADY_CLAIMED' using errcode='23505';
  end if;
  if current_balance+amount>1000000 then
    raise exception 'WEEKLY_REWARD_WALLET_LIMIT' using errcode='22023';
  end if;
  insert into public.aurvex_weekly_star_claims(user_id,week_start,week_number,points_awarded)
    values(who,utc_today,week_no,amount);
  update public.aurvex_shop_wallets set balance=balance+amount where user_id=who;
  insert into public.aurvex_shop_ledger(user_id,points_delta,reason)
    values(who,amount,'weekly_reward');
  return jsonb_build_object('week_number',week_no,'points',amount,'balance',current_balance+amount);
end
$$;
revoke all on function public.aurvex_weekly_star_claim() from public,anon;
grant execute on function public.aurvex_weekly_star_claim() to authenticated;
