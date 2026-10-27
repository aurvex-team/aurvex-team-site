// Weekly Stars rewards: the database decides eligibility and amount.
import {idClient} from './id-service.js?v=20261027-001';
const state={loading:false,busy:false,data:null,message:'',error:false};
window.AURVEX_WEEKLY_REWARDS=state;
const isRewardsRoute=()=>location.hash==='#/free'||location.hash==='#/rewards';
const notify=()=>window.dispatchEvent(new CustomEvent('aurvex:weekly-state'));
async function refresh(){
 if(!isRewardsRoute())return;
 const id=window.AURVEX_ID;
 if(!id?.user?.id||id.mfaVerified!==true){
  state.loading=false;state.data=null;state.message='';state.error=false;notify();return;
 }
 state.loading=true;state.message='';state.error=false;notify();
 try{
  const client=await idClient();
  const {data,error}=await client.rpc('aurvex_weekly_star_reward_state');
  if(error)throw error;
  state.data=data||null;
 }catch(error){
  state.data=null;state.message='error';state.error=true;
  console.warn('Weekly Stars state:',error?.code||'unavailable');
 }finally{state.loading=false;notify()}
}
document.addEventListener('click',async event=>{
 const button=event.target.closest?.('[data-weekly-action="claim"]');
 if(!button||state.busy)return;
 if(!window.AURVEX_ID?.user?.id){location.hash='#/id';return}
 if(window.AURVEX_ID?.mfaVerified!==true){location.hash='#/id';return}
 state.busy=true;state.message='';state.error=false;notify();
 try{
  const client=await idClient();
  const {error}=await client.rpc('aurvex_weekly_star_claim');
  if(error)throw error;
  await refresh();
  state.message='claimed';state.error=false;
 }catch(error){
  const code=String(error?.message||error?.code||'');
  state.message=code.includes('WEEKLY_REWARD_WALLET_LIMIT')?'wallet':code.includes('WEEKLY_REWARD_ALREADY_CLAIMED')?'claimed':'error';
  state.error=true;
  console.warn('Weekly Stars claim:',error?.code||'unavailable');
 }finally{state.busy=false;notify()}
});
window.addEventListener('hashchange',()=>void refresh());
window.addEventListener('aurvex:id-state',()=>void refresh());
if(isRewardsRoute())void refresh();
