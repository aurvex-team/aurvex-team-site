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
