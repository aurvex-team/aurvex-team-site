-- Applied after aurvex_id_core; preserve insert-only wishlist edits.
-- Duplicate Devive wishlist rows use INSERT ... ON CONFLICT DO NOTHING.
revoke update on public.id_wishlist from authenticated;
