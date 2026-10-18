// AURVEX Social 3.7 controller: opt-in friends-only online status, inbox, blocking.
import {socialSnapshot,socialShowOnline,socialHeartbeat,socialBlock,
 socialRead,socialFamilyInvite,socialOpenInvite,socialCanInvite} from './social37-service.js?v=20261018-381';

const model={
 ready:false,busy:false,userId:'',showOnline:false,onlineIds:[],
 blocked:[],notifications:[],canInvite:false,
 status:'',error:false
};
window.AURVEX_SOCIAL37=model;
const authorized=()=>!!(window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified);
const current=()=>authorized()?window.AURVEX_ID.user.id:'';
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:social37-state'));
let revision=0,loading=false,lastHeartbeat=0,lastRefresh=0;
function message(key,error=false){model.status=key;model.error=error;model.busy=false;fire()}
function reset(){
 ++revision;
 model.userId='';model.ready=false;model.busy=false;model.showOnline=false;
 model.onlineIds=[];model.blocked=[];model.notifications=[];model.canInvite=false;
 model.status='';model.error=false;loading=false;fire();
}
async function refresh(force=false){
 const who=current();
 if(!who){if(model.userId)reset();return}
 if(loading||model.busy)return;
 if(!force&&Date.now()-lastRefresh<25000)return;
 const token=revision;
 const previouslyReady=model.ready;
 loading=true;
 try{
  const snapshot=await socialSnapshot();
  if(token!==revision||current()!==who)return;
  // Invite capability is verified separately; refresh on changes to family status.
  const canInvite=await socialCanInvite();
  if(token!==revision||current()!==who)return;
  const next={
   showOnline:snapshot.showOnline,
   onlineIds:snapshot.onlineIds,
   blocked:snapshot.blocked,
   notifications:snapshot.notifications,
   canInvite:canInvite===true
  };
  const changed=!previouslyReady||Object.entries(next).some(([key,val])=>JSON.stringify(val)!==JSON.stringify(model[key]));
  Object.assign(model,next);
  model.ready=true;lastRefresh=Date.now();
  if(changed)fire();
 }catch(e){
  if(token!==revision)return;
  console.warn('AURVEX Social sync',e?.code||'failed');
  model.ready=true;model.status='social37LoadError';model.error=true;fire();
 }finally{loading=false}
}
async function heartbeat(){
 if(!current()||!model.showOnline||document.visibilityState==='hidden')return;
 if(Date.now()-lastHeartbeat<35000)return;
 lastHeartbeat=Date.now();
 try{await socialHeartbeat()}catch(e){console.warn('Online heartbeat failed',e?.code||'error')}
}
async function tick(force=false){
 if(document.visibilityState==='hidden')return;
 if(!current()){if(model.userId)reset();return}
 if(model.userId!==current()){
  ++revision;model.userId=current();model.ready=false;
  model.onlineIds=[];model.blocked=[];model.notifications=[];model.showOnline=false;
  model.canInvite=false;lastRefresh=0;lastHeartbeat=0;force=true;
 }
 if(force)lastRefresh=0;
 await refresh(force);
 void heartbeat();
}
window.addEventListener('aurvex:id-state',()=>{void tick()});
window.addEventListener('aurvex:social-state',()=>{
 // May have just created or left a family, so refresh owner capability.
 if(current())void tick(true);
});
window.addEventListener('focus',()=>{void tick(true)});
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible')void tick(true);
});
setInterval(()=>{void tick()},30000);

document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-social37-action]');
 if(!btn||!current()||model.busy)return;
 const action=btn.dataset.social37Action;
 const target=btn.dataset.playerId;
 const notification=btn.dataset.notificationId;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const who=current();
 if(['block','unblock','invite-friend'].includes(action)&&!uuid.test(target||''))return;
 if(['read','open-invite'].includes(action)&&!uuid.test(notification||''))return;
 if(action==='block'&&!window.confirm?.('Block this player? Existing friendship and invitations will be removed.'))return;
 model.busy=true;fire();
 void(async()=>{
  try{
   if(action==='visibility'){
    await socialShowOnline(!model.showOnline);
    model.showOnline=!model.showOnline;
    lastHeartbeat=0;
    if(model.showOnline)await heartbeat();
    message(model.showOnline?'social37Visible':'social37Hidden');
   }else if(action==='block'||action==='unblock'){
    await socialBlock(target,action==='block');
    message(action==='block'?'social37Blocked':'social37Unblocked');
    window.dispatchEvent(new CustomEvent('aurvex:social-block-changed'));
   }else if(action==='invite-friend'){
    await socialFamilyInvite(target);
    message('social37InvitationSent');
   }else if(action==='read'){
    await socialRead(notification);
    message('social37MarkedRead');
   }else if(action==='open-invite'){
    const token=await socialOpenInvite(notification);
    if(who!==current())return;
    message('social37InvitationOpened');
    location.hash='#/family?invite='+encodeURIComponent(token);
   }
   if(who===current())void tick(true);
  }catch(e){
   console.warn('AURVEX Social action',e?.code||'error');
   message('social37ActionError',true);
  }
 })();
});
void tick();
