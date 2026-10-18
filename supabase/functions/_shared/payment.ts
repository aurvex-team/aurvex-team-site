// Shared payment helpers: secrets remain exclusively in Supabase Edge Functions.
export const allowOrigin=(request:Request)=>{
 const origin=request.headers.get('origin')||'';
 return origin==='https://aurvex-team.github.io'||origin==='http://localhost:8080' ? origin:'';
};
export function cors(req:Request){
 const origin=allowOrigin(req);
 return {'Access-Control-Allow-Origin':origin||'https://aurvex-team.github.io',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Vary':'Origin','Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store'};
}
export const json=(r:Request,data:unknown,status=200)=>new Response(JSON.stringify(data),
 {status,headers:cors(r)});
export function env(key:string){return Deno.env.get(key)||'';}
export function enabled(){return env('AURVEX_PAYMENTS_ENABLED')==='true';}
export function publicKey(){
 const legacy=env('SUPABASE_ANON_KEY');
 if(legacy)return legacy;
 try{
  const keys=JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS'));
  const result=Object.values(keys).find(v=>typeof v==='string');
  return typeof result==='string'?result:'';
 }catch{return ''}
}
export function adminKey(){
 if(env('SUPABASE_SERVICE_ROLE_KEY'))return env('SUPABASE_SERVICE_ROLE_KEY');
 try{
  const keys=JSON.parse(env('SUPABASE_SECRET_KEYS'));
  const result=Object.values(keys).find(v=>typeof v==='string');
  return typeof result==='string'?result:'';
 }catch{return ''}
}
export async function postRpc(name:string,input:object,key:string,authorization?:string){
 const url=env('SUPABASE_URL')+'/rest/v1/rpc/'+name;
 const headers:Record<string,string>={'Content-Type':'application/json','apikey':key};
 if(authorization)headers['Authorization']=authorization;
 else if(key.split('.').length===3)headers['Authorization']='Bearer '+key;
 const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(input),
  signal:AbortSignal.timeout(12000)});
 const data=await response.json().catch(()=>({message:'Database error'}));
 if(!response.ok)throw new Error('RPC_'+String(data?.code||response.status));
 return data;
}
export async function digest(hexType:'SHA-1'|'SHA-256',value:string){
 const digest=await crypto.subtle.digest(hexType,new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function fondySignature(obj:Record<string,unknown>,secret:string){
 const pairs=Object.entries(obj).filter(([k,v])=>k!=='signature'&&k!=='response_signature_string'
  &&v!==null&&v!==undefined&&v!==''&&typeof v!=='object');
 pairs.sort(([a],[b])=>a<b?-1:a>b?1:0);
 return digest('SHA-1',secret+'|'+pairs.map(([,v])=>String(v)).join('|'));
}
export function safeEqual(a:string,b:string){
 if(a.length!==b.length||a.length!==40)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
export function gatewayCurrencies(){
 const raw=env('AURVEX_FONDY_CURRENCIES')||'UAH';
 return new Set(raw.split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z]{3}$/.test(x)));
}
