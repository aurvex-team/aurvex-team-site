// AURVEX Points Shop client UI controller. Server authorizes ALL spend/equip.
// UAH payments are NOT enabled here: no client can mint entitlements.
import {loadShopCatalog,loadShopState,buyShopItemPoints,equipShopItem}
 from './shop-service.js?v=20261018-401';
import {translations} from './i18n.js?v=20261018-401';

const model={catalog:[],catalogReady:false,catalogError:false,
  balance:null,inventory:[],equipped:{avatar:null,profile:null},history:[],
  userId:'',ready:false,busy:false,previewId:'',messageKey:'',error:false};
window.AURVEX_SHOP=model;
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:shop-state'));
const t=key=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
const secureOwner=()=>window.AURVEX_ID?.mfaVerified===true
  ?window.AURVEX_ID?.user?.id||'':'';
let loading=false,catalogLoading=false;
async function catalog(){
 if(catalogLoading)return;
 catalogLoading=true;
 try{
  model.catalog=await loadShopCatalog();model.catalogReady=true;model.catalogError=false;
 }catch(err){
  console.warn('AURVEX Points Shop catalog error',err?.code||'unavailable');
  model.catalogError=true;model.catalogReady=true;
 }finally{catalogLoading=false;fire()}
}
function clearWallet(){
 model.userId='';model.balance=null;model.inventory=[];
 model.equipped={avatar:null,profile:null};model.history=[];
 model.ready=false;model.previewId='';model.messageKey='';model.error=false;
 fire();
}
async function refresh(){
 const id=secureOwner();
 if(!id){if(model.userId)clearWallet();return}
 if(loading)return;
 loading=true;
 model.userId=id;model.ready=false;fire();
 try{
  const state=await loadShopState();
  if(secureOwner()!==id)return;
  model.balance=Number.isInteger(state.balance)?state.balance:0;
  model.inventory=Array.isArray(state.inventory)?state.inventory:[];
  model.equipped=state.equipped&&typeof state.equipped==='object'?state.equipped:{avatar:null,profile:null};
  model.history=Array.isArray(state.history)?state.history:[];
  model.ready=true;model.error=false;
 }catch(err){
  if(secureOwner()!==id)return;
  model.messageKey='shopLoadError';model.error=true;
  console.warn('AURVEX Shop state error',err?.code||'unavailable');
 }finally{loading=false;fire()}
}
function onAuth(){
 const id=secureOwner();
 if(!id){if(model.userId)clearWallet();return}
 if(id!==model.userId||(!model.ready&&!loading))void refresh();
}
window.addEventListener('aurvex:id-state',onAuth);
window.addEventListener('hashchange',()=>{
 if(location.hash.startsWith('#/shop')){
  if(!model.catalogReady&&!catalogLoading)void catalog();
  if(secureOwner()&&!loading)void refresh();
 }
});
document.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-shop-action]');
 if(!btn)return;
 const action=btn.dataset.shopAction,id=btn.dataset.itemId||'';
 if(action==='retry'){
  if(!catalogLoading)void catalog();
  if(secureOwner()&&!loading)void refresh();
  return;
 }
 if(action==='preview'){
  if(!model.catalog.some(x=>x.id===id))return;
  model.previewId=model.previewId===id?'':id;fire();return;
 }
 if(!secureOwner()||model.busy||!model.ready)return;
 const item=model.catalog.find(x=>x.id===id);
 if(action==='buy-points'){
  if(!item||model.inventory.some(x=>x.item_id===id))return;
  if(!window.confirm(t('shopConfirmBuy').replace('{price}',String(item.price_points)).replace('{name}',t('shopItem_'+id))))return;
 }else if(action==='equip'){
  if(!item||!model.inventory.some(x=>x.item_id===id))return;
 }else if(action==='unequip'){
  if(!['avatar','profile'].includes(btn.dataset.kind))return;
 }else return;
 const userId=secureOwner();
 model.busy=true;model.messageKey='';fire();
 void(async()=>{
  try{
   if(action==='buy-points')await buyShopItemPoints(id);
   else if(action==='equip')await equipShopItem(id,item.kind);
   else await equipShopItem(null,btn.dataset.kind);
   if(userId===secureOwner()){
    model.messageKey=action==='buy-points'?'shopBought':'shopEquipped';
    await refreshAfterChange();
   }
  }catch(err){
   if(userId===secureOwner()){
    const reason=String(err?.message||'');
    model.messageKey=reason.includes('INSUFFICIENT_POINTS')?'shopNotEnough':
      reason.includes('ITEM_ALREADY_OWNED')?'shopAlreadyOwned':'shopActionError';
    model.error=true;
    console.warn('AURVEX Shop operation failed',err?.code||'error');
   }
  }finally{model.busy=false;fire()}
 })();
});
async function refreshAfterChange(){
 try{
  const current=secureOwner();
  const updated=await loadShopState();
  if(current&&current===secureOwner()){
   model.userId=current;
   model.balance=Number.isInteger(updated.balance)?updated.balance:0;
   model.inventory=Array.isArray(updated.inventory)?updated.inventory:[];
   model.equipped=updated.equipped||{avatar:null,profile:null};
   model.history=Array.isArray(updated.history)?updated.history:[];
   model.ready=true;model.error=false;
  }
 }catch(err){model.messageKey='shopLoadError';model.error=true}
}
void catalog();
onAuth();
