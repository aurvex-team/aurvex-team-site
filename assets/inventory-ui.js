// Steam-inspired Inventory and deliberate item-bundle trading.
// The browser never grants items or changes ownership. Supabase AAL2 RPC is authoritative.
import {inventoryState,peerItems,createTrade,tradeAction} from './inventory-service.js?v=20261018-411';
import {translations} from './i18n.js?v=20261018-411';
const m={userId:'',ready:false,loading:false,busy:false,gameItems:[],offers:[],
 screen:'items',category:'all',search:'',selectedKey:'',peerId:'',peerItems:[],
 peerItemsReady:false,give:[],take:[],messageKey:'',error:false};
window.AURVEX_INVENTORY=m;
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:inventory-state'));
const t=key=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
const owner=()=>window.AURVEX_ID?.mfaVerified===true?window.AURVEX_ID?.user?.id||'':'';
const key=x=>x.kind+':'+x.ref;
const secureFriend=id=>(window.AURVEX_FRIENDS?.relations||[])
 .some(x=>x.peer_id===id&&x.relation==='friend');
let requestSeq=0,peerSeq=0;
function owned(){
 const shop=window.AURVEX_SHOP||{};
 if(shop.userId!==owner()||!shop.ready)return [];
 return (shop.inventory||[]).map(x=>({kind:'cosmetic',ref:x.item_id}))
  .concat(m.gameItems.filter(x=>x.tradable).map(x=>({kind:'game',ref:x.id})));
}
function clear(){
 ++requestSeq;++peerSeq;
 Object.assign(m,{userId:'',ready:false,loading:false,busy:false,gameItems:[],offers:[],
 screen:'items',category:'all',search:'',selectedKey:'',peerId:'',peerItems:[],
 peerItemsReady:false,give:[],take:[],messageKey:'',error:false});fire();
}
async function refresh(){
 const who=owner();if(!who){if(m.userId)clear();return}
 const seq=++requestSeq;m.userId=who;m.loading=true;fire();
 try{
  const data=await inventoryState();
  if(who!==owner()||seq!==requestSeq)return;
  m.gameItems=Array.isArray(data.gameItems)?data.gameItems:[];
  m.offers=Array.isArray(data.offers)?data.offers:[];
  m.ready=true;m.error=false;
  const keys=new Set(owned().map(key));
  m.give=m.give.filter(x=>keys.has(x));
 }catch(e){if(owner()===who&&seq===requestSeq){
   m.messageKey='invLoadError';m.error=true;
   console.warn('AURVEX inventory:',e?.code||'error');
 }}finally{if(seq===requestSeq){m.loading=false;fire()}}
}
async function loadPeer(id){
 const seq=++peerSeq;m.peerId=id;m.peerItems=[];m.peerItemsReady=!id;m.take=[];fire();
 if(!id)return;
 try{
  const data=await peerItems(id);
  if(seq!==peerSeq||!owner()||id!==m.peerId)return;
  m.peerItems=Array.isArray(data)?data.filter(x=>x.tradable!==false):[];
  m.peerItemsReady=true;fire();
 }catch(e){if(seq===peerSeq){
   m.peerItemsReady=false;m.error=true;m.messageKey='invLoadError';fire();
   console.warn('AURVEX peer items:',e?.code||'error');
 }}
}
function updateSelection(which,target){
 const pool=which==='give'?owned():m.peerItems;
 const x=pool.find(i=>key(i)===target&&(which!=='give'||i.kind==='cosmetic'||i.kind==='game'));
 if(!x)return;
 const current=m[which];
 if(current.includes(target))m[which]=current.filter(k=>k!==target);
 else if(current.length<500)m[which]=current.concat(target);
 else{m.messageKey='siTooMany';m.error=true}
 fire();
}
function cleanBundle(keys,items){
 if(!Array.isArray(keys)||keys.length>500||new Set(keys).size!==keys.length)return null;
 const lookup=new Map(items.map(item=>[key(item),item]));
 const out=keys.map(k=>lookup.get(k)).filter(Boolean).map(x=>({kind:x.kind,ref:x.ref}));
 return out.length===keys.length?out:null;
}
function peerLabel(id){
 return (window.AURVEX_FRIENDS?.relations||[]).find(x=>x.peer_id===id)?.nickname||t('invFriend');
}
async function send(){
 if(!owner()||m.busy||!secureFriend(m.peerId)||!m.peerItemsReady)return;
 const offered=cleanBundle(m.give,owned());
 const requested=cleanBundle(m.take,m.peerItems);
 if(!offered||!requested||!offered.length){m.messageKey='siChooseGive';m.error=true;fire();return}
 const gifts=requested.length===0;
 const template=t(gifts?'siGiftConfirm':'siTradeConfirm');
 const message=template.replace('{count}',String(offered.length))
   .replace('{receive}',String(requested.length))
   .replace('{friend}',peerLabel(m.peerId));
 if(!window.confirm(message))return;
 const who=owner();const recipient=m.peerId;
 m.busy=true;m.messageKey='';m.error=false;fire();
 try{
  await createTrade(recipient,offered,requested);
  if(who!==owner())return;
  m.give=[];m.take=[];
  await refresh();m.messageKey='invTradeSent';
 }catch(e){if(who===owner()){
  m.messageKey='invTradeError';m.error=true;
  console.warn('Trade creation:',e?.code||'error');
 }}finally{if(who===owner()){m.busy=false;fire()}}
}
async function act(button){
 const action=button.dataset.inventoryAction,id=button.dataset.offerId;
 const offer=m.offers.find(x=>x.id===id);
 if(!offer||!owner()||m.busy||!['accept','decline','cancel'].includes(action))return;
 const incoming=offer.receiver_id===owner();
 if(action==='accept'&&!incoming||action==='cancel'&&incoming)return;
 const sent=Array.isArray(offer.offered_items)?offer.offered_items:[];
 const requested=Array.isArray(offer.requested_items)?offer.requested_items:[];
 const isGift=action==='accept'&&requested.length===0;
 const template=t(isGift?'siAcceptGiftConfirm':action==='accept'?'siAcceptTradeConfirm':'invConfirm');
 const prompt=template.replace('{count}',String(sent.length))
   .replace('{give}',String(requested.length));
 if(!window.confirm(prompt))return;
 const who=owner();
 m.busy=true;m.messageKey='';m.error=false;fire();
 try{
  await tradeAction(id,action);
  if(who!==owner())return;
  await refresh();m.messageKey=action==='accept'?'invTradeAccepted':'invTradeUpdated';
  window.dispatchEvent(new CustomEvent('aurvex:inventory-changed'));
 }catch(e){if(who===owner()){
  m.messageKey='invTradeError';m.error=true;
  console.warn('Trade acceptance:',e?.code||'error');
 }}finally{if(who===owner()){m.busy=false;fire()}}
}
document.addEventListener('change',event=>{
 if(!event.target.matches?.('[data-inventory-peer]'))return;
 const id=event.target.value;
 void loadPeer(secureFriend(id)?id:'');
});
document.addEventListener('input',event=>{
 const search=event.target.closest?.('[data-inventory-search]');
 if(!search)return;
 m.search=search.value.trim().slice(0,90);
 const term=m.search.toLowerCase();
 document.querySelectorAll('.si-grid [data-si-search]').forEach(tile=>{
  tile.hidden=!String(tile.dataset.siSearch||'').includes(term);
 });
});
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-inventory-action]');
 if(!button)return;
 const action=button.dataset.inventoryAction;
 if(action==='view-items'){m.screen='items';fire();return}
 if(action==='view-trades'){m.screen='trades';if(owner()&&!m.loading)void refresh();else fire();return}
 if(action==='category'){
  if(['all','frames','games','tradable'].includes(button.dataset.invCategory)){
   m.category=button.dataset.invCategory;fire()
  }
  return;
 }
 if(action==='inspect'){m.selectedKey=button.dataset.invKey;fire();return}
 if(action==='trade-selected'){
  const x=owned().find(x=>key(x)===m.selectedKey);
  if(x&&!m.give.includes(key(x)))m.give.push(key(x));
  m.screen='trades';fire();return;
 }
 if(!owner())return;
 if(action==='give-toggle'||action==='take-toggle'){
  updateSelection(action==='give-toggle'?'give':'take',button.dataset.invKey);return;
 }
 if(action==='give-all'){
  const all=owned().map(key);
  if(all.length>500){m.messageKey='siTooMany';m.error=true}
  else{m.give=all;m.messageKey='';m.error=false}
  fire();return;
 }
 if(action==='give-clear'){m.give=[];fire();return}
 if(action==='take-clear'){m.take=[];fire();return}
 if(action==='send'){void send();return}
 if(action==='refresh'){
  void refresh();window.dispatchEvent(new CustomEvent('aurvex:inventory-changed'));return;
 }
 if(['accept','decline','cancel'].includes(action))void act(button);
});
window.addEventListener('aurvex:id-state',()=>{
 if(!owner()){if(m.userId)clear();return}
 if(owner()!==m.userId)void refresh();
});
window.addEventListener('aurvex:inventory-changed',()=>{if(owner()&&!m.loading)void refresh()});
window.addEventListener('hashchange',()=>{
 if(location.hash.startsWith('#/inventory')&&owner()&&!m.loading)void refresh();
});
window.addEventListener('focus',()=>{
 if(location.hash.startsWith('#/inventory')&&owner()&&!m.loading)void refresh();
});
if(owner())void refresh();
