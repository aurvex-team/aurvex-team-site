// Public-facing AURVEX profiles and family membership are isolated from Google/Auth secrets.
import {idClient,profileMediaUrl,ensureOwnProfile,getProfileTitles} from './id-service.js?v=20261018-391';
import {loadPublicShopEquipped} from './shop-service.js?v=20261018-391';
export async function loadPlayerProfile(id){
 const client=await idClient();
 const [{data,error},titles,shopEquipped,about]=await Promise.all([
   client.rpc('aurvex_public_profile',{target_player:id}),
   getProfileTitles(id),loadPublicShopEquipped(id),
   client.rpc('aurvex_public_profile_about',{target_player:id}).then(({data})=>data||{}).catch(()=>({}))
 ]);
 if(error)throw error;
 const p=(data||[])[0]||null;
 return p?{...p,profile_bio:String(about?.bio||''),profile_status:String(about?.status||'building'),
   profile_status_text:String(about?.customText||''),profile_status_emoji:String(about?.customEmoji||''),
   profile_status_expires_at:about?.customExpiresAt||null,
    profileTitles:titles,shop_equipped:shopEquipped,avatarUrl:profileMediaUrl(p.avatar_path),
   bannerUrl:profileMediaUrl(p.banner_path)}:null;
}
export async function saveCustomProfileStatus(text,emoji,duration){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_profile_set_custom_status',{
   new_text:text,new_emoji:emoji,duration
 });
 if(error)throw error;
 return data;
}
export async function saveProfileAbout(bio,status){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_profile_save_about',{new_bio:bio,new_status:status});
 if(error)throw error;
 return data;
}
export async function saveSocialProfile(userId,links,wishlistPublic){
 const client=await idClient();
 await ensureOwnProfile(client,userId);
 const {data,error}=await client.from('id_profiles')
   .update({public_links:links,wishlist_public:!!wishlistPublic}).eq('id',userId)
   .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').single();
 if(error)throw error;
 return data;
}
export async function saveWishlistVisibility(userId,visible){
 const client=await idClient();await ensureOwnProfile(client,userId);
 const {data,error}=await client.from('id_profiles').update({wishlist_public:!!visible}).eq('id',userId)
  .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public,profile_appearance,hidden_title_codes,profile_bio,profile_status,profile_status_text,profile_status_emoji,profile_status_expires_at').single();
 if(error)throw error;return data;
}
export async function getFamilyOverview(){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_family_overview');
 if(error)throw error;
 return data;
}
export async function createFamily(name){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_family_create',{family_name:name});
 if(error)throw error;return data;
}
export async function createFamilyInvite(){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_family_new_invite');
 if(error)throw error;return data;
}
export async function joinFamily(token){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_family_join',{invite_token:token});
 if(error)throw error;return data;
}
export async function leaveFamily(){
 const client=await idClient();
 const {error}=await client.rpc('aurvex_family_leave');
 if(error)throw error;
}
export async function removeFamilyMember(playerId){
 const client=await idClient();
 const {error}=await client.rpc('aurvex_family_remove_member',{target_player:playerId});
 if(error)throw error;
}
export async function setFamilyShare(productId,on){
 const client=await idClient();
 const {error}=await client.rpc('aurvex_family_share',{product:productId,share_on:!!on});
 if(error)throw error;
}
export async function getFamilyLibrary(){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_family_access');
 if(error)throw error;return data||[];
}
