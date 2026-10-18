# AURVEX payments: ready for merchant onboarding (preview only)

**Version:** 3.12.0 (2026-10-18). **Status: DISABLED. NO LIVE PAYMENTS.**
This is technical preparation, **not** a declaration of legal/commercial readiness.

## What is ready

- **37 display currencies**, already present in the Store header:
  UAH, USD, EUR, GBP, PLN, CHF, CAD, AUD, JPY, CNY, KRW, SEK, NOK, DKK,
  CZK, HUF, RON, TRY, INR, BRL, MXN, AED, SAR, ILS, ZAR, SGD, HKD, NZD,
  THB, IDR, MYR, PHP, VND, KZT, GEL, MDL, AZN.
- Server-only product prices from the database, in **UAH kopecks**, never from browser-supplied prices.
- Four Stars packs: 100 / 39 UAH; 350 / 119 UAH; 800 / 249 UAH; 1800 / 499 UAH.
- Real-money cosmetic frame purchases from existing \`aurvex_shop_items.price_uah_kop\`.
- A checkout *preview* route \`#/checkout?kind=stars&sku=stars_350\` and an order-status route \`#/payment?order=<uuid>\`.
- Provider-first **Fondy hosted checkout** Edge Function: card numbers stay with the payment provider, not with AURVEX.
- Signature-verified Fondy callbacks, merchant ID validation, exact order currency/amount match, one-time server fulfillment, idempotency, order/event audit records, stale FX protection, refund/dispute flags.
- Optional server FX refresh endpoint, requiring a long operator-only secret.
- Wallet top-ups are reflected as \`reason='topup'\` in \`aurvex_shop_ledger\`; existing Stars balances and historical \`points\` column names are preserved.
- **Two independent kill switches:** \`AURVEX_PAYMENTS_ENABLED\` Edge secret (defaults off) **AND** database \`aurvex_payment_settings.checkout_enabled AND merchant_verified\` (both default off). The UI only enables checkout after both are true and provider credentials are present.

## Display currencies vs charged currencies

Never claim "all 37 are accepted" until your merchant provider explicitly approves **each** charge currency for your account. The header selector supports 37 *display* currencies; for a particular merchant, the payment gateway may only charge UAH, EUR and USD, for example. Any unsupported selected currency safely falls back to **UAH** and requires explicit user consent before leaving the site.

- Database \`aurvex_payment_currencies.checkout_enabled\` controls which charge currencies are merchant-approved; initially **UAH only**. The overall checkout is still **OFF**.
- Edge \`AURVEX_FONDY_CURRENCIES\` is an independent allowlist of the merchant-approved currencies; default **UAH**. A checkout currency must be enabled in **both** lists.
- All non-UAH charge quotes require a server-stored, non-stale FX rate from \`aurvex_payment_rates\`. A rate that is stale, missing or implausible blocks checkout.
- **Display conversions are indicative** and use a browser FX feed; only the **server** calculates charged amounts.
- Minor currency units are configured per currency. Zero-decimal currencies currently include JPY, KRW and VND. Confirm provider-specific minor-unit requirements and minimum charges with the merchant before enabling an additional currency.
- The user may face bank conversion/FX fees independent of the site's estimate; these must be disclosed.

## Functions (deployed in AURVEX-ID Supabase)

| Endpoint | JWT | Responsibility |
|---|---|---|
| \`aurvex-payment-status\` | Public GET | Read-only merchant readiness (no secrets). |
| \`aurvex-payment-checkout\` | Valid user JWT, plus SQL AAL2 verification | Server creates a quote and signed Fondy-hosted URL. **OFF** now. |
| \`aurvex-payment-webhook\` | Public POST, **requires Fondy signature** | Validates signed provider event and settles matching orders; ignores page redirects as payment proof. **OFF** now. |
| \`aurvex-payment-fx-sync\` | Operator-only \`x-aurvex-fx-secret\` header | Validates rate feed and stores 37 quotes in server DB. **OFF** until secret and scheduled secure invoker are set. |

All Edge source files live under \`supabase/functions\`. The frontend code stores **no** provider keys or privileged database credentials.

## Server tables

\`aurvex_payment_currencies\`, \`aurvex_payment_rates\`, \`aurvex_stars_packs\`,
\`aurvex_payment_settings\`, \`aurvex_payment_orders\`, \`aurvex_payment_events\`.

All tables have RLS enabled; private order/event tables are not directly readable or mutable from the browser. Refund/dispute events are retained for **manual financial review**. Automatic clawback of Stars that have already been spent is deliberately **not implemented**; define a debt/block/fraud policy before live sales.

## Activation checklist — do not turn on early

1. Have an **eligible adult/operator** establish the proper merchant/business legal entity and complete KYC/KYB, banking, tax, and payout registration. This is especially important because the developer is under 18. **Never** use someone else's name without their participation and authorisation.
2. Verify that Fondy or another provider supports this merchant's country, digital virtual currency, resalable/tradable cosmetics, chargebacks/refunds, and chosen markets. Its broad advertised multicurrency support is *not* a merchant approval for all 37 currencies.
3. Publish operator-reviewed **Terms of Sale, Refund/Withdrawal Policy, Privacy Policy, contact/support details, and any consumer notices** needed for digital items and local markets. The site currently lacks approved merchant legal policies; do not enable checkout without them.
4. Set Edge secrets via the private Supabase Dashboard, **never GitHub**:
   - \`FONDY_MERCHANT_ID\`: verified merchant ID
   - \`FONDY_PAYMENT_KEY\`: provider's private payment signing key
   - \`AURVEX_FONDY_CURRENCIES\`: e.g. \`UAH,USD,EUR\`, **only those actually enabled**
   - \`AURVEX_FX_SYNC_SECRET\`: long random secret, at least 32 characters; for the separate FX sync endpoint
   - Leave \`AURVEX_PAYMENTS_ENABLED\` **unset or false** until final approval.
5. Arrange a **secure daily** authenticated request to \`aurvex-payment-fx-sync\` via trusted scheduler and secret Vault (not a public browser, plaintext source file or publicly exposed cron URL). Check exchange-rate timestamps, outages and provider FX agreement. Keep any untested currency disabled.
6. Run provider **sandbox** scenarios (two 2FA accounts): valid payment, duplicate callback, invalid signature, amount/currency mismatch, pending/late callbacks, reversed/refunded/disputed event, cosmetic already owned, insufficient/stale FX, failed provider request, concurrent transactions and AURVEX trade ownership after payment.
7. Configure Fondy callback to:
   \`https://zalzsgfufvppvgvqfocf.supabase.co/functions/v1/aurvex-payment-webhook\`.
   Ensure provider knows the HTTPS address. Only the signed, valid callback can fulfill a sale.
8. Once approved, an authorised database operator updates *only merchant-approved charge currencies* in \`aurvex_payment_currencies.checkout_enabled\` and sets \`aurvex_payment_settings.merchant_verified=true,checkout_enabled=true\`. Finally set the Edge secret \`AURVEX_PAYMENTS_ENABLED=true\`.
9. Test a real, minimal-charge transaction from a consented adult-controlled account before launching public sale. Reconcile money paid, ledger, item state and gateway settlement.
10. Monitor fraud, notifications, chargebacks, refunds, FX drift and PSP downtime daily after activation. Pause **either kill switch** immediately if there is an anomaly.

**Important:** Any new own domain must be added to the Edge Function CORS origin allowlist and the provider-approved return domain; the current code allows \`https://aurvex-team.github.io\` and a local dev origin only.

### Official references

- Fondy supported merchant countries: https://docs.fondy.io/getting-started/reference-pages/supported-countries/
- Fondy gateway features/currencies: https://docs.fondy.io/getting-started/fondy-gateway/
- Fondy signature algorithm: https://docs.fondy.io/gateway/signatures/
- Fondy callbacks: https://docs.fondy.io/gateway/direct-integration/callbacks/
- Supabase Edge Functions auth: https://supabase.com/docs/guides/functions/auth
