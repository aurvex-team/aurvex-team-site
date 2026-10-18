// AURVEX community moderation. All authorization is enforced again by server RPCs.
import {idClient} from './id-service.js?v=20261018-411';
import {translations} from './i18n.js?v=20261018-470';
const mod={moderator:false,siteAdmin:false,who:'',ready:false,loading:false,busy:false,open:false,queue:[],roster:[],feedback:''};
window.AURVEX_CHAT_ADMIN=mod;
const valid=id=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id||'');
const verified=()=>!!window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified===true;
const chat=()=>location.hash.split('?')[0]==='#/chat';
const t=k=>translations[document.documentElement.lang]?.[k]||translations.en[k]||k;
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const choices=[['mute_1h','modMuteHour'],['mute_1d','modMuteDay'],['ban_1d','modBanDay'],['ban_7d','modBanWeek'],
 ['ban_30d','modBanMonth'],['ban_permanent','modBanForever'],['unban','modUnban']];
function render(){
 const box=document.getElementById('chat-admin-panel');
 if(!box)return;
 if(!verified()||!mod.moderator||mod.who!==window.AURVEX_ID.user.id){box.innerHTML='';return}
 const options=choices.concat(mod.siteAdmin?[['ban_site','modBanSite'],['unban_site','modUnbanSite']]:[])
  .map(([value,key])=>'<option value="'+value+'">'+t(key)+'</option>').join('');
 const members=mod.roster.filter(x=>valid(x.userId)&&x.userId!==mod.who)
  .map(x=>'<option value="'+esc(x.userId)+'">'+esc(x.nickname||x.userId)+
    (x.siteBan?' — '+t('modSiteBanned'):x.chatBan?' — '+t('modChatBanned'):'')+'</option>').join('');
 const flagged=mod.queue.length?mod.queue.map(x=>{
  const mid=Number(x.id),uid=String(x.authorId||'');
  if(!Number.isSafeInteger(mid)||!valid(uid))return '';
  return '<article class="mod-review-item"><strong>'+esc(x.nickname||uid)+'</strong><span> #'+mid+
   ' · '+t('modReports')+': '+Number(x.reports||0)+' · '+esc(x.status)+'</span>'+
   '<p>'+esc(String(x.body||'').slice(0,500))+'</p><div>'+
   '<button data-mod-message="'+mid+'" data-mod-decision="removed">'+t('modDelete')+'</button>'+
   '<button data-mod-message="'+mid+'" data-mod-decision="visible">'+t('modApprove')+'</button>'+
   '<button data-mod-user="'+esc(uid)+'" data-mod-decision="ban_7d">'+t('modBanWeek')+'</button>'+
   '</div></article>';
 }).join(''):'<p>'+t('modNoReports')+'</p>';
 box.innerHTML='<section class="mod-panel"><div class="mod-panel-head"><div><div class="smallcaps">AURVEX / STAFF</div>'+
  '<h2>🛡 '+t('modTitle')+'</h2><p>'+t('modDescription')+'</p></div>'+
  '<button data-mod-toggle aria-expanded="'+mod.open+'">'+t(mod.open?'modClose':'modOpen')+'</button></div>'+
  (mod.feedback?'<p class="mod-feedback">'+t(mod.feedback)+'</p>':'')+
  (mod.open?'<div class="mod-panel-inner"><section><h3>'+t('modAccountSection')+'</h3>'+
   '<form id="mod-find-form" class="mod-find"><input type="search" name="search" minlength="3" maxlength="40" required placeholder="'+esc(t('modSearchPlaceholder'))+'">'+
   '<button type="submit">'+t('modSearchButton')+'</button></form>'+
   '<form id="mod-account-form"><label>'+t('modTarget')+'<select name="target" required>'+members+'</select></label>'+
   '<label>'+t('modAction')+'<select name="decision">'+options+'</select></label>'+
   '<button type="submit"'+(mod.busy?' disabled':'')+'>'+t('modApply')+'</button></form>'+
   '<p>'+t('modProtected')+'</p></section>'+
   '<section><div class="mod-review-head"><h3>'+t('modReportsTitle')+'</h3>'+
     '<button data-mod-refresh>'+t('chatRefresh')+'</button></div>'+flagged+'</section></div>':'')+
  '</section>';
}
window.AURVEX_CHAT_ADMIN_POST_TOOLS=x=>{
 if(!verified()||!mod.moderator||mod.who!==window.AURVEX_ID.user.id)return '';
 const uid=String(x.authorId||''),mid=Number(x.id);
 if(!valid(uid)||!Number.isSafeInteger(mid))return '';
 return '<details class="mod-message-menu"><summary>🛡 '+t('modManage')+'</summary>'+
  '<div><button data-mod-message="'+mid+'" data-mod-decision="removed">'+t('modDelete')+'</button>'+
  (uid===mod.who?'':'<button data-mod-user="'+esc(uid)+'" data-mod-decision="mute_1d">'+t('modMuteDay')+'</button>'+
   '<button data-mod-user="'+esc(uid)+'" data-mod-decision="ban_7d">'+t('modBanWeek')+'</button>'+
   '<button data-mod-user="'+esc(uid)+'" data-mod-decision="ban_permanent">'+t('modBanForever')+'</button>'+
   (mod.siteAdmin?'<button data-mod-site-user="'+esc(uid)+'" data-mod-decision="ban_site">'+t('modBanSite')+'</button>':''))+
  '</div></details>';
};

async function details(client){
 if(!mod.moderator||!verified())return;
 const [people,reports]=await Promise.all([
  client.rpc('aurvex_chat_staff_roster'),client.rpc('aurvex_chat_moderation_queue')]);
 if(people.error||reports.error)throw people.error||reports.error;
 if(!verified()||window.AURVEX_ID.user.id!==mod.who)return;
 mod.roster=Array.isArray(people.data)?people.data:[];
 mod.queue=Array.isArray(reports.data)?reports.data:[];
 render();
}
async function start(force=false){
 if(!chat()||!verified()){
  mod.ready=false;mod.moderator=false;mod.siteAdmin=false;mod.who='';mod.roster=[];mod.queue=[];
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
 if(!verified()||!mod.moderator||mod.who!==window.AURVEX_ID.user.id||mod.busy)return;
 if(type==='site'&&!mod.siteAdmin)return;
 if(type==='message'&&(!Number.isSafeInteger(target)||target<1||!['removed','visible'].includes(decision)))return;
 if(type!=='message'&&(!valid(target)||target===mod.who))return;
 if(type==='user'&&!choices.some(x=>x[0]===decision))return;
 if(type==='site'&&!['ban_site','unban_site'].includes(decision))return;
 const name=t(choices.concat([['ban_site','modBanSite'],['unban_site','modUnbanSite']])
   .find(x=>x[0]===decision)?.[1]||'modDelete');
 if(!window.confirm(t('modConfirm').replace('{action}',name).replace('{target}',String(target))))return;
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
  await window.AURVEX_CHAT_RELOAD?.();
  await details(client);
  mod.feedback='modSuccess';
 }catch(e){mod.feedback='modFailed';console.warn('Moderation failed:',e?.code||'unavailable')}
 finally{mod.busy=false;render();window.AURVEX_CHAT_RENDER?.()}
}
document.addEventListener('click',event=>{
 const toggle=event.target.closest?.('[data-mod-toggle]');
 if(toggle){mod.open=!mod.open;render();return}
 const refresher=event.target.closest?.('[data-mod-refresh]');
 if(refresher){void start(true);return}
 const message=event.target.closest?.('[data-mod-message]');
 if(message){void apply('message',Number(message.dataset.modMessage),message.dataset.modDecision);return}
 const member=event.target.closest?.('[data-mod-user]');
 if(member){void apply('user',member.dataset.modUser,member.dataset.modDecision);return}
 const site=event.target.closest?.('[data-mod-site-user]');
 if(site){void apply('site',site.dataset.modSiteUser,site.dataset.modDecision);return}
});
document.addEventListener('submit',event=>{
 if(event.target?.id!=='mod-account-form')return;
 event.preventDefault();
 const info=new FormData(event.target);
 const target=String(info.get('target')||''),decision=String(info.get('decision')||'');
 void apply(decision.endsWith('_site')?'site':'user',target,decision);
});
window.addEventListener('aurvex:id-state',()=>{if(chat())void start()});
window.addEventListener('hashchange',()=>{if(chat())void start()});
if(chat())void start();
