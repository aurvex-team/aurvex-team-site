// Auth adapter: all credentials are managed by Supabase Auth, never this website.
// Static site clients only use the public publishable key and auth.uid() RLS.
// PINNED SDK VERSION: change deliberately and retest before upgrading.
import { ID_CONFIG,isIdConfigured } from './id-config.js?v=20261017-320';
const SUPABASE_SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.56.1/+esm';
let clientPromise;
export async function idClient(){
  if(!isIdConfigured())throw new Error('AURVEX_ID_NOT_CONFIGURED');
  if(!clientPromise)clientPromise=import(SUPABASE_SDK).then(({createClient})=>
    createClient(ID_CONFIG.supabaseUrl,ID_CONFIG.supabasePublishableKey,{
      auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}
    })
  ).catch(err=>{clientPromise=null;throw err});
  return clientPromise;
}
export function idReturnUrl(){
  // Point OAuth and email verification at a normal HTTPS page; PKCE "code"
  // returns in URL query parameters, NOT the hash used by our SPA routes.
  return new URL('id.html',document.baseURI).href.split('#')[0];
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
export async function ownProfile(userId){
  const client=await idClient();
  const {data,error}=await client.from('id_profiles')
    .select('nickname').eq('id',userId).maybeSingle();
  if(error)throw error;
  return data;
}
export async function saveOwnNickname(userId,nickname){
  const client=await idClient();
  const {data,error}=await client.from('id_profiles')
    .upsert({id:userId,nickname},{onConflict:'id'}).select('nickname').single();
  return {data,error};
}
export async function syncOwnWishlist(userId,localSaved){
  const client=await idClient();
  if(localSaved){
    const {error}=await client.from('id_wishlist')
      .upsert({user_id:userId,product_id:'devive'},{onConflict:'user_id,product_id',ignoreDuplicates:true});
    if(error)throw error;
  }
  const {data,error}=await client.from('id_wishlist')
    .select('product_id').eq('user_id',userId).eq('product_id','devive').maybeSingle();
  if(error)throw error;
  return !!data;
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
