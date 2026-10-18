# AURVEX Points Shop — v0.1 (2026-10-18)

## Status
- First-party, original CSS-only avatar/profile cosmetics catalog: 8 items.
- Points purchases ARE server-authorized and irreversible; wallet, ledger, inventory and equip use Supabase PostgreSQL SECURITY DEFINER RPCs guarded by `auth.uid()` and JWT `aal2`.
- First 2FA-verified shop visit grants **500 welcome AURVEX Points once per account**. No points top-ups, gift transfers, payment-to-points conversion or ways to earn further points are enabled yet.
- UAH prices appear as **preview/catalog prices only**. **Money checkout is disabled**. Users are never charged; price buttons are disabled and no items can be granted in exchange for fake browser payment notifications.
- Live UAH payments will require a merchant account controlled by a legally eligible adult, settlement/tax arrangements, provider SDK or hosted checkout, server-created orders with price snapshots and unique order IDs, verified signature/webhook, idempotent fulfillment, disputes/refunds and consumer policies. Never grant entitlements based only on a client redirect or the user's claim of payment. Deploy merchant keys **only in secrets**, never to GitHub Pages.
- Bought frames permanently remain in `aurvex_shop_inventory` as non-transferable cosmetics; equipped items are read publicly through a **narrow safe RPC**, never wallet or transaction history. Future account deletion can remove wallet and inventory via CASCADE.

## Tables
- `aurvex_shop_items`: canonical active catalog and POINTS/UAH listing prices.
- `aurvex_shop_wallets`: integer nonnegative server-controlled balances.
- `aurvex_shop_ledger`: immutable welcome and purchase events, private.
- `aurvex_shop_inventory`: owned items, private.
- `aurvex_shop_equipped`: chosen avatar/profile IDs, private (public projection by RPC).

## RPCs
- `aurvex_shop_state()`: self-only balance, inventory, equipment and last 15 ledger events.
- `aurvex_shop_buy_points(product)`: serializes purchases with `FOR UPDATE`, rejects duplicates and insufficient funds, debits wallet and grants inventory in one transaction.
- `aurvex_shop_equip(product,kind_requested)`: verifies own inventory and item kind; null product removes the specified equipped frame.
- `aurvex_shop_public_equipped(target_player)`: only equipped cosmetics for visible profiles.
- `aurvex_shop_bootstrap()`: welcome grant once per 2FA account, safe with simultaneous sessions.
- `aurvex_shop_actor()`: requires verified user and `aal2` JWT.

## UI
- `#/shop` for catalog, wallet, collection, server ledger preview and CSS try-ons. Links in header/sidebar/mobile nav and user Profile Studio.
- Both AURVEX Points and illustrative UAH price; latter clearly disabled until payment setup.
- After purchase/equip, state is refetched from the server, not trusted from localStorage.
- Check own and public profile with two independent browsers; ensure only owned equipment appears.

## QA before marking production-ready
1. Two independent Google+MFA accounts; verify 500 welcome grant happens once even after refresh or login.
2. Buy an avatar and a profile frame; confirm balances and inventory on both devices.
3. Equip/unequip both independently; confirm public profile shows correct decorations.
4. Attempt duplicate purchase/insufficient balance/race (multiple tabs), and try equipping someone else's item. All must fail without changing wallet or inventory.
5. UAH buttons must stay disabled until an adult-owned merchant provider is connected and server-verified.
6. Review Supabase Advisors, transactional audit logging, merchant terms, refund policy and backup workflow before public monetization.

Migrations: `supabase/migrations/20261018_aurvex_points_shop_v1.sql`, `supabase/migrations/20261018_aurvex_points_shop_permissions.sql`.
