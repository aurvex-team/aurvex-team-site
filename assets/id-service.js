// Auth adapter: all credentials are managed by Supabase Auth, never this website.
// Static site clients only use the public publishable key and auth.uid() RLS.
// PINNED SDK VERSION: change deliberately and retest before upgrading.
import { ID_CONFIG,isIdConfigured } from './id-config.js?v=20261017-380';
const SUPABASE_SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.56.1/+esm';
let clientPromise;
export async function idClient(){
  if(!isIdConfigured())throw new Error('AURVEX_ID_NOT_CONFIGURED');
  if(!clientPromise)clientPromise=import(SUPABASE_SDK).then(async({createClient})=>{
    const desktop=typeof window.AURVEX_DESKTOP?.session==='function';
    const client=createClient(ID_CONFIG.supabaseUrl,ID_CONFIG.supabasePublishableKey,{
      auth:{flowType:'pkce',detectSessionInUrl:!desktop,persistSession:!desktop,autoRefreshToken:!desktop}
    });
    if(desktop){
      const session=await window.AURVEX_DESKTOP.session();
      if(session?.access_token&&session?.refresh_token){
        const {error}=await client.auth.setSession(session);
        if(error)throw error;
      }
    }
    return client;
  }).catch(err=>{clientPromise=null;throw err});
  return clientPromise;
}
export function idReturnUrl(){
  // Keep the nonce-protected desktop pairing context across OAuth/OTP redirects.
  const callback=new URL('id.html',document.baseURI);
  const current=new URL(window.location.href);
  if(current.searchParams.get('desktopPairing')==='1'){
    for(const key of ['desktopPairing','port','nonce']){
      const value=current.searchParams.get(key);
      if(value)callback.searchParams.set(key,value);
    }
  }
  return callback.href.split('#')[0];
}
export async function requestEmailCode(email,register){
  const client=await idClient();
  return client.auth.signInWithOtp({
    email,
    options:{shouldCreateUser:!!register,emailRedirectTo:idReturnUrl()}
  });
}
export async function verifyEmailCode(email,token){
  const client=await idClient();
  return client.auth.verifyOtp({email,token,type:'email'});
}
export async function beginGoogleLogin(){
  const client=await idClient();
  return client.auth.signInWithOAuth({
    provider:'google',options:{redirectTo:idReturnUrl()}
  });
}
export async function currentVerifiedUser(){
  const client=await idClient();
  const {data,error}=await client.auth.getUser();
  if(error)throw error;
  return data.user;
}
// Official team title codes are read-only public metadata. The browser can
// never assign titles: RLS and table grants permit SELECT only.
const TEAM_TITLE_CODES=['aurvex_ceo','site_launcher_developer'];
const validPlayerId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'');
export async function getProfileTitles(userId){
  if(!validPlayerId(userId))return [];
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_visible_titles',{target_player:userId});
  if(error)throw error;
  return (Array.isArray(data)?data:[]).filter(code=>TEAM_TITLE_CODES.includes(code));
}
export async function getOwnProfileTitles(userId){
  if(!validPlayerId(userId))return [];
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_own_titles');
  if(error)throw error;
  return (Array.isArray(data)?data:[]).filter(code=>TEAM_TITLE_CODES.includes(code));
}
export async function getPublicAppearance(userId){
  if(!validPlayerId(userId))return {};
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_public_appearance',{target_player:userId});
  if(error)throw error;
  return data||{};
}
export async function ownProfile(userId){
  const client=await idClient();
  const {data,error}=await client.from('id_profiles')
    .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').eq('id',userId).maybeSingle();
  if(error)throw error;
  return data;
}
export async function ensureOwnProfile(client,userId){
  // INSERT ... ON CONFLICT DO NOTHING. Do not overwrite an existing nickname
  // or avatar/banner when the user's first profile field is saved.
  const {error}=await client.from('id_profiles')
    .upsert({id:userId},{onConflict:'id',ignoreDuplicates:true});
  if(error)throw error;
}
export async function saveOwnNickname(userId,nickname){
  const client=await idClient();
  await ensureOwnProfile(client,userId);
  const {data,error}=await client.from('id_profiles')
    .update({nickname}).eq('id',userId)
    .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').single();
  return {data,error};
}
// Server wishlist is authoritative for signed-in accounts. In particular,
// NEVER merge stale localStorage into server on page load: it resurrects items
// deleted from another device.
export async function getOwnWishlist(userId){
  const client=await idClient();
  const {data,error}=await client.from('id_wishlist')
    .select('product_id').eq('user_id',userId).eq('product_id','devive').maybeSingle();
  if(error)throw error;
  return !!data;
}
export async function claimDeviveToLibrary(){
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_claim_devive');
  if(error)throw error;
  return data;
}
export function subscribeOwnWishlist(userId,onChange){
  let channel=null;
  let closed=false;
  const promise=idClient().then(client=>{
    if(closed)return;
    channel=client.channel('aurvex-wishlist-'+userId+'-'+crypto.randomUUID())
      .on('postgres_changes',{
        event:'*',schema:'public',table:'id_wishlist',filter:'user_id=eq.'+userId
      },()=>onChange())
      .subscribe();
  }).catch(err=>console.warn('AURVEX wishlist subscription:',err?.message||'failed'));
  return async()=>{
    closed=true;
    await promise;
    if(channel){const client=await idClient();await client.removeChannel(channel)}
  };
}
export async function setOwnWishlist(userId,wished){
  const client=await idClient();
  if(wished){
    const {error}=await client.from('id_wishlist')
      .upsert({user_id:userId,product_id:'devive'},{onConflict:'user_id,product_id',ignoreDuplicates:true});
    if(error)throw error;
  }else{
    const {error}=await client.from('id_wishlist')
      .delete().eq('user_id',userId).eq('product_id','devive');
    if(error)throw error;
  }
}


// User media is public-by-design (avatars and banners shown on profiles).
// Never upload private images, EXIF/location-sensitive photos, SVG or HTML.
const MEDIA_BUCKET='aurvex-profile-media';
export function profileMediaUrl(path){
  if(!path||typeof path!=='string')return '';
  const base=ID_CONFIG.supabaseUrl.replace(/\/$/,'');
  return base+'/storage/v1/object/public/'+MEDIA_BUCKET+'/'+
    path.split('/').map(encodeURIComponent).join('/');
}
export async function uploadProfileMedia(userId,kind,file,existingPath){
  if(!['avatar','banner'].includes(kind))throw new Error('Invalid media field');
  if(!file||!file.type)throw new Error('Invalid image');
  const extMap={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
  const extension=extMap[file.type];
  const maxBytes=kind==='avatar'?3*1024*1024:8*1024*1024;
  if(!extension||(kind==='avatar'&&extension==='gif')||file.size<1||file.size>maxBytes){
    throw new Error('Invalid image size or type');
  }
  const client=await idClient();
  // Never reuse media object URLs: changing a banner won't leave stale CDN cache.
  const path=userId+'/'+kind+'-'+crypto.randomUUID()+'.'+extension;
  const {error:uploadError}=await client.storage.from(MEDIA_BUCKET).upload(path,file,{
    contentType:file.type,cacheControl:'3600',upsert:false
  });
  if(uploadError)throw uploadError;
  const column=kind==='avatar'?'avatar_path':'banner_path';
  await ensureOwnProfile(client,userId);
  const {data,error}=await client.from('id_profiles')
    .update({[column]:path}).eq('id',userId)
    .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').single();
  if(error){
    await client.storage.from(MEDIA_BUCKET).remove([path]).catch(()=>{});
    throw error;
  }
  // Only delete files previously stored for this account; user-controlled paths
  // cannot escape their own prefix.
  if(existingPath&&existingPath.startsWith(userId+'/'+kind+'-')&&existingPath!==path){
    await client.storage.from(MEDIA_BUCKET).remove([existingPath]).catch(()=>{});
  }
  return data;
}
export async function removeProfileMedia(userId,kind,existingPath){
  if(!['avatar','banner'].includes(kind))throw new Error('Invalid media field');
  const client=await idClient();
  const column=kind==='avatar'?'avatar_path':'banner_path';
  await ensureOwnProfile(client,userId);
  const {data,error}=await client.from('id_profiles')
    .update({[column]:null}).eq('id',userId)
    .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').single();
  if(error)throw error;
  if(existingPath&&existingPath.startsWith(userId+'/'+kind+'-')){
    await client.storage.from(MEDIA_BUCKET).remove([existingPath]).catch(()=>{});
  }
  return data;
}

 
// Supabase validates the authenticator code server-side. Never save an MFA
// secret in localStorage, a profile row or GitHub.
export async function getMfaState(){
  const client=await idClient();
  const [{data:aal,error:aalError},{data:factors,error:factorsError}]=await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors()
  ]);
  if(aalError)throw aalError;
  if(factorsError)throw factorsError;
  const verified=(factors?.totp||[]).filter(f=>f.status==='verified');
  return {
    verified:aal?.currentLevel==='aal2'&&verified.length>0,
    hasFactors:verified.length>0,
    verifiedFactors:verified,
    currentLevel:aal?.currentLevel||'aal1',
    nextLevel:aal?.nextLevel||'aal1'
  };
}
export async function beginMfaEnrollment(label='AURVEX Authenticator'){
  const client=await idClient();
  const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:label});
  if(error)throw error;
  return {
    factorId:data.id,
    // Supabase-generated QR is used directly as an image URL.
    qr:data.totp?.qr_code||'',
    secret:data.totp?.secret||''
  };
}
export async function verifyMfaCode(factorId,code){
  const client=await idClient();
  const {data,error}=await client.auth.mfa.challenge({factorId});
  if(error)throw error;
  const verified=await client.auth.mfa.verify({factorId,challengeId:data.id,code});
  if(verified.error)throw verified.error;
  return verified.data;
}
