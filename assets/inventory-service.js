// Inventory RPC adapter. Only the Supabase backend can grant or transfer items.
import {idClient} from './id-service.js?v=20261018-391';
async function call(name,args){
 const db=await idClient();const {data,error}=await db.rpc(name,args);
 if(error)throw error;return data;
}
export const inventoryState=()=>call('aurvex_inventory_state');
export const peerItems=target_player=>call('aurvex_trade_peer_items',{target_player});
export const createTrade=(target_player,offered,requested)=>call('aurvex_trade_create',{
 target_player,offered_kind:offered.kind,offered_ref:offered.ref,requested_kind:requested.kind,requested_ref:requested.ref
});
export const tradeAction=(offer_id,decision)=>call('aurvex_trade_action',{offer_id,decision});
