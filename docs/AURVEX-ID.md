# AURVEX ID — identity architecture and setup

Status: **separate Supabase project created and schema applied; production sign-in remains disabled**. Project `aurvex-id` (`zalzsgfufvppvgvqfocf`, region `eu-central-1`) is entirely separate from XONI Mail. The site contains ONLY a publishable key. Email/Google provider switches remain off pending verified email delivery, OAuth setup, redirect allow-list and live end-to-end tests. A public API key and disabled UI controls are not a replacement for configuring provider-level signup and abuse restrictions in Supabase.

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
5. Only after end-to-end Google sign-in and logout are verified should \`googleEnabled\` be set to \`true\` in the public \`assets/id-config.js\`. The existing browser login code already uses Google + PKCE, and redirects back to \`id.html\`.
6. Later, enable ordinary email signup via a **custom SMTP** provider and branded verification email. A custom DNS domain is strongly recommended for a public service, but an SMTP provider that can send from an authorized mailbox (e.g. a dedicated Gmail address with a Google app password) can be used for **small internal testing**, if the provider's terms and limits allow. Do not use a personal account for production mail. Supabase's default mailer is restricted to project-team addresses and is not suitable for public signups.
7. XONI Mail will not authenticate via raw email strings; it needs a secure identity provider and explicit account linking.

**Important:** AURVEX Launcher later uses its own OAuth 2.1/OIDC client registration and system-browser PKCE. The Google browser Client ID is **not** an app credential embedded in native builds.

