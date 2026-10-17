// AURVEX ID client, version 3.3: Google identity, profile art, server-owned wishlist.
// OAuth secrets never appear in the browser. Supabase RLS owns authorization.
import { translations } from './i18n.js?v=20261017-394';
import { ID_CONFIG,isIdConfigured } from './id-config.js?v=20261017-360';
import {
 idClient,requestEmailCode,verifyEmailCode,beginGoogleLogin,
 currentVerifiedUser,ownProfile,saveOwnNickname,getOwnWishlist,setOwnWishlist,
 subscribeOwnWishlist,profileMediaUrl,uploadProfileMedia,removeProfileMedia,
 getMfaState,beginMfaEnrollment,verifyMfaCode
} from './id-service.js?v=20261017-380';

const model={user:null,profile:null,avatarUrl:'',bannerUrl:'',pendingEmail:'',statusKey:'',statusError:false,busy:false,ready:false,
 mfaVerified:false,mfaHasFactors:false,mfaFactors:[],mfaEnrollment:null,
 configured:isIdConfigured()&&(ID_CONFIG.emailEnabled||ID_CONFIG.googleEnabled),
 emailEnabled:ID_CONFIG.emailEnabled,googleEnabled:ID_CONFIG.googleEnabled};
window.AURVEX_ID=model;
if(window.location.pathname.endsWith('/id.html')&&!window.location.hash)window.location.hash='#/id';

const t=key=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
const notify=()=>window.dispatchEvent(new CustomEvent('aurvex:id-state'));
let stopWishlistSubscription=null;
let activeUserId='';
let pendingWishlistWrites=0;
let wishlistQueue=Promise.resolve();
let profileReloadToken=0;

function status(key,error=false){
  model.statusKey=key;model.statusError=error;model.busy=false;notify();
}
function fail(error,key){
  // Do not leak Auth provider responses or private account details in the UI.
  console.warn('AURVEX ID operation failed:',error?.code||error?.name||'unknown');
  status(key,true);
}
function updateProfile(profile){
  model.profile=profile||null;
  model.avatarUrl=profileMediaUrl(profile?.avatar_path);
  model.bannerUrl=profileMediaUrl(profile?.banner_path);
}
function broadcastWishlist(wished){
  window.dispatchEvent(new CustomEvent('aurvex:sync-wishlist',{detail:{wished}}));
}
async function readRemoteWishlist(userId){
  if(!userId||model.user?.id!==userId||!model.mfaVerified||pendingWishlistWrites)return;
  try{
    const wished=await getOwnWishlist(userId);
    if(model.user?.id!==userId||pendingWishlistWrites)return;
    broadcastWishlist(wished);
  }catch(error){
    console.warn('AURVEX wishlist refresh failed:',error?.code||'failed');
  }
}
async function activateWishlist(userId){
  if(activeUserId===userId)return;
  if(stopWishlistSubscription){
    const stop=stopWishlistSubscription;stopWishlistSubscription=null;void stop();
  }
  activeUserId=userId;
  stopWishlistSubscription=subscribeOwnWishlist(userId,()=>void readRemoteWishlist(userId));
}
function clearWishlistSubscription(){
  activeUserId='';
  if(stopWishlistSubscription){
    const stop=stopWishlistSubscription;stopWishlistSubscription=null;void stop();
  }
}
async function reload(){
  const revision=++profileReloadToken;
  try{
    const client=await idClient();
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    if(!sessionData?.session){
      model.user=null;updateProfile(null);model.pendingEmail='';
      model.mfaVerified=false;model.mfaHasFactors=false;model.mfaFactors=[];model.mfaEnrollment=null;
      clearWishlistSubscription();
      model.ready=true;model.statusKey='';notify();return;
    }
    const user=await currentVerifiedUser();
    if(revision!==profileReloadToken)return;
    if(!user)throw new Error('No verified account');
    model.user=user;model.pendingEmail='';
    const mfa=await getMfaState();
    if(revision!==profileReloadToken||model.user?.id!==user.id)return;
    model.mfaVerified=mfa.verified;
    model.mfaHasFactors=mfa.hasFactors;
    model.mfaFactors=mfa.verifiedFactors;
    if(!mfa.verified){
      // No profile or wishlist query is made before the second factor succeeds.
      updateProfile(null);clearWishlistSubscription();
      model.ready=true;model.statusKey='';notify();return;
    }
    // Verified aal2 session: private account data is now readable under RLS.
    // Server is authoritative: never re-upload an old local wishlist snapshot.
    const [profile,wished]=await Promise.all([
      ownProfile(user.id),getOwnWishlist(user.id)
    ]);
    if(revision!==profileReloadToken||model.user?.id!==user.id)return;
    updateProfile(profile);
    if(!pendingWishlistWrites)broadcastWishlist(wished);
    await activateWishlist(user.id);
    model.ready=true;model.statusKey='';notify();
  }catch(error){
    if(revision!==profileReloadToken)return;
    model.ready=true;model.user=null;updateProfile(null);
    model.mfaVerified=false;model.mfaHasFactors=false;model.mfaFactors=[];model.mfaEnrollment=null;
    clearWishlistSubscription();
    fail(error,'idSessionError');
  }
}
async function initialize(){
  if(!isIdConfigured()||(!ID_CONFIG.emailEnabled&&!ID_CONFIG.googleEnabled)){
    model.ready=true;notify();return;
  }
  try{
    const client=await idClient();
    client.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED'){
        queueMicrotask(()=>{void reload()});
      }
    });
    await reload();
  }catch(error){fail(error,'idOperationError')}
}
document.addEventListener('submit',async function(event){
  const form=event.target;
  if(!form?.id||!['id-email-form','id-code-form','id-nickname-form','id-mfa-form'].includes(form.id))return;
  event.preventDefault();
  if(!isIdConfigured()){status('idProviderUnavailable',true);return}
  if(model.busy)return;
  model.busy=true;
  if(form.id==='id-email-form'){
    if(!ID_CONFIG.emailEnabled){status('idProviderUnavailable',true);return}
    const email=String(new FormData(form).get('email')||'').trim().toLowerCase();
    const register=form.dataset.mode==='register';
    if(!/^[^\s@]{1,64}@[^\s@]{1,253}$/.test(email)||email.length>254){
      status('idEmailEnter',true);return;
    }
    try{
      const {error}=await requestEmailCode(email,register);
      if(error)throw error;
      model.pendingEmail=email;status('idEmailSent');
    }catch(error){fail(error,'idOperationError')}
  }else if(form.id==='id-code-form'){
    const code=String(new FormData(form).get('otp')||'').trim();
    if(!/^[0-9]{6}$/.test(code)){status('idCodeInvalid',true);return}
    if(!model.pendingEmail){status('idEmailEnter',true);return}
    try{
      const {error}=await verifyEmailCode(model.pendingEmail,code);
      if(error)throw error;
      model.pendingEmail='';
      await reload();
    }catch(error){fail(error,'idCodeInvalid')}
  }else if(form.id==='id-nickname-form'){
    if(!model.user||!model.mfaVerified){status('mfaRequired',true);return}
    const nickname=String(new FormData(form).get('nickname')||'').trim();
    if(!/^[A-Za-z0-9_]{3,24}$/.test(nickname)){status('idProfileError',true);return}
    try{
      const {data,error}=await saveOwnNickname(model.user.id,nickname);
      if(error)throw error;
      updateProfile(data);status('idProfileSaved');
    }catch(error){fail(error,'idProfileError')}
  }else if(form.id==='id-mfa-form'){
    if(!model.user){status('idSessionError',true);return}
    const code=String(new FormData(form).get('code')||'').trim();
    if(!/^[0-9]{6}$/.test(code)){status('mfaInvalidCode',true);return}
    const factorId=model.mfaEnrollment?.factorId||model.mfaFactors[0]?.id;
    if(!factorId){status('mfaSetupError',true);return}
    try{
      await verifyMfaCode(factorId,code);
      model.mfaEnrollment=null;
      // The server issues an aal2 JWT; recheck with Supabase.
      await reload();
      status('mfaVerifiedSuccess');
    }catch(error){fail(error,'mfaInvalidCode')}
  }
});
document.addEventListener('change',async function(event){
  const input=event.target;
  if(!['id-avatar-upload','id-banner-upload'].includes(input?.id))return;
  const file=input.files?.[0],userId=model.user?.id;
  if(!file||!userId||!model.mfaVerified||model.busy)return;
  const kind=input.id==='id-avatar-upload'?'avatar':'banner';
  const extAllowed=kind==='avatar'?['image/jpeg','image/png','image/webp']:['image/jpeg','image/png','image/webp','image/gif'];
  const maxBytes=kind==='avatar'?3*1024*1024:8*1024*1024;
  if(!extAllowed.includes(file.type)||file.size<1||file.size>maxBytes){
    status(kind==='avatar'?'idAvatarInvalid':'idBannerInvalid',true);
    return;
  }
  model.busy=true;model.statusKey='idUploading';model.statusError=false;notify();
  const previous=kind==='avatar'?model.profile?.avatar_path:model.profile?.banner_path;
  try{
    const profile=await uploadProfileMedia(userId,kind,file,previous);
    if(model.user?.id!==userId)return;
    updateProfile(profile);
    status(kind==='avatar'?'idAvatarSaved':'idBannerSaved');
  }catch(error){fail(error,'idUploadFailed')}
});
document.addEventListener('click',async function(event){
  const button=event.target.closest('[data-id-action]');
  if(!button)return;
  const action=button.dataset.idAction;
  if(action==='google'){
    if(!isIdConfigured()||!ID_CONFIG.googleEnabled){status('idProviderUnavailable',true);return}
    if(model.busy)return;
    model.busy=true;
    try{const {error}=await beginGoogleLogin();if(error)throw error}
    catch(error){fail(error,'idOperationError')}
  }else if(action==='signout'){
    if(!isIdConfigured()||model.busy)return;
    model.busy=true;
    try{
      const client=await idClient();
      const {error}=await client.auth.signOut({scope:'local'});
      if(error)throw error;
      ++profileReloadToken;
      model.user=null;updateProfile(null);model.pendingEmail='';
      model.mfaVerified=false;model.mfaHasFactors=false;model.mfaFactors=[];model.mfaEnrollment=null;
      clearWishlistSubscription();status('idSignedOut');
    }catch(error){fail(error,'idOperationError')}
  }else if(action==='mfa-start'||action==='mfa-backup'){
    if(!model.user||model.busy)return;
    if(action==='mfa-backup'&&(!model.mfaVerified||model.mfaFactors.length>=2)){
      status('mfaSetupError',true);return;
    }
    if(action==='mfa-start'&&model.mfaHasFactors){status('mfaRequired',true);return}
    model.busy=true;notify();
    try{
      model.mfaEnrollment=await beginMfaEnrollment(action==='mfa-backup'?'AURVEX Backup':'AURVEX Authenticator');
      status('mfaScan');
    }catch(error){fail(error,'mfaSetupError')}
  }else if(action==='mfa-cancel-backup'){
    if(!model.mfaVerified||!model.mfaEnrollment)return;
    const factorId=model.mfaEnrollment.factorId;
    model.mfaEnrollment=null;
    const client=await idClient();
    void client.auth.mfa.unenroll({factorId}).catch(()=>{});
    status('');
  }else if(action==='change-email'){
    model.pendingEmail='';status('');
  }else if(action==='xoni'){
    status('idProviderUnavailable',true);
  }else if(action==='remove-avatar'||action==='remove-banner'){
    if(!model.user||!model.mfaVerified||model.busy)return;
    const kind=action==='remove-avatar'?'avatar':'banner',userId=model.user.id;
    const previous=kind==='avatar'?model.profile?.avatar_path:model.profile?.banner_path;
    if(!previous)return;
    model.busy=true;model.statusKey='idUploading';notify();
    try{
      const profile=await removeProfileMedia(userId,kind,previous);
      if(model.user?.id!==userId)return;
      updateProfile(profile);
      status('idMediaRemoved');
    }catch(error){fail(error,'idUploadFailed')}
  }
});
window.addEventListener('aurvex:wishlist-changed',function(event){
  const userId=model.user?.id;
  if(!userId||!isIdConfigured()||!model.mfaVerified)return;
  const wished=event.detail?.wished===true;
  pendingWishlistWrites++;
  // Serialize rapid toggles so the LAST action wins on the server.
  wishlistQueue=wishlistQueue.catch(()=>{}).then(async()=>{
    await setOwnWishlist(userId,wished);
  }).catch(error=>{
    console.warn('AURVEX wishlist write failed:',error?.code||'failed');
    status('idWishlistError',true);
  }).finally(()=>{
    pendingWishlistWrites--;
    if(pendingWishlistWrites===0)void readRemoteWishlist(userId);
  });
});
window.addEventListener('focus',()=>{if(activeUserId)void readRemoteWishlist(activeUserId)});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&activeUserId)void readRemoteWishlist(activeUserId);
});
// Realtime delivers most changes instantly; polling is a fail-safe if a browser,
// proxy or mobile network drops the websocket. Avoid background traffic in hidden tabs.
setInterval(()=>{
  if(document.visibilityState==='visible'&&activeUserId)void readRemoteWishlist(activeUserId);
},30000);
void initialize();
