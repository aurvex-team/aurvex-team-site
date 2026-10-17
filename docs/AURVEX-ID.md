# AURVEX ID — identity architecture and setup

Status: **separate Supabase project and RLS schema active; Google OAuth provider enabled in Supabase and Google sign-in frontend enabled for testing, not yet verified end-to-end**. Project `aurvex-id` (`zalzsgfufvppvgvqfocf`, region `eu-central-1`) is entirely separate from XONI Mail. The site contains ONLY a publishable key. Google provider and Google frontend switch are ON for testing; email and XONI frontend switches remain OFF pending verified email delivery, proper delegated authentication and end-to-end tests. A public API key and disabled UI controls are not a replacement for configuring provider-level signup and abuse restrictions in Supabase.

## Ownership boundaries

AURVEX ID is a NEW, independent Supabase Auth project and database. Do not reuse the existing **XONI Mail** Supabase project, Neon databases for VELTRIX/VYLOQ, or copy users/password hashes between apps. XONI Mail remains a separate service and an optional future identity provider.

- AURVEX Store: the public browser client; only a public Supabase publishable key, with RLS on all per-user data.
- AURVEX ID: Supabase Auth service issues verified session tokens and stable UUID identity; Google OAuth (authorization code + PKCE) and email one-time-code authentication.
- AURVEX Launcher (later): trusted OIDC Authorization Code + PKCE in the system browser. The launcher must use a registered public client and NEVER embed service-role credentials or a client secret. The new Supabase Auth OAuth 2.1 server can be evaluated to act as the OIDC provider for the launcher, or a dedicated backend can validate tokens and issue an app session. Do not assume website tokens automatically authenticate a native application.
- XONI Mail (later): must implement an independently audited, trusted OIDC identity-provider flow or equivalent server-verified delegation. A raw email address, inbox message, a client-provided "XONI token" or a password entered on AURVEX **must not** create/link an account. Only link an XONI provider subject to the *already authenticated* AURVEX user with reauthentication and explicit consent. Prevent automatic account linking by matching email addresses.
- Game entitlements: payment/download permissions must be granted by a trusted server after confirming legitimate transactions; never by UI/localStorage.

## Activation checklist

1. ✅ Created separate project **aurvex-id**, project ref `zalzsgfufvppvgvqfocf`, under the same organization as XONI Mail; price quoted for project creation was $0/month. Region: Frankfurt (`eu-central-1`).
2. ✅ Applied `supabase/migrations/20261017_aurvex_id_core.sql` and `supabase/migrations/20261017_aurvex_id_wishlist_permissions.sql` on AURVEX ID only; verified all three RLS tables, no anon read/write access, and authenticated users cannot insert or update entitlements.
3. In Supabase Auth configuration, set the Site URL to `https://aurvex-team.github.io/aurvex-team-site/id.html`. Allow the exact GitHub Pages return URL `https://aurvex-team.github.io/aurvex-team-site/id.html` (and optional `store.html` if used). The PKCE callback adds `?code=...` to `id.html`; configure Supabase's normal URL allowlist according to its rules. The SPA then opens `#/id` without moving code into the hash. Never redirect to an arbitrary URL from a request parameter.
4. Configure Google provider in Google Cloud OAuth and Supabase. Restrict authorized redirect URIs to the verified Supabase callback, set correct authorized origins, consent screen and audience. Put Google **client secrets** only in Supabase/Google dashboard, never the git repo.
5. Configure a real transactional email sender/SMTP for Supabase Auth, verified sender/domain, rate limits/CAPTCHA or equivalent anti-abuse controls. Update the Supabase email template to include \`{{ .Token }}\` to send 6-digit OTP; optionally also send \`{{ .ConfirmationURL }}\` for a magic link. Test both sign-in and registration with real mailboxes. Limit email abuse/credential-stuffing using provider rate limits and monitoring; never show if a user exists.
6. ✅ `assets/id-config.js` contains only the project URL and a Supabase `sb_publishable_` key. Keep `googleEnabled` and `emailEnabled` set to `false` until their provider flows have been tested. Do not enable signup on the public site until email abuse limits, authorized redirect URLs, and sender configuration are reviewed. The repo and deployed site are public. Do not put service-role keys, JWT secrets, Google client secrets, SMTP credentials, XONI integration keys, or PostgreSQL URLs into frontend code.
7. Test on a fresh browser/device: new OTP account, existing account, Google sign in, verification, sign out, nickname length/uniqueness, RLS between accounts, wishlist sync, loading the same account on a second computer.
8. Enable XONI only AFTER completing the secure delegated identity protocol. It is intentionally disabled in the current frontend.

## Current frontend structure

- `assets/id-config.js` — connected project URL and publishable key; provider flags intentionally false.
- \`assets/id-service.js\` — pinned Supabase client, PKCE, Google, OTP, profiles, wishlist; sends no real-name/phone fields.
- \`assets/id-ui.js\` — auth controller, form handling, signed-in state, no fake session fallback.
- \`assets/app.js\` — #/id route, responsive sign-in/profile screen, account nav button.
- \`supabase/migrations/20261017_aurvex_id_core.sql\` — RLS-secured per-user data and read-only entitlements.

**Known limitations:** The separate Supabase project exists, but Google OAuth/SMTP and allowed redirect URLs still need setup. All sign-in actions remain disabled; no registration or account is created. A project's public key is public by design, but authorization relies on strict RLS. Profile nickname only uses ASCII letters/numbers/underscore (3–24 characters); no real names, phone numbers or addresses.

## Wishlist

Before sign-in the user keeps their wishlist in localStorage. On a verified sign-in, the client merges locally saved Devive into the server wishlist (never deletes server data due to absent local data). Subsequent wishlist edits sync to the signed-in account. Signed-out browsing stays local.

## Production-security follow-ups

- Perform independent review of Google OAuth, allowed redirects, RLS, error handling, and identity linking.
- Add per-user deletion/export flows, privacy notice, terms, abuse monitoring, and email recovery.
- Use multi-factor authentication for sensitive account changes, and reauthenticate to link providers.
- Give the future launcher tokens limited scopes with expiry, refresh-token rotation and protected local storage.
- Never expose payment data, service keys, or private XONI messages to the client.
- If enabling profile search/social features, add a separate explicitly opt-in public view — private email/profile tables should not become searchable.


## No custom domain required — launch Google sign-in first

AURVEX Store may stay on GitHub Pages while the identity provider is Supabase.
These are **three different URLs with different purposes**:

| Setting | Exact value |
| --- | --- |
| Store origin / Google "Authorized JavaScript origins" | \`https://aurvex-team.github.io\` |
| Supabase Site URL and redirect allowlist | \`https://aurvex-team.github.io/aurvex-team-site/id.html\` |
| Google "Authorized redirect URIs" | \`https://zalzsgfufvppvgvqfocf.supabase.co/auth/v1/callback\` |

1. **Supabase:** Authentication → URL Configuration: enter the exact **Site URL** and add the exact account callback address to **Redirect URLs**.
2. **Google Cloud Console:** Create an OAuth project and configure Google Auth Platform Branding, Audience = External, Data Access scopes \`openid\`, \`userinfo.email\`, \`userinfo.profile\`. In "Clients", create a **Web application** using the exact origin and Supabase callback above. If Audience is set to *Testing*, only specifically added Google test users may sign in.
3. **Supabase:** Authentication → Sign In / Providers → Google; enable it, and paste **Client ID** and **Client Secret** from Google Cloud **into the Supabase dashboard only**. Never paste a client secret into ChatGPT, public GitHub, or screenshots.
4. Enable new user signups in Supabase **only after Google is verified and tested**. If initially launching Google-only, consider disabling the Email sign-in provider until a real outbound sender exists, since an unconfigured email provider can otherwise invite abuse.
5. ✅ The public frontend `googleEnabled` flag has been enabled **for testing** after the Google provider was enabled in Supabase. This is *not* confirmation that login works or that public signups are safe. The existing browser login code already uses Google + PKCE, and redirects back to \`id.html\`.
6. Later, enable ordinary email signup via a **custom SMTP** provider and branded verification email. A custom DNS domain is strongly recommended for a public service, but an SMTP provider that can send from an authorized mailbox (e.g. a dedicated Gmail address with a Google app password) can be used for **small internal testing**, if the provider's terms and limits allow. Do not use a personal account for production mail. Supabase's default mailer is restricted to project-team addresses and is not suitable for public signups.
7. XONI Mail will not authenticate via raw email strings; it needs a secure identity provider and explicit account linking.

**Important:** AURVEX Launcher later uses its own OAuth 2.1/OIDC client registration and system-browser PKCE. The Google browser Client ID is **not** an app credential embedded in native builds.



## Google test activation (2026-10-17)

Google Cloud OAuth client \`AURVEX ID Web\` was created and added to Supabase. An accidentally exposed original client secret has been disabled and replaced by the user; the active replacement secret is never stored in this repository. The Supabase Sign In / Providers screen shows Google ENABLED.

- ✅ Frontend Google sign-in button enabled for controlled testing (\`googleEnabled:true\`).
- ⏳ Add the Gmail being used to **Google Auth Platform → Audience → Test users**. While Google OAuth remains in Testing, non-test users should not be able to sign in.
- ⏳ Confirm **Supabase → Authentication → Sign In / Providers → Allow new users to sign up** is ON for a first Google signup (may have been switched OFF during initial setup).
- ⏳ Consider turning **Email provider OFF** while public signup is temporarily enabled, until a working custom SMTP transport is set up. This prevents unsupported passwordless email sign-ups through the Auth API.
- ⏳ Verify the production Google login loop and logout with a test account on \`https://aurvex-team.github.io/aurvex-team-site/id.html#/id\`.
- ⏳ Onboarding for untrusted public accounts, anti-abuse/rate limits, and actual production rollout are future steps.

**No Google Client Secret, SMTP password or admin key should ever be placed in this repo or shared in screenshots.**


## Player profiles, avatars, animated banners and cross-device wishlist (v3.3)

- ✅ `aurvex_profile_media_realtime` migration is applied to the standalone AURVEX ID project, not XONI Mail.
- ✅ `id_profiles.avatar_path` and `banner_path` are constrained to objects in the profile owner's UUID folder.
- ✅ Supabase Storage public bucket `aurvex-profile-media` allows JPG/PNG/WebP/GIF with an 8 MiB server limit. Avatar uploads limit to 3 MiB and disallow GIF; banners support animated GIF up to 8 MiB. `storage.objects` RLS only permits the signed-in owner to insert/delete own files.
- ✅ Public media URLs are accessible by others: users should remove GPS/EXIF and avoid uploading sensitive photos. Before shipping public social profiles, add moderation/reporting and a content policy.
- ✅ Nickname, avatar and banner updates preserve other profile columns. Every new file gets a new unique path to avoid cached images.
- ✅ `id_wishlist` is enabled in Supabase Realtime with owner-only RLS. Signed-in clients ALWAYS read the authoritative server value; the bug where stale localStorage resurrected a deleted wish on another device is fixed.
- ✅ Live updates arrive from Realtime, with tab-focus checks and 30-second visible-tab polling as backup. Local rapid toggles are serialized.
- ⚠️ Old guest wishlist entries are NOT automatically imported on new sign-in, to avoid unexpectedly recreating remotely removed items. Users can add games while signed in.
- ⚠️ Automated frontend tests cover the controls and expected security invariants. End-to-end file upload, cross-device sync and GIF rendering must be checked manually using a test account.


## Mandatory two-factor authentication and Verified badge (v3.4)

- Supabase Auth TOTP MFA is required for access to the full AURVEX profile, cloud wishlist and entitlement data. This is NOT Google 2-Step Verification: it is a separate, AURVEX-specific authenticator code.
- After Google login with AAL1: if there is no verified TOTP factor, the user must enroll by scanning a QR and verifying a six-digit code; if there is an existing factor, the user must enter a fresh code to step up to AAL2.
- The Profile link replaces AURVEX ID in the sidebar in all four languages (EN, UA, PL, DE). The Verified/2FA badge appears only after a validated AAL2 session AND an enrolled verified TOTP factor.
- The frontend reads current AAL and verified factors via Supabase Auth. No TOTP secret is ever saved to localStorage, GitHub or the profile DB.
- Migration `supabase/migrations/20261017_aurvex_mfa_required.sql` was applied to `aurvex-id` AFTER the v3.4 account interface was deployed. Five RESTRICTIVE RLS policies require `auth.jwt()->>'aal' = 'aal2'` for profile and wishlist data, entitlements, and account media writes.
- The protected data remains inaccessible to AAL1 API requests even if somebody bypasses JavaScript UI with a Google-only token. Google-only sign-in still obtains a limited AAL1 Supabase Auth session; do not describe it as fully unauthenticated.
- Supabase Auth does not provide recovery codes. A verified user can enroll a second independent backup TOTP factor from the account's security card (keep it on another device). Losing all factors may permanently lock the user out. Do not unenroll all verified factors through an unsafe API.
- IMPORTANT LIMITATION: If the victim has NEVER enrolled MFA and someone already controls their Google credentials, that person may enroll a first authenticator before the legitimate user. MFA reduces exposure AFTER safe enrollment; users should also protect their Google accounts and enroll AURVEX MFA promptly.
- Already uploaded profile images remain publicly viewable by URL because the media bucket is public. MFA secures new uploads/deletions, not reads of previously published images.
- Manual acceptance test: configure first TOTP, verify AAL2 profile and upload, log out, log back into Google and confirm an authenticator challenge is required, try a new browser (must require code), add independent backup TOTP from profile, verify RLS rejects AAL1 direct access.


## Friends system v1 (AURVEX 3.5)

- AURVEX ID friends feature is available to Google-authenticated users who completed AURVEX 2FA, in all 4 languages and on desktop/mobile.
- Features: search up to 15 matching players by the first 3–24 nickname characters, send request, accept, decline, cancel outgoing, view accepted friends and remove. Shows public avatar and nickname only; never emails.
- `id_friendships` and `id_friend_attempts` are private RLS-enabled tables with *no grants or policies for authenticated/anon users*. Only 4 vetted SECURITY DEFINER RPCs are executable by the authenticated role; each validates `aal2` through an unexposed private helper.
- Unique unordered pairs prevent duplicate/reversed invitations. Sender cannot accept own request. Declining rejects further invitations from that pair; cancelling requires 24 hours before sending to same player again. Limit 10 sent invites per 24h and 30 pending invites at a time (server-enforced).
- Visibility: nickname prefix search requires a publicly chosen nickname (no email/user ID lookups). Profile banner not returned; only public avatar path returned.
- Polling on focus and at visible-tab intervals updates friend lists across devices. True Realtime notifications and chat are not included in v1.
- Database migration: `supabase/migrations/20261017_aurvex_friends_v1.sql` applied to `aurvex-id` after the prior MFA migration.
- Google OAuth is still in Testing. To test with a second real Google account, add that account to Google Auth Platform test users, then sign in, enroll AURVEX MFA, and choose a distinct public nickname on both accounts.
- Verify manually with 2 accounts: search nickname, send request, accept it from second user, ensure both see each other on next focus/refresh, cancel/remove/decline. Automated checks cover scripts, UI and DB policy invariants.


## Public-facing profiles, family invitations and game gifts (v3.6)

- ✅ `supabase/migrations/20261017_profile_public_links.sql` is deployed in `aurvex-id`. Players may set up to 3 named HTTPS links. Wishlist visibility is OFF by default, and the server-side public projection RPC returns only nickname, public artwork, links, join date and opt-in Wishlist product IDs. Never exposes email, private permissions, MFA session, billing data or login secrets.
- ✅ `#/player/<player-uuid>` is the real public-view route. The owner's `View as others` button uses the same endpoint and rendering as another visitor, not the authenticated private profile view.
- ✅ `supabase/migrations/20261017_aurvex_family_v1.sql` implements family creation, one-family-per-user membership, a six-person limit, invitations only via a 256-bit private random link token hashed at rest, seven-day expiration and owner invitation rotation. Family RPCs require AAL2. Members can leave, owners can remove members, and owners can close their family after others leave.
- ✅ Explicit game-by-game opt-in sharing by each purchasing family member uses verified `source='purchase'` entitlements. Borrowed family licenses never count as the owner's purchases, and membership removal automatically revokes membership access.
- ✅ `supabase/migrations/20261017_family_product_allowlist.sql` adds an administrator-only eligibility table; games are **not shareable by default**, even after purchase. A first-party publisher will opt in only licenses permitting family sharing. The server's family access RPC rechecks ownership, membership AND game eligibility every time.
- ⚠️ No completed payment processing, purchased inventory, gifts or launched paid games exist in AURVEX at this point. Friend Gift button deliberately displays `coming soon` and is disabled. A future checkout/gifting implementation requires payment verification webhooks, fraud controls, chargeback/refund revocation, gift acceptance, ownership policy and publisher consent. Never mark a gift delivered until purchase is proven server-side.
- ⚠️ `aurvex_family_access` is a protected **server-side rights-query foundation**, not yet integrated with game download/play in a released AURVEX Launcher. The future launcher/backend must revalidate this access every download and launch and respect license and concurrency restrictions.
- ⚠️ User-facing family and profile views have automated tests, but verify invitation joining, six-person capacity, preview after editing, public Wishlist privacy, and family share revocation with two or more actual test users before broader deployment.
- Existing XONI Mail infrastructure remains completely separate.
