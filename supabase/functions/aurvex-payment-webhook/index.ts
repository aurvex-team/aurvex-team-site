// Provider-signed Fondy callback. Public route but signature is mandatory.
// Only a valid approved payment with exact server-recorded amount can grant items.
import {json,env,enabled,adminKey,postRpc,fondySignature,safeEqual,digest} from '../_shared/payment.ts';
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json(req,{error:'METHOD_NOT_ALLOWED'},405);
 if(!enabled())return json(req,{error:'WEBHOOK_DISABLED'},503);
 const secret=env('FONDY_PAYMENT_KEY'),merchant=env('FONDY_MERCHANT_ID'),admin=adminKey();
 if(!secret||!merchant||!admin||!env('SUPABASE_URL'))
  return json(req,{error:'NOT_CONFIGURED'},503);
 let body:Record<string,unknown>;
 try{
  const raw=await req.text();
  if(raw.length>32000)return json(req,{error:'PAYLOAD_TOO_LARGE'},413);
  const parsed=JSON.parse(raw);
  body=(parsed?.response||parsed) as Record<string,unknown>;
  if(!body||typeof body!=='object'||Array.isArray(body))
   return json(req,{error:'BAD_DATA'},400);
 }catch{return json(req,{error:'BAD_JSON'},400)}
 const signature=String(body.signature||'').toLowerCase();
 if(!/^[a-f0-9]{40}$/.test(signature))return json(req,{error:'INVALID_SIGNATURE'},403);
 const expected=await fondySignature(body,secret);
 if(!safeEqual(signature,expected))return json(req,{error:'INVALID_SIGNATURE'},403);
 const id=String(body.order_id||'');
 const reference=String(body.payment_id||'');
 const amount=Number(body.amount),currency=String(body.currency||'');
 if(String(body.merchant_id)!==merchant||!/^[a-f0-9-]{36}$/i.test(id)||
   !/^[a-zA-Z0-9_-]{1,120}$/.test(reference)||!Number.isSafeInteger(amount)||
   amount<1||!/^[A-Z]{3}$/.test(currency)||String(body.tran_type||'purchase')!=='purchase')
   return json(req,{error:'INVALID_PAYMENT_DETAILS'},400);
 const status=String(body.order_status||'').toLowerCase();
 const responseStatus=String(body.response_status||'');
 const fingerprint=await digest('SHA-256',[merchant,id,reference,status,currency,amount].join('|'));
 try{
  if(status==='approved'&&responseStatus==='success'){
   const data=await postRpc('aurvex_payment_settle',{
    order_uuid:id,charged_currency:currency,charged_minor:amount,
    provider_payment:reference,event_sha256:fingerprint
   },admin);
   return json(req,{ok:true,result:data});
  }
  if(['declined','expired'].includes(status)){
   await postRpc('aurvex_payment_mark_issue',{
    order_uuid:id,provider_payment:reference,issue_type:'failed',event_sha256:fingerprint
   },admin);
   return json(req,{ok:true});
  }
  if(['reversed','refunded'].includes(status)){
   await postRpc('aurvex_payment_mark_issue',{
    order_uuid:id,provider_payment:reference,issue_type:'refunded',event_sha256:fingerprint
   },admin);
   return json(req,{ok:true,manualReview:true});
  }
  if(['chargeback','disputed'].includes(status)){
   await postRpc('aurvex_payment_mark_issue',{
    order_uuid:id,provider_payment:reference,issue_type:'disputed',event_sha256:fingerprint
   },admin);
   return json(req,{ok:true,manualReview:true});
  }
  return json(req,{ok:true,ignored:true});
 }catch(e){
  // Non-200 causes provider to retry. No browser redirect is proof of payment.
  console.error('Signed webhook processing rejected:',String(e instanceof Error?e.message:'error'));
  return json(req,{error:'PROCESSING_FAILED'},503);
 }
});
