// Frontend only: payment authorisation and fulfillment happen on verified servers.
import {idClient} from './id-service.js?v=20261018-411';
import {translations} from './i18n.js?v=20261018-420';
const statusUrl='https://zalzsgfufvppvgvqfocf.supabase.co/functions/v1/aurvex-payment-status';
const model={ready:false,checkoutCurrencies:[],orders:[],busy:false,error:false,message:''};
window.AURVEX_PAYMENTS=model;
const notify=()=>window.dispatchEvent(new CustomEvent('aurvex:payment-state'));
const t=key=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
async function checkStatus(){
 try{
  const response=await fetch(statusUrl,{cache:'no-store'});
  if(!response.ok)throw new Error('Status not ready');
  const data=await response.json();
  model.ready=data?.ready===true;
  model.checkoutCurrencies=Array.isArray(data?.checkoutCurrencies)?data.checkoutCurrencies:[];
 }catch{model.ready=false;model.checkoutCurrencies=[]}
 notify();
}
async function refreshOrders(){
 if(!window.AURVEX_ID?.mfaVerified)return;
 try{
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_payment_my_orders');
  if(error)throw error;
  model.orders=Array.isArray(data)?data:[];
 }catch(error){model.message='payUnableToRefresh';model.error=true;
   console.warn('Payment status:',error?.code||'not available')}
 notify();
}
async function beginCheckout(button){
 if(model.busy||!model.ready||!window.AURVEX_ID?.mfaVerified)return;
 const kind=button.dataset.kind,sku=button.dataset.sku,currency=button.dataset.currency;
 if(!['stars','cosmetic','wallet'].includes(kind)||!/^[-a-z0-9_]{3,64}$/.test(sku||'')||
   !/^[A-Z]{3}$/.test(currency||''))return;
 const debit=model.checkoutCurrencies.includes(currency)?currency:'UAH';
 if(!window.confirm(t(debit===currency?'payConfirm':'payFallbackConfirm')
    .replace('{selected}',currency).replace('{actual}',debit)))return;
 model.busy=true;model.message='';model.error=false;notify();
 try{
  const client=await idClient();
  const {data,error}=await client.functions.invoke('aurvex-payment-checkout',{
    body:{kind,sku,currency,idempotency:crypto.randomUUID()}
  });
  if(error||!data?.checkoutUrl)throw error||new Error('No checkout URL');
  const url=new URL(data.checkoutUrl);
  if(url.protocol!=='https:'||!['pay.fondy.eu','pay.fondy.com'].includes(url.hostname))
   throw new Error('Checkout URL not trusted');
  window.location.assign(url.href);
 }catch(e){model.message='payCheckoutError';model.error=true;
  console.warn('Checkout:',e?.code||'not available')}
 finally{model.busy=false;notify()}
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-payment-action]');
 if(!button)return;
 if(button.dataset.paymentAction==='checkout')void beginCheckout(button);
 if(button.dataset.paymentAction==='refresh')void refreshOrders();
});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/payment'))void refreshOrders()});
window.addEventListener('aurvex:id-state',()=>{
 if(!window.AURVEX_ID?.user?.id)model.orders=[];
 if(location.hash.startsWith('#/payment'))void refreshOrders();
});
void checkStatus();
if(location.hash.startsWith('#/payment'))void refreshOrders();
