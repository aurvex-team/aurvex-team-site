// Official AURVEX Desktop pairing page. Runs only at aurvex-team.github.io.
// The verified session is sent only over loopback so the desktop can refresh it
// and initialize the same website account inside its isolated Electron session.
import {idClient} from './id-service.js?v=20261019-401';
const params=new URLSearchParams(location.hash.slice(1));
const port=Number(params.get('port'));
const nonce=params.get('nonce')||'';
const autoConnect=params.get('auto')==='1';
const ok=location.origin==='https://aurvex-team.github.io'&&Number.isInteger(port)&&port>=1024&&port<=65535&&/^[a-f0-9]{64}$/.test(nonce);
const status=document.getElementById('status'),button=document.getElementById('connect');
function say(message){status.textContent=message}
let lastReported=null;
async function report(state){
 if(!ok||state===lastReported)return;lastReported=state;
 try{await fetch(`http://127.0.0.1:${port}/status`,{method:'POST',mode:'cors',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,state}),signal:AbortSignal.timeout(4000)})}
 catch{}
}
let approved=null,checking=false,sending=false,autoAttempted=false;
async function check(){
 if(!ok){say('Invalid or expired connection link. Start again from your AURVEX Desktop Launcher.');button.disabled=true;return}
 if(checking||sending)return;
 checking=true;
 button.disabled=true;
 try{
  const client=await idClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user||!user.email_confirmed_at){void report('waiting');say('Sign in on the official AURVEX site, verify your email and return here.');return}
  const {data:levels,error:levelError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(levelError){void report('failed');say('Could not check your AURVEX security status. Refresh this page and try again.');return}
  if(levels.currentLevel!=='aal2'){
   const state=levels.nextLevel==='aal2'?'mfa-required':'mfa-setup-required';void report(state);
   say(state==='mfa-required'?'Google sign-in worked. Complete the 2FA prompt on the AURVEX ID page; this page will connect automatically.':'Google sign-in worked, but this account has no verified 2FA yet. Open Profile → Security on the AURVEX site, set up an authenticator, then start Connect Profile again.');return
  }
  approved=user.id;button.disabled=false;
  say('Ready to connect: '+(user.user_metadata?.preferred_username||'your verified AURVEX Profile')+'. Confirm only if you opened the launcher yourself.');
  if(autoConnect&&!autoAttempted){autoAttempted=true;void report('connecting');queueMicrotask(()=>button.click())}
 }catch(e){void report('failed');say('Could not confirm your AURVEX session. Check the internet, sign in on the AURVEX ID tab, then return here.');console.warn('Pairing check unavailable')}
 finally{checking=false}
}
button.addEventListener('click',async()=>{
 if(!ok||!approved||sending)return;
 sending=true;void report('connecting');
 button.disabled=true;say('Connecting securely to the launcher on this computer…');
 try{
  const client=await idClient();
  // Keep the valid browser session if refresh is already running in the separate ID tab.
  const {data:{session:current},error:currentError}=await client.auth.getSession();
  if(currentError||!current||current.user?.id!==approved)throw Error('Your browser session changed. Sign in again, then retry.');
  let session=current;
  try{
   const refreshed=await client.auth.refreshSession();
   const candidate=refreshed?.data?.session;
   if(!refreshed?.error&&candidate&&typeof candidate.access_token==='string'&&candidate.access_token.length>50)session=candidate;
  }catch{}
  const accessToken=typeof session.access_token==='string'?session.access_token:'';
  const refreshToken=typeof session.refresh_token==='string'&&session.refresh_token.length>=20?session.refresh_token:
   (typeof current.refresh_token==='string'&&current.refresh_token.length>=20?current.refresh_token:'');
  if(accessToken.length<=50)throw Error('AURVEX did not return an access token. Sign in again on the ID tab, then retry.');
  if(!refreshToken)throw Error('AURVEX did not return a refresh token. Sign in again on the ID tab, then retry.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let res;
  try{res=await fetch(`http://127.0.0.1:${port}/connect`,{method:'POST',mode:'cors',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,
     access_token:accessToken,refresh_token:refreshToken}),signal:controller.signal});}
  finally{clearTimeout(timeout)}
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.ok!==true)throw Error(String(data.error||'Connection failed.'));
  approved=null;say('✓ Connected successfully! Return to AURVEX Launcher. You may close this tab.');
 }catch(e){void report('failed');const message=String(e.message||'').replace(/[.]+$/,'');say(/failed to fetch|networkerror|aborterror/i.test(message)?
  'Could not reach the launcher on this computer. Keep it open, close this tab, and start Connect Profile again.':
  'Connection failed: '+message+'. Keep the launcher open and retry from its Profile screen.');}
 finally{sending=false;if(approved&&ok)button.disabled=false}
});
window.addEventListener('focus',()=>void check());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check()});
void check();
setInterval(()=>{if((autoConnect||!document.hidden)&&!approved)void check()},7000);
