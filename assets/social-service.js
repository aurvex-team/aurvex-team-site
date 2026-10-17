// Public-facing AURVEX profiles and family membership are isolated from Google/Auth secrets.
import {idClient,profileMediaUrl,ensureOwnProfile,getProfileTitles} from './id-service.js?v=20261017-395';
export async function loadPlayerProfile(id){
 const client=await idClient();
 const [{data,error},titles]=await Promise.all([
   client.rpc('aurvex_public_profile',{target_player:id}),
   getProfileTitles(id)
 ]);
 if(error)throw error;
 const p=(data||[])[0]||null;
 return p?{...p,profileTitles:titles,avatarUrl:profileMediaUrl(p.avatar_path),
   bannerUrl:profileMediaUrl(p.banner_path)}:null;
}
export async function saveSocialProfile(userId,links,wishlistPublic){
 const client=await idClient();
 await ensureOwnProfile(client,userId);
 const {data,error}=await client.from('id_profiles')
   .update({public_links:links,wishlist_public:!!wishlistPublic}).eq('id',userId)
   .select('nickname,avatar_path,banner_path,created_at,public_links,wishlist_public').single();
 if(error)throw error;
 return data;
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
