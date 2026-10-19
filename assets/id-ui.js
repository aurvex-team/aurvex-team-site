// AURVEX ID client, version 3.3: Google identity, profile art, server-owned wishlist.
// OAuth secrets never appear in the browser. Supabase RLS owns authorization.
import { translations } from './i18n.js?v=20261018-391';
import { ID_CONFIG,isIdConfigured } from './id-config.js?v=20261017-360';
import {
 idClient,requestEmailCode,verifyEmailCode,beginGoogleLogin,
 currentVerifiedUser,ownProfile,saveOwnNickname,getOwnWishlist,setOwnWishlist,
 subscribeOwnWishlist,profileMediaUrl,uploadProfileMedia,removeProfileMedia,
 getMfaState,beginMfaEnrollment,verifyMfaCode,getOwnProfileTitles
} from './id-service.js?v=20261019-494';

const model={user:null,profile:null,avatarUrl:'',bannerUrl:'',pendingEmail:'',statusKey:'',statusError:false,busy:false,ready:false,
 mfaVerified:false,mfaHasFactors:false,mfaFactors:[],mfaEnrollment:null,
 profileTitles:[],
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

const desktopPairing=(()=>{
 const params=new URLSearchParams(location.search);
 const port=Number(params.get('port')),nonce=params.get('nonce')||'';
 return location.origin==='https://aurvex-team.github.io'&&params.get('desktopPairing')==='1'&&
  Number.isInteger(port)&&port>=1024&&port<=65535&&/^[a-f0-9]{64}$/.test(nonce)?{port,nonce}:null;
})();
let desktopPairingBusy=false,desktopPairingDone=false,lastDesktopPairingState='';
const desktopPairingNotice=desktopPairing?document.createElement('div'):null;
const desktopPairingMessages={
 en:{waiting:'Sign in to your AURVEX ID to connect this launcher.','mfa-required':'Complete the 2FA check to connect your launcher.','mfa-setup-required':'Set up 2FA in Profile → Security, then retry.','connecting':'Connecting your verified AURVEX ID to the launcher…',success:'Connected! Returning to AURVEX Launcher…',failed:'Could not connect to the launcher. Return to it and retry.'},
 uk:{waiting:'Увійди в AURVEX ID, щоб підключити лаунчер.','mfa-required':'Підтверди 2FA, щоб підключити лаунчер.','mfa-setup-required':'Налаштуй 2FA у Профілі → Безпека й повтори спробу.','connecting':'Підключаю підтверджений AURVEX ID до лаунчера…',success:'Підключено! Повертаюся до AURVEX Launcher…',failed:'Не вдалося підключити лаунчер. Повернись до нього й повтори спробу.'},
 pl:{waiting:'Zaloguj się do AURVEX ID, aby połączyć launcher.','mfa-required':'Dokończ weryfikację 2FA, aby połączyć launcher.','mfa-setup-required':'Skonfiguruj 2FA w Profil → Bezpieczeństwo i spróbuj ponownie.','connecting':'Łączenie potwierdzonego AURVEX ID z launcherem…',success:'Połączono! Powrót do AURVEX Launcher…',failed:'Nie udało się połączyć launchera. Wróć do niego i spróbuj ponownie.'},
 de:{waiting:'Melde dich bei deiner AURVEX ID an, um den Launcher zu verbinden.','mfa-required':'Schließe die 2FA-Prüfung ab, um den Launcher zu verbinden.','mfa-setup-required':'Richte 2FA unter Profil → Sicherheit ein und versuche es erneut.','connecting':'Verbinde deine bestätigte AURVEX ID mit dem Launcher…',success:'Verbunden! Kehre zu AURVEX Launcher zurück…',failed:'Der Launcher konnte nicht verbunden werden. Kehre zurück und versuche es erneut.'}
};
if(desktopPairingNotice){
 desktopPairingNotice.setAttribute('role','status');desktopPairingNotice.setAttribute('aria-live','polite');
 Object.assign(desktopPairingNotice.style,{position:'fixed',zIndex:'2147483647',left:'50%',bottom:'20px',transform:'translateX(-50%)',maxWidth:'min(620px,calc(100vw - 32px))',padding:'14px 18px',border:'1px solid #8b6ac5',borderRadius:'12px',background:'#211933',color:'#f6edff',font:'600 14px/1.5 system-ui,sans-serif',boxShadow:'0 8px 30px #0008',textAlign:'center'});
 document.body.append(desktopPairingNotice);
}
function showDesktopPairingState(state){
 if(!desktopPairingNotice)return;
 const language=document.documentElement.lang||'en';
 desktopPairingNotice.textContent=desktopPairingMessages[language]?.[state]||desktopPairingMessages.en[state]||desktopPairingMessages.en.failed;
}
async function reportDesktopPairing(state){
 if(!desktopPairing||state===lastDesktopPairingState)return;
 lastDesktopPairingState=state;
 showDesktopPairingState(state);
 try{await fetch(`http://127.0.0.1:${desktopPairing.port}/status`,{method:'POST',mode:'cors',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce:desktopPairing.nonce,state}),signal:AbortSignal.timeout(4000)})}catch{}
}
async function connectDesktopPairing(){
 if(!desktopPairing||desktopPairingBusy||desktopPairingDone)return;
 desktopPairingBusy=true;
 try{
  const client=await idClient();
  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session){void reportDesktopPairing('waiting');return}
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError||!user||!user.email_confirmed_at){void reportDesktopPairing('waiting');return}
  const {data:levels,error:levelError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(levelError)throw levelError;
  if(levels.currentLevel!=='aal2'){
   void reportDesktopPairing(levels.nextLevel==='aal2'?'mfa-required':'mfa-setup-required');return;
  }
  const accessToken=typeof session.access_token==='string'?session.access_token:'';
  const refreshToken=typeof session.refresh_token==='string'?session.refresh_token:'';
  if(accessToken.length<=50||refreshToken.length<20)throw new Error('The verified AURVEX session is incomplete. Sign in again.');
  void reportDesktopPairing('connecting');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let response;
  try{response=await fetch(`http://127.0.0.1:${desktopPairing.port}/connect`,{method:'POST',mode:'cors',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce:desktopPairing.nonce,
   access_token:accessToken,refresh_token:refreshToken}),signal:controller.signal})}
  finally{clearTimeout(timeout)}
  const result=await response.json().catch(()=>({}));
  if(!response.ok||result.ok!==true)throw new Error(String(result.error||'Desktop connection failed.'));
  desktopPairingDone=true;
  showDesktopPairingState('success');
  const clean=new URL(location.href);
  clean.searchParams.delete('desktopPairing');clean.searchParams.delete('port');clean.searchParams.delete('nonce');
  history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
 }catch(error){
  void reportDesktopPairing('failed');
  showDesktopPairingState('failed');
  status('idSessionError',true);
  console.warn('AURVEX desktop pairing failed:',error?.code||error?.name||'failed');
 }finally{desktopPairingBusy=false}
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
      model.profileTitles=[];
      clearWishlistSubscription();
      model.ready=true;model.statusKey='';notify();void reportDesktopPairing('waiting');return;
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
      model.profileTitles=[];
      // No profile or wishlist query is made before the second factor succeeds.
      updateProfile(null);clearWishlistSubscription();
      model.ready=true;model.statusKey='';notify();void reportDesktopPairing(mfa.hasFactors?'mfa-required':'mfa-setup-required');return;
    }
    // Verified aal2 session: private account data is now readable under RLS.
    // Server is authoritative: never re-upload an old local wishlist snapshot.
    const [profile,wished,titles]=await Promise.all([
      ownProfile(user.id),getOwnWishlist(user.id),getOwnProfileTitles(user.id)
    ]);
    if(revision!==profileReloadToken||model.user?.id!==user.id)return;
    updateProfile(profile);
    model.profileTitles=titles;
    if(!pendingWishlistWrites)broadcastWishlist(wished);
    await activateWishlist(user.id);
    model.ready=true;model.statusKey='';notify();void connectDesktopPairing();
  }catch(error){
    if(revision!==profileReloadToken)return;
    model.ready=true;model.user=null;updateProfile(null);
    model.mfaVerified=false;model.mfaHasFactors=false;model.mfaFactors=[];model.mfaEnrollment=null;
    model.profileTitles=[];
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
      model.profileTitles=[];
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
window.AURVEX_DESKTOP?.onSession(async tokens => {
  try {
    const client = await idClient();
    const { error } = await client.auth.setSession(tokens);
    if (error) throw error;
    await reload();
  } catch (error) {
    fail(error, 'idSessionError');
  }
});

if(desktopPairing){
  window.addEventListener('focus',()=>void connectDesktopPairing());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void connectDesktopPairing()});
  setInterval(()=>void connectDesktopPairing(),4000);
}

void initialize();
