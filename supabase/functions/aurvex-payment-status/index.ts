// Public readiness: both merchant configuration AND server kill switch must be enabled.
import {cors,json,enabled,env,gatewayCurrencies,publicKey,postRpc} from '../_shared/payment.ts';
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=='GET')return json(req,{error:'METHOD_NOT_ALLOWED'},405);
 const keys=!!env('FONDY_MERCHANT_ID')&&!!env('FONDY_PAYMENT_KEY');
 let settings={enabled:false,rateCount:0,displayCurrencyCount:37,currencies:[] as string[]};
 try{
  const anon=publicKey();
  if(anon)settings=await postRpc('aurvex_payment_public_readiness',{},anon);
 }catch(e){console.warn('Payment readiness unavailable',e instanceof Error?e.message:'error')}
 const enabledNow=enabled()&&keys&&settings.enabled===true;
 const charge=enabledNow?settings.currencies.filter(c=>gatewayCurrencies().has(c)):[];
 return json(req,{ready:enabledNow&&charge.length>0,provider:enabledNow?'fondy':null,
    displayCurrencies:Number(settings.displayCurrencyCount)||37,
    checkoutCurrencies:charge,rateCount:Number(settings.rateCount)||0,
    fallbackCurrency:'UAH',mode:enabledNow?'configured':'preview-only'});
});
