// Public profile viewer + AURVEX Family controller; all family mutations require server AAL2.
import {loadPlayerProfile,saveSocialProfile,saveProfileAppearance,getFamilyOverview,createFamily,
 createFamilyInvite,joinFamily,leaveFamily,removeFamilyMember,setFamilyShare,getFamilyLibrary}
 from './social-service.js?v=20261017-395';
import {normalizePublicLinks} from './social-links.js?v=20261017-394';
import {normalizeAppearance,normalizeHiddenTitles} from './profile-customization.js?v=20261018-380';

const m={profile:null,profileLoading:false,profileTarget:'',profileError:false,
 family:null,familyLibrary:[],familyReady:false,familyLoading:false,
 inviteUrl:'',busy:false,message:'',error:false,userId:'',
 socialDraft:null,draftUserId:'',appearanceDraft:null,appearanceUserId:''};
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
   if(m.userId||m.draftUserId||m.appearanceUserId){m.userId='';m.family=null;m.familyLibrary=[];
     m.familyReady=false;m.inviteUrl='';m.message='';m.socialDraft=null;m.draftUserId='';m.appearanceDraft=null;m.appearanceUserId='';fire();}
 }else if((m.userId&&m.userId!==current)||(m.draftUserId&&m.draftUserId!==current)||(m.appearanceUserId&&m.appearanceUserId!==current)){
   m.userId=current;m.family=null;m.familyReady=false;m.inviteUrl='';
   m.socialDraft=null;m.draftUserId='';m.appearanceDraft=null;m.appearanceUserId='';
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
   wishlistPublic:data.has('wishlist_public')
 };
}
function readAppearanceDraft(form){
 const data=new FormData(form);
 return {
   appearance:{
     font:String(data.get('font')||'system'),
     avatar_frame:String(data.get('avatar_frame')||'violet'),
     profile_frame:String(data.get('profile_frame')||'none'),
     glow_color:String(data.get('glow_color')||'violet'),
     glow_avatar:data.has('glow_avatar'),glow_banner:data.has('glow_banner'),
     glow_name:data.has('glow_name'),glow_links:data.has('glow_links'),
     glow_profile:data.has('glow_profile')
   },
   hidden: (window.AURVEX_ID?.profileTitles||[])
      .filter(code=>['aurvex_ceo','site_launcher_developer'].includes(code)&&!data.has('show_'+code))
 };
}
document.addEventListener('input',event=>{
 const form=event.target?.closest?.('#social-profile-form');
 if(!form||!isSecure())return;
 m.socialDraft=readSocialDraft(form);m.draftUserId=owner();
});
document.addEventListener('input',event=>{
 const appearance=event.target?.closest?.('#profile-appearance-form');
 if(appearance&&isSecure()){
   m.appearanceDraft=readAppearanceDraft(appearance);m.appearanceUserId=owner();
 }
});
document.addEventListener('change',event=>{
 const form=event.target?.closest?.('#social-profile-form');
 if(!form||!isSecure())return;
 m.socialDraft=readSocialDraft(form);m.draftUserId=owner();
});
document.addEventListener('change',event=>{
 const appearance=event.target?.closest?.('#profile-appearance-form');
 if(appearance&&isSecure()){
   m.appearanceDraft=readAppearanceDraft(appearance);m.appearanceUserId=owner();
 }
 if(appearance)fire();
});
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!form||!['social-profile-form','family-create-form','profile-appearance-form'].includes(form.id))return;
 event.preventDefault();if(!isSecure()||m.busy)return;
 // Read data before any notification could rerender and detach this form.
 const originalUser=owner();
 const data=new FormData(form);
 if(form.id==='social-profile-form'){
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
 }else if(form.id==='profile-appearance-form'){
   const draft=readAppearanceDraft(form);
   m.appearanceDraft=draft;m.appearanceUserId=originalUser;
   m.busy=true;
   const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
   void (async()=>{
     try{
       const appearance=normalizeAppearance(draft.appearance);
       const hidden=normalizeHiddenTitles(draft.hidden,window.AURVEX_ID?.profileTitles||[]);
       const updated=await saveProfileAppearance(originalUser,appearance,hidden);
       if(owner()!==originalUser)return;
       m.appearanceDraft=null;m.appearanceUserId='';
       window.AURVEX_ID.profile=updated;
       window.dispatchEvent(new CustomEvent('aurvex:id-state'));
       message('customSaved');
     }catch(error){
       console.warn('AURVEX appearance saving failed:',error?.code||error?.message||'unknown');
       message('customSaveFailed',true);
     }finally{if(m.busy){m.busy=false;fire()}}
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
