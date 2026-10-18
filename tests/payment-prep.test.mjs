import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Payment Edge functions never expose merchant keys to frontend',()=>{
 const frontend=read('assets/payment-ui.js');
 for(const forbidden of ['FONDY_PAYMENT_KEY','FONDY_MERCHANT_ID','SUPABASE_SERVICE_ROLE_KEY','PAYMENTS_ENABLED=true']){
  assert.ok(!frontend.includes(forbidden));
 }
 const checkout=read('supabase/functions/aurvex-payment-checkout/index.ts');
 const webhook=read('supabase/functions/aurvex-payment-webhook/index.ts');
 const status=read('supabase/functions/aurvex-payment-status/index.ts');
 const fx=read('supabase/functions/aurvex-payment-fx-sync/index.ts');
 for(const code of [checkout,webhook])assert.ok(code.includes('if(!enabled())'));
 assert.ok(checkout.includes('aurvex_payment_prepare'));
 assert.ok(webhook.includes('fondySignature'));
 assert.ok(webhook.includes('aurvex_payment_settle'));
 assert.ok(webhook.includes('charged_minor:amount'));
 assert.ok(status.includes('aurvex_payment_public_readiness'));
 assert.ok(fx.includes('AURVEX_FX_SYNC_SECRET'));
 assert.ok(fx.includes('aurvex_payment_store_rates'));
 const config=read('supabase/config.toml');
 assert.ok(config.includes('[functions.aurvex-payment-webhook]\nverify_jwt = false'));
 assert.ok(config.includes('[functions.aurvex-payment-checkout]\nverify_jwt = true'));
});
test('Final fulfillment is restricted, idempotent and database-controlled',()=>{
 const sql=read('supabase/migrations/aurvex_payment_core_20261018.sql');
 const guard=read('supabase/migrations/aurvex_payments_killswitch_and_issues_20261018.sql');
 const fx=read('supabase/migrations/aurvex_payment_fx_sync_20261018.sql');
 for(const fragment of ["unique(user_id,client_request_id)", "aurvex_payment_settle",
 "o.charge_currency<>charged_currency","o.charge_minor<>charged_minor",
 "PAYMENT_PROVIDER_CONFLICT","already_processed","aurvex_shop_ledger",
 "reason in ('welcome','purchase','topup')","grant execute on function public.aurvex_payment_settle"])
  assert.ok(sql.includes(fragment),fragment);
 for(const s of ['merchant_verified boolean not null default false',
  'checkout_enabled boolean not null default false','PAYMENTS_DISABLED',
  'aurvex_payment_mark_issue'])assert.ok(guard.includes(s),s);
 assert.ok(fx.includes("auth.role() is distinct from 'service_role'"));
 assert.ok(fx.includes('PAYMENT_INCOMPLETE_FX'));
});
test('All display currencies exist as server catalog and none are assumed live',()=>{
 const sql=read('supabase/migrations/aurvex_payment_core_20261018.sql');
 const codes=['UAH','USD','EUR','GBP','PLN','CHF','CAD','AUD','JPY','CNY','KRW','SEK','NOK',
  'DKK','CZK','HUF','RON','TRY','INR','BRL','MXN','AED','SAR','ILS','ZAR','SGD','HKD',
  'NZD','THB','IDR','MYR','PHP','VND','KZT','GEL','MDL','AZN'];
 assert.equal(codes.length,37);
 for(const code of codes)assert.ok(sql.includes("('"+code+"',"),code);
 assert.ok(sql.includes("checkout_enabled boolean not null default false"));
 assert.ok(sql.includes("where code='UAH'"));
 const status=read('supabase/functions/aurvex-payment-status/index.ts');
 assert.ok(status.includes('mode:enabledNow?'));
 const docs=read('docs/AURVEX-PAYMENTS-SETUP.md');
 assert.ok(docs.includes('NO LIVE PAYMENTS'));
 assert.ok(docs.includes('37 display currencies'));
});
