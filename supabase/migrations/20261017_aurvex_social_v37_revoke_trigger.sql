-- Internal social notification trigger must not be directly callable over PostgREST.
-- It remains executable by PostgreSQL's trigger engine when friendships change.
revoke all on function public.aurvex_social_friend_notify() from public,anon,authenticated;
