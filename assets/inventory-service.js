// Inventory RPC adapter. Only the Supabase backend can grant or transfer items.
import {idClient} from './id-service.js?v=20261018-391';
async function call(name,args){
 const db=await idClient();const {data,error}=await db.rpc(name,args);
 if(error)throw error;return data;
}
export const inventoryState=()=>call('aurvex_inventory_state');
export const peerItems=target_player=>call('aurvex_trade_peer_items',{target_player});
// All selected items are passed as an immutable snapshot; an empty request means a gift.
export const createTrade=(target_player,offered_items,requested_items)=>call('aurvex_trade_create_bundle',{
 target_player,offered_items,requested_items
});
export const tradeAction=(offer_id,decision)=>call('aurvex_trade_action',{offer_id,decision});
