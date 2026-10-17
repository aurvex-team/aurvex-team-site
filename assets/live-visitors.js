// AURVEX live site visitors — anonymous, ephemeral Supabase Realtime Presence.
// This counts concurrently visible browser tabs, not unique humans or registered users.
// No email, nickname, user ID, IP address, location, cookies or persistent visitor ID
// is sent in the Presence payload; the random key exists only for the current tab.
import {idClient} from './id-service.js?v=20261017-393';

export function countActivePresences(state){
  if(!state||typeof state!=='object'||Array.isArray(state))return 0;
  // Realtime Presence state is keyed by ephemeral per-tab Presence keys.
  return Object.values(state).reduce((count,entries)=>
    count+(Array.isArray(entries)?entries.length:0),0);
}

const model={status:'connecting',count:null};
window.AURVEX_VISITORS=model;
let channel=null;
let subscribed=false;
let requestQueue=Promise.resolve();
const update=(nextStatus,nextCount=null)=>{
  const count=Number.isSafeInteger(nextCount)&&nextCount>=0?nextCount:null;
  if(model.status===nextStatus&&model.count===count)return;
  model.status=nextStatus;
  model.count=count;
  // Patch only the counter: rerendering the whole Store would reset active forms.
  document.querySelectorAll('[data-live-visitors]').forEach(el=>{
    el.dataset.liveState=nextStatus;
    const n=el.querySelector('[data-live-visitors-count]');
    if(n)n.textContent=count===null?'—':String(count);
    // Keep stale counts hidden while the WebSocket is disconnected.
    el.setAttribute('aria-busy',String(nextStatus==='connecting'));
  });
};

function syncCount(){
  if(!channel||!subscribed||document.visibilityState==='hidden')return;
  update('live',countActivePresences(channel.presenceState()));
}
function updateTracking(){
  // Serialize rapid background/foreground changes (track & untrack).
  requestQueue=requestQueue.catch(()=>{}).then(async()=>{
    if(!subscribed||!channel)return;
    const visible=document.visibilityState==='visible';
    const result=visible?await channel.track({active:true}):await channel.untrack();
    if(result==='error'||result==='timeout')throw new Error('Presence tracking failed');
    if(visible)syncCount();
  }).catch(error=>{
    console.warn('AURVEX live visitors: presence temporarily unavailable',error?.message||'network');
    update('unavailable');
  });
}
async function start(){
  try{
    const client=await idClient();
    const key=crypto.randomUUID();
    channel=client.channel('aurvex-store:live-visitors:v1',{
      config:{presence:{key}}
    });
    channel.on('presence',{event:'sync'},syncCount);
    channel.subscribe(status=>{
      if(status==='SUBSCRIBED'){
        subscribed=true;
        update('connecting');
        updateTracking();
      }else if(status==='CLOSED'||status==='TIMED_OUT'||status==='CHANNEL_ERROR'){
        subscribed=false;
        update('unavailable');
      }
    });
  }catch(error){
    console.warn('AURVEX live visitors: cannot connect',error?.message||'network');
    update('unavailable');
  }
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden')update('connecting');
  updateTracking();
});
window.addEventListener('pagehide',()=>{
  if(channel&&subscribed)void channel.untrack().catch(()=>{});
});
void start();
