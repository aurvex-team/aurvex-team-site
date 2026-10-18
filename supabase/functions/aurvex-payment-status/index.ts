// Public safe read-only payment readiness endpoint.
import {cors,json,enabled,env,gatewayCurrencies} from '../_shared/payment.ts';
Deno.serve((req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=='GET')return json(req,{error:'METHOD_NOT_ALLOWED'},405);
 const configured=!!env('FONDY_MERCHANT_ID')&&!!env('FONDY_PAYMENT_KEY');
 const live=enabled()&&configured;
 return json(req,{ready:live,provider:live?'fondy':null,displayCurrencies:37,
  checkoutCurrencies:live?[...gatewayCurrencies()]:[],
  fallbackCurrency:'UAH',
  mode:live?'merchant-configured':'preview-only',
  note:live?'Only merchant-enabled currencies are charged.':'Payments are not enabled.'});
});
