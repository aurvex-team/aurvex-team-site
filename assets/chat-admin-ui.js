// AURVEX moderation dashboard. Permissions are always enforced by server RPCs.
import {idClient} from './id-service.js?v=20261018-411';
import {translations} from './i18n.js?v=20261018-480';
const mod={moderator:false,siteAdmin:false,who:'',ready:false,loading:false,busy:false,
  tab:'members',mobileOpen:false,queue:[],roster:[],selectedUser:'',selectedMessage:null,
  search:'',action:'ban_7d',feedback:''};
window.AURVEX_CHAT_ADMIN=mod;
const valid=id=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id||'');
const verified=()=>!!window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified===true;
const chat=()=>location.hash.split('?')[0]==='#/chat';
const t=k=>translations[document.documentElement.lang]?.[k]||translations.en[k]||k;
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const choices=[['mute_1h','modMuteHour'],['mute_1d','modMuteDay'],['ban_1d','modBanDay'],
 ['ban_7d','modBanWeek'],['ban_30d','modBanMonth'],['ban_permanent','modBanForever'],
 ['unban','modUnban']];
const isStaff=()=>verified()&&mod.ready&&mod.moderator&&mod.who===window.AURVEX_ID.user.id;
const availableActions=()=>choices.concat(mod.siteAdmin?[['ban_site','modBanSite'],['unban_site','modUnbanSite']]:[]);
const notice=()=>mod.feedback?'<p class="mod-feedback" role="status">'+t(mod.feedback)+'</p>':'';
function selectedMessageCard(){
 const x=mod.selectedMessage;
 if(!x||!Number.isSafeInteger(Number(x.id))||!valid(x.authorId))return '';
 const uid=x.authorId,mid=Number(x.id);
 return '<section class="mod-selected-message"><div class="mod-section-top"><h3>'+t('modSelectedMessage')+'</h3>'+
   '<button type="button" data-mod-clear-message aria-label="'+esc(t('modClearSelection'))+'">×</button></div>'+
   '<strong>'+esc(x.nickname||uid)+'</strong><small> #'+mid+'</small>'+
   '<p>'+esc(String(x.body||'').slice(0,500))+'</p>'+
   '<div class="mod-item-actions"><button type="button" data-mod-message="'+mid+'" data-mod-decision="removed">'+t('modDelete')+'</button>'+
   (uid!==mod.who?'<button type="button" data-mod-pick-user="'+esc(uid)+'">'+t('modManageAccount')+'</button>':'')+'</div></section>';
}
function memberPanel(){
 const rows=mod.roster.filter(x=>valid(x.userId)&&x.userId!==mod.who);
 if(mod.selectedUser&&!rows.some(x=>x.userId===mod.selectedUser))mod.selectedUser='';
 const members='<option value=""'+(!mod.selectedUser?' selected':'')+' disabled>'+t('modSelectMember')+'</option>'+
  rows.map(x=>'<option value="'+esc(x.userId)+'"'+(x.userId===mod.selectedUser?' selected':'')+'>'+
   esc(x.nickname||t('modUnknownPlayer'))+' · '+esc(x.userId.slice(0,8))+
   (x.siteBan?' · '+t('modSiteBanned'):x.chatBan?' · '+t('modChatBanned'):'')+'</option>').join('');
 const actions=availableActions().map(([value,key])=>
   '<option value="'+value+'"'+(mod.action===value?' selected':'')+'>'+t(key)+'</option>').join('');
 return '<section class="mod-members"><h3>'+t('modAccountSection')+'</h3>'+
  '<form id="mod-find-form" class="mod-find" role="search"><label class="sr-only" for="mod-account-search">'+t('modSearchPlaceholder')+'</label>'+
   '<input type="search" id="mod-account-search" name="search" minlength="3" maxlength="40" value="'+esc(mod.search)+'" required placeholder="'+esc(t('modSearchPlaceholder'))+'">'+
   '<button type="submit"'+(mod.busy?' disabled':'')+'>'+t('modSearchButton')+'</button></form>'+
  '<form id="mod-account-form" class="mod-account-form"><label>'+t('modTarget')+
   '<select name="target" required'+(!rows.length?' disabled':'')+'>'+members+'</select></label>'+
   '<label>'+t('modAction')+'<select name="decision">'+actions+'</select></label>'+
   '<button class="mod-apply" type="submit"'+(mod.busy||!mod.selectedUser?' disabled':'')+'>'+
     t('modApply')+'</button></form>'+
   '<p class="mod-footnote">'+t('modProtected')+'</p></section>';
}
function reportsPanel(){
 const queue=mod.queue.filter(x=>Number.isSafeInteger(Number(x.id))&&Number(x.id)>0&&valid(x.authorId));
 const items=queue.length?queue.map(x=>{
  const mid=Number(x.id),uid=String(x.authorId);
  return '<article class="mod-review-item"><div class="mod-review-summary"><strong>'+esc(x.nickname||uid)+'</strong>'+
   '<span> #'+mid+' · '+t('modReports')+': '+Number(x.reports||0)+'</span></div>'+
   '<p>'+esc(String(x.body||'').slice(0,500))+'</p>'+
   '<div class="mod-item-actions"><button type="button" data-mod-message="'+mid+'" data-mod-decision="removed">'+t('modDelete')+'</button>'+
   '<button type="button" data-mod-message="'+mid+'" data-mod-decision="visible">'+t('modApprove')+'</button>'+
   (uid!==mod.who?'<button type="button" data-mod-pick-user="'+esc(uid)+'">'+t('modManageAccount')+'</button>':'')+
   '</div></article>';
 }).join(''):'<div class="mod-queue-empty">🛡<p>'+t('modNoReports')+'</p></div>';
 return '<section class="mod-review"><div class="mod-section-top"><h3>'+t('modReportsTitle')+
   '</h3><button type="button" data-mod-refresh'+(mod.busy?' disabled':'')+'>'+t('chatRefresh')+'</button></div>'+
   items+'</section>';
}
function render(){
 const box=document.getElementById('chat-admin-panel');
 const mobileButton=document.querySelector('[data-mod-mobile-open]');
 if(mobileButton)mobileButton.hidden=!isStaff();
 if(!box)return;
 if(!isStaff()){
  box.innerHTML='';box.classList.remove('is-mobile-open');document.body.classList.remove('chat-admin-drawer-open');
  return;
 }
 box.classList.toggle('is-mobile-open',mod.mobileOpen);
 document.body.classList.toggle('chat-admin-drawer-open',mod.mobileOpen);
 box.innerHTML='<section class="mod-panel"><div class="mod-panel-head"><div>'+
   '<span class="smallcaps">AURVEX / STAFF</span><h2>🛡 '+t('modTitle')+'</h2>'+
   '<p>'+t('modDescription')+'</p></div>'+
   '<button type="button" class="mod-mobile-close" data-mod-mobile-close aria-label="'+esc(t('modClose'))+'">×</button></div>'+
   '<div class="mod-tabs" role="group" aria-label="'+esc(t('modTitle'))+'">'+
     '<button type="button" data-mod-tab="members" aria-pressed="'+(mod.tab==='members')+'" class="'+(mod.tab==='members'?'is-active':'')+'">'+t('modUsersTab')+'</button>'+
     '<button type="button" data-mod-tab="reports" aria-pressed="'+(mod.tab==='reports')+'" class="'+(mod.tab==='reports'?'is-active':'')+'">'+t('modReportsTab')+
     (mod.queue.length?'<span class="mod-tab-count">'+mod.queue.length+'</span>':'')+'</button></div>'+
   notice()+selectedMessageCard()+
   '<div class="mod-panel-inner">'+(mod.tab==='members'?memberPanel():reportsPanel())+'</div></section>';
}
window.AURVEX_CHAT_ADMIN_POST_TOOLS=x=>{
 if(!isStaff()||!valid(x.authorId)||!Number.isSafeInteger(Number(x.id)))return '';
 return '<button type="button" class="mod-select-message" data-mod-select-message="'+Number(x.id)+
  '" data-mod-select-author="'+esc(x.authorId)+'" title="'+esc(t('modManage'))+'">🛡 '+t('modManage')+'</button>';
};
async function details(client){
 if(!isStaff())return;
 const [people,reports]=await Promise.all([
  client.rpc('aurvex_chat_staff_roster'),client.rpc('aurvex_chat_moderation_queue')]);
 if(people.error||reports.error)throw people.error||reports.error;
 if(!isStaff())return;
 mod.roster=Array.isArray(people.data)?people.data:[];
 mod.queue=Array.isArray(reports.data)?reports.data:[];
 render();
}
async function start(force=false){
 if(!chat()||!verified()){
  mod.ready=false;mod.moderator=false;mod.siteAdmin=false;mod.who='';
  mod.roster=[];mod.queue=[];mod.selectedUser='';mod.selectedMessage=null;mod.mobileOpen=false;
  render();window.AURVEX_CHAT_RENDER?.();return;
 }
 const who=window.AURVEX_ID.user.id;
 if(mod.loading)return;
 if(mod.ready&&mod.who===who&&!force){render();return}
 mod.loading=true;
 try{
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_chat_staff_state');
  if(error)throw error;
  if(!verified()||window.AURVEX_ID.user.id!==who)return;
  if(mod.who!==who){mod.selectedUser='';mod.selectedMessage=null;mod.mobileOpen=false}
  mod.who=who;mod.moderator=data?.moderator===true;mod.siteAdmin=data?.siteAdmin===true;
  mod.ready=true;
  if(mod.moderator)await details(client);
  render();window.AURVEX_CHAT_RENDER?.();
 }catch(e){mod.ready=false;mod.moderator=false;mod.siteAdmin=false;
  console.warn('Staff verification:',e?.code||'unavailable');render()}
 finally{mod.loading=false}
}
window.AURVEX_CHAT_ADMIN_MOUNT=()=>{if(chat())void start()};
async function apply(type,target,decision){
 if(!isStaff()||mod.busy)return;
 if(type==='site'&&!mod.siteAdmin)return;
 if(type==='message'&&(!Number.isSafeInteger(target)||target<1||!['removed','visible'].includes(decision)))return;
 if(type!=='message'&&(!valid(target)||target===mod.who))return;
 if(type==='user'&&!choices.some(x=>x[0]===decision))return;
 if(type==='site'&&!['ban_site','unban_site'].includes(decision))return;
 const label=t(availableActions().find(x=>x[0]===decision)?.[1]||'modDelete');
 const targetLabel=type==='message'?'#'+target:
   (mod.roster.find(x=>x.userId===target)?.nickname||target);
 if(!window.confirm(t('modConfirm').replace('{action}',label).replace('{target}',targetLabel)))return;
 mod.busy=true;mod.feedback='';render();
 try{
  const client=await idClient();let error;
  if(type==='message'){
   ({error}=await client.rpc('aurvex_chat_moderate_message',{target_message:target,decision}));
  }else if(type==='user'){
   ({error}=await client.rpc('aurvex_chat_moderate_user',{target_user:target,decision}));
  }else{
   const result=await client.functions.invoke('aurvex-chat-admin',{
    body:{target,action:decision,reason:'AURVEX community rule violation'}});
   error=result.error;
   if(!error&&result.data?.ok!==true)error=new Error('Unconfirmed site action');
  }
  if(error)throw error;
  if(type==='message')mod.selectedMessage=null;
  await window.AURVEX_CHAT_RELOAD?.();
  await details(client);
  mod.feedback='modSuccess';
 }catch(e){mod.feedback='modFailed';console.warn('Moderation failed:',e?.code||'unavailable')}
 finally{mod.busy=false;render();window.AURVEX_CHAT_RENDER?.()}
}
function chooseUser(uid){
 if(!isStaff()||!valid(uid)||uid===mod.who)return;
 const exists=mod.roster.some(x=>x.userId===uid);
 const message=window.AURVEX_CHAT?.messages?.find(x=>x.authorId===uid);
 if(!exists){mod.roster.push({userId:uid,nickname:message?.nickname||uid})}
 mod.selectedUser=uid;mod.tab='members';render();
}
document.addEventListener('click',event=>{
 const target=event.target;
 if(target.closest?.('[data-mod-mobile-open]')){
  if(isStaff()){mod.mobileOpen=true;render()}return;
 }
 if(target.closest?.('[data-mod-mobile-close]')){
  mod.mobileOpen=false;render();return;
 }
 const tab=target.closest?.('[data-mod-tab]');
 if(tab&&isStaff()){mod.tab=tab.dataset.modTab==='reports'?'reports':'members';mod.feedback='';render();return}
 if(target.closest?.('[data-mod-clear-message]')){mod.selectedMessage=null;render();return}
 const chosen=target.closest?.('[data-mod-select-message]');
 if(chosen&&isStaff()){
  const id=Number(chosen.dataset.modSelectMessage),uid=chosen.dataset.modSelectAuthor;
  const x=window.AURVEX_CHAT?.messages?.find(y=>y.id===id&&y.authorId===uid);
  if(x&&valid(uid)){
   mod.selectedMessage={id,authorId:uid,nickname:x.nickname,body:x.body};
   mod.mobileOpen=true;render();
  }return;
 }
 const pick=target.closest?.('[data-mod-pick-user]');
 if(pick){chooseUser(pick.dataset.modPickUser);return}
 const refresh=target.closest?.('[data-mod-refresh]');
 if(refresh){void start(true);return}
 const message=target.closest?.('[data-mod-message]');
 if(message){void apply('message',Number(message.dataset.modMessage),message.dataset.modDecision);return}
 const member=target.closest?.('[data-mod-user]');
 if(member){void apply('user',member.dataset.modUser,member.dataset.modDecision);return}
 const site=target.closest?.('[data-mod-site-user]');
 if(site){void apply('site',site.dataset.modSiteUser,site.dataset.modDecision);return}
});
document.addEventListener('change',event=>{
 if(!isStaff())return;
 if(event.target?.matches?.('#mod-account-form [name="target"]')){
  mod.selectedUser=event.target.value;const button=document.querySelector('#mod-account-form [type="submit"]');
  if(button)button.disabled=!mod.selectedUser||mod.busy;
 }
 if(event.target?.matches?.('#mod-account-form [name="decision"]'))mod.action=event.target.value;
});
document.addEventListener('input',event=>{
 if(event.target?.id==='mod-account-search')mod.search=event.target.value.slice(0,40);
});
document.addEventListener('submit',event=>{
 if(event.target?.id==='mod-find-form'){
  event.preventDefault();
  if(!isStaff()||mod.busy)return;
  const term=String(new FormData(event.target).get('search')||'').trim();
  if(term.length<3||term.length>40)return;
  mod.busy=true;mod.feedback='';
  void(async()=>{
   try{
    const {data,error}=await (await idClient()).rpc('aurvex_chat_staff_find_users',{search_text:term});
    if(error)throw error;
    if(!isStaff())return;
    const matches=Array.isArray(data)?data.filter(x=>valid(x.userId)):[];
    mod.roster=[...new Map([...matches,...mod.roster].map(x=>[x.userId,x])).values()];
    if(matches.length)mod.selectedUser=matches[0].userId;
    mod.feedback=matches.length?'modSearchFound':'modSearchEmpty';
   }catch(e){mod.feedback='modFailed';console.warn('Moderator search:',e?.code||'unavailable')}
   finally{mod.busy=false;render()}
  })();return;
 }
 if(event.target?.id!=='mod-account-form')return;
 event.preventDefault();
 const data=new FormData(event.target);
 const target=String(data.get('target')||''),decision=String(data.get('decision')||'');
 void apply(decision.endsWith('_site')?'site':'user',target,decision);
});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&mod.mobileOpen){mod.mobileOpen=false;render()}
});
window.addEventListener('aurvex:id-state',()=>{if(chat())void start()});
window.addEventListener('hashchange',()=>{
 if(chat())void start();
 else if(mod.mobileOpen){mod.mobileOpen=false;document.body.classList.remove('chat-admin-drawer-open')}
});
if(chat())void start();
