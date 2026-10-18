// Official AURVEX Desktop pairing page. Runs only at aurvex-team.github.io.
// Session tokens go directly to a randomly authenticated loopback connection.
import {idClient} from './id-service.js?v=20261018-391';
const params=new URLSearchParams(location.hash.slice(1));
const port=Number(params.get('port'));
const nonce=params.get('nonce')||'';
const ok=location.origin==='https://aurvex-team.github.io'&&Number.isInteger(port)&&port>=1024&&port<=65535&&/^[a-f0-9]{64}$/.test(nonce);
const status=document.getElementById('status'),button=document.getElementById('connect');
function say(message){status.textContent=message}
let approved=null;
async function check(){
 if(!ok){say('Invalid or expired connection link. Start again from your AURVEX Desktop Launcher.');button.disabled=true;return}
 button.disabled=true;
 try{
  const client=await idClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user||!user.email_confirmed_at){say('Sign in on the official AURVEX site, verify your email and return here.');return}
  const {data:levels,error:levelError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(levelError||levels.currentLevel!=='aal2'){say('You are signed in, but 2FA is not completed. Complete it on the AURVEX site, then press Check again.');return}
  approved=user.id;button.disabled=false;
  say('Ready to connect: '+(user.user_metadata?.preferred_username||'your verified AURVEX Profile')+'. Confirm only if you opened the launcher yourself.');
 }catch(e){say('Could not confirm your AURVEX session. Check the internet and try again.');console.warn('Pairing check unavailable')}
}
button.addEventListener('click',async()=>{
 if(!ok||!approved)return;
 button.disabled=true;say('Connecting securely to the launcher on this computer…');
 try{
  const client=await idClient();const {data:{session},error}=await client.auth.getSession();
  if(error||!session||session.user?.id!==approved)throw Error('Session changed. Retry verification.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  let res;
  try{res=await fetch('http://127.0.0.1:'+port+'/connect',{method:'POST',mode:'cors',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,
     access_token:session.access_token,refresh_token:session.refresh_token}),signal:controller.signal});}
  finally{clearTimeout(timeout)}
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.ok!==true)throw Error(String(data.error||'Connection failed.'));
  approved=null;say('✓ Connected successfully! Return to AURVEX Launcher. You may close this tab.');
 }catch(e){say('Could not connect: '+String(e.message||'Connection failed')+'. Retry from the launcher if pairing expired.');}
});
document.getElementById('check').addEventListener('click',()=>void check());
void check();
