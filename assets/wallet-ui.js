// AURVEX monetary wallet (separate from Stars). Never compute balances locally.
// State comes only from the AAL2-gated Supabase money-wallet RPC.
import {idClient} from './id-service.js?v=20261018-411';
const wallet={userId:'',ready:false,loading:false,error:false,balanceUahKop:0,entries:[]};
window.AURVEX_WALLET=wallet;
const emit=()=>window.dispatchEvent(new CustomEvent('aurvex:wallet-state'));
const owner=()=>window.AURVEX_ID?.mfaVerified===true?window.AURVEX_ID?.user?.id||'':'';
let requestId=0;
function reset(){
 ++requestId;Object.assign(wallet,{userId:'',ready:false,loading:false,error:false,balanceUahKop:0,entries:[]});
 emit();
}
async function refresh(){
 const who=owner();
 if(!who){if(wallet.userId)reset();return}
 if(wallet.loading&&wallet.userId===who)return;
 const seq=++requestId;
 wallet.userId=who;wallet.loading=true;wallet.error=false;emit();
 try{
   const client=await idClient();
   const {data,error}=await client.rpc('aurvex_money_wallet_state');
   if(error)throw error;
   if(seq!==requestId||owner()!==who)return;
   const amount=Number(data?.balanceUahKop);
   if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid server balance');
   wallet.balanceUahKop=amount;
   wallet.entries=Array.isArray(data?.entries)?data.entries:[];
   wallet.ready=true;
 }catch(e){
   if(seq!==requestId||owner()!==who)return;
   wallet.ready=false;wallet.error=true;
   console.warn('AURVEX wallet read:',e?.code||'unavailable');
 }finally{if(seq===requestId&&owner()===who){wallet.loading=false;emit()}}
}
document.addEventListener('click',event=>{
 if(event.target.closest?.('[data-wallet-action="refresh"]'))void refresh();
});
window.addEventListener('aurvex:id-state',()=>{
 const who=owner();
 if(!who){if(wallet.userId)reset();return}
 if(wallet.userId!==who||!wallet.ready&&!wallet.loading)void refresh();
});
window.addEventListener('hashchange',()=>{
 if((location.hash.startsWith('#/balance')||location.hash.startsWith('#/payment'))&&owner())void refresh();
});
window.addEventListener('focus',()=>{
 if(location.hash.startsWith('#/balance')&&owner())void refresh();
});
if(owner())void refresh();
