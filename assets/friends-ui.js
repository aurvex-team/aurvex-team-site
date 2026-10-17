// AURVEX Friends v1 browser controller. No credentials, emails or secret keys.
import {listFriends,findPlayers,sendFriendRequest,respondFriendRequest} from './friends-service.js?v=20261017-380';

const model={ready:false,busy:false,searching:false,query:'',results:[],relations:[],
 statusKey:'',statusError:false,userId:''};
window.AURVEX_FRIENDS=model;
let refreshVersion=0;
let searchVersion=0;
let nextPoll=0;
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:friends-state'));
const authorized=()=>!!(window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified);
const userId=()=>authorized()?window.AURVEX_ID.user.id:'';
function reset(){
  ++refreshVersion;
  ++searchVersion;
  model.userId='';model.ready=false;model.busy=false;model.searching=false;
  model.query='';model.results=[];model.relations=[];model.statusKey='';model.statusError=false;
  fire();
}
function warning(key){
  model.statusKey=key;model.statusError=true;model.busy=false;model.searching=false;fire();
}
async function refresh(){
  const who=userId();
  if(!who){if(model.userId)reset();return}
  if(model.busy)return;
  const run=++refreshVersion;
  model.userId=who;
  if(!model.ready)fire();
  try{
    const data=await listFriends();
    if(run!==refreshVersion||userId()!==who)return;
    const changed=!model.ready||JSON.stringify(data)!==JSON.stringify(model.relations);
    model.relations=data;model.ready=true;model.statusError=false;
    if(changed)fire();
  }catch(error){
    if(run!==refreshVersion)return;
    console.warn('AURVEX Friends refresh:',error?.code||'failed');
    model.ready=true;warning('friendsError');
  }
}
async function search(query){
  const who=userId();
  if(!who)return;
  model.query=query;model.results=[];model.statusKey='';
  if(!/^[A-Za-z0-9_]{3,24}$/.test(query)){warning('friendsSearchInvalid');return}
  const run=++searchVersion;
  model.searching=true;fire();
  try{
    const data=await findPlayers(query);
    if(run!==searchVersion||userId()!==who)return;
    model.results=data;model.searching=false;fire();
  }catch(error){
    if(run!==searchVersion)return;
    console.warn('AURVEX Friends search:',error?.code||'failed');
    warning('friendsError');
  }
}
document.addEventListener('submit',event=>{
  if(event.target?.id!=='friends-search-form')return;
  event.preventDefault();
  if(!authorized())return;
  const value=String(new FormData(event.target).get('nickname')||'').trim();
  void search(value);
});
document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-friend-action]');
  if(!btn||!authorized()||model.busy)return;
  const action=btn.dataset.friendAction;
  const playerId=btn.dataset.playerId;
  if(!/^[0-9a-f-]{36}$/i.test(playerId||''))return;
  if(!['send','accept','decline','cancel','remove'].includes(action))return;
  model.busy=true;model.statusKey='';fire();
  const who=userId();
  void (async()=>{
    try{
      if(action==='send')await sendFriendRequest(playerId);
      else await respondFriendRequest(playerId,action);
      if(who!==userId())return;
      model.statusKey={
        send:'friendsSent',accept:'friendsAccepted',
        decline:'friendsDeclined',cancel:'friendsCancelled',remove:'friendsRemoved'
      }[action];
      model.statusError=false;model.busy=false;
      await refresh();
      if(model.query)await search(model.query);
      // refresh and search clear status; restore the successful action.
      model.statusKey={
        send:'friendsSent',accept:'friendsAccepted',
        decline:'friendsDeclined',cancel:'friendsCancelled',remove:'friendsRemoved'
      }[action];
      fire();
    }catch(error){
      console.warn('AURVEX Friends action:',error?.code||'failed');
      warning('friendsActionError');
      model.busy=false;
    }
  })();
});
window.addEventListener('aurvex:id-state',()=>{
  const who=userId();
  if(!who){if(model.userId)reset();return}
  if(who!==model.userId){model.userId=who;void refresh()}
});
window.addEventListener('aurvex:social-block-changed',()=>{
  if(!authorized())return;
  void (async()=>{
    await refresh();
    if(model.query)await search(model.query);
  })();
});
window.addEventListener('hashchange',()=>{
  if(location.hash.startsWith('#/friends')&&authorized()&&!model.busy)void refresh();
});
function polling(){
  if(!authorized())return;
  if(document.visibilityState==='hidden')return;
  if(Date.now()-nextPoll<25000)return;
  nextPoll=Date.now();
  if(model.busy||model.searching)return;
  void refresh();
}
window.addEventListener('focus',polling);
document.addEventListener('visibilitychange',polling);
setInterval(polling,30000);
if(authorized()){model.userId=userId();void refresh()}
