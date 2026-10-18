// AURVEX Points Shop client. Only reads public catalog and calls AAL2-gated
// server RPCs. Never calculates or writes wallets, items, or payment receipts.
import {idClient} from './id-service.js?v=20261018-390';
export async function loadShopCatalog(){
 const client=await idClient();
 const {data,error}=await client.from('aurvex_shop_items')
  .select('id,kind,theme,price_points,price_uah_kop').eq('active',true).order('price_points');
 if(error)throw error;return data||[];
}
export async function loadShopState(){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_shop_state');
 if(error)throw error;return data||{};
}
export async function buyShopItemPoints(itemId){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_shop_buy_points',{product:itemId});
 if(error)throw error;return data;
}
export async function equipShopItem(itemId,kind){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_shop_equip',{product:itemId,kind_requested:kind});
 if(error)throw error;return data;
}
export async function loadPublicShopEquipped(playerId){
 const client=await idClient();
 const {data,error}=await client.rpc('aurvex_shop_public_equipped',{target_player:playerId});
 if(error)throw error;return data||{avatar:null,profile:null};
}
