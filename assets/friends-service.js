// AURVEX Friends v1: strict Supabase RPC adapter.
// Only nickname, optional public avatar and relationship status are exposed.
// All RPC functions verify Auth JWT AAL2 on the database server.
import { idClient,profileMediaUrl } from './id-service.js?v=20261018-391';
export async function listFriends(){
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_friends_list');
  if(error)throw error;
  return (data||[]).map(item=>({...item,avatarUrl:profileMediaUrl(item.avatar_path)}));
}
export async function findPlayers(nickname){
  const query=String(nickname||'').trim();
  if(!/^[A-Za-z0-9_]{3,24}$/.test(query))return [];
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_search_players',{search_text:query});
  if(error)throw error;
  return data||[];
}
export async function sendFriendRequest(playerId){
  const client=await idClient();
  const {error}=await client.rpc('aurvex_friend_send',{target_player:playerId});
  if(error)throw error;
}
export async function respondFriendRequest(playerId,action){
  if(!['accept','decline','cancel','remove'].includes(action))throw new Error('Invalid action');
  const client=await idClient();
  const {error}=await client.rpc('aurvex_friend_action',{other_player:playerId,action});
  if(error)throw error;
}
