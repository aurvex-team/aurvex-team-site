-- AURVEX ID: enforce confirmed two-factor authentication in the DATABASE.
-- Apply only after the web MFA enrollment/login UI has deployed successfully.
-- Supabase Auth MFA verifies users and gives session JWTs "aal":"aal2".
-- These restrictive policies AND with_check prevent aal1 sessions (including
-- Google-only compromised sessions) from accessing the account's private data.
-- Owner-specific permissive policies from prior migrations are preserved.

create policy "aurvex_profiles_require_mfa"
  on public.id_profiles as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "aurvex_wishlist_require_mfa"
  on public.id_wishlist as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "aurvex_entitlements_require_mfa"
  on public.id_entitlements as restrictive for select to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');

-- Storage bucket uses public image URLs intentionally: reading previously
-- published avatar/banner files is public. Creating or deleting assets is not.
-- Restrictive policy applies to authenticated writes only; anon has no access.
create policy "aurvex_media_insert_requires_mfa"
  on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'aurvex-profile-media' or (select auth.jwt()->>'aal')='aal2');
create policy "aurvex_media_delete_requires_mfa"
  on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'aurvex-profile-media' or (select auth.jwt()->>'aal')='aal2');
-- Existing owner-scoped select is required for authenticated delete.
