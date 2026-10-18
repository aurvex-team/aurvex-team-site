// AURVEX checkout: NO card details collected here; Fondy hosted checkout only.
// Feature locked until an adult-operated verified merchant and project secrets are supplied.
import {cors,json,env,enabled,publicKey,postRpc,fondySignature,gatewayCurrencies} from '../_shared/payment.ts';
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=='POST')return json(req,{error:'METHOD_NOT_ALLOWED'},405);
 if(!enabled())return json(req,{error:'PAYMENTS_NOT_ENABLED'},503);
 const merchant=env('FONDY_MERCHANT_ID'),secret=env('FONDY_PAYMENT_KEY');
 const anon=publicKey();
 if(!/^\d{3,15}$/.test(merchant)||!secret||!anon||!env('SUPABASE_URL'))
   return json(req,{error:'MERCHANT_NOT_CONFIGURED'},503);
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer ')||auth.split(' ').length!==2||
    auth.slice(7).split('.').length!==3)return json(req,{error:'SIGN_IN_REQUIRED'},401);
 let payload:Record<string,unknown>;
 try{payload=await req.json()}catch{return json(req,{error:'INVALID_JSON'},400)}
 const kind=payload.kind,sku=payload.sku,currency=payload.currency,idempotency=payload.idempotency;
 if(!['stars','cosmetic'].includes(String(kind))||typeof sku!=='string'||!/^[-a-z0-9_]{3,64}$/.test(sku)||
  typeof currency!=='string'||!/^[A-Z]{3}$/.test(currency)||
  typeof idempotency!=='string'||!/^[a-f0-9-]{36}$/i.test(idempotency))
    return json(req,{error:'INVALID_CHECKOUT_SELECTION'},400);
 try{
  const quote=await postRpc('aurvex_payment_prepare',{
   requested_kind:kind,requested_sku:sku,display_currency:currency,request_id:idempotency
  },anon,auth);
  const chargedCurrency=String(quote.currency),amount=Number(quote.amountMinor);
  if(!gatewayCurrencies().has(chargedCurrency)||!Number.isSafeInteger(amount)||amount<1)
    return json(req,{error:'CURRENCY_NOT_ENABLED_AT_GATEWAY',chargedCurrency},422);
  if(quote.status!=='created'&&quote.status!=='redirected')
    return json(req,{error:'ORDER_NOT_PENDING'},409);
  const orderId=String(quote.id);
  if(!/^[a-f0-9-]{36}$/i.test(orderId))throw new Error('Invalid order id');
  const data:Record<string,string|number>={
    merchant_id:Number(merchant),order_id:orderId,amount,currency:chargedCurrency,
    order_desc:'AURVEX '+String(kind)+' '+sku,
    response_url:'https://aurvex-team.github.io/aurvex-team-site/#/payment?order='+orderId,
    server_callback_url:env('SUPABASE_URL')+'/functions/v1/aurvex-payment-webhook'
  };
  const signature=await fondySignature(data,secret);
  const response=await fetch('https://pay.fondy.eu/api/checkout/url',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({request:{...data,signature}}),signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)return json(req,{error:'GATEWAY_UNAVAILABLE'},502);
  const result=await response.json();
  const url=String(result?.response?.checkout_url||'');
  let parsed:URL;
  try{parsed=new URL(url)}catch{return json(req,{error:'GATEWAY_NO_CHECKOUT'},502)}
  if(parsed.protocol!=='https:'||!['pay.fondy.eu','pay.fondy.com'].includes(parsed.hostname))
    return json(req,{error:'GATEWAY_REDIRECT_UNTRUSTED'},502);
  return json(req,{checkoutUrl:url,orderId,currency:chargedCurrency,
    amountMinor:amount,selectedCurrency:quote.selectedCurrency,expiresAt:quote.expiresAt});
 }catch(e){
  console.error('Checkout rejected',String(e instanceof Error?e.message:'unknown'));
  return json(req,{error:'CHECKOUT_NOT_AVAILABLE'},422);
 }
});
