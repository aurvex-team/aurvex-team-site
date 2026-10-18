// Inventory client. Trades transfer ownership only through server AAL2 RPC.
import {inventoryState,peerItems,createTrade,tradeAction} from './inventory-service.js?v=20261018-410';
import {translations} from './i18n.js?v=20261018-410';
const m={userId:'',ready:false,loading:false,busy:false,gameItems:[],offers:[],
 peerId:'',peerItems:[],peerItemsReady:false,offered:'',requested:'',messageKey:'',error:false};
window.AURVEX_INVENTORY=m;
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:inventory-state'));
const t=key=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
const owner=()=>window.AURVEX_ID?.mfaVerified===true?window.AURVEX_ID?.user?.id||'':'';
let seq=0,peerSeq=0;
function clear(){
 ++seq;++peerSeq;m.userId='';m.ready=false;m.loading=false;m.busy=false;m.gameItems=[];m.offers=[];
 m.peerId='';m.peerItems=[];m.peerItemsReady=false;m.offered='';m.requested='';m.messageKey='';m.error=false;fire();
}
async function refresh(){
 const who=owner();if(!who){if(m.userId)clear();return}
 const current=++seq;m.userId=who;m.loading=true;fire();
 try{
  const v=await inventoryState();if(owner()!==who||current!==seq)return;
  m.gameItems=Array.isArray(v.gameItems)?v.gameItems:[];
  m.offers=Array.isArray(v.offers)?v.offers:[];
  m.ready=true;m.error=false;
 }catch(e){if(owner()===who&&current===seq){m.messageKey='invLoadError';m.error=true;console.warn('Inventory:',e?.code||'error')}}
 finally{if(current===seq){m.loading=false;fire()}}
}
async function loadPeer(id){
 const current=++peerSeq;m.peerId=id;m.requested='';m.peerItems=[];m.peerItemsReady=!id;fire();
 if(!id)return;
 try{
  const v=await peerItems(id);if(current!==peerSeq||!owner())return;
  m.peerItems=Array.isArray(v)?v:[];m.peerItemsReady=true;fire();
 }catch(e){if(current===peerSeq){m.peerItemsReady=true;m.error=true;m.messageKey='invLoadError';fire()}}
}
function parse(value){
 const match=String(value||'').match(/^(cosmetic|game):([a-z0-9_-]{3,80}|[a-f0-9-]{36})$/);
 return match?{kind:match[1],ref:match[2]}:null;
}
document.addEventListener('change',event=>{
 if(!event.target.closest?.('#inventory-trade-form'))return;
 if(event.target.name==='peer'){
  const peer=event.target.value;
  void loadPeer((window.AURVEX_FRIENDS?.relations||[]).some(x=>x.peer_id===peer&&x.relation==='friend')?peer:'');
 }else if(event.target.name==='offered')m.offered=event.target.value;
 else if(event.target.name==='requested')m.requested=event.target.value;
});
document.addEventListener('submit',event=>{
 if(event.target.id!=='inventory-trade-form')return;
 event.preventDefault();if(!owner()||m.busy)return;
 const f=new FormData(event.target),target=String(f.get('peer')||'');
 const offer=parse(f.get('offered')),request=parse(f.get('requested'));
 if(!offer||!request||target!==m.peerId||!m.peerItemsReady)return;
 if(!(window.AURVEX_FRIENDS?.relations||[]).some(x=>x.peer_id===target&&x.relation==='friend'))return;
 const owns=offer.kind==='cosmetic'?(window.AURVEX_SHOP?.inventory||[]).some(x=>x.item_id===offer.ref):
   m.gameItems.some(x=>x.id===offer.ref&&x.tradable);
 if(!owns||!m.peerItems.some(x=>x.kind===request.kind&&x.ref===request.ref))return;
 if(!window.confirm(t('invConfirm')))return;
 const who=owner();m.busy=true;m.error=false;m.messageKey='';fire();
 void(async()=>{try{
  await createTrade(target,offer,request);
  if(who!==owner())return;
  m.offered='';m.requested='';await refresh();m.messageKey='invTradeSent';
 }catch(e){if(who===owner()){m.messageKey='invTradeError';m.error=true;console.warn('Trade:',e?.code||'error')}}
 finally{m.busy=false;fire()}})();
});
document.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-inventory-action]');
 if(!btn||!owner()||m.busy)return;
 const action=btn.dataset.inventoryAction,id=btn.dataset.offerId;
 if(!['accept','decline','cancel'].includes(action)||!m.offers.some(x=>x.id===id))return;
 if(!window.confirm(t('invConfirm')))return;
 const who=owner();m.busy=true;m.error=false;m.messageKey='';fire();
 void(async()=>{try{
  await tradeAction(id,action);
  if(who!==owner())return;
  await refresh();m.messageKey=action==='accept'?'invTradeAccepted':'invTradeUpdated';
  window.dispatchEvent(new CustomEvent('aurvex:inventory-changed'));
 }catch(e){if(who===owner()){m.messageKey='invTradeError';m.error=true;console.warn('Trade:',e?.code||'error')}}
 finally{m.busy=false;fire()}})();
});
window.addEventListener('aurvex:id-state',()=>{
 if(!owner()){if(m.userId)clear();return}
 if(owner()!==m.userId)void refresh();
});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/inventory')&&owner()&&!m.loading)void refresh()});
if(owner())void refresh();
