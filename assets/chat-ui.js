// AURVEX Community Chat v1 — public reading, verified AAL2-only writing.
import {idClient} from './id-service.js?v=20261018-411';
import {profileMediaUrl} from './id-service.js?v=20261018-411';
import {translations} from './i18n.js?v=20261018-460';
const s={messages:[],loading:false,ready:false,busy:false,draft:'',notice:'',hidden:[]};
window.AURVEX_CHAT=s;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const active=()=>location.hash.split('?')[0]==='#/chat';
const verified=()=>!!window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified===true;
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const t=k=>translations[document.documentElement.lang]?.[k]||translations.en[k]||k;
const key='aurvex.community.hidden.v1';
try{s.hidden=JSON.parse(localStorage.getItem(key)||'[]').filter(x=>typeof x==='string'&&uuid.test(x)).slice(0,150)}catch{}
const persist=()=>{try{localStorage.setItem(key,JSON.stringify(s.hidden))}catch{}};
let channel=null,starting=false,request=0,fetching=null,lastFetch=0;
const db=()=>idClient();
function messageRow(x){
 if(!Number.isSafeInteger(x?.id)||!uuid.test(x.authorId||'')||s.hidden.includes(x.authorId))return '';
 const author=String(x.nickname||'AURVEX Player').slice(0,40);
 const path=String(x.avatarPath||'');
 const avatar=/^[a-zA-Z0-9_./-]{1,220}$/.test(path)&&!path.includes('..')?
  '<img loading="lazy" src="'+esc(profileMediaUrl(path))+'" alt="">':svgUser;
 const date=new Date(x.createdAt);
 const time=Number.isFinite(date.getTime())?date.toLocaleString(document.documentElement.lang||'en',{dateStyle:'short',timeStyle:'short'}):'';
 const canReport=verified()&&x.authorId!==window.AURVEX_ID?.user?.id;
 return '<article class="chat-message"><a class="chat-avatar" href="#/player/'+x.authorId+'" title="'+esc(author)+'">'+avatar+'</a>'+
 '<div class="chat-message-body"><div class="chat-message-head"><a href="#/player/'+x.authorId+'">'+esc(author)+'</a><time>'+esc(time)+'</time></div>'+
 '<p>'+esc(String(x.body||'').slice(0,500))+'</p><div class="chat-message-actions">'+
 '<button type="button" data-chat-hide="'+x.authorId+'">'+t('chatHideUser')+'</button>'+
 (canReport?'<details class="chat-report"><summary>'+t('chatReport')+'</summary><div class="chat-report-tools">'+
 '<select aria-label="'+esc(t('chatReportReason'))+'">'+
 ['spam','harassment','unsafe','privacy','other'].map(y=>'<option value="'+y+'">'+t('chatReason_'+y)+'</option>').join('')+
 '</select><button type="button" data-chat-report="'+x.id+'">'+t('chatReportSend')+'</button></div></details>':'')+
 (window.AURVEX_CHAT_ADMIN_POST_TOOLS?.(x)||'')+
 '</div></div></article>';
}
const svgUser='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>';
function renderMessages(){
 const box=document.getElementById('chat-message-feed');
 if(!box)return;
 const atEnd=box.scrollHeight-box.scrollTop-box.clientHeight<130;
 const html=s.messages.map(messageRow).join('');
 box.innerHTML=html||'<div class="chat-empty">'+svgUser+'<strong>'+t('chatEmpty')+'</strong><p>'+t(s.loading?'chatLoading':s.hidden.length?'chatFiltered':'chatEmptyDetail')+'</p></div>';
 const count=document.getElementById('chat-message-count');
 if(count)count.textContent=s.messages.length+' '+t('chatRecent');
 const notice=document.getElementById('chat-notice');
 if(notice)notice.textContent=s.notice?t(s.notice):'';
 if(atEnd)box.scrollTop=box.scrollHeight;
 const send=document.querySelector('#community-chat-form button[type="submit"]');
 if(send)send.disabled=s.busy;
}
window.AURVEX_CHAT_RENDER=renderMessages;
function renderComposer(){
 const area=document.getElementById('chat-compose-slot');
 if(!area)return;
 const mode=verified()?'write':'read';
 if(area.dataset.chatMode===mode)return;
 area.dataset.chatMode=mode;
 if(mode==='write'){
  area.innerHTML='<form id="community-chat-form" class="chat-composer">'+
   '<label for="chat-draft">'+t('chatWritingAs')+' <strong>'+esc(window.AURVEX_ID?.profile?.nickname||'AURVEX')+'</strong></label>'+
   '<div class="chat-composer-row"><textarea id="chat-draft" name="message" rows="2" maxlength="500" placeholder="'+esc(t('chatPlaceholder'))+'" required>'+esc(s.draft)+'</textarea>'+
   '<button type="submit"'+(s.busy?' disabled':'')+'><span>➤</span> '+t('chatSend')+'</button></div>'+
   '<div class="chat-composer-hint"><span>'+t('chatNoLinks')+'</span><span id="chat-count">'+s.draft.length+'/500</span></div></form>';
 }else{
  const signed=!!window.AURVEX_ID?.user?.id;
  area.innerHTML='<div class="chat-locked">'+svgUser+'<div><strong>'+t('chatReadOnly')+'</strong>'+
   '<p>'+t(signed?'chatNeedTwoFactor':'chatNeedSignIn')+'</p></div>'+
   '<a href="#/id" class="btn btn-primary">'+t('chatVerifyButton')+'</a></div>';
 }
}
window.AURVEX_CHAT_MOUNT=()=>{if(!active())return;renderComposer();renderMessages();void load();void subscribe()};
async function load(){
 if(!active())return;
 if(fetching)return fetching;
 const id=++request;s.loading=true;renderMessages();
 fetching=(async()=>{
  try{
   const {data,error}=await (await db()).rpc('aurvex_chat_feed');
   if(error)throw error;
   if(id!==request)return;
   s.messages=Array.isArray(data)?data.slice(-60):[];
   s.ready=true;s.notice='';lastFetch=Date.now();
  }catch(e){s.notice='chatLoadError';console.warn('Community chat read:',e?.code||'unavailable')}
  finally{if(id===request){s.loading=false;renderMessages()}}
 })();
 try{await fetching}finally{fetching=null}
}
window.AURVEX_CHAT_RELOAD=load;
async function subscribe(){
 if(channel||starting||!active())return;
 starting=true;
 try{
  const client=await db();
  if(!active())return;
  channel=client.channel('aurvex-community-pulses')
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'aurvex_chat_pulses'},()=>{if(active())void load()})
   .subscribe();
 }catch(e){console.warn('Chat live subscription:',e?.code||'unavailable')}
 finally{starting=false}
}
async function cleanup(){
 ++request;
 const old=channel;channel=null;
 if(old)try{await (await db()).removeChannel(old)}catch{}
}
function errorKey(e){
 const message=String(e?.message||'');
 for(const [snippet,key] of [['CHAT_SLOW_MODE','chatSlowError'],['CHAT_ACCOUNT_BANNED','chatBanned'],
 ['CHAT_ACCOUNT_MUTED','chatMuted'],['CHAT_PROFILE_REQUIRED','chatNicknameRequired'],
 ['CHAT_VERIFICATION_REQUIRED','chatMustVerify'],['MFA_REQUIRED','chatMustVerify'],
 ['CHAT_RATE_LIMIT','chatRateError'],['CHAT_DAILY_LIMIT','chatRateError'],
 ['CHAT_MESSAGE_INVALID','chatInvalid']])if(message.includes(snippet))return key;
 return 'chatSendError';
}
async function send(form){
 if(!verified()||s.busy)return;
 const message=String(form.querySelector('textarea')?.value||'').trim();
 if(message.length<1||message.length>500||/https?:\/\/|www\.|[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i.test(message)){
  s.notice='chatInvalid';renderMessages();return;
 }
 s.busy=true;s.notice='';s.draft=message;renderMessages();
 try{
  const {error}=await (await db()).rpc('aurvex_chat_send',{message_text:message,request_id:crypto.randomUUID()});
  if(error)throw error;
  s.draft='';
  const text=form.querySelector('textarea');if(text)text.value='';
  const count=document.getElementById('chat-count');if(count)count.textContent='0/500';
  s.notice='chatSent';
  await load();
 }catch(e){s.notice=errorKey(e);console.warn('Community chat send:',e?.code||'rejected')}
 finally{s.busy=false;renderMessages()}
}
async function report(messageId,reason){
 if(!verified()||s.busy||!Number.isSafeInteger(messageId)||messageId<=0)return;
 if(!['spam','harassment','unsafe','privacy','other'].includes(reason))return;
 s.busy=true;s.notice='';renderMessages();
 try{
  const {data,error}=await (await db()).rpc('aurvex_chat_report',{target_message:messageId,report_reason:reason});
  if(error)throw error;
  s.notice=data==='held'?'chatAutoHidden':'chatReported';
  await load();
 }catch(e){s.notice='chatReportError';console.warn('Community report:',e?.code||'rejected')}
 finally{s.busy=false;renderMessages()}
}
document.addEventListener('submit',event=>{
 if(event.target?.id!=='community-chat-form')return;
 event.preventDefault();void send(event.target);
});
document.addEventListener('input',event=>{
 if(event.target?.id!=='chat-draft')return;
 s.draft=event.target.value.slice(0,500);
 const count=document.getElementById('chat-count');if(count)count.textContent=s.draft.length+'/500';
});
document.addEventListener('keydown',event=>{
 if(event.target?.id==='chat-draft'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
  event.preventDefault();event.target.closest('form')?.requestSubmit();
 }
});
document.addEventListener('click',event=>{
 const hide=event.target.closest?.('[data-chat-hide]');
 if(hide?.dataset.chatHide&&uuid.test(hide.dataset.chatHide)){
  if(!s.hidden.includes(hide.dataset.chatHide))s.hidden.push(hide.dataset.chatHide);
  s.hidden=s.hidden.slice(-150);persist();s.notice='chatUserHidden';renderMessages();return;
 }
 const btn=event.target.closest?.('[data-chat-report]');
 if(btn){
  const details=btn.closest('.chat-report');
  void report(Number(btn.dataset.chatReport),details?.querySelector('select')?.value||'other');return;
 }
 const action=event.target.closest?.('[data-chat-action]')?.dataset.chatAction;
 if(action==='refresh')void load();
 if(action==='show-hidden'){s.hidden=[];persist();s.notice='chatUnhidden';renderMessages()}
});
window.addEventListener('hashchange',()=>{if(active())window.AURVEX_CHAT_MOUNT?.();else void cleanup()});
window.addEventListener('aurvex:id-state',()=>{if(!verified())s.draft='';if(active()){renderComposer();renderMessages()}});
window.addEventListener('focus',()=>{if(active())void load()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active())void load()});
setInterval(()=>{if(active()&&!document.hidden&&Date.now()-lastFetch>12000)void load()},14000);
if(active())window.AURVEX_CHAT_MOUNT?.();
