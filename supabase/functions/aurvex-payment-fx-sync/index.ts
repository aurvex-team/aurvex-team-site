// Server-only rate update. Set AURVEX_FX_SYNC_SECRET and schedule externally after merchant onboarding.
// Rates come from a whitelisted provider; no browser-supplied rates accepted.
import {json,env,adminKey,postRpc,digest} from '../_shared/payment.ts';
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json(req,{error:'METHOD_NOT_ALLOWED'},405);
 const secret=env('AURVEX_FX_SYNC_SECRET'),provided=req.headers.get('x-aurvex-fx-secret')||'';
 if(secret.length<32||!provided)return json(req,{error:'SYNC_NOT_CONFIGURED'},503);
 const a=await digest('SHA-256',secret),b=await digest('SHA-256',provided);
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 if(diff!==0)return json(req,{error:'UNAUTHORIZED'},403);
 const admin=adminKey();if(!admin)return json(req,{error:'SERVER_NOT_CONFIGURED'},503);
 try{
  const resp=await fetch('https://open.er-api.com/v6/latest/UAH',{
   signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
  if(!resp.ok)throw new Error('FX_SOURCE_UNAVAILABLE');
  const data=await resp.json();
  if(data.result!=='success'||data.base_code!=='UAH'||data.rates?.UAH!==1)
   throw new Error('FX_INVALID_SOURCE');
  const sourceDate=Number(data.time_last_update_unix);
  if(!Number.isSafeInteger(sourceDate)||Date.now()/1000-sourceDate>48*3600||sourceDate>Date.now()/1000+600)
   throw new Error('FX_STALE');
  const codes=['UAH','USD','EUR','GBP','PLN','CHF','CAD','AUD','JPY','CNY','KRW',
   'SEK','NOK','DKK','CZK','HUF','RON','TRY','INR','BRL','MXN','AED','SAR','ILS',
   'ZAR','SGD','HKD','NZD','THB','IDR','MYR','PHP','VND','KZT','GEL','MDL','AZN'];
  const rates:Record<string,number>={};
  for(const code of codes){
   const rate=data.rates?.[code];
   if(!Number.isFinite(rate)||rate<=0||rate>100000)throw new Error('FX_MISSING_CURRENCY');
   rates[code]=rate;
  }
  const count=await postRpc('aurvex_payment_store_rates',{
   rates,source_timestamp:new Date(sourceDate*1000).toISOString()},admin);
  return json(req,{updated:count,source:'open.er-api.com',sourceDate:new Date(sourceDate*1000).toISOString()});
 }catch(e){
  console.warn('FX sync error',e instanceof Error?e.message:'unavailable');
  return json(req,{error:'FX_SYNC_FAILED'},503);
 }
});
