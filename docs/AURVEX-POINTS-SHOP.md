# Stars — AURVEX virtual currency and cosmetics shop (2026-10-18)

## Status
- First-party, original CSS-only avatar/profile cosmetics catalog: 8 items.
- Stars purchases ARE server-authorized and irreversible; wallet, ledger, inventory and equip use Supabase PostgreSQL SECURITY DEFINER RPCs guarded by `auth.uid()` and JWT `aal2`.
- First 2FA-verified shop visit grants **500 welcome Stars once per account**. No Stars top-ups, gift transfers, payment-to-Stars conversion or ways to earn more Stars are enabled yet.
- UAH prices appear as **preview/catalog prices only**. **Money checkout is disabled**. Users are never charged; price buttons are disabled and no items can be granted in exchange for fake browser payment notifications.
- Live UAH payments will require a merchant account controlled by a legally eligible adult, settlement/tax arrangements, provider SDK or hosted checkout, server-created orders with price snapshots and unique order IDs, verified signature/webhook, idempotent fulfillment, disputes/refunds and consumer policies. Never grant entitlements based only on a client redirect or the user's claim of payment. Deploy merchant keys **only in secrets**, never to GitHub Pages.
- Bought frames permanently remain in `aurvex_shop_inventory` as non-transferable cosmetics; equipped items are read publicly through a **narrow safe RPC**, never wallet or transaction history. Future account deletion can remove wallet and inventory via CASCADE.

The customer-facing currency is **Stars**, including welcome bonuses, balances, purchase confirmations and transaction history. Existing database columns and RPC identifiers containing `points` are kept for backward compatibility so previously earned balances and purchased frames remain valid.

## Tables
- `aurvex_shop_items`: canonical active catalog and Stars/UAH listing prices (legacy database column `price_points`).
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
- Stars (`#/shop`) for catalog, wallet, collection, server ledger preview and CSS try-ons. Links in header/sidebar/mobile nav and user Profile Studio.
- Both Stars and illustrative UAH price; latter clearly disabled until payment setup.
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

## Inventory & trades — v3.10.0
- An Inventory page at `#/inventory` shows owned frame cosmetics and future game item instances.
- One-for-one trades between accepted friends; AAL2 required for offer, cancellation, rejection and acceptance. Offers expire after 48 hours. Stars-bought frames are transferable, with server-controlled ownership changes; equipped frames are cleared when transferred.
- Server-only game-item grants are reserved for future game integration. No live game-item inventory exists yet.
- Stars pack previews: 100 Stars / 39 UAH, 350 / 119 UAH, 800 / 249 UAH, 1800 / 499 UAH. No charge or Stars top-up is processed. Payment checkout remains disabled pending an adult merchant and verified payment webhook.
- Profile UI now offers Overview and Links only. Wishlist visibility is edited independently from Overview. Historical Appearance data is retained in the database for backward compatibility but no longer displayed or edited.
- SQL migrations `aurvex_inventory_trades_v1_20261018.sql` and `aurvex_trade_peer_catalog_20261018.sql` are applied to AURVEX-ID Supabase; direct table writes are denied for client roles.

## v3.11 — Steam-inspired inventory and bulk gifts
- Grid with category navigation (All, cosmetics, games, tradable), search, selectable thumbnails and a separate right-side details panel; responsive on mobile.
- The trade builder shows two inventories side by side. Users can offer multiple items, use **Select all tradable** (up to 500), or request **zero** items in return: gifts.
- Gift and acceptance require explicit confirmation explaining irreversible transfer. The recipient must accept or decline within 48 hours; the sender may cancel before acceptance.
- Trading is restricted to accepted friends with AAL2, with server-side reassessment of every item's ownership and tradability. All selected items move atomically; nothing transfers if one item is no longer owned or conflicts with existing recipient ownership.
- The trade is a **snapshot** of selected items, not a continuous authorization to transfer future acquisitions. "All" means every currently *tradable* owned item, never items flagged nontradable by a game's authority.
- Money checkout and Stars top-ups remain disabled. No browser code can mint items or bypass server permissions.
