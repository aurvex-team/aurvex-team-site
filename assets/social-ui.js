// Public profile viewer + AURVEX Family controller; all family mutations require server AAL2.
import {loadPlayerProfile,saveProfileAbout,saveCustomProfileStatus,saveSocialProfile,saveWishlistVisibility,getFamilyOverview,createFamily,
 createFamilyInvite,joinFamily,leaveFamily,removeFamilyMember,setFamilyShare,getFamilyLibrary}
 from './social-service.js?v=20261018-410';
import {normalizePublicLinks} from './social-links.js?v=20261018-410';

const m={profile:null,profileLoading:false,profileTarget:'',profileError:false,
 family:null,familyLibrary:[],familyReady:false,familyLoading:false,
 inviteUrl:'',busy:false,message:'',error:false,userId:'',
 socialDraft:null,draftUserId:'',aboutDraft:null,aboutDraftUser:'',customDraft:null,customDraftUser:''};
window.AURVEX_SOCIAL=m;
let profileSeq=0,familySeq=0;
const fire=()=>window.dispatchEvent(new CustomEvent('aurvex:social-state'));
const isSecure=()=>!!(window.AURVEX_ID?.user?.id&&window.AURVEX_ID?.mfaVerified);
const owner=()=>isSecure()?window.AURVEX_ID.user.id:'';
function message(key,error=false){m.message=key;m.error=error;m.busy=false;fire()}
async function showProfile(id){
 const run=++profileSeq;
 m.profileTarget=id;m.profileLoading=true;m.profile=null;m.profileError=false;fire();
 try{
   const p=await loadPlayerProfile(id);
   if(run!==profileSeq)return;
   m.profile=p;m.profileError=!p;m.profileLoading=false;fire();
 }catch(e){
   if(run!==profileSeq)return;
   m.profileLoading=false;m.profileError=true;fire();
 }
}
async function refreshFamily(){
 if(!isSecure())return;
 const run=++familySeq;const who=owner();
 m.familyLoading=!m.familyReady;fire();
 try{
   const [f,library]=await Promise.all([getFamilyOverview(),getFamilyLibrary()]);
   if(run!==familySeq||who!==owner())return;
   m.family=f;m.familyLibrary=library;m.familyReady=true;m.familyLoading=false;fire();
 }catch(e){
   if(run!==familySeq)return;
   console.warn('AURVEX Family overview error',e?.code||'error');
   m.familyLoading=false;message('familyError',true);
 }
}
function onRoute(){
 const hash=location.hash||'';
 const match=hash.match(/^#\/player\/([0-9a-f-]{36})(?:\?|$)/i);
 if(match)void showProfile(match[1]);
 if(hash.startsWith('#/family')&&isSecure()){
   if(!m.familyReady||m.userId!==owner()){m.userId=owner();void refreshFamily()}
 }
}
window.addEventListener('hashchange',onRoute);
window.addEventListener('aurvex:id-state',()=>{
 const current=owner();
 if(!current){
   if(m.userId||m.draftUserId){m.userId='';m.family=null;m.familyLibrary=[];
     m.familyReady=false;m.inviteUrl='';m.message='';m.socialDraft=null;m.draftUserId='';m.aboutDraft=null;m.aboutDraftUser='';m.customDraft=null;m.customDraftUser='';fire();}
 }else if((m.userId&&m.userId!==current)||(m.draftUserId&&m.draftUserId!==current)){
   m.userId=current;m.family=null;m.familyReady=false;m.inviteUrl='';
   m.socialDraft=null;m.draftUserId='';m.aboutDraft=null;m.aboutDraftUser='';m.customDraft=null;m.customDraftUser='';
   if(location.hash.startsWith('#/family'))void refreshFamily();
 }
});
// Keep edits through background notifications / Realtime-driven page re-renders.
function readSocialDraft(form){
 const data=new FormData(form);
 return {
   links:[1,2,3].map(i=>({
     title:String(data.get('title'+i)||''),
     url:String(data.get('url'+i)||''),
     slot:String(data.get('slot'+i)||'main'),
     align:String(data.get('align'+i)||'left')
   })),
   wishlistPublic:!!window.AURVEX_ID?.profile?.wishlist_public
 };
}
function readAboutDraft(form){
 const data=new FormData(form);
 return {bio:String(data.get('bio')||''),status:String(window.AURVEX_ID?.profile?.profile_status||'building')};
}
function captureAbout(event){
 const form=event.target?.closest?.('#profile-about-form');
 if(!form||!isSecure())return;
 m.aboutDraft=readAboutDraft(form);m.aboutDraftUser=owner();
 const indicator=form.closest('.profile-about-editor')?.querySelector('.profile-about-count');
 if(indicator)indicator.textContent=m.aboutDraft.bio.length+' / 240';
}
const knownEmoji=new Set(['','😀','😎','💻','🎮','🔥','💜','✨','🚀','🌙','🎧','🛠️','☕','💤','❤️','🌸','👾','🧠','🎨','✅','💬']);
const durations=new Set(['30m','1h','4h','1d','7d','never']);
function readCustomStatusDraft(form){
 const data=new FormData(form);
 return {text:String(data.get('custom_text')||''),emoji:String(data.get('custom_emoji')||''),
   duration:String(data.get('duration')||'1d')};
}
function captureCustomStatus(event){
 const form=event.target?.closest?.('#profile-custom-status-form');
 if(!form||!isSecure()||m.busy)return;
 m.customDraft=readCustomStatusDraft(form);m.customDraftUser=owner();
 const count=form.querySelector('.profile-status-char-count');
 if(count)count.textContent=m.customDraft.text.length+'/80';
}
document.addEventListener('input',captureCustomStatus);
document.addEventListener('change',captureCustomStatus);
document.addEventListener('input',captureAbout);
document.addEventListener('change',captureAbout);
document.addEventListener('input',event=>{
 const form=event.target?.closest?.('#social-profile-form');
 if(!form||!isSecure())return;
 m.socialDraft=readSocialDraft(form);m.draftUserId=owner();
});
document.addEventListener('change',event=>{
 const form=event.target?.closest?.('#social-profile-form');
 if(!form||!isSecure())return;
 m.socialDraft=readSocialDraft(form);m.draftUserId=owner();
});
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!form||!['social-profile-form','family-create-form','wishlist-privacy-form','profile-about-form','profile-custom-status-form'].includes(form.id))return;
 event.preventDefault();if(!isSecure()||m.busy)return;
 // Read data before any notification could rerender and detach this form.
 const originalUser=owner();
 const data=new FormData(form);
 if(form.id==='profile-custom-status-form'){
   m.customDraft=readCustomStatusDraft(form);m.customDraftUser=originalUser;
   const draft=m.customDraft;
   if(draft.text.trim().length>80||!knownEmoji.has(draft.emoji)||!durations.has(draft.duration)){
     message('profileStatusInvalid',true);return;
   }
   m.busy=true;
   const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
   void(async()=>{
     try{
       const updated=await saveCustomProfileStatus(draft.text.trim(),draft.emoji,draft.duration);
       if(owner()!==originalUser)return;
       window.AURVEX_ID.profile={...(window.AURVEX_ID.profile||{}),
          profile_status_text:updated.text,profile_status_emoji:updated.emoji,
          profile_status_expires_at:updated.expiresAt};
       m.customDraft=null;m.customDraftUser='';
       window.dispatchEvent(new CustomEvent('aurvex:id-state'));
       message('profileStatusSaved');
     }catch(error){
       if(owner()===originalUser){
         console.warn('AURVEX custom status update:',error?.code||'error');
         message('profileStatusSaveFailed',true);
       }
     }finally{if(m.busy){m.busy=false;fire()}}
   })();
 }else if(form.id==='profile-about-form'){
   m.aboutDraft=readAboutDraft(form);m.aboutDraftUser=originalUser;
   const bio=m.aboutDraft.bio.trim(),status=m.aboutDraft.status;
   if(bio.length>240||!['building','open','busy','chilling'].includes(status)){
     message('profileAboutInvalid',true);return;
   }
   m.busy=true;
   const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
   void(async()=>{
     try{
       const updated=await saveProfileAbout(bio,status);
       if(owner()!==originalUser)return;
       window.AURVEX_ID.profile={...(window.AURVEX_ID.profile||{}),
         profile_bio:updated.bio,profile_status:updated.status};
       m.aboutDraft=null;m.aboutDraftUser='';
       window.dispatchEvent(new CustomEvent('aurvex:id-state'));
       message('profileAboutSaved');
     }catch(error){
       if(owner()===originalUser){
        console.warn('AURVEX profile about update:',error?.code||'error');
        message('profileAboutFailed',true);
       }
     }finally{if(m.busy){m.busy=false;fire()}}
   })();
 }else if(form.id==='social-profile-form'){
   m.socialDraft=readSocialDraft(form);m.draftUserId=originalUser;
   m.busy=true;
   const button=form.querySelector('[type="submit"]');
   if(button)button.disabled=true;
   void (async()=>{
     try{
       const links=normalizePublicLinks(m.socialDraft.links);
       const updated=await saveSocialProfile(originalUser,links,m.socialDraft.wishlistPublic);
       if(owner()!==originalUser)return;
       m.socialDraft=null;m.draftUserId='';
       window.AURVEX_ID.profile=updated;
       window.dispatchEvent(new CustomEvent('aurvex:id-state'));
       message('socialSaved');
     }catch(error){
       console.warn('AURVEX profile link saving failed:',error?.code||error?.message||'unknown');
       const isValidation=String(error?.message||'').startsWith('LINK_');
       message(isValidation?'socialInvalid':'socialSaveFailed',true);
     }finally{
       if(m.busy){m.busy=false;fire()}
     }
   })();
 }else if(form.id==='wishlist-privacy-form'){
   m.busy=true;
   const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
   void(async()=>{try{
     const updated=await saveWishlistVisibility(originalUser,data.has('wishlist_public'));
     if(owner()!==originalUser)return;
     window.AURVEX_ID.profile=updated;window.dispatchEvent(new CustomEvent('aurvex:id-state'));
     message('socialSaved');
   }catch(error){console.warn('Wishlist save:',error?.code||'error');message('socialSaveFailed',true)}
   finally{if(m.busy){m.busy=false;fire()}}
   })();
 }else{
   m.busy=true;fire();
   void (async()=>{
     try{
       const name=String(data.get('family_name')||'').trim();
       if(name.length<3||name.length>40)throw new Error('Invalid family name');
       await createFamily(name);m.inviteUrl='';
       await refreshFamily();message('familyCreated');
     }catch(error){
       console.warn('AURVEX family creation failed:',error?.code||'error');
       message('familyActionError',true);
     }
   })();
 }
});
document.addEventListener('click',event=>{
 const emojiButton=event.target.closest?.('[data-profile-emoji]');
 if(emojiButton){
   const form=emojiButton.closest('#profile-custom-status-form');
   if(!form||!isSecure()||m.busy)return;
   const emoji=emojiButton.dataset.profileEmoji;
   if(!knownEmoji.has(emoji))return;
   const hidden=form.querySelector('[name="custom_emoji"]');
   if(hidden)hidden.value=emoji;
   form.querySelectorAll('[data-profile-emoji]').forEach(button=>{
     const active=button.dataset.profileEmoji===emoji;
     button.classList.toggle('is-selected',active);
     button.setAttribute('aria-pressed',String(active));
   });
   const preview=form.querySelector('.profile-status-input-emoji');
   if(preview)preview.textContent=emoji||'💬';
   m.customDraft=readCustomStatusDraft(form);m.customDraftUser=owner();
   return;
 }
 const clear=event.target.closest?.('[data-profile-clear-status]');
 if(clear){
   if(!isSecure()||m.busy)return;
   const who=owner();
   m.busy=true;
   void(async()=>{
     try{
       const updated=await saveCustomProfileStatus('','','never');
       if(owner()!==who)return;
       window.AURVEX_ID.profile={...(window.AURVEX_ID.profile||{}),
         profile_status_text:updated.text,profile_status_emoji:updated.emoji,
         profile_status_expires_at:updated.expiresAt};
       m.customDraft=null;m.customDraftUser='';
       window.dispatchEvent(new CustomEvent('aurvex:id-state'));
       message('profileStatusCleared');
     }catch(error){
       if(owner()===who){
        console.warn('AURVEX status clear:',error?.code||'error');
        message('profileStatusSaveFailed',true);
       }
     }finally{if(m.busy){m.busy=false;fire()}}
   })();
   return;
 }
 const btn=event.target.closest('[data-social-action]');
 if(!btn)return;
 const action=btn.dataset.socialAction;
 if(action==='copy-profile'){
  if(!owner())return;
  const url=new URL('./',document.baseURI).href.split('#')[0]+'#/player/'+owner();
  void navigator.clipboard?.writeText(url).then(()=>message('socialCopied')).catch(()=>message('socialCopyFailed',true));return;
 }
 if(action==='copy-invite'){
  if(m.inviteUrl)void navigator.clipboard?.writeText(m.inviteUrl).then(()=>message('familyLinkCopied')).catch(()=>message('socialCopyFailed',true));return;
 }
 if(action==='move-link-up'||action==='move-link-down'){
   if(!isSecure()||m.busy)return;
   const form=document.getElementById('social-profile-form');
   if(!form)return;
   const draft=readSocialDraft(form);
   const index=Number(btn.dataset.index)-1;
   const other=index+(action==='move-link-up'?-1:1);
   if(!Number.isInteger(index)||index<0||index>2||other<0||other>2)return;
   [draft.links[index],draft.links[other]]=[draft.links[other],draft.links[index]];
   m.socialDraft=draft;m.draftUserId=owner();fire();return;
 }
 if(!isSecure()||m.busy)return;
 if(['family-leave','family-kick'].includes(action)){
  if(!window.confirm('Confirm this family membership change?'))return;
 }
 m.busy=true;fire();
 void(async()=>{
  try{
   if(action==='family-invite'){
    const token=await createFamilyInvite();
    m.inviteUrl=new URL('./',document.baseURI).href.split('#')[0]+'#/family?invite='+encodeURIComponent(token);
    message('familyInviteMade');
   }else if(action==='family-join'){
    const token=(new URLSearchParams((location.hash.split('?')[1]||''))).get('invite')||'';
    if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Bad invite token');
    await joinFamily(token);
    // Remove sensitive invitation token from browser navigation history.
    location.replace('#/family');m.inviteUrl='';await refreshFamily();message('familyJoined');
   }else if(action==='family-leave'){
    await leaveFamily();m.inviteUrl='';await refreshFamily();message('familyLeft');
   }else if(action==='family-kick'){
    const id=btn.dataset.memberId;
    if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid player');
    await removeFamilyMember(id);await refreshFamily();message('familyRemoved');
   }else if(action==='family-share'){
    const game=btn.dataset.game;
    if(!/^[a-z0-9_-]{1,80}$/.test(game||''))throw new Error('Invalid game');
    const enabled=btn.dataset.enabled!=='true';
    await setFamilyShare(game,enabled);await refreshFamily();message('familyShareSaved');
   }
  }catch(e){console.warn('AURVEX Family action',e?.code||'error');message('familyActionError',true)}
 })();
});
window.addEventListener('focus',()=>{
 const player=location.hash.match(/^#\/player\/([0-9a-f-]{36})(?:\?|$)/i);
 if(player)void showProfile(player[1]);
 if(location.hash.startsWith('#/family')&&isSecure()&&!m.busy)void refreshFamily();
});
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'&&location.hash.startsWith('#/family')&&isSecure()&&!m.busy)void refreshFamily();
});
onRoute();
