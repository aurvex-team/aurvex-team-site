# AURVEX Store

AURVEX is a responsive storefront and community site for games and software, published with GitHub Pages.

**Live site:** https://aurvex-team.github.io/aurvex-team-site/

## Current features

- Searchable, filterable store catalog and wishlist.
- AURVEX ID account/profile screens, friends, family, notifications, library, inventory and Stars features.
- Global visual themes and language selection.
- Download information for desktop and mobile operating systems. A listing does not mean an installer or mobile app is available.
- Browse Store submission panel. Creators can introduce a game or app and offer a demo/test build through Telegram at [@flekusik](https://t.me/flekusik). The site does not upload files; share a description, screenshots/video and a safe test link in Telegram.
- Help & policies page covering privacy notes, account use, checkout status and creator submissions.

## Languages

The language selector includes English, Ukrainian, Polish, German, Russian, Spanish and French. English, Ukrainian, Polish and German are the established site-wide translations. Russian, Spanish and French include translated navigation, account entry and submission/policy screens; older feature copy still needs review and translation before these three can be described as fully localized.

## Accounts and sign-in

AURVEX ID uses Supabase Auth and RLS-protected data. Browser code must contain only the Supabase project URL and publishable key. Never commit a service-role key, OAuth client secret or Fmail secret.

Current public settings are in `assets/id-config.js`. Google sign-in is enabled; email OTP and Fmail are disabled until provider setup and end-to-end checks are complete. Do not set `fmailEnabled` to `true` before registering Fmail as a Supabase custom OAuth provider.

### Fmail activation checklist

The Fmail OAuth server is maintained in the separate `flekiii/xoni-mail` project. Before enabling Fmail in AURVEX:

1. Set a long random `FMAIL_AURVEX_OAUTH_SECRET` on the private Render service running XONI Mail. Keep it private.
2. Register the confidential client `aurvex-supabase` in Supabase Auth as a custom OAuth provider with this exact callback URL: `https://zalzsgfufvppvgvqfocf.supabase.co/auth/v1/callback`.
3. Configure the provider endpoints:
   - Authorization: `https://xoni-mail.onrender.com/oauth/authorize`
   - Token: `https://xoni-mail.onrender.com/oauth/token`
   - User information: `https://xoni-mail.onrender.com/oauth/userinfo`
4. Use the same client secret in Render and Supabase provider settings. Never put it in GitHub or browser JavaScript.
5. Test sign-in and first-time AURVEX account creation, consent, cancellation, MFA, sign-out and return-to-site behavior.
6. Only after those checks, enable `fmailEnabled` in `assets/id-config.js`.

Fmail login should send users to Fmail to authenticate and approve AURVEX; AURVEX must never collect a Fmail password. AURVEX's own 2FA remains separate.

## Payments and downloads

The Stars balance and checkout UI do not by themselves represent a payment processor. Real-money purchases must remain unavailable until a payment provider, server-side order validation, refunds and entitlement checks are implemented and tested. Devive is in development; do not advertise a game download unless a verified release build is published.

## Main files

- `assets/app.js` — routes, storefront, filters and page rendering.
- `assets/i18n.js` — interface translations.
- `assets/site.css` — themes, layout and responsive styling.
- `assets/id-config.js`, `assets/id-service.js`, `assets/id-ui.js` — AURVEX ID client integration.
- `supabase/migrations/` — database schema and security policies.
- `tests/store.test.mjs` — UI and localization regression checks.
- `.github/workflows/pages.yml` — tests and GitHub Pages deployment.

## Development

Use Node.js 20 or newer:

```sh
npm install
npm test
```

GitHub Pages deploys through the repository's Actions workflow after changes reach `main`. Check the workflow run before sharing a change as live.

## Creator submissions

A submission invites the AURVEX team to review a project; it does not promise a listing, funding or purchase. The creator retains ownership. Publication, distribution or sale requires a separate agreement. Do not send passwords, private keys, personal documents or confidential user data with a test build.
