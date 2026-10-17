# AURVEX Store

**AURVEX Store** — an original, responsive games-and-software discovery storefront for the AURVEX team, built for GitHub Pages.

🌐 Website: **https://aurvex-team.github.io/aurvex-team-site/**

## Features (v2)

- Premium desktop storefront inspired by game discovery platforms, with its own AURVEX branding and original artwork.
- **English by default**, with complete Ukrainian, Polish, and German localization.
- Dark theme by default, optional light theme.
- Responsive desktop sidebar and mobile navigation.
- Hash-based single-page routes: Home, Browse, Games (legacy), Software (legacy), Free Rewards, Wishlist, Devive, About & roadmap.
- Browse Store with centered search, 26 localized game genres, product-type filter, minimum/maximum price in UAH (₴), release year, clear filters, and helpful empty states. Filter selections are shareable through the address bar.
- The sidebar links only to Home, Browse Store, Free Rewards, Wishlist and About; the Free Rewards section is a placeholder until real rewards are announced.
- **Wishlist saved in the current browser using localStorage**; works without an account.
- Dedicated **Devive** product page: concept art, description, planned controls, status, and game features.
- Original vector artwork in assets/devive-scene.svg. Images are **concept art**, not gameplay screenshots.
- Project roadmap clarifies what works today vs. what is planned.

## Current catalog

| Product | Category | Planned price | Status |
| --- | --- | --- | --- |
| **Devive** | 2D side-view horror game set in an old two-storey house | Free | In development; no downloadable build yet |

**Important:** This is a storefront preview, **not a functional checkout or distribution service**. No payment processing, user accounts or executable game downloads exist yet. Don't represent Devive as released before its release build is available.

## Files

- index.html — lightweight entry point, default language en
- assets/site.css — all themes, typography, desktop/mobile layouts
- assets/app.js — navigation, filtering, wishlists, rendering and interactions
- assets/i18n.js — EN / UK / PL / DE translations
- assets/devive-scene.svg — original horror concept illustration
- assets/favicon.svg — AURVEX brand mark
- .github/workflows/pages.yml — automatic GitHub Pages deployment

## Deploy

Push to main. The GitHub Actions workflow publishes the site automatically.

In Settings → Pages → Build and deployment, make sure **GitHub Actions** is selected. The site is served from the repository's own base path.

## Next releases

1. Add tested build files and verified platforms for Devive after the game is ready.
2. Add new **actual** games and applications to the data-driven catalog. Do not publish invented products.
3. For future sales, implement authentication, a secure backend, payment provider integration, purchase records and file entitlement checks.
4. Add real product screenshots and publisher tools when available.

AURVEX Store is not affiliated with Valve or Epic Games.
