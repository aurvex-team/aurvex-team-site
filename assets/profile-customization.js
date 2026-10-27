// Safe visual presets — no user-supplied CSS, HTML, fonts or arbitrary colors.
export const PROFILE_DEFAULTS=Object.freeze({
 font:'system',avatar_frame:'violet',profile_frame:'none',glow_color:'violet',
 profile_theme:'galaxy',inner_color:'violet',transparent:false,
 glow_avatar:false,glow_banner:false,glow_name:false,glow_links:false,glow_profile:false
});
const choices={
 font:['system','modern','rounded','mono','serif'],
 profile_theme:['galaxy','summer','winter','aurora','neon'],
 inner_color:['rose','violet','blue','gold'],
 avatar_frame:['none','violet','red','cyan','emerald','gold'],
 profile_frame:['none','violet','red','cyan','emerald','gold'],
 glow_color:['violet','red','cyan','emerald','gold']
};
const booleanKeys=['glow_avatar','glow_banner','glow_name','glow_links','glow_profile','transparent'];
export function normalizeAppearance(raw={}){
 if(raw===null||typeof raw!=='object'||Array.isArray(raw))throw new Error('INVALID_APPEARANCE');
 const result={...PROFILE_DEFAULTS};
 for(const [key,value] of Object.entries(raw)){
  if(Object.hasOwn(choices,key)){
   if(!choices[key].includes(value))throw new Error('INVALID_APPEARANCE');
   result[key]=value;
  }else if(booleanKeys.includes(key)){
   if(typeof value!=='boolean')throw new Error('INVALID_APPEARANCE');
   result[key]=value;
  }else{throw new Error('INVALID_APPEARANCE')}
 }
 return result;
}
export function visibleTeamTitles(titles,hidden){
 const available=Array.isArray(titles)?titles:[];
 const off=Array.isArray(hidden)?hidden:[];
 return available.filter(code=>['aurvex_ceo','site_launcher_developer'].includes(code)&&!off.includes(code));
}
export function normalizeHiddenTitles(hidden,owned){
 if(!Array.isArray(hidden)||!Array.isArray(owned))throw new Error('INVALID_TITLES');
 const known=['aurvex_ceo','site_launcher_developer'];
 if(hidden.some(x=>!known.includes(x)||!owned.includes(x)))throw new Error('INVALID_TITLES');
 return [...new Set(hidden)];
}
