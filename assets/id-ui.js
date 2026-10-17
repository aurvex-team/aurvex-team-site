// AURVEX ID browser controller. No secret is stored in this repository.
// Auth buttons remain disabled until a separate AURVEX auth project is ready.
import { translations } from './i18n.js?v=20261017-310';
import { ID_CONFIG,isIdConfigured } from './id-config.js';
import {
 idClient,requestEmailCode,verifyEmailCode,beginGoogleLogin,
 currentVerifiedUser,ownProfile,saveOwnNickname,syncOwnWishlist,setOwnWishlist
} from './id-service.js';

const model={user:null,profile:null,pendingEmail:'',statusKey:'',statusError:false,busy:false,ready:false,
 configured:isIdConfigured(),emailEnabled:ID_CONFIG.emailEnabled,googleEnabled:ID_CONFIG.googleEnabled};
window.AURVEX_ID=model;
const t=(key)=>translations[document.documentElement.lang]?.[key]||translations.en[key]||key;
const notify=()=>window.dispatchEvent(new CustomEvent('aurvex:id-state'));

function status(key,error=false){
  model.statusKey=key;model.statusError=error;model.busy=false;notify();
}
function fail(error,fallback){
  // Don't echo server error messages to the user: email/account enumeration
  // and sensitive provider details should never enter the public UI.
  console.warn('AURVEX ID operation:',error?.code||error?.name||'failed');
  status(fallback,true);
}
async function reload(){
  try{
    const client=await idClient();
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    if(!sessionData?.session){
      model.user=null;model.profile=null;model.pendingEmail='';
      model.ready=true;model.statusKey='';notify();return;
    }
    const user=await currentVerifiedUser();
    model.user=user;
    model.profile=null;
    model.pendingEmail='';
    if(user){
      const [profile,wished]=await Promise.all([
        ownProfile(user.id),
        syncOwnWishlist(user.id,localStorage.getItem('aurvex.wishlist.devive')==='1')
      ]);
      model.profile=profile;
      window.dispatchEvent(new CustomEvent('aurvex:sync-wishlist',{detail:{wished}}));
    }
    model.ready=true;model.statusKey='';notify();
  }catch(error){
    model.ready=true;model.user=null;model.profile=null;
    fail(error,'idSessionError');
  }
}
async function initialize(){
  if(!isIdConfigured()){model.ready=true;notify();return}
  try{
    const client=await idClient();
    client.auth.onAuthStateChange((event)=>{
      if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED'){
        // Avoid additional Supabase queries inside the auth event callback.
        queueMicrotask(()=>{reload()});
      }
    });
    await reload();
  }catch(error){fail(error,'idOperationError')}
}
document.addEventListener('submit',async function(event){
  const form=event.target;if(!form?.id||!['id-email-form','id-code-form','id-nickname-form'].includes(form.id))return;
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
    if(!model.user){status('idSessionError',true);return}
    const nickname=String(new FormData(form).get('nickname')||'').trim();
    if(!/^[A-Za-z0-9_]{3,24}$/.test(nickname)){status('idProfileError',true);return}
    try{
      const {data,error}=await saveOwnNickname(model.user.id,nickname);
      if(error)throw error;
      model.profile=data;status('idProfileSaved');
    }catch(error){fail(error,'idProfileError')}
  }
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
    if(!isIdConfigured())return;
    if(model.busy)return;
    model.busy=true;
    try{
      const client=await idClient();
      const {error}=await client.auth.signOut({scope:'local'});
      if(error)throw error;
      model.user=null;model.profile=null;model.pendingEmail='';
      status('idSignedOut');
    }catch(error){fail(error,'idOperationError')}
  }else if(action==='change-email'){
    model.pendingEmail='';status('');
  }else if(action==='xoni'){
    // Explicitly unavailable: never accept an XONI password or token here.
    status('idProviderUnavailable',true);
  }
});
window.addEventListener('aurvex:wishlist-changed',async function(event){
  if(!model.user||!isIdConfigured())return;
  try{await setOwnWishlist(model.user.id,event.detail?.wished===true)}
  catch(error){console.warn('AURVEX ID wishlist sync unsuccessful:',error?.code||'failed')}
});
initialize();
