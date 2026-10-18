// AURVEX Social 3.7: isolated, server-verified opt-in presence and inbox.
import {idClient,profileMediaUrl} from './id-service.js?v=20261018-381';
async function rpc(name,args){
 const client=await idClient();
 const {data,error}=await client.rpc(name,args);
 if(error)throw error;
 return data;
}
export async function socialSnapshot(){
 const result=await rpc('aurvex_social_snapshot');
 return {
  showOnline:result?.show_online===true,
  onlineIds:Array.isArray(result?.online_friends)?result.online_friends:[],
  blocked:Array.isArray(result?.blocked)?result.blocked:[],
  notifications:Array.isArray(result?.notifications)?result.notifications.map(n=>({
   ...n,avatarUrl:profileMediaUrl(n.avatar_path)
  })):[]
 };
}
export const socialShowOnline=enabled=>rpc('aurvex_social_set_visibility',{enable_online:!!enabled});
export const socialHeartbeat=()=>rpc('aurvex_social_heartbeat');
export const socialBlock=(id,on)=>rpc('aurvex_social_block',{target_player:id,block_on:!!on});
export const socialRead=id=>rpc('aurvex_social_mark_read',{notification_id:id});
export const socialFamilyInvite=friendId=>rpc('aurvex_social_invite_friend',{target_friend:friendId});
export const socialOpenInvite=id=>rpc('aurvex_social_open_invite',{notification_id:id});
export const socialCanInvite=()=>rpc('aurvex_social_can_invite');
