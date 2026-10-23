import { translations, supportedLanguages } from './i18n.js?v=20261023-623';

const repoUrl='https://github.com/aurvex-team/aurvex-team-site';
const sceneUrl='./assets/devive-scene.svg';
const galleryUrls=[sceneUrl,'./assets/devive-interior.svg','./assets/devive-hallway.svg'];
const STORAGE={locale:'aurvex.locale',currency:'aurvex.currency',fx:'aurvex.fx.v1',theme:'aurvex.theme',wish:'aurvex.wishlist.devive'};
function getStored(k){try{return localStorage.getItem(k)}catch{return null}}
function store(k,v){try{localStorage.setItem(k,v)}catch{/* Browsing still works without storage */}}
const state={
  language:supportedLanguages.includes(getStored(STORAGE.locale))?getStored(STORAGE.locale):'en',
  currency:['UAH','USD','EUR','GBP','PLN','CHF','CAD','AUD','JPY','CNY','KRW','SEK','NOK','DKK','CZK','HUF','RON','TRY','INR','BRL','MXN','AED','SAR','ILS','ZAR','SGD','HKD','NZD','THB','IDR','MYR','PHP','VND','KZT','GEL','MDL','AZN'].includes(getStored(STORAGE.currency))?getStored(STORAGE.currency):'UAH',
  theme:getStored(STORAGE.theme)==='light'?'light':'dark',
  wished:getStored(STORAGE.wish)==='1',
  query:'',sort:'featured',kind:'all',genre:'all',minPrice:'',maxPrice:'',releaseYear:'',profileTab:'overview',profileNicknameDraft:null,profileNicknameOwner:''
};
let toastTimer=0;
let notificationsOpen=false;
const pathIcons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2.2 5.2L9 15l2.2-5.2z"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9a7 7 0 0 1 12.1-2L20 12M4 12l2.2 5A7 7 0 0 0 18.3 15"/>',
 gamepad:'<path d="M6.5 8.5h11a4 4 0 0 1 3.9 3.1l.5 3.8a2.8 2.8 0 0 1-4.5 2.6l-2.2-1.8H8.8l-2.2 1.8a2.8 2.8 0 0 1-4.5-2.6l.5-3.8a4 4 0 0 1 3.9-3.1Z"/><path d="M7 12v4m-2-2h4m7-1h.01M19 15h.01"/>',
 apps:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 ban:'<circle cx="12" cy="12" r="9"/><path d="M5.7 5.7 18.3 18.3"/>',
 crown:'<path d="m2 7 5 4 5-7 5 7 5-4-2 12H4L2 7Z"/><path d="M4 22h16"/>',
 code:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4m-3-13-2 18"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9H8a3 3 0 1 1 3-3c.6 1.2 1 3 1 3Zm0 0h4a3 3 0 1 0-3-3c-.6 1.2-1 3-1 3Z"/>',
 heart:'<path d="M20.5 8.5c0 4.9-8.5 10.7-8.5 10.7S3.5 13.4 3.5 8.5a4.8 4.8 0 0 1 8.5-3.1 4.8 4.8 0 0 1 8.5 3.1Z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 close:'<path d="M5 5l14 14M19 5 5 19"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.9-7.1-1.5 1.5M6.4 17.6l-1.5 1.5m14.2 0-1.5-1.5M6.4 6.4 4.9 4.9"/>',
 moon:'<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
 arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
 arrowUp:'<path d="M5 19 19 5M8 5h11v11"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 sparkle:'<path d="m12 2 2.6 6.9L22 12l-7.4 3.1L12 22l-2.6-6.9L2 12l7.4-3.1z"/>',
 shield:'<path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="m9 12 2 2 4-4"/>',
 laptop:'<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M2 20h20"/>',
 tool:'<path d="M14 6a5 5 0 0 0-6.6 6.4l-5 5a2 2 0 0 0 2.8 2.8l5-5A5 5 0 0 0 16.6 8l-3 3-2.7-.7-.6-2.7z"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
 cloud:'<path d="M6 19H5a4 4 0 0 1 0-8 7 7 0 0 1 13.6-1.8A5 5 0 0 1 19 19h-1"/>',
 back:'<path d="M20 12H4m7 7-7-7 7-7"/>',
 book:'<path d="M3 4h8a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H3Zm18 0h-7a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h7Z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 5-6 13 0 18m0-18c6 5 6 13 0 18"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 eye:'<path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5-10 10"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
 pencil:'<path d="m4 20 4-.8 11.7-11.7a2 2 0 0 0-3-3L5 16.3 4 20z"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>',
 pin:'<path d="M12 22s7-7.1 7-13a7 7 0 0 0-14 0c0 5.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9H8a3 3 0 1 1 3-3c.6 1.2 1 3 1 3Zm0 0h4a3 3 0 1 0-3-3c-.6 1.2-1 3-1 3Z"/>',
 wallet:'<rect x="2.5" y="5" width="19" height="16" rx="3"/><path d="M2.5 9h19M15 14h6m-4 0h.1"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 message:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.9-.3-4-.9L3 21l1.9-5.5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h8m-8 4h5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>'
};
function icon(name,size=19){return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(pathIcons[name]||pathIcons.sparkle)+'</svg>'}
function t(key){return translations[state.language]?.[key]||translations.en[key]||key}
function esc(str){return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}

/* Display-currency preferences never affect the server's UAH prices or Points ledger. */
const currencyList=[
 ['UAH','🇺🇦','Ukrainian hryvnia'],['USD','🇺🇸','US dollar'],['EUR','🇪🇺','Euro'],
 ['GBP','🇬🇧','British pound'],['PLN','🇵🇱','Polish złoty'],['CHF','🇨🇭','Swiss franc'],
 ['CAD','🇨🇦','Canadian dollar'],['AUD','🇦🇺','Australian dollar'],['JPY','🇯🇵','Japanese yen'],
 ['CNY','🇨🇳','Chinese yuan'],['KRW','🇰🇷','South Korean won'],['SEK','🇸🇪','Swedish krona'],
 ['NOK','🇳🇴','Norwegian krone'],['DKK','🇩🇰','Danish krone'],['CZK','🇨🇿','Czech koruna'],
 ['HUF','🇭🇺','Hungarian forint'],['RON','🇷🇴','Romanian leu'],['TRY','🇹🇷','Turkish lira'],
 ['INR','🇮🇳','Indian rupee'],['BRL','🇧🇷','Brazilian real'],['MXN','🇲🇽','Mexican peso'],
 ['AED','🇦🇪','UAE dirham'],['SAR','🇸🇦','Saudi riyal'],['ILS','🇮🇱','Israeli shekel'],
 ['ZAR','🇿🇦','South African rand'],['SGD','🇸🇬','Singapore dollar'],['HKD','🇭🇰','Hong Kong dollar'],
 ['NZD','🇳🇿','New Zealand dollar'],['THB','🇹🇭','Thai baht'],['IDR','🇮🇩','Indonesian rupiah'],
 ['MYR','🇲🇾','Malaysian ringgit'],['PHP','🇵🇭','Philippine peso'],['VND','🇻🇳','Vietnamese đồng'],
 ['KZT','🇰🇿','Kazakhstani tenge'],['GEL','🇬🇪','Georgian lari'],['MDL','🇲🇩','Moldovan leu'],
 ['AZN','🇦🇿','Azerbaijani manat']
];
const currencyCodes=new Set(currencyList.map(x=>x[0]));
const walletPacks=[[50,5000],[100,10000],[250,25000],[500,50000],[1000,100000]];
function formatAccountBalance(kop){
 if(!Number.isSafeInteger(kop)||kop<0)return '— '+state.currency;
 const converted=kop===0?0:convertUah(kop/100);
 if(converted===null)return '— '+state.currency;
 return new Intl.NumberFormat(localeTags[state.language]||'en-US',{
  style:'currency',currency:state.currency,minimumFractionDigits:state.currency==='UAH'?2:undefined
 }).format(converted);
}

const localeTags={en:'en-US',uk:'uk-UA',pl:'pl-PL',de:'de-DE'};
const fxState={rates:{UAH:1},time:0,status:'loading'};
try{
 const cached=JSON.parse(getStored(STORAGE.fx)||'null');
 if(cached&&Number.isFinite(cached.time)&&Date.now()-cached.time<48*3600*1000&&cached.rates&&cached.rates.UAH===1){
   fxState.rates=cached.rates;fxState.time=cached.time;fxState.status='ready';
 }
}catch{/* Corrupt local data must not affect prices */ }
function currencyRate(){
 if(state.currency==='UAH')return 1;
 const rate=fxState.rates[state.currency];
 return Number.isFinite(rate)&&rate>0?rate:null;
}
function convertUah(amount){
 if(!Number.isFinite(amount)||amount<0)return null;
 const rate=currencyRate();return rate===null?null:amount*rate;
}
function formatShopMoney(kop){
 if(!Number.isSafeInteger(kop)||kop<0)return '—';
 const amount=convertUah(kop/100);
 if(amount===null)return '— '+state.currency;
 if(state.currency==='UAH')return (amount%1===0?amount.toFixed(0):amount.toFixed(2))+' ₴';
 return new Intl.NumberFormat(localeTags[state.language]||'en-US',{
   style:'currency',currency:state.currency,currencyDisplay:'symbol',
   // Use the ISO 4217 currency fraction digits (JPY/KRW/VND render without decimals).
 }).format(amount);
}
function preferenceMenu(type){
 const language=type==='language';
 const current=language?state.language:state.currency;
 const label=t(language?'language':'currency');
 const entries=language?supportedLanguages.map(code=>[code,({en:'🇬🇧',uk:'🇺🇦',pl:'🇵🇱',de:'🇩🇪'})[code],translations[code].langName]):currencyList;
 const indicator=language?state.language.toUpperCase():state.currency;
 return '<details class="pref-dropdown '+(language?'pref-language':'pref-currency')+'">'+
   '<summary class="pref-trigger" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+
     icon(language?'globe':'layers',16)+'<span>'+esc(indicator)+'</span>'+icon('chevron',13)+'</summary>'+
   '<div class="pref-panel" role="group" aria-label="'+esc(label)+'">'+
     '<div class="pref-panel-heading"><strong>'+esc(label)+'</strong><span>'+esc(indicator)+'</span></div>'+
     (!language?'<label class="pref-search">'+icon('search',15)+'<input type="search" data-pref-search placeholder="'+esc(t('currencySearch'))+'" aria-label="'+esc(t('currencySearch'))+'" autocomplete="off"></label>':'')+
     '<div class="pref-options">'+entries.map(([code,flag,name])=>
        '<button type="button" class="pref-option'+(current===code?' is-selected':'')+'" data-pref-'+(language?'lang':'currency')+'="'+esc(code)+'" data-pref-name="'+esc((code+' '+name).toLowerCase())+'" aria-pressed="'+String(current===code)+'">'+
          '<span class="pref-flag" aria-hidden="true">'+flag+'</span><span class="pref-option-text"><strong>'+esc(language?name:code)+'</strong>'+
            (!language?'<small>'+esc(name)+'</small>':'<small>'+esc(code.toUpperCase())+'</small>')+'</span>'+
          (current===code?icon('check',16):'')+'</button>').join('')+'</div>'+
     (!language?'<div class="pref-footnote">'+esc(t(fxState.status==='ready'?'currencyRatesUpdated':'currencyRatesLoading'))+
       (fxState.time&&fxState.status==='ready'?' · '+new Date(fxState.time).toLocaleDateString(localeTags[state.language]):'')+'</div>':'')+
   '</div></details>';
}
async function refreshCurrencyRates(){
 if(typeof window.fetch!=='function')return;
 if(fxState.status==='ready'&&Date.now()-fxState.time<23*3600*1000)return;
 try{
   const response=await window.fetch('https://open.er-api.com/v6/latest/UAH',{cache:'no-store'});
   if(!response.ok)throw new Error('FX_HTTP');
   const data=await response.json();
   if(data.result!=='success'||data.base_code!=='UAH'||data.rates?.UAH!==1)throw new Error('FX_SCHEMA');
   const rates={UAH:1};
   for(const code of currencyCodes){
     if(code==='UAH')continue;
     const v=data.rates[code];
     if(Number.isFinite(v)&&v>0)rates[code]=v;
   }
   if(!rates.USD||!rates.EUR)throw new Error('FX_MISSING_RATES');
   fxState.rates=rates;fxState.time=Date.now();fxState.status='ready';
   store(STORAGE.fx,JSON.stringify({time:fxState.time,rates}));
 }catch{
   if(fxState.status!=='ready')fxState.status='unavailable';
 }
 render(true);
}

function href(route){return '#'+route}
function routeInfo(){
  const raw=(location.hash||'#/').slice(1);
  const question=raw.indexOf('?');
  const path=(question<0?raw:raw.slice(0,question))||'/';
  const params=new URLSearchParams(question<0?'':raw.slice(question+1));
  return {path,params};
}
function safeRoute(path){if(path==='/downloads')return '/desktop';return /^\/player\/[0-9a-f-]{36}$/i.test(path)?path:['/','/browse','/games','/apps','/free','/rewards' ,'/saved','/id','/friends','/family','/notifications','/shop','/inventory','/library','/balance','/chat','/checkout','/payment','/desktop','/game/devive'].includes(path)?path:'/'}
function isActive(path,where){
  if(where==='/browse')return ['/browse','/games','/apps'].includes(path);
  if(where==='/rewards')return path==='/rewards'||path==='/free';
  return where===path;
}
function navLink(route,key,ico,path,counter){
  const label=esc(t(key));
  return '<a class="side-link'+(isActive(path,route)?' active':'')+'" href="'+href(route)+'" aria-label="'+label+'" title="'+label+'">'+icon(ico,18)+'<span>'+t(key)+'</span>'+(counter?'<span class="counter">'+counter+'</span>':'')+'</a>';
}
function notificationPopover(){
 const social=window.AURVEX_SOCIAL37||{},notes=Array.isArray(window.AURVEX_SOCIAL37?.notifications)?window.AURVEX_SOCIAL37.notifications:[];
 const unread=notes.filter(n=>!n.read).length;
 const items=notificationsOpen?(notes.length?notes.map(n=>{
  const family=n.kind==='family_invite';
  const avatar=n.avatarUrl?'<img src="'+esc(n.avatarUrl)+'" alt="">':icon('user',19);
  const actor=esc(n.nickname||t('friendsUnknown'));
  const actorLink=n.actor_id?'<a href="#/player/'+esc(n.actor_id)+'">'+actor+'</a>':'<strong>'+actor+'</strong>';
  const date=Date.parse(n.created_at||''),age=date?Math.abs(Date.now()-date):0;
  const unit=!date?'':age<60000?'minute':age<3600000?'hour':'day';
  const divisor=unit==='minute'?60000:unit==='hour'?3600000:86400000;
  const when=unit?'<time>'+esc(new Intl.RelativeTimeFormat(state.language,{numeric:'auto'}).format(Math.round((date-Date.now())/divisor),unit))+'</time>':'';
  return '<article class="notification-popover-item'+(n.read?'':' is-unread')+'"><span class="notification-popover-avatar">'+avatar+'</span>'+
   '<div class="notification-popover-copy"><div class="notification-popover-meta">'+actorLink+when+'</div>'+
   '<p>'+t(family?'social37FamilyInvite':'social37FriendRequest')+'</p><div class="notification-popover-actions">'+
   (family?'<button type="button" class="notification-popover-action" data-social37-action="open-invite" data-notification-id="'+esc(n.id)+'"'+(social.busy?' disabled':'')+'>'+t('social37OpenInvite')+'</button>':
    '<a class="notification-popover-action" href="#/friends">'+t('social37OpenFriends')+'</a>')+
   (!n.read?'<button type="button" class="notification-popover-read" data-social37-action="read" data-notification-id="'+esc(n.id)+'" title="'+t('social37Read')+'" aria-label="'+t('social37Read')+'"'+(social.busy?' disabled':'')+'>'+icon('check',14)+'</button>':'')+
   '</div></div></article>';
 }).join(''):'<div class="notification-popover-empty">'+icon('bell',23)+'<strong>'+t('social37Empty')+'</strong></div>'):'';
 return '<section class="notification-popover" id="notifications-popover" role="dialog" aria-label="'+t('social37Nav')+'"'+(notificationsOpen?'':' hidden')+'>'+
  '<header class="notification-popover-header"><div><span class="smallcaps">AURVEX / SOCIAL</span><h2>'+t('social37Nav')+
  (notes.length?'<span class="notification-popover-count">'+notes.length+'</span>':'')+'</h2></div>'+
  (unread?'<button class="notification-popover-mark" type="button" data-social37-action="read-all"'+(social.busy?' disabled':'')+'>'+t('social37MarkAll')+'</button>':'')+
  '<button class="notification-popover-close" type="button" data-action="notifications-close" aria-label="'+t('closeMenu')+'">'+icon('close',16)+'</button></header>'+
  '<div class="notification-popover-list">'+items+'</div></section>';
}
function header(path){
  const id=window.AURVEX_ID;
  const profileAvatar=id?.user&&id?.avatarUrl?
    '<img class="top-account-avatar" src="'+esc(id.avatarUrl)+'" alt="">':icon('user',17);
  const profileLabel=id?.user?(id.profile?.nickname||t('idAccount')):t('idSignIn');
  const wallet=window.AURVEX_WALLET||{};
  const balanceReady=!!id?.user?.id&&id.mfaVerified===true&&wallet.ready===true&&wallet.userId===id.user.id;
  const balanceLabel=balanceReady?formatAccountBalance(wallet.balanceUahKop):'— '+state.currency;
  const live=window.AURVEX_VISITORS||{status:'connecting',count:null};
  const liveCount=Number.isSafeInteger(live.count)&&live.count>=0?String(live.count):'—';
  const liveState=['live','connecting','unavailable'].includes(live.status)?live.status:'connecting';
  const liveHint=liveState==='unavailable'?t('visitorsUnavailable'):liveState==='connecting'?t('visitorsLoading'):t('visitorsLiveHint');
  const liveBadge='<span class="live-visitors" data-live-visitors data-live-state="'+liveState+
    '" data-live-label="'+esc(t('visitorsOnline'))+
    '" data-live-hint-live="'+esc(t('visitorsLiveHint'))+
    '" data-live-hint-connecting="'+esc(t('visitorsLoading'))+
    '" data-live-hint-unavailable="'+esc(t('visitorsUnavailable'))+
    '" title="'+esc(liveHint)+'" aria-label="'+esc(t('visitorsOnline')+': '+liveCount+'. '+liveHint)+'" aria-busy="'+String(liveState==='connecting')+'">'+
    '<span class="live-visitors-dot" aria-hidden="true"></span>'+
    '<span data-live-visitors-count class="live-visitors-count">'+liveCount+'</span>'+
    '<span class="live-visitors-label">'+t('visitorsOnline')+'</span></span>';
  return '<header class="topbar">'+
    '<button class="icon-btn menu-trigger" type="button" data-action="menu" aria-label="'+t('menu')+'" aria-expanded="false">'+icon('menu',20)+'</button>'+
    '<a class="top-brand" href="#/" aria-label="AURVEX Store">'+
    '<span class="brand-crest"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4 29 27H3L16 4Z" stroke="white" stroke-width="2.8" stroke-linejoin="round"/><path d="M16 13 22 24H10l6-11Z" fill="white"/></svg></span><span>AURVEX</span></a>'+

    '<form id="global-search-form" class="top-search" role="search">'+icon('search',18)+'<input type="search" name="q" aria-label="'+t('search')+'" placeholder="'+t('searchPlaceholder')+'" maxlength="120"></form>'+
    '<div class="top-actions">'+liveBadge+preferenceMenu('language')+preferenceMenu('currency')+
    '<button class="icon-btn" type="button" data-action="theme" title="'+t('toggleTheme')+'" aria-label="'+t('toggleTheme')+'">'+icon(state.theme==='dark'?'sun':'moon',18)+'</button>'+
    '<a class="icon-btn" href="#/saved" aria-label="'+t('saved')+'">'+icon('heart',19)+(state.wished&&!isDeviveOwned()?'<span class="wish-dot"></span>':'')+'</a>'+
    '<div class="notification-popover-wrap"><button class="icon-btn social-bell'+(notificationsOpen?' active':'')+'" type="button" data-action="notifications-toggle" title="'+t('social37Nav')+'" aria-label="'+t('social37Nav')+'" aria-haspopup="dialog" aria-expanded="'+String(notificationsOpen)+'" aria-controls="notifications-popover">'+
      icon('bell',19)+((window.AURVEX_SOCIAL37?.notifications||[]).some(x=>!x.read)?'<span class="wish-dot"></span>':'')+'</button>'+notificationPopover()+'</div>'+
    '<a class="account-header-btn'+(path==='/id'?' active':'')+'" href="#/id" aria-label="'+t('aurvexId')+'">'+profileAvatar+'<span>'+esc(profileLabel)+'</span></a>'+
    '<a class="header-balance-btn'+(path==='/balance'?' active':'')+'" href="#/balance" aria-label="'+esc(t('balanceNav')+': '+balanceLabel)+'">'+icon('wallet',17)+
    '<span class="header-balance-caption">'+t('balanceNav')+'</span><strong>'+esc(balanceLabel)+'</strong><span class="header-balance-plus">'+icon('plus',15)+'</span></a></div></header>';
}
function sidebar(path){
  return '<div class="sidebar-shade" data-action="close-menu"></div><aside class="sidebar" id="site-sidebar">'+
    '<div class="side-group"><div class="side-label">'+t('store')+'</div>'+
      navLink('/','home','home',path)+navLink('/browse','browse','compass',path)+launcherNavLink(path)+
      navLink('/shop','shopNav','sparkle',path)+navLink('/rewards','free','gift',path)+'</div>'+
    '<div class="side-group"><div class="side-label">'+t('yourSpace')+'</div>'+navLink('/saved','saved','heart',path)+navLink('/id','profileNav','user',path)+navLink('/balance','balanceNav','wallet',path)+navLink('/inventory','inventoryNav','layers',path)+navLink('/library','libraryNav','gamepad',path)+
      navLink('/friends','friendsNav','users',path,
        (window.AURVEX_FRIENDS?.relations||[]).filter(x=>x.relation==='incoming').length||0)+navLink('/chat','chatNav','message',path)+navLink('/family','familyNav','home',path)+navLink('/notifications','social37Nav','bell',path,
      (window.AURVEX_SOCIAL37?.notifications||[]).filter(n=>!n.read).length)+'</div>'+
    '<div class="side-space"></div><div class="side-promo" aria-label="AURVEX">'+
    '<div class="smallcaps">AURVEX</div><strong>'+t('bannerTitle')+'</strong></div></aside>';
}
function mobileNav(path){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation">'+
   mobileLink('/','home','home',path)+mobileLink('/browse','browse','compass',path)+mobileLink('/shop','shopNav','sparkle',path)+mobileLink('/inventory','inventoryNav','layers',path)+mobileLink('/friends','friendsNav','users',path)+mobileLink('/chat','chatNav','message',path)+mobileLink('/id','profileNav','user',path)+'</nav>';
}
function mobileLink(route,key,ico,path){return '<a href="'+href(route)+'" class="'+(isActive(path,route)?'active':'')+'">'+icon(ico,19)+'<span>'+t(key)+'</span></a>'}
function tag(key,cls){return '<span class="tag'+(cls?' '+cls:'')+'">'+t(key)+'</span>'}
const launcherCopy={
 en:{nav:'Download Launcher',crumb:'Home',eyebrow:'DESKTOP APP · LINUX PREVIEW',title:'AURVEX Desktop Launcher',intro:'Your AURVEX library, profile and community in a dedicated desktop app.',available:'Public preview',version:'Version 0.6.0 alpha.16 · Linux x86_64',download:'Download Linux preview',fileType:'Linux .run installer · x86_64',installTitle:'Install on Linux',installText:'After downloading, open a terminal in your Downloads folder and run:',knownTitle:'In-launcher sign-in',knownIssue:'Alpha.16 opens Google sign-in in your default browser, completes 2FA there, then returns the verified session to the launcher.',otherTitle:'More platforms',otherText:'Windows and macOS builds are not available yet.',shaLabel:'SHA-256',copy:'Copy',copySuccess:'Install commands copied.',copyFailed:'Could not copy. Select the commands and copy them manually.'},
 uk:{nav:'Завантажити лаунчер',crumb:'Головна',eyebrow:'ДЕСКТОПНИЙ ЗАСТОСУНОК · LINUX PREVIEW',title:'AURVEX Desktop Launcher',intro:'Бібліотека AURVEX, профіль і спільнота в окремому застосунку для комп’ютера.',available:'Публічне preview',version:'Версія 0.6.0 alpha.16 · Linux x86_64',download:'Завантажити preview для Linux',fileType:'Інсталятор .run · Linux x86_64',installTitle:'Встановлення на Linux',installText:'Після завантаження відкрий термінал у папці «Завантаження» та виконай:',knownTitle:'Вхід у лаунчері',knownIssue:'Alpha.16 відкриває вхід через Google у браузері, де можна пройти 2FA; після цього підтверджений профіль повертається в лаунчер.',otherTitle:'Інші платформи',otherText:'Збірки для Windows і macOS ще не доступні.',shaLabel:'SHA-256',copy:'Скопіювати',copySuccess:'Команди встановлення скопійовано.',copyFailed:'Не вдалося скопіювати. Виділи команди та скопіюй їх вручну.'},
 pl:{nav:'Pobierz launcher',crumb:'Strona główna',eyebrow:'APLIKACJA DESKTOPOWA · LINUX PREVIEW',title:'AURVEX Desktop Launcher',intro:'Biblioteka AURVEX, profil i społeczność w osobnej aplikacji desktopowej.',available:'Publiczna wersja preview',version:'Wersja 0.6.0 alpha.16 · Linux x86_64',download:'Pobierz wersję preview dla Linux',fileType:'Instalator .run · Linux x86_64',installTitle:'Instalacja w systemie Linux',installText:'Po pobraniu otwórz terminal w folderze Pobrane i uruchom:',knownTitle:'Logowanie w launcherze',knownIssue:'Alpha.16 otwiera logowanie Google w przeglądarce i po weryfikacji 2FA zwraca potwierdzony profil do launchera.',otherTitle:'Więcej platform',otherText:'Wersje dla Windows i macOS nie są jeszcze dostępne.',shaLabel:'SHA-256',copy:'Kopiuj',copySuccess:'Polecenia instalacji skopiowane.',copyFailed:'Nie udało się skopiować. Zaznacz polecenia i skopiuj je ręcznie.'},
 de:{nav:'Launcher herunterladen',crumb:'Startseite',eyebrow:'DESKTOP-APP · LINUX PREVIEW',title:'AURVEX Desktop Launcher',intro:'AURVEX-Bibliothek, Profil und Community in einer eigenen Desktop-App.',available:'Öffentliche Preview',version:'Version 0.6.0 alpha.16 · Linux x86_64',download:'Linux-Preview herunterladen',fileType:'Linux-.run-Installer · x86_64',installTitle:'Installation unter Linux',installText:'Öffne nach dem Download ein Terminal im Ordner „Downloads“ und führe Folgendes aus:',knownTitle:'Anmeldung im Launcher',knownIssue:'Alpha.16 öffnet die Google-Anmeldung im Browser und verbindet dein bestätigtes Profil nach der 2FA automatisch mit dem Launcher.',otherTitle:'Weitere Plattformen',otherText:'Builds für Windows und macOS sind noch nicht verfügbar.',shaLabel:'SHA-256',copy:'Kopieren',copySuccess:'Installationsbefehle kopiert.',copyFailed:'Kopieren fehlgeschlagen. Markiere die Befehle und kopiere sie manuell.'}
};
function launcherT(key){return launcherCopy[state.language]?.[key]||launcherCopy.en[key]||key}
function launcherNavLink(path){return '<a class="side-link'+(isActive(path,'/desktop')?' active':'')+'" href="#/desktop">'+icon('laptop',18)+'<span>'+esc(launcherT('nav'))+'</span></a>'}
const launcherFile='AURVEX-Launcher-v0.6.0-alpha.16-Google-Login-Fix-Linux.run';
function desktopPage(route){return downloadsPage(route)}
function downloadsPage(route){
  const os=route.params.get('os')||'';
  const current=route.params.get('version')||'';
  const distro=route.params.get('distro')||'';
  const systems=[
    {id:'windows',label:t('downloadsWindows'),symbol:'⊞',desc:t('downloadsWindowsDesc')},
    {id:'macos',label:t('downloadsMacOS'),symbol:'⌘',desc:t('downloadsMacOSDesc')},
    {id:'linux',label:t('downloadsLinux'),symbol:'◉',desc:t('downloadsLinuxDesc')},
    {id:'ios',label:t('downloadsIOS'),symbol:'◌',desc:t('downloadsIOSDesc')},
    {id:'android',label:t('downloadsAndroid'),symbol:'▣',desc:t('downloadsAndroidDesc')}
  ];
  const versions={
    windows:[
      {id:'win11-26h2',label:'Windows 11 · 26H2',meta:'x64 · '+t('downloadsCurrent')},
      {id:'win11-25h2',label:'Windows 11 · 25H2',meta:'x64'},
      {id:'win11-24h2',label:'Windows 11 · 24H2',meta:'x64'},
      {id:'win10-22h2',label:'Windows 10 · 22H2',meta:'x64 · '+t('downloadsLegacy'),legacy:true}
    ],
    macos:[
      {id:'macos-27',label:'macOS 27 Golden Gate · 27.0.1',meta:t('downloadsAppleSilicon')+' · '+t('downloadsIntel')},
      {id:'macos-26',label:'macOS 26 Tahoe · 26.7.1',meta:t('downloadsAppleSilicon')+' · '+t('downloadsIntel')},
      {id:'macos-15',label:'macOS 15 Sequoia · 15.8.1',meta:t('downloadsAppleSilicon')+' · '+t('downloadsIntel')},
      {id:'macos-14',label:'macOS 14 Sonoma · 14.8.9',meta:t('downloadsAppleSilicon')+' · '+t('downloadsIntel')},
      {id:'macos-13',label:'macOS 13 Ventura · 13.7.8',meta:t('downloadsAppleSilicon')+' · '+t('downloadsIntel')}
    ],
    ios:[
      {id:'ios-27',label:'iOS 27',meta:'iPhone'},
      {id:'ios-26',label:'iOS 26',meta:'iPhone'}
    ],
    android:[
      {id:'android-17',label:'Android 17',meta:t('downloadsCurrent')},
      {id:'android-16',label:'Android 16',meta:t('downloadsPrevious')}
    ]
  };
  const distros=[
    {id:'nixos',name:'NixOS',meta:'26.05 · '+t('downloadsStable')+' · unstable',options:[
      {id:'nixos-26.05',label:'NixOS 26.05',meta:t('downloadsStable')},
      {id:'nixos-unstable',label:'NixOS Unstable',meta:t('downloadsRolling')}
    ]},
    {id:'ubuntu',name:'Ubuntu',meta:'26.10 · 26.04 LTS · 24.04 LTS',options:[
      {id:'ubuntu-26.10',label:'Ubuntu 26.10',meta:t('downloadsCurrent')},
      {id:'ubuntu-26.04',label:'Ubuntu 26.04 LTS',meta:t('downloadsLTS')},
      {id:'ubuntu-24.04',label:'Ubuntu 24.04 LTS',meta:t('downloadsLTS')}
    ]},
    {id:'debian',name:'Debian',meta:'13 Stable · 12 Oldstable',options:[
      {id:'debian-13',label:'Debian 13 Trixie',meta:t('downloadsStable')},
      {id:'debian-12',label:'Debian 12 Bookworm',meta:t('downloadsPrevious')}
    ]},
    {id:'fedora',name:'Fedora Workstation',meta:'44 · 43',options:[
      {id:'fedora-44',label:'Fedora 44',meta:t('downloadsCurrent')},
      {id:'fedora-43',label:'Fedora 43',meta:t('downloadsPrevious')}
    ]},
    {id:'arch',name:'Arch Linux',meta:t('downloadsRolling'),options:[
      {id:'arch-rolling',label:'Arch Linux',meta:t('downloadsRolling')}
    ]},
    {id:'manjaro',name:'Manjaro',meta:t('downloadsStable')+' · '+t('downloadsRolling'),options:[
      {id:'manjaro-stable',label:'Manjaro Stable',meta:t('downloadsStable')},
      {id:'manjaro-testing',label:'Manjaro Testing',meta:t('downloadsRolling')}
    ]},
    {id:'mint',name:'Linux Mint',meta:'22.x',options:[
      {id:'mint-22',label:'Linux Mint 22.x',meta:t('downloadsStable')}
    ]},
    {id:'opensuse',name:'openSUSE',meta:'Leap 16.0 · Tumbleweed',options:[
      {id:'opensuse-leap-16',label:'openSUSE Leap 16.0',meta:t('downloadsStable')},
      {id:'opensuse-tumbleweed',label:'openSUSE Tumbleweed',meta:t('downloadsRolling')}
    ]}
  ];
  const platform=systems.find(x=>x.id===os);
  const selectedDistro=distros.find(x=>x.id===distro);
  const options=os==='linux'?(selectedDistro?.options||[]):(versions[os]||[]);
  const selectedVersion=options.find(x=>x.id===current);
  const systemCards=systems.map(x=>'<a class="download-os-card" href="#/desktop?os='+x.id+'">'+
    '<span class="download-os-symbol" aria-hidden="true">'+x.symbol+'</span><span class="download-os-copy"><strong>'+x.label+'</strong><small>'+x.desc+'</small></span>'+
    '<span class="download-os-arrow" aria-hidden="true">'+icon('arrow',17)+'</span></a>').join('');
  const distroCards='<div class="download-choice-grid">'+distros.map(x=>
    '<a class="download-choice-card download-distro-card" href="#/desktop?os=linux&distro='+x.id+'">'+
    '<span><strong>'+x.name+'</strong><small>'+x.meta+'</small></span><span class="download-choice-status">'+icon('arrow',16)+'</span></a>'
  ).join('')+'</div>';
  const optionCards=options.length?'<div class="download-choice-grid">'+options.map(x=>{
    const target=os==='linux'?'#/desktop?os=linux&distro='+distro+'&version='+encodeURIComponent(x.id):
      '#/desktop?os='+os+'&version='+encodeURIComponent(x.id);
    return '<a class="download-choice-card" href="'+target+'"><span><strong>'+x.label+'</strong><small>'+x.meta+'</small></span>'+
      '<span class="download-choice-status">'+icon('arrow',16)+'</span></a>';
  }).join('')+'</div>':'';
  const commands='cd ~/Downloads\nchmod +x '+launcherFile+'\n./'+launcherFile;
  const linuxDownload='<section class="linux-launcher-download"><div class="linux-download-mark">'+icon('laptop',25)+'</div>'+
    '<div class="linux-download-copy"><span class="smallcaps">'+esc(launcherT('fileType'))+'</span><h3>'+esc(launcherT('installTitle'))+'</h3>'+
    '<p>'+esc(launcherT('installText'))+'</p><span class="download-status-pill">'+esc(launcherT('version'))+'</span></div>'+
    '<div class="linux-download-actions"><a class="btn btn-primary" href="./desktop/updates/'+launcherFile+'" download>'+icon('arrow',16)+' '+esc(launcherT('download'))+'</a>'+
    '<button class="btn btn-outline" type="button" data-action="copy-launcher-command">'+icon('copy',16)+' '+esc(launcherT('copy'))+'</button></div>'+
    '<pre><code data-launcher-command>'+esc(commands)+'</code></pre><p class="download-sha"><strong>'+esc(launcherT('shaLabel'))+':</strong> '+
    '<code>74bf8f367b2058711f0f2329c7961369aee59a4c8070aa249b6e82f0da7e526b</code></p></section>';
  let stage='';
  if(!platform){stage=''}else if(selectedVersion){
    stage='<section class="download-release-detail"><div class="download-release-check">'+icon('shield',22)+'</div>'+
      '<span class="smallcaps">'+t('downloadsSelected')+'</span><h2>'+selectedVersion.label+'</h2><p>'+selectedVersion.meta+'</p>'+
      '<aside class="download-build-note"><span class="download-note-icon">'+icon('info',19)+'</span><div>'+
      '<strong>'+t('downloadsBuildPending')+'</strong><p>'+t('downloadsBuildNotReady')+'</p>'+
      (selectedVersion.legacy?'<p class="download-legacy-note">'+t('downloadsWindowsLegacy')+'</p>':'')+
      ((os==='ios'||os==='android')?'<p>'+t('downloadsMobileNote')+'</p>':'')+
      '<span class="download-status-pill">'+t('downloadsPreparing')+'</span></div></aside></section>';
  }else if(os==='linux'&&selectedDistro){
    stage='<section class="download-stage"><div class="download-stage-head"><span class="smallcaps">'+t('downloadsChooseVersion')+
      '</span><h2>'+selectedDistro.name+'</h2><p>'+selectedDistro.meta+'</p></div>'+optionCards+'</section>';
  }else if(os==='linux'){
    stage='<section class="download-stage"><div class="download-stage-head"><span class="smallcaps">'+t('downloadsChooseDistro')+
      '</span><h2>'+platform.label+'</h2><p>'+platform.desc+'</p></div>'+distroCards+'</section>';
  }else{
    stage='<section class="download-stage"><div class="download-stage-head"><span class="smallcaps">'+t('downloadsChooseVersion')+
      '</span><h2>'+platform.label+'</h2><p>'+platform.desc+'</p></div>'+optionCards+'</section>';
  }
  const backUrl=!platform?'#/':selectedVersion?(os==='linux'?'#/desktop?os=linux&distro='+distro:'#/desktop?os='+os):
    '#/desktop';
  const backLabel=!platform?t('home'):selectedVersion?(os==='linux'?(selectedDistro?.name||t('downloadsLinux')):platform.label):t('downloadsAllSystems');
  const screen=platform?
    '<div class="download-screen-toolbar"><a class="download-back" href="'+backUrl+'">'+icon('arrow',16)+' '+backLabel+'</a>'+
    '<span>'+t('downloadsSelected')+'</span></div>'+
    '<section class="download-platform-hero"><div class="download-platform-icon">'+platform.symbol+'</div><div class="download-platform-heading">'+
    '<span class="smallcaps">AURVEX · '+platform.label+'</span><h1>'+(selectedVersion?selectedVersion.label:(selectedDistro?selectedDistro.name:platform.label))+'</h1>'+
    '<p>'+(selectedVersion?selectedVersion.meta:(selectedDistro?selectedDistro.meta:platform.desc))+'</p></div>'+
    '<span class="download-platform-status">'+icon('shield',15)+' '+(selectedVersion&&os==='linux'?esc(launcherT('fileType')):t('downloadsPreparing'))+'</span></section>'+
    (selectedVersion?(os==='linux'?linuxDownload:stage):(stage+(os==='windows'?'<p class="download-legacy-note">'+t('downloadsWindowsLegacy')+'</p>':'')))
    :'<section class="downloads-hero launcher-downloads-hero"><div class="downloads-hero-glow"></div>'+
    '<div class="smallcaps">'+esc(launcherT('eyebrow'))+'</div><h1>'+esc(launcherT('title'))+'</h1><p>'+esc(launcherT('intro'))+
    '</p><span class="downloads-live-chip">'+icon('shield',15)+' '+t('downloadsPreparing')+'</span></section>'+
    '<section class="downloads-section launcher-os-section"><div class="downloads-section-head"><div>'+
    '<span class="smallcaps">'+t('downloadsPlatformLabel')+'</span><h2>'+t('downloadsChoosePlatform')+'</h2></div></div>'+
    '<div class="download-os-grid">'+systemCards+'</div></section>';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+esc(launcherT('nav'))+'</span></div>'+
    '<main class="launcher-downloads">'+screen+'</main>';
}
function isDeviveOwned(){return window.AURVEX_ID?.ownedGameIds?.includes('devive')===true}
function libraryAction(className='btn btn-soft'){
  const id=window.AURVEX_ID||{};
  if(isDeviveOwned())return '<a class="'+className+'" href="#/library">'+icon('check',16)+' '+t('inLibrary')+'</a>';
  if(id.claimingGame==='devive')return '<button class="'+className+'" type="button" disabled>'+icon('clock',16)+' '+t('libraryAdding')+'</button>';
  if(!id.user?.id||id.mfaVerified!==true)return '<a class="'+className+'" href="#/id">'+icon('user',16)+' '+t('signInToAdd')+'</a>';
  return '<button class="'+className+'" type="button" data-action="claim-devive">'+icon('plus',16)+' '+t('addToLibrary')+'</button>';
}
function wishlistButton(){if(isDeviveOwned())return '';return '<button class="heart-btn'+(state.wished?' is-saved':'')+'" type="button" data-action="wishlist" aria-pressed="'+String(state.wished)+'" aria-label="'+t(state.wished?'removeWish':'addWish')+'" title="'+t(state.wished?'removeWish':'addWish')+'">'+icon('heart',17)+'</button>'}
function gameCard(){
  return '<article class="game-card"><a href="#/game/devive" class="game-cover"><img src="'+sceneUrl+'" loading="lazy" alt="'+esc(t('conceptArtwork'))+'"><span class="cover-label">'+t('twoD')+'</span><span class="cover-logo">DEVIVE</span></a>'+
    '<div class="game-card-body"><div class="game-name"><h3><a href="#/game/devive">Devive</a></h3>'+tag('freeAtLaunch','tag-green')+'</div><p>'+t('deviveShort')+'</p>'+
    '<div class="card-meta">'+tag('gameType')+tag('horror')+tag('genrePsychological')+tag('inDevelopment','tag-amber')+'</div>'+
    '<div class="card-actions"><a class="btn btn-outline" href="#/game/devive">'+t('viewDetails')+' '+icon('arrow',14)+'</a>'+libraryAction('btn btn-soft')+wishlistButton()+'</div></div></article>';
}
function upcomingCard(){
  return '<article class="upcoming-card"><div class="upcoming-watermark">'+icon('sparkle',170)+'</div>'+
    '<span class="smallcaps">'+t('newProject')+'</span><h3>'+t('newProjectTitle')+'</h3><p>'+t('newProjectDesc')+'</p>'+
    '<span class="progress-chip"><span class="progress-dot"></span>'+t('comingSoon')+'</span></article>';
}
function sectionHead(kicker,title,description,link,route){
  return '<div class="section-head"><div><div class="smallcaps">'+t(kicker)+'</div><h2>'+t(title)+'</h2>'+
    (description?'<p>'+t(description)+'</p>':'')+'</div>'+
    (link?'<a class="text-link" href="'+href(route)+'">'+t(link)+' '+icon('arrow',15)+'</a>':'')+'</div>';
}
function categoryCard(route,iconName,name,description,tint){
  return '<a href="'+href(route)+'" class="category-tile" style="--tint:'+tint+'"><span class="category-icon">'+icon(iconName,23)+'</span>'+
    '<span class="cat-copy"><strong>'+t(name)+'</strong><small>'+t(description)+'</small></span></a>';
}
function features(){
  const names=[['compass','whyCard1','whyCard1Desc'],['heart','whyCard2','whyCard2Desc'],['apps','whyCard3','whyCard3Desc'],['shield','whyCard4','whyCard4Desc']];
  return '<div class="feature-columns">'+names.map(function(x){return '<article class="feature-column"><div class="feature-icon">'+icon(x[0],23)+'</div><h3>'+t(x[1])+'</h3><p>'+t(x[2])+'</p></article>'}).join('')+'</div>';
}
function home(){
  return '<div class="welcome-bar"><div><div class="smallcaps">'+t('beta')+'</div><h1>'+t('welcomeTitle')+'</h1><p>'+t('welcomeText')+'</p></div><span class="round-badge">✦ AURVEX STORE v2.0</span></div>'+
  '<section class="hero" aria-label="Devive game spotlight"><img class="hero-background" src="'+sceneUrl+'" alt="'+esc(t('conceptArtwork'))+'" fetchpriority="high">'+
    '<div class="hero-content"><div class="hero-label">'+t('eyebrow')+'</div><div class="hero-wordmark">DEVIVE</div>'+
    '<h2 class="hero-headline">'+t('heroTitle')+'<br>'+t('heroTitleAccent')+'</h2><p class="hero-description">'+t('heroCopy')+'</p>'+
    '<div class="hero-actions"><a class="btn btn-primary" href="#/game/devive">'+t('exploreDevive')+' '+icon('arrow',16)+'</a>'+
    '+libraryAction('btn btn-soft')+'</div>'+
    '<div class="hero-facts"><span>'+icon('gift',15)+' '+t('freeAtLaunch')+'</span><span>'+icon('clock',15)+' '+t('inDevelopment')+'</span><span>'+icon('gamepad',15)+' '+t('twoD')+'</span></div></div>'+
    '<span class="art-note">'+t('conceptArtwork')+'</span></section>'+
  '<section class="section">'+sectionHead('selectionKicker','selectionTitle','selectionSubtitle','showAll','/browse')+
    '<div class="editorial-grid">'+gameCard()+upcomingCard()+'</div></section>'+
  '<section class="section">'+sectionHead('whyKicker','whyTitle','whyText',null,null)+features()+'</section>'+
  '<section class="section">'+sectionHead('editorialKicker','editorialTitle','editorialDesc',null,null)+
    '<div class="feature-story"><div class="story-content"><div class="smallcaps">'+t('firstRelease')+'</div><h2>'+t('deviveQuote')+'</h2><p>'+t('deviveLong')+'</p>'+
    '<a href="#/game/devive" class="btn btn-soft">'+t('editorialLink')+' '+icon('arrow',16)+'</a></div></div></section>'+
  '<section class="section">'+sectionHead('whatsNext','announcing','announcementDesc',null,null)+
    '<div class="announcement-grid"><a href="#/game/devive" class="announcement-card"><small>'+t('firstRelease')+'</small><h3>'+t('updateDevive')+'</h3><p>'+t('updateDeviveDesc')+'</p></a></div></section>';
}
function heading(title,sub,kicker){
  return '<div class="heading-block"><div class="smallcaps">'+t(kicker)+'</div><h1>'+t(title)+'</h1><p>'+t(sub)+'</p></div>';
}
// Genres are prepared for future listings. Only announced products are searchable today.
const gameGenres=[
 ['action','genreAction'],['adventure','adventure'],['rpg','genreRpg'],
 ['shooter','genreShooter'],['horror','horror'],['survival','genreSurvival'],
 ['open-world','genreOpenWorld'],['sandbox','genreSandbox'],['strategy','genreStrategy'],
 ['simulation','genreSimulation'],['racing','genreRacing'],['sports','genreSports'],
 ['puzzle','genrePuzzle'],['platformer','genrePlatformer'],['fighting','genreFighting'],
 ['stealth','genreStealth'],['co-op','genreCoop'],['multiplayer','genreMultiplayer'],
 ['casual','genreCasual'],['indie','indie'],['story-rich','genreStory'],
 ['psychological','genrePsychological'],['mystery','genreMystery'],
 ['roguelike','genreRoguelike'],['rhythm','genreRhythm'],['visual-novel','genreVisualNovel']
];
const announcedProducts=[{
 id:'devive',kind:'game',title:'Devive',price:0,
 // Devive has no announced release year, so it does not match a specific year filter.
 releaseYear:null,genres:['horror','psychological','indie'],
 searchTerms:['devive','2d','horror','psychological horror','house','side view','indie']
}];
function selectedGenres(){
  return state.genre==='all'||!state.genre?[]:state.genre.split(',').filter(function(x){return gameGenres.some(function(entry){return entry[0]===x})});
}
function catalogMatches(route){
  const params=route.params;
  const kind=state.kind;
  const genres=selectedGenres();
  const q=state.query.trim().toLocaleLowerCase(state.language);
  const min=state.minPrice===''?null:Number(state.minPrice);
  const max=state.maxPrice===''?null:Number(state.maxPrice);
  const year=state.releaseYear===''?null:Number(state.releaseYear);
  return announcedProducts.filter(function(product){
    if(route.path==='/apps'&&product.kind!=='app')return false;
    if(route.path==='/games'&&product.kind!=='game')return false;
    if(kind!=='all'&&product.kind!==kind)return false;
    if(genres.length&&!genres.some(function(genre){return product.genres.includes(genre)}))return false;
    const chosenPrice=convertUah(product.price);
    if((min!==null||max!==null)&&chosenPrice===null)return false;
    if(min!==null&&(!Number.isFinite(min)||min<0||chosenPrice<min))return false;
    if(max!==null&&(!Number.isFinite(max)||max<0||chosenPrice>max))return false;
    if(min!==null&&max!==null&&min>max)return false;
    if(year!==null&&(!Number.isInteger(year)||product.releaseYear!==year))return false;
    if(q){
      const terms=[product.title,...product.searchTerms,t('horror'),t('gameType'),t('freeAtLaunch'),t('deviveShort')].join(' ').toLocaleLowerCase(state.language);
      if(!terms.includes(q))return false;
    }
    return true;
  });
}
function resultHTML(route){
  const matched=catalogMatches(route);
  if(matched.length)return matched.map(function(product){return product.id==='devive'?gameCard():''}).join('');
  return '<div class="empty-state"><div class="empty-icon">'+icon('search',30)+'</div><h3>'+t('noResults')+'</h3>'+
    '<p>'+t('noResultsDesc')+'</p><button type="button" class="btn btn-outline" data-action="clear-filters">'+t('clearFilters')+' '+icon('arrow',15)+'</button></div>';
}
function customChoice(id,label,options,current,name,extraClass=''){
  const chosen=options.find(function(opt){return opt[0]===current})||options[0];
  return '<div class="filter-field">'+(label?'<span>'+esc(label)+'</span>':'')+'<details class="filter-dropdown '+extraClass+'" id="'+id+'" name="aurvex-filters">'+
    '<summary class="filter-trigger"><span class="filter-current">'+esc(chosen[1])+'</span>'+icon('chevron',17)+'</summary>'+
    '<div class="filter-menu" role="group" aria-label="'+esc(label||t('sort'))+'">'+
      '<div class="filter-option-list">'+options.map(function(opt){
        const selected=opt[0]===current;
        return '<button type="button" class="filter-option'+(selected?' chosen':'')+'" aria-pressed="'+selected+'" data-filter-choice="'+name+'" data-value="'+esc(opt[0])+'">'+
          '<span>'+esc(opt[1])+'</span><span class="option-check">'+icon('check',15)+'</span></button>';
      }).join('')+'</div></div></details></div>';
}
function customGenres(){
  const selected=selectedGenres();
  const label=selected.length?(selected.length===1?t((gameGenres.find(function(x){return x[0]===selected[0]})||[])[1]):selected.length+' '+t('genresSelected')):t('allGenres');
  return '<div class="filter-field"><span>'+t('genre')+'</span><details class="filter-dropdown genre-dropdown" id="filter-genre" name="aurvex-filters">'+
    '<summary class="filter-trigger"><span class="filter-current" id="genre-filter-label">'+esc(label)+'</span>'+
      '<span class="selection-bubble"'+(selected.length?'':' hidden')+'>'+selected.length+'</span>'+icon('chevron',17)+'</summary>'+
    '<div class="filter-menu genre-menu" role="group" aria-label="'+t('genre')+'">'+
      '<div class="genre-menu-top"><span>'+t('selectMultipleGenres')+'</span><span class="genre-count" id="genre-selected-count">'+selected.length+'</span></div>'+
      '<label class="genre-search">'+icon('search',16)+'<input type="search" id="genre-lookup" autocomplete="off" placeholder="'+esc(t('searchGenres'))+'" aria-label="'+t('searchGenres')+'"></label>'+
      '<div class="genre-list">'+gameGenres.map(function(x){
        const checked=selected.includes(x[0]),name=t(x[1]);
        return '<label class="genre-check" data-genre-row data-genre-name="'+esc(name.toLocaleLowerCase(state.language))+'">'+
          '<input type="checkbox" value="'+esc(x[0])+'" data-genre-option="'+esc(x[0])+'"'+(checked?' checked':'')+'>'+
          '<span class="fake-check">'+icon('check',13)+'</span><span>'+esc(name)+'</span></label>';
      }).join('')+'</div>'+
      '<div class="genre-menu-footer"><button type="button" data-action="genre-clear" class="genre-clear">'+t('clearGenres')+'</button>'+
        '<button type="button" data-action="dropdown-done" class="genre-done">'+t('done')+'</button></div>'+
    '</div></details></div>';
}
function activeFilters(){
  const list=[];
  if(state.kind!=='all')list.push(['kind',state.kind,t(state.kind==='game'?'games':'apps')]);
  selectedGenres().forEach(function(g){const entry=gameGenres.find(function(x){return x[0]===g});if(entry)list.push(['genre',g,t(entry[1])]);});
  if(state.minPrice!=='')list.push(['min','',t('filterMinPrice')+' ('+state.currency+'): '+state.minPrice]);
  if(state.maxPrice!=='')list.push(['max','',t('filterMaxPrice')+' ('+state.currency+'): '+state.maxPrice]);
  if(state.releaseYear!=='')list.push(['year','',t('releaseYear')+': '+state.releaseYear]);
  return list.length?'<div class="active-filter-chips" aria-label="'+t('activeFilters')+'">'+
    '<span class="active-filter-label">'+t('activeFilters')+'</span>'+
    list.map(function(x){return '<button type="button" class="active-filter-chip" data-remove-filter="'+esc(x[0])+'" data-value="'+esc(x[1])+'" aria-label="'+t('removeFilter')+': '+esc(x[2])+'">'+esc(x[2])+icon('close',13)+'</button>'}).join('')+
    '</div>':'';
}
function catalog(route){
  const initialKind=route.path==='/apps'?'app':route.path==='/games'?'game':'all';
  state.kind=route.params.get('kind')||initialKind;
  if(!['all','game','app'].includes(state.kind))state.kind='all';
  const queryGenres=(route.params.get('genre')||'').toLowerCase().split(',');
  state.genre=[...new Set(queryGenres.filter(function(g){return gameGenres.some(function(entry){return entry[0]===g})}))].join(',')||'all';
  state.query=route.params.get('q')||'';
  state.minPrice=route.params.get('min')||'';
  state.maxPrice=route.params.get('max')||'';
  state.releaseYear=route.params.get('year')||'';
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(state.minPrice))state.minPrice='';
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(state.maxPrice))state.maxPrice='';
  if(!/^\d{4}$/.test(state.releaseYear))state.releaseYear='';
  const yearNow=new Date().getFullYear();
  const yearList=[['',t('anyYear')]];
  for(let y=yearNow+1;y>=1970;y--)yearList.push([String(y),String(y)]);
  const typeList=[['all',t('allProducts')],['game',t('games')],['app',t('apps')]];
  const isGame=route.path==='/games',isApp=route.path==='/apps';
  const title=isGame?'gamesTitle':isApp?'appsTitle':'browseTitle';
  const subtitle=isGame?'gamesSub':isApp?'appsSub':'browseSub';
  const count=catalogMatches(route).length;
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('browse')+'</span></div>'+
    heading(title,subtitle,'browseKicker')+
    '<div class="catalog-search-row"><label class="catalog-search catalog-search-large">'+icon('search',20)+
      '<input type="search" id="catalog-search" value="'+esc(state.query)+'" placeholder="'+t('searchCatalog')+'" aria-label="'+t('search')+'" autocomplete="off" maxlength="120"></label></div>'+
    '<div class="advanced-filters" aria-label="'+t('filters')+'">'+
      '<div class="filters-heading"><div>'+icon('layers',19)+' <strong>'+t('filters')+'</strong><span>'+t('filterDescription')+'</span></div>'+
      '<button class="filter-reset" type="button" data-action="clear-filters">'+icon('close',14)+' '+t('clearFilters')+'</button></div>'+
      '<div class="filter-fields">'+
        customChoice('filter-kind',t('productType'),typeList,state.kind,'kind')+
        customGenres()+
        '<label class="filter-field"><span>'+t('filterMinPrice')+' ('+state.currency+')</span><input id="filter-min-price" type="number" min="0" max="9999999" step="1" inputmode="numeric" placeholder="0" value="'+esc(state.minPrice)+'"></label>'+
        '<label class="filter-field"><span>'+t('filterMaxPrice')+' ('+state.currency+')</span><input id="filter-max-price" type="number" min="0" max="9999999" step="1" inputmode="numeric" placeholder="'+t('anyPrice')+'" value="'+esc(state.maxPrice)+'"></label>'+
        customChoice('filter-year',t('releaseYear'),yearList,state.releaseYear,'year','year-dropdown')+
      '</div>'+
      '<p class="filter-note">'+icon('info',15)+' '+t('currencyFilterNote')+'</p>'+
    '</div>'+
    '<div id="active-filters">'+activeFilters()+'</div>'+ 
    '<div class="catalog-tools"><strong id="catalog-count">'+count+' '+t(count===1?'oneResult':'results')+'</strong>'+
    '<div class="sort-block"><span>'+t('sort')+'</span>'+customChoice('sort-select','',[['featured',t('sortFeatured')],['name',t('sortName')],['free',t('sortFree')]],state.sort,'sort','sort-dropdown')+'</div></div>'+
    '<div class="catalog-results" id="catalog-results">'+resultHTML(route)+'</div>'+
    '<div class="catalog-tip">'+icon('info',19)+'<span>'+t('onlyDevive')+'</span></div>';
}
function rewardsPage(){
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('freeRewards')+'</span></div>'+
    '<section class="rewards-hero"><div class="rewards-halo" aria-hidden="true">'+icon('gift',170)+'</div>'+
      '<div class="rewards-copy"><span class="smallcaps">'+t('rewardsEyebrow')+'</span><h1>'+t('freeRewards')+'</h1>'+
      '<p>'+t('rewardsIntro')+'</p><span class="tag tag-amber">'+t('comingSoon')+'</span></div></section>'+
    '<section class="rewards-empty"><div class="empty-icon">'+icon('gift',35)+'</div>'+
      '<h2>'+t('rewardsEmptyTitle')+'</h2><p>'+t('rewardsEmptyText')+'</p>'+
      '<a href="#/browse" class="btn btn-outline">'+t('exploreStore')+' '+icon('arrow',16)+'</a></section>';
}
function gamePage(){
  const controlItems=[['A / D','move'],['SPACE','jump'],['E','interact'],['TAB','inventory']];
  const specItems=[['deviveTeam','AURVEX Team'],['deviveGenre','twoD'],['deviveDate','deviveDateValue'],['devivePrice','devivePriceValue'],['devivePlatform','devivePlatformValue'],['deviveStatus','inDevelopment']];
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<a href="#/games">'+t('games')+'</a>'+icon('arrow',13)+'Devive</div>'+
    '<div class="detail-title"><div><div class="smallcaps">'+t('heroTag')+'</div><h1>Devive</h1><p>'+t('deviveShort')+'</p></div><div class="detail-side">'+tag('inDevelopment','tag-amber')+'<button class="btn btn-outline" type="button" data-action="share">'+icon('arrowUp',15)+' '+t('share')+'</button></div></div>'+
    '<div class="detail-hero"><img src="'+sceneUrl+'" alt="'+esc(t('conceptArtwork'))+'"><span class="detail-caption">'+t('conceptArtwork')+'</span></div>'+
    '<div class="detail-grid"><div>'+
      '<section class="detail-section"><div class="card-meta detail-genres">'+tag('horror')+tag('genrePsychological')+tag('indie')+'</div><h2>'+t('deviveDescTitle')+'</h2><p>'+t('deviveLong')+'</p></section>'+
      '<section class="detail-section"><h2>'+t('deviveFeatures')+'</h2><div class="detail-features">'+
      ['featureOne','featureTwo','featureThree','featureFour'].map(function(k){return '<div class="detail-feature">'+icon('check',19)+'<span>'+t(k)+'</span></div>'}).join('')+
      '</div><p class="notice">'+t('deviveNotice')+'</p></section>'+
      '<section class="detail-section"><h2>'+t('screenshots')+'</h2><p>'+t('screenshotsNote')+'</p><div class="concept-gallery">'+
        ['previewExterior','previewRooms','previewNight'].map(function(k,i){return '<div class="concept-shot"><img src="'+galleryUrls[i]+'" alt="'+esc(t(k))+'" loading="lazy"><span>'+t(k)+'</span></div>'}).join('')+
      '</div></section>'+
      '<section class="detail-section"><h2>'+t('controlsTitle')+'</h2><div class="control-grid">'+controlItems.map(function(x){return '<div class="control-row"><kbd class="key">'+x[0]+'</kbd><span>'+t(x[1])+'</span></div>'}).join('')+'</div></section>'+
    '</div><aside class="purchase-panel"><div class="purchase-banner"><img src="'+sceneUrl+'" alt=""></div><h3>Devive</h3>'+
    '<p>'+t('deviveFlavor')+' '+t('deviveShort')+'</p><div class="card-meta">'+tag('freeAtLaunch','tag-green')+tag('genrePsychological')+tag('inDevelopment','tag-amber')+'</div>'+
    '<div class="purchase-actions"><button class="btn btn-accent" type="button" disabled>'+icon('cloud',17)+' '+t('downloadDisabled')+'</button>'+
    '+libraryAction('btn btn-accent')+(!isDeviveOwned()?'<button class="btn btn-outline" type="button" data-action="wishlist">'+icon('heart',17)+' '+t(state.wished?'removeWish':'addWish')+'</button>':'')+'</div>'+
    '<p class="notice">'+t('devStatusNotice')+'</p><dl class="specs">'+specItems.map(function(x){return '<div><dt>'+t(x[0])+'</dt><dd>'+(x[1]==='AURVEX Team'?'AURVEX Team':t(x[1]))+'</dd></div>'}).join('')+'</dl></aside></div>';
}
function savedPage(){
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('saved')+'</div>'+
    heading('savedTitle','savedSub','savedKicker')+
    (state.wished&&!isDeviveOwned()?'<div class="catalog-results">'+gameCard()+'</div>':'<div class="empty-state"><div class="empty-icon">'+icon('heart',30)+'</div><h3>'+t('savedEmpty')+'</h3><p>'+t('savedEmptyDesc')+'</p><a href="#/browse" class="btn btn-accent">'+t('exploreStore')+' '+icon('arrow',15)+'</a></div>')+
    '<div class="saved-banner">'+icon('shield',20)+t(window.AURVEX_ID?.user?'idWishlistSync':'localOnly')+'</div>';
}
function mfaGatePage(auth){
  const enrollment=auth.mfaEnrollment||null;
  const isBackup=!!(enrollment&&auth.mfaVerified);
  const enrollNeeded=!auth.mfaHasFactors&&!enrollment;
  const title=isBackup?t('mfaBackupTitle'):
    enrollment?t('mfaSetupTitle'):(enrollNeeded?t('mfaSetupTitle'):t('mfaChallengeTitle'));
  const description=auth.mfaHasFactors&&!enrollment?t('mfaChallengeIntro'):t('mfaSetupIntro');
  const setupSecret=enrollment?.secret||'';
  const qrUi={
    en:{enlarge:'Enlarge QR code',close:'Close enlarged QR',copy:'Copy setup key',copied:'Setup key copied.'},
    uk:{enlarge:'Збільшити QR-код',close:'Закрити збільшений QR-код',copy:'Скопіювати ключ налаштування',copied:'Ключ налаштування скопійовано.'},
    pl:{enlarge:'Powiększ kod QR',close:'Zamknij powiększony kod QR',copy:'Skopiuj klucz konfiguracji',copied:'Skopiowano klucz konfiguracji.'},
    de:{enlarge:'QR-Code vergrößern',close:'Vergrößerten QR-Code schließen',copy:'Einrichtungsschlüssel kopieren',copied:'Einrichtungsschlüssel kopiert.'}
  }[state.language]||{enlarge:'Enlarge QR code',close:'Close enlarged QR',copy:'Copy setup key',copied:'Setup key copied.'};
  // Only trust the QR data-URI scheme expected from Supabase Auth.
  const qr=(typeof enrollment?.qr==='string'&&enrollment.qr.startsWith('data:image/svg+xml'))
    ?enrollment.qr:'';
  const qrBlock=enrollment?
    '<div class="mfa-qr-wrap">'+(qr?'<button type="button" class="mfa-qr-open" data-id-action="mfa-qr-open" aria-label="'+esc(qrUi.enlarge)+'"><img src="'+esc(qr)+'" alt="TOTP QR" class="mfa-qr"></button>':'')+
      '<div class="mfa-scan-note">'+t('mfaScan')+'</div></div>'+
    '<div class="mfa-secret"><div>'+t('mfaManual')+'</div><code>'+esc(setupSecret)+'</code>'+ (setupSecret?'<button type="button" class="btn btn-outline mfa-copy-secret" data-id-action="mfa-copy-secret">'+icon('copy',15)+' '+esc(qrUi.copy)+'</button>':'')+'</div>'+
    '<p class="mfa-warning">'+icon('shield',16)+' '+t('mfaSecretWarn')+'</p>'+
    (auth.mfaQrExpanded&&qr?'<div class="mfa-qr-overlay" role="dialog" aria-modal="true" aria-label="'+esc(qrUi.enlarge)+'" data-id-action="mfa-qr-close"><button type="button" class="mfa-qr-close" aria-label="'+esc(qrUi.close)+'">×</button><img src="'+esc(qr)+'" alt="TOTP QR" class="mfa-qr-large"></div>':''):'';
  const statusText=auth.statusKey?'<p role="status" class="id-alert'+(auth.statusError?' id-alert-error':'')+'">'+t(auth.statusKey)+'</p>':'';
  const verifyForm=(enrollment||auth.mfaHasFactors)?
    '<form id="id-mfa-form" class="id-form mfa-code-form">'+
      '<label for="id-mfa-code">'+t('mfaCodeLabel')+'</label>'+
      '<input id="id-mfa-code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="one-time-code" required placeholder="'+t('mfaCodePlaceholder')+'">'+
      '<button type="submit" class="btn btn-primary"'+(auth.busy?' disabled':'')+'>'+icon('shield',17)+' '+t('mfaVerify')+'</button></form>':
    '<button class="btn btn-primary mfa-begin-btn" type="button" data-id-action="mfa-start"'+(auth.busy?' disabled':'')+'>'+icon('shield',18)+' '+t('mfaStart')+'</button>';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('profileNav')+'</span></div>'+
    '<div class="mfa-layout">'+
      '<section class="mfa-cover"><div class="id-brand-pill">'+icon('shield',17)+' AURVEX ID</div>'+
        '<div class="mfa-lock-symbol">'+icon('shield',75)+'</div>'+
        '<h1>'+title+'</h1><p>'+description+'</p>'+
        '<div class="mfa-level-row"><span>'+icon('check',17)+' Google OAuth</span>'+
          '<span>'+icon('shield',17)+' '+t('mfaPendingBadge')+'</span></div>'+
        '<p class="mfa-help">'+t('mfaHelp')+'</p>'+
      '</section>'+
      '<section class="mfa-panel">'+
        '<span class="smallcaps">'+t('mfaSecurity')+'</span>'+
        '<h2>'+(!enrollment&&auth.mfaHasFactors?t('mfaChallengeTitle'):t('mfaStart'))+'</h2>'+
        qrBlock+verifyForm+statusText+
        '<p class="mfa-care-note">'+icon('info',16)+' '+t('mfaNoBackup')+'</p>'+
        (isBackup?'<button type="button" data-id-action="mfa-cancel-backup" class="btn btn-outline">'+t('mfaCancelBackup')+'</button>':'')+
        '<button type="button" data-id-action="signout" class="btn btn-outline">'+t('mfaLogout')+'</button>'+
      '</section></div>';
}

// Shop cosmetics are rendered through a fixed allowlist, never arbitrary CSS.
function shopStyleAttrs(equipped){
 const e=equipped&&typeof equipped==='object'?equipped:{};
 const avatar=['avatar_violet','avatar_ruby','avatar_cyan','avatar_gold'].includes(e.avatar)?e.avatar:'none';
 const profile=['profile_emerald','profile_cosmic','profile_frost','profile_flame'].includes(e.profile)?e.profile:'none';
 return ' data-shop-avatar="'+avatar+'" data-shop-profile="'+profile+'"';
}
function renderProfileLinks(links,slot){
 const chosen=(Array.isArray(links)?links:[]).filter(l=>
  (['header','main','footer'].includes(l?.slot)?l.slot:'main')===slot);
 if(!chosen.length)return '';
 return '<div class="profile-placed-links profile-placed-'+slot+'">'+chosen.map(l=>{
   const align=['left','center','right'].includes(l.align)?l.align:'left';
   const safeUrl=String(l.url||'');
   if(!/^https:\/\//i.test(safeUrl))return '';
   return '<div class="profile-placed-link profile-align-'+align+'"><a href="'+esc(safeUrl)+
     '" target="_blank" rel="noopener noreferrer nofollow">'+icon('arrowUp',15)+' '+esc(l.title||'')+'</a></div>';
 }).join('')+'</div>';
}
function appearanceOptions(items,current){
 return items.map(([value,label])=>'<option value="'+value+'"'+(current===value?' selected':'')+'>'+t(label)+'</option>').join('');
}
function officialProfileBadges(titles){
  const items=Array.isArray(titles)?titles:[];
  const known=[
    ['aurvex_ceo','crown','profileTitleCeo'],
    ['site_launcher_developer','code','profileTitleDeveloper']
  ];
  const badges=known.filter(([code])=>items.includes(code));
  if(!badges.length)return '';
  return '<div class="official-profile-titles" aria-label="'+esc(t('profileOfficialTeam'))+'">'+
    badges.map(([code,ico,label])=>'<span class="official-profile-title official-profile-title-'+code+'">'+
      icon(ico,16)+' '+t(label)+'</span>').join('')+'</div>';
}
const customStatusEmojis=["😀","😎","💻","🎮","🔥","💜","✨","🚀","🌙","🎧","🛠️","☕","💤","❤️","🌸","👾","🧠","🎨","✅","💬"];
const customStatusDurations=['30m','1h','4h','1d','7d','never'];
function currentCustomStatus(profile){
 if(!profile||typeof profile!=='object')return null;
 const text=String(profile.profile_status_text||'').slice(0,80);
 const emoji=customStatusEmojis.includes(profile.profile_status_emoji)?profile.profile_status_emoji:'';
 const end=profile.profile_status_expires_at;
 if(end&&(!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.now()))return null;
 return text||emoji?{text,emoji,expiresAt:end||null}:null;
}
function customStatusPill(status){
 return status?'<span class="profile-custom-status" title="'+esc(t('profileCustomStatus'))+'">'+
  (status.emoji?'<span class="profile-custom-emoji">'+esc(status.emoji)+'</span>':'')+
  (status.text?'<span class="profile-custom-text">'+esc(status.text)+'</span>':'')+'</span>':'';
}
function profileMemberSince(joined,titles){
  // Special launch-era label is server-authorized for the original CEO.
  // All other accounts retain their real registration month and year.
  return Array.isArray(titles)&&titles.includes('aurvex_ceo')
    ? t('profileFounderSince')
    : t('profileMemberSince')+' '+esc(joined);
}
function playerProfilePage(auth){
  const nickname=auth.profile?.nickname||auth.user?.user_metadata?.preferred_username||'AURVEX PLAYER';
  const avatar=auth.avatarUrl?'<img src="'+esc(auth.avatarUrl)+'" alt="'+esc(t('profileAvatarUpload'))+'" loading="eager" decoding="async">':icon('user',48);
  const banner=auth.bannerUrl?'<img class="player-cover-image" src="'+esc(auth.bannerUrl)+'" alt="'+esc(t('profileProfileArt'))+'" decoding="async">':
    '<div class="player-cover-placeholder"><span class="player-cover-logo">A</span><span>'+t('profileNoArt')+'</span></div>';
  let joined=t('profileSinceUnknown');
  if(auth.user?.created_at){
    const date=new Date(auth.user.created_at);
    if(!Number.isNaN(date.valueOf())){
      joined=date.toLocaleDateString({en:'en-US',uk:'uk-UA',pl:'pl-PL',de:'de-DE'}[state.language]||'en-US',{month:'long',year:'numeric'});
    }
  }
  if(state.profileNicknameOwner===auth.user?.id&&
     state.profileNicknameDraft===auth.profile?.nickname){
    state.profileNicknameDraft=null;state.profileNicknameOwner='';
  }
  const inputNickname=state.profileNicknameOwner===auth.user?.id&&state.profileNicknameDraft!==null
    ?state.profileNicknameDraft:(auth.profile?.nickname||'');
  const saving=auth.busy?' disabled aria-disabled="true"':'';
  const socialDraft=window.AURVEX_SOCIAL?.draftUserId===auth.user?.id?window.AURVEX_SOCIAL?.socialDraft:null;
  const shownLinks=socialDraft?.links||auth.profile?.public_links||[];
  const shownWishlist=!!auth.profile?.wishlist_public;
  const visibleTitles=auth.profileTitles||[];
  const profileLinks=auth.profile?.public_links||[];
  const aboutDraft=window.AURVEX_SOCIAL?.aboutDraftUser===auth.user?.id?window.AURVEX_SOCIAL?.aboutDraft:null;
  const savedBio=auth.profile?.profile_bio||'';
  const profileBio=aboutDraft?.bio??savedBio;
  const savedCustomStatus=currentCustomStatus(auth.profile);
  const customDraft=window.AURVEX_SOCIAL?.customDraftUser===auth.user?.id?window.AURVEX_SOCIAL?.customDraft:null;
  const customText=customDraft?.text??(savedCustomStatus?.text||'');
  const rawCustomEmoji=customDraft?.emoji??savedCustomStatus?.emoji??'';
  const customEmoji=customStatusEmojis.includes(rawCustomEmoji)?rawCustomEmoji:'';
  const customDuration=customStatusDurations.includes(customDraft?.duration)?customDraft.duration:
   savedCustomStatus?.expiresAt?'1d':'never';
  const activeTab=['overview','links'].includes(state.profileTab)?state.profileTab:'overview';
  const tabData=[
    ['overview','user','profileTabOverview'],
    ['links','globe','profileTabLinks']
  ];
  const tabNav='<nav class="profile-tabs" role="tablist" aria-label="'+t('profileTabsLabel')+'">'+
    tabData.map(([tab,iconName,textKey])=>
      '<button type="button" id="profile-tab-'+tab+'" class="profile-tab'+(activeTab===tab?' is-active':'')+'" role="tab"'+
        ' aria-selected="'+(activeTab===tab)+'" aria-controls="profile-panel-'+tab+'" tabindex="'+(activeTab===tab?'0':'-1')+'" data-profile-tab="'+tab+'">'+
        icon(iconName,17)+'<span>'+t(textKey)+'</span></button>').join('')+'</nav>';
  // Always visible alongside the tabs, regardless of which editor section is open.
  const publicPreview='<a class="btn btn-outline profile-shop-action" href="#/shop">'+icon('sparkle',16)+
    '<span>'+t('shopNav')+'</span></a>'+
    '<a class="btn btn-accent profile-preview-action" href="#/player/'+esc(auth.user.id)+'"'+
    ' aria-label="'+esc(t('viewAsOthers'))+'">'+icon('eye',17)+'<span>'+t('viewAsOthers')+'</span></a>';
  const tabToolbar='<div class="profile-tab-toolbar">'+tabNav+publicPreview+'</div>';
  const panelStart=tab=>'<div id="profile-panel-'+tab+'" class="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-'+tab+'"'+
    (activeTab===tab?'':' hidden')+'>';
  const statusText=(auth.statusKey?'<div class="player-flash'+(auth.statusError?' player-flash-error':'')+'" role="status">'+t(auth.statusKey)+'</div>':'')+
    (window.AURVEX_SOCIAL?.message?'<div class="player-flash'+(window.AURVEX_SOCIAL.error?' player-flash-error':'')+
      '" role="status">'+t(window.AURVEX_SOCIAL.message)+'</div>':'');
  const avatarRemove=auth.profile?.avatar_path?
    '<button type="button" class="player-remove" data-id-action="remove-avatar"'+saving+'>'+icon('close',13)+' '+t('profileRemove')+'</button>':'';
  const bannerRemove=auth.profile?.banner_path?
    '<button type="button" class="player-remove" data-id-action="remove-banner"'+saving+'>'+icon('close',13)+' '+t('profileRemove')+'</button>':'';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('aurvexId')+'</span></div>'+
    '<div class="player-profile"'+shopStyleAttrs(window.AURVEX_SHOP?.userId&&window.AURVEX_SHOP.userId===auth.user?.id?window.AURVEX_SHOP.equipped:null)+'>'+
      '<header class="player-cover">'+banner+
        '<div class="player-cover-shade"></div>'+
        '<div class="player-cover-top"><span>'+icon('shield',17)+' '+t('profileEyebrow')+'</span>'+
          '<span class="player-verified">'+icon('shield',15)+' '+t('mfaVerifiedLabel')+'</span></div>'+
        '<div class="player-banner-edit">'+
          '<label class="player-banner-btn'+(auth.busy?' is-disabled':'')+'" for="id-banner-upload">'+icon('image',16)+' '+t('profileBannerUpload')+'</label>'+
          bannerRemove+
        '</div>'+
      '</header>'+
      '<div class="player-identity">'+
        '<div class="player-avatar-frame">'+avatar+'<label class="player-avatar-edit'+(auth.busy?' is-disabled':'')+'" for="id-avatar-upload" title="'+esc(t('profileAvatarUpload'))+'" aria-label="'+esc(t('profileAvatarUpload'))+'">'+icon('pencil',15)+'</label></div>'+
        '<div class="player-name-stack"><div class="smallcaps">'+t('profileProfileId')+'</div><h1>'+esc(nickname)+'</h1>'+
          officialProfileBadges(visibleTitles)+
          '<p>'+icon('calendar',15)+' '+profileMemberSince(joined,visibleTitles)+'</p>'+
          '<div class="profile-intro-row">'+customStatusPill(savedCustomStatus)+
          (savedBio?'<span class="profile-intro-description">'+esc(savedBio)+'</span>':'')+'</div>'+
          renderProfileLinks(profileLinks,'header')+'</div>'+
        '<span class="player-status">'+icon('shield',15)+' '+t('mfaProfileShield')+'</span>'+
      '</div>'+
      tabToolbar+
      '<div class="player-content profile-workspace" data-profile-workspace data-active-profile-tab="'+activeTab+'"><section class="player-main">'+
        panelStart('overview')+
        '<div class="player-section-heading"><span class="smallcaps">'+t('profileYourIdentity')+'</span><h2>'+t('profilePersonalize')+'</h2>'+
          '<p>'+t('profilePersonalizeDesc')+'</p></div>'+
        '<div class="player-edit-layout">'+
          '<div class="player-edit-card"><h3>'+icon('user',20)+' '+t('idProfileName')+'</h3>'+
            '<form id="id-nickname-form" class="id-form"><label for="id-nickname">'+t('idProfileName')+'</label>'+
              '<input id="id-nickname" name="nickname" type="text" inputmode="text" spellcheck="false" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="nickname" value="'+esc(inputNickname)+'" placeholder="'+esc(t('idProfileNamePlaceholder'))+'">'+
              '<p class="id-field-hint">3–24 · A–Z · 0–9 · _</p>'+
              '<button class="btn btn-primary" type="submit"'+saving+'>'+icon('check',17)+' '+t('idProfileSave')+'</button></form></div>'+
          '<div class="player-edit-card"><h3>'+icon('image',20)+' '+t('profileProfileArt')+'</h3>'+
            '<div class="player-media-choice">'+
              '<div><strong>'+t('profileAvatarUpload')+'</strong><p>'+t('profileAvatarHint')+'</p></div>'+
              '<div class="player-media-buttons"><label for="id-avatar-upload" class="btn btn-outline'+(auth.busy?' is-disabled':'')+'">'+icon('upload',15)+' '+t('profileAvatarUpload')+'</label>'+avatarRemove+'</div></div>'+
            '<div class="player-media-choice">'+
              '<div><strong>'+t('profileBannerUpload')+'</strong><p>'+t('profileBannerHint')+'</p></div>'+
              '<div class="player-media-buttons"><label for="id-banner-upload" class="btn btn-outline'+(auth.busy?' is-disabled':'')+'">'+icon('upload',15)+' '+t('profileBannerUpload')+'</label></div></div>'+
          '</div></div>'+
        '<section class="player-edit-card profile-about-editor"><div class="profile-about-heading"><h3>'+icon('pencil',19)+' '+t('profileAboutTitle')+'</h3>'+
          '<span class="profile-about-count">'+profileBio.length+' / 240</span></div>'+
         '<form id="profile-about-form" class="id-form">'+
          '<label for="profile-about-text">'+t('profileAboutLabel')+'</label>'+
          '<textarea id="profile-about-text" name="bio" maxlength="240" rows="3" placeholder="'+esc(t('profileAboutPlaceholder'))+'">'+esc(profileBio)+'</textarea>'+
          '<div class="profile-about-bottom"><button class="btn btn-primary" type="submit"'+saving+'>'+icon('check',16)+' '+t('profileAboutSave')+'</button></div>'+
         '</form><p class="profile-about-note">'+icon('info',14)+' '+t('profileAboutPublic')+'</p></section>'+
        '<section class="profile-status-studio"><div class="profile-status-heading"><div>'+
          '<span class="smallcaps">AURVEX / STATUS</span><h3>'+icon('sparkle',19)+' '+t('profileCustomStatus')+'</h3>'+
          '<p>'+t('profileCustomStatusHint')+'</p></div>'+
          '<div class="profile-status-live">'+
           (savedCustomStatus?customStatusPill(savedCustomStatus):'<span class="profile-status-empty">'+t('profileStatusEmpty')+'</span>')+
          '</div></div>'+
          '<form id="profile-custom-status-form" class="id-form">'+
            '<label for="profile-custom-status-text">'+t('profileStatusMessageLabel')+'</label>'+
            '<div class="profile-status-input"><span class="profile-status-input-emoji">'+esc(customEmoji||'💬')+'</span>'+
              '<input id="profile-custom-status-text" name="custom_text" maxlength="80" type="text" autocomplete="off" value="'+esc(customText)+'" placeholder="'+esc(t('profileStatusMessagePlaceholder'))+'">'+
              '<span class="profile-status-char-count">'+customText.length+'/80</span></div>'+
            '<label>'+t('profilePickEmoji')+'</label>'+
            '<div class="profile-emoji-picker" role="group" aria-label="'+esc(t('profilePickEmoji'))+'">'+
              '<button type="button" class="profile-emoji-option'+(customEmoji===''?' is-selected':'')+'" data-profile-emoji="" aria-label="'+esc(t('profileNoEmoji'))+'" aria-pressed="'+(customEmoji===''?'true':'false')+'">×</button>'+
              customStatusEmojis.map(emoji=>'<button type="button" class="profile-emoji-option'+(customEmoji===emoji?' is-selected':'')+'" data-profile-emoji="'+esc(emoji)+'" aria-label="'+esc(emoji)+'" aria-pressed="'+(customEmoji===emoji?'true':'false')+'">'+esc(emoji)+'</button>').join('')+'</div>'+
            '<input type="hidden" name="custom_emoji" value="'+esc(customEmoji)+'">'+
            '<div class="profile-status-footer"><label>'+t('profileStatusDuration')+
               '<select name="duration">'+customStatusDurations.map(duration=>'<option value="'+duration+'"'+(customDuration===duration?' selected':'')+'>'+t('profileDuration_'+duration)+'</option>').join('')+'</select></label>'+
              '<div class="profile-status-actions"><button type="button" class="btn btn-outline" data-profile-clear-status'+saving+'>'+icon('close',15)+' '+t('profileStatusClear')+'</button>'+
              '<button type="submit" class="btn btn-primary"'+saving+'>'+icon('check',16)+' '+t('profileStatusSave')+'</button></div></div>'+
          '</form><p class="profile-about-note">'+icon('clock',14)+' '+t('profileStatusExpirationHint')+'</p></section>'+
        renderProfileLinks(profileLinks,'main')+
        '<section class="inventory-privacy-card profile-online-visibility"><h3>'+icon('eye',19)+' '+t('social37Settings')+'</h3>'+
          '<label class="social-wish-toggle social37-online-control"><input type="checkbox" data-social37-action="visibility"'+(window.AURVEX_SOCIAL37?.showOnline?' checked':'')+(window.AURVEX_SOCIAL37?.busy?' disabled':'')+'>'+
            '<span><strong>'+t('social37ShowOnline')+'</strong><small>'+t('social37Privacy')+'</small></span></label></section>'+
        '<section class="inventory-privacy-card"><h3>'+icon('heart',19)+' '+t('socialWishlistPublic')+'</h3>'+
          '<form id="wishlist-privacy-form" class="id-form">'+
           '<label class="social-wish-toggle"><input type="checkbox" name="wishlist_public"'+(shownWishlist?' checked':'')+'>'+
             '<span><strong>'+t('socialWishlistPublic')+'</strong><small>'+t('socialWishlistPrivate')+'</small></span></label>'+
           '<button class="btn btn-outline" type="submit"'+saving+'>'+icon('check',16)+' '+t('socialSave')+'</button></form></section>'+
        '</div>'+
        panelStart('links')+
        '<section class="player-social-settings"><div class="smallcaps">'+t('socialSettings')+'</div>'+
          '<h2>'+t('socialSettings')+'</h2><p>'+t('socialSettingsDesc')+'</p>'+
          '<div class="player-social-actions"><button class="btn btn-outline" type="button" data-social-action="copy-profile"'+saving+'>'+
                icon('arrowUp',16)+' '+t('copyProfile')+'</button></div>'+
          '<form id="social-profile-form" class="id-form">'+
             '<p class="social-link-tip">'+t('socialLinkTip')+'</p>'+
             [1,2,3].map(i=>{const l=shownLinks[i-1]||{};return '<div class="social-link-fields">'+
              '<label>'+t('socialLinkTitle')+' '+i+'<input name="title'+i+'" type="text" maxlength="40" value="'+esc(l.title||'')+'" placeholder="TikTok, Discord, GitHub" autocomplete="off"></label>'+
              '<label>'+t('socialLinkUrl')+' '+i+'<input name="url'+i+'" type="text" inputmode="url" spellcheck="false" autocapitalize="none" autocomplete="url" maxlength="220" value="'+esc(l.url||'')+'" placeholder="https://github.com/username"></label>'+
              '<div class="social-link-layout"><label>'+t('customLinkArea')+
              '<select name="slot'+i+'">'+appearanceOptions([
                ['header','customAreaHeader'],['main','customAreaMain'],['footer','customAreaFooter']
              ],l.slot||'main')+'</select></label>'+
              '<label>'+t('customLinkAlign')+
              '<select name="align'+i+'">'+appearanceOptions([
                ['left','customAlignLeft'],['center','customAlignCenter'],['right','customAlignRight']
              ],l.align||'left')+'</select></label>'+
              '<div class="social-link-move"><button type="button" data-social-action="move-link-up" data-index="'+i+'" aria-label="'+t('customMoveUp')+'"'+(i===1?' disabled':'')+'>↑</button>'+
              '<button type="button" data-social-action="move-link-down" data-index="'+i+'" aria-label="'+t('customMoveDown')+'"'+(i===3?' disabled':'')+'>↓</button></div></div></div>'}).join('')+
             '<button class="btn btn-primary" type="submit"'+saving+'>'+icon('check',17)+' '+t('socialSave')+'</button></form></section>'+
        '</div>'+
        statusText+
        '<div class="player-privacy">'+icon('shield',20)+'<span>'+t('profileArtworkPublic')+'</span></div>'+
      '</section>'+
      '<aside class="player-aside"><div class="player-aside-card">'+
        '<div class="smallcaps">'+t('profileYourIdentity')+'</div>'+
        '<span class="player-aside-shield">'+icon('shield',27)+'</span>'+
        '<h3>'+t('aurvexId')+'</h3><p class="player-private-email">'+esc(auth.user?.email||'')+'</p>'+
        '<span class="player-account-badge">'+icon('shield',14)+' '+t('mfaVerifiedLabel')+'</span>'+
        '<button type="button" class="btn btn-outline player-signout" data-id-action="signout"'+saving+'>'+icon('back',15)+' '+t('idSignOut')+'</button></div>'+
      '<div class="player-aside-card player-wish-card"><div class="smallcaps">'+t('profileWishlist')+'</div>'+
        '<h3>'+icon('heart',20)+' '+t('profileWishlist')+'</h3>'+
        '<p>'+t('idWishlistSync')+'</p><a class="btn btn-outline" href="#/saved">'+t('profileWishlistView')+' '+icon('arrow',16)+'</a></div>'+
      '<div class="player-aside-card player-mfa-card"><div class="smallcaps">'+t('mfaSecurity')+'</div>'+
        '<h3>'+icon('shield',21)+' '+t('mfaProfileShield')+'</h3><p>'+t('mfaSecurityNote')+'</p>'+
        '<p>'+t('mfaFactors')+': '+(auth.mfaFactors?.length||1)+'</p>'+
        (auth.mfaFactors?.length<2?'<button class="btn btn-outline" type="button" data-id-action="mfa-backup">'+icon('shield',16)+' '+t('mfaAddBackup')+'</button>':'')+
        '<p class="mfa-backup-hint">'+t('mfaBackupDesc')+'</p></div></aside></div>'+
      renderProfileLinks(profileLinks,'footer')+
      '<input class="profile-file-input" id="id-avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="'+esc(t('profileAvatarUpload'))+'"'+saving+'>'+
      '<input class="profile-file-input" id="id-banner-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="'+esc(t('profileBannerUpload'))+'"'+saving+'>'+
    '</div>';
}
function idPage(route){
  const auth=window.AURVEX_ID||{};
  const configured=auth.configured===true;
  const signedIn=!!auth.user;
  if(signedIn){
    if(!auth.mfaVerified||auth.mfaEnrollment)return mfaGatePage(auth);
    return playerProfilePage(auth);
  }
  const mode=route.params.get('mode')==='register'?'register':'signin';
  const disabledEmail=(!configured||!auth.emailEnabled)?' disabled aria-disabled="true"':'';
  const disabledGoogle=(!configured||!auth.googleEnabled)?' disabled aria-disabled="true"':'';
  const message=auth.statusKey?'<p class="id-alert'+(auth.statusError?' id-alert-error':'')+'" role="status">'+t(auth.statusKey)+'</p>':'';
  const isBusy=auth.busy===true?' disabled':'';
  const card=signedIn?('<div class="id-form-header"><div class="smallcaps">'+t('idEmailVerified')+'</div><h2>'+t('idAccount')+'</h2></div>'+
    '<div class="id-user-chip">'+icon('shield',21)+'<span>'+esc(auth.user.email||'AURVEX ID')+'</span></div>'+
    '<form id="id-nickname-form" class="id-form"><label for="id-nickname">'+t('idProfileName')+'</label>'+
      '<input id="id-nickname" name="nickname" type="text" inputmode="text" spellcheck="false" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="nickname" value="'+esc(auth.profile?.nickname||'')+'" placeholder="'+t('idProfileNamePlaceholder')+'">'+
      '<p class="id-field-hint">3–24 · A–Z · 0–9 · _</p>'+
      '<button class="btn btn-primary" type="submit"'+isBusy+'>'+icon('check',16)+' '+t('idProfileSave')+'</button></form>'+
    '<p class="id-muted-note">'+icon('heart',16)+' '+t('idWishlistSync')+'</p>'+
    '<button type="button" class="btn btn-outline id-signout" data-id-action="signout"'+isBusy+'>'+icon('back',17)+' '+t('idSignOut')+'</button>'
  ):('<div class="id-form-header"><div class="smallcaps">'+t('idMethodLabel')+'</div><h2>'+t(mode==='register'?'idRegister':'idSignIn')+'</h2></div>'+
    (!configured?'<div class="id-setup"><div class="id-setup-icon">'+icon('shield',23)+'</div>'+
      '<strong>'+t('idSetupTitle')+'</strong><p>'+t('idSetupBody')+'</p><small>'+t('idSetupSmall')+'</small></div>':'')+
    '<button class="id-provider-btn" type="button" data-id-action="google"'+disabledGoogle+isBusy+'><span class="google-mark">G</span><span>'+t('idGoogle')+'</span>'+icon('arrow',17)+'</button>'+
    '<div class="id-divider"><span>'+t('idEmail')+'</span></div>'+
    (auth.pendingEmail?(
      '<div class="id-code-heading"><span>'+icon('mail',19)+'</span><strong>'+t('idEmailRequest')+'</strong></div>'+
      '<form class="id-form" id="id-code-form"><label for="id-code">'+t('idOtpLabel')+'</label>'+
        '<input id="id-code" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" required minlength="6" maxlength="6" pattern="[0-9]{6}" placeholder="••••••">'+
        '<button class="btn btn-primary" type="submit"'+isBusy+'>'+t('idOtpAction')+' '+icon('arrow',16)+'</button>'+
        '<p class="id-field-hint">'+t('idOtpHint')+'</p></form>'+
      '<button type="button" class="id-text-link" data-id-action="change-email">'+t('idEmailAddress')+' ↩</button>'
    ):(
      '<form class="id-form" id="id-email-form" data-mode="'+mode+'"><label for="id-email">'+t('idEmailAddress')+'</label>'+
        '<input id="id-email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="'+esc(t('idEmailPlaceholder'))+'"'+disabledEmail+'>'+
        '<button class="btn btn-primary" type="submit"'+disabledEmail+isBusy+'>'+icon('mail',17)+' '+t('idEmailAction')+'</button>'+
        '<p class="id-field-hint">'+t('idEmailHint')+'</p></form>'
    ))+
    '<button class="id-provider-btn id-xoni" type="button" disabled aria-disabled="true"><span class="id-xoni-icon">'+icon('shield',21)+'</span>'+
      '<span>'+t('idXoni')+'</span><span class="id-soon">'+t('idAvailableSoon')+'</span></button>'+
    '<p class="id-method-note">'+t('idXoniHint')+'</p>'+
    '<p class="id-mode-switch">'+t(mode==='register'?'idHaveAccount':'idNoAccountYet')+' <a href="'+(mode==='register'?'#/id':'#/id?mode=register')+'">'+t(mode==='register'?'idStartLogin':'idStartRegister')+'</a></p>'
  );
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('aurvexId')+'</span></div>'+
    '<div class="id-page">'+
      '<section class="id-intro"><div class="id-brand-pill">'+icon('shield',16)+' '+t('aurvexId')+'</div>'+
        '<h1>'+t('idHeading')+'</h1><p>'+t('idLead')+'</p>'+
        '<div class="id-connection"><div>'+icon('globe',21)+'<strong>AURVEX Store</strong></div>'+
          '<span>'+icon('arrow',20)+'</span><div>'+icon('gamepad',21)+'<strong>AURVEX Launcher</strong></div></div>'+
        '<div class="id-privacy"><div class="smallcaps">'+t('idPrivacyLabel')+'</div>'+
          '<p>'+t('idPrivacyText')+'</p></div></section>'+
      '<section class="id-panel"><div class="id-panel-top"><span class="id-avatar">'+icon('user',22)+'</span>'+
        '<span class="id-state'+(configured?' configured':'')+'">'+t(configured?'idStateReady':'idStateLocked')+'</span></div>'+
        card+message+'<p class="id-bottom-note">'+icon('shield',14)+' '+t('idLinkSoon')+'</p></section>'+
    '</div>';
}

function friendPlayerRow(player){
  const relation=player.relation||'none';
  const uuid=esc(player.player_id||player.peer_id||'');
  const avatar=player.avatarUrl?
    '<img src="'+esc(player.avatarUrl)+'" alt="" loading="lazy">':icon('user',24);
  const relationKeys={none:'friendsRelationNew',friend:'friendsRelationFriend',incoming:'friendsRelationIncoming',outgoing:'friendsRelationOutgoing',cooldown:'friendsRelationCooldown',unavailable:'friendsUnavailable'};
  const choices={
    none:[['send','friendsAdd','btn-accent']],
    friend:[['remove','friendsRemove','btn-outline']],
    incoming:[['accept','friendsAccept','btn-accent'],['decline','friendsDecline','btn-outline']],
    outgoing:[['cancel','friendsCancel','btn-outline']]
  };
  const buttons=(choices[relation]||[]).map(([action,label,cls])=>
    '<button class="btn '+cls+'" type="button" data-friend-action="'+action+
    '" data-player-id="'+uuid+'"'+(window.AURVEX_FRIENDS?.busy?' disabled':'')+'>'+
    icon(action==='accept'?'check':action==='send'?'users':'close',15)+' '+t(label)+'</button>').join('');
  return '<article class="friends-player"><div class="friends-avatar">'+avatar+'</div>'+
    '<div class="friends-player-info"><strong><a class="friend-profile-link" href="#/player/'+uuid+'">'+esc(player.nickname||t('friendsUnknown'))+'</a></strong>'+
    '<span>'+t(relationKeys[relation]||'friendsUnavailable')+
      (relation==='friend'?' · '+(((window.AURVEX_SOCIAL37?.onlineIds||[]).includes(uuid))?t('social37Online'):t('social37Offline')):'')+'</span></div>'+
    '<div class="friends-player-actions">'+(buttons||'<small>'+t('friendsUnavailable')+'</small>')+
     (relation==='friend'?'<button class="btn btn-outline" disabled title="'+t('giftExplain')+'">'+icon('gift',15)+' '+t('giftSoon')+'</button>':'')+
     '<a class="btn btn-outline" href="#/player/'+uuid+'" title="'+t('social37ViewProfile')+'">'+icon('user',14)+' '+t('social37ViewProfile')+'</a>'+
     (relation==='friend'&&window.AURVEX_SOCIAL37?.canInvite?
       '<button class="btn btn-outline" type="button" data-social37-action="invite-friend" data-player-id="'+uuid+'">'+icon('users',14)+' '+t('social37SendFamilyInvite')+'</button>':'')+
     '<button class="btn btn-outline" type="button" data-social37-action="block" data-player-id="'+uuid+'">'+icon('ban',14)+' '+t('social37Block')+'</button>'+
     '</div></article>';
}

function communityChatPage(){
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('chatNav')+'</span></div>'+
 '<section class="chat-hero"><div><div class="smallcaps">AURVEX COMMUNITY</div><h1>'+icon('message',29)+' '+t('chatTitle')+'</h1>'+
 '<p>'+t('chatIntro')+'</p><div class="chat-hero-tags"><span>'+icon('shield',14)+' '+t('chatVerifyRule')+'</span>'+
 '<span>'+icon('clock',14)+' '+t('chatSlowRule')+'</span><span>'+icon('globe',14)+' '+t('chatReadingRule')+'</span></div></div>'+
 '<div class="chat-hero-mark">'+icon('users',53)+'</div></section>'+
 '<div class="chat-layout"><section class="chat-room"><div class="chat-room-header"><div>'+
 '<span class="chat-presence-dot"></span><strong># '+t('chatGeneral')+'</strong><small id="chat-message-count"></small></div>'+
 '<div class="chat-header-buttons"><button type="button" data-chat-action="refresh" aria-label="'+esc(t('chatRefresh'))+'">'+icon('refresh',17)+'</button>'+
 '<button type="button" data-chat-action="show-hidden" aria-label="'+esc(t('chatShowHidden'))+'">'+icon('eye',17)+'</button>'+
 '<button type="button" class="chat-mobile-staff-button" data-mod-mobile-open hidden aria-label="'+esc(t('modTitle'))+'">'+icon('shield',17)+'</button></div></div>'+
 '<div id="chat-message-feed" class="chat-message-feed" role="log" aria-label="'+esc(t('chatGeneral'))+'" aria-live="off">'+
 '<div class="chat-empty">'+icon('message',27)+'<p>'+t('chatLoading')+'</p></div></div>'+
 '<div id="chat-notice" class="chat-notice" role="status"></div>'+
 '<div id="chat-compose-slot" class="chat-compose-slot" data-chat-mode="initial">'+
 '<div class="chat-locked">'+icon('shield',23)+'<span>'+t('chatReadOnly')+'</span></div></div></section>'+
 '<aside class="chat-side-column"><button type="button" class="chat-admin-backdrop" data-mod-mobile-close aria-label="'+esc(t('modClose'))+'"></button>'+
 '<div id="chat-admin-panel" class="chat-admin-slot"></div>'+
 '<section class="chat-guidelines"><div class="smallcaps">COMMUNITY RULES</div><h2>'+icon('shield',19)+' '+t('chatRules')+'</h2>'+
 '<p>'+t('chatRulesLead')+'</p><ul><li>'+t('chatRule1')+'</li><li>'+t('chatRule2')+'</li>'+
 '<li>'+t('chatRule3')+'</li><li>'+t('chatRule4')+'</li></ul>'+
 '<div class="chat-guideline-note">'+icon('info',18)+'<span>'+t('chatCaution')+'</span></div></section></aside></div>';
}

function friendsPage(){
  const auth=window.AURVEX_ID||{}, data=window.AURVEX_FRIENDS||{};
  if(!auth.user||!auth.mfaVerified){
    return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('friendsNav')+'</div>'+
      '<section class="friends-lock"><div class="friends-lock-icon">'+icon('shield',40)+'</div>'+
      '<div class="smallcaps">AURVEX SOCIAL</div><h1>'+t('friendsLockedTitle')+'</h1><p>'+
      t(auth.user?'friends2faNeeded':'friendsSignInNeeded')+'</p>'+
      '<a class="btn btn-accent" href="#/id">'+t('friendsOpenProfile')+' '+icon('arrow',16)+'</a></section>';
  }
  const all=data.relations||[];
  const members=all.filter(x=>x.relation==='friend');
  const incoming=all.filter(x=>x.relation==='incoming');
  const outgoing=all.filter(x=>x.relation==='outgoing');
  function group(items,empty){
    if(!data.ready)return '<div class="friends-empty">'+t('friendsLoading')+'</div>';
    return items.length?'<div class="friends-list">'+items.map(friendPlayerRow).join('')+'</div>':
      '<div class="friends-empty">'+icon('users',24)+'<p>'+t(empty)+'</p></div>';
  }
  const notice=data.statusKey?'<p role="status" class="friends-alert'+(data.statusError?' friends-error':'')+'">'+t(data.statusKey)+'</p>':'';
  const matches=data.query?(data.searching?'<p class="friends-empty">'+t('friendsSearching')+'</p>':
    data.results?.length?'<div class="friends-list friends-results">'+data.results.map(friendPlayerRow).join('')+'</div>':
      '<div class="friends-empty">'+t('friendsNoResults')+'</div>'):'';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('friendsNav')+'</span></div>'+
    '<header class="friends-hero"><div class="smallcaps">'+t('friendsEyebrow')+'</div><h1>'+t('friendsTitle')+'</h1>'+
    '<p>'+t('friendsLead')+'</p><div class="friends-stats">'+
      '<span>'+icon('users',16)+' '+members.length+' '+t('friendsNav')+'</span>'+
      '<span>'+icon('mail',16)+' '+incoming.length+' '+t('friendsIncoming')+'</span>'+
      '<span>'+icon('arrowUp',16)+' '+outgoing.length+' '+t('friendsOutgoing')+'</span>'+
    '</div></header>'+notice+
    '<div class="friends-columns"><div class="friends-main">'+
      '<section class="friends-panel"><div class="smallcaps">'+t('friendsMyFriends')+'</div><h2>'+t('friendsMyFriends')+'</h2>'+
        group(members,'friendsNoFriends')+'</section>'+
      '<section class="friends-panel"><div class="smallcaps">'+t('friendsRequests')+'</div><h2>'+t('friendsIncoming')+'</h2>'+
        group(incoming,'friendsNoIncoming')+'</section>'+
      '<section class="friends-panel"><div class="smallcaps">'+t('friendsRequests')+'</div><h2>'+t('friendsOutgoing')+'</h2>'+
        group(outgoing,'friendsNoOutgoing')+'</section></div>'+
      '<aside class="friends-panel friends-search-panel"><div class="smallcaps">'+t('friendsDiscover')+'</div>'+
      '<h2>'+t('friendsFindTitle')+'</h2><p>'+t('friendsFindLead')+'</p>'+
      '<form id="friends-search-form" role="search"><label for="friends-search-input">'+t('friendsSearchLabel')+'</label>'+
        '<div class="friends-input">'+icon('search',19)+'<input id="friends-search-input" type="search" name="nickname" required autocomplete="off" maxlength="24" placeholder="'+esc(t('friendsSearchPlaceholder'))+'" value="'+esc(data.query||'')+'"></div>'+
        '<button type="submit" class="btn btn-accent"'+(data.busy||data.searching?' disabled':'')+'>'+
        icon('search',16)+' '+t('friendsSearchButton')+'</button></form>'+
      '<p class="friends-privacy">'+icon('shield',16)+' '+t('friendsPrivacy')+'</p>'+matches+'</aside></div>';
}


function publicPlayerPage(path){
 const v=window.AURVEX_SOCIAL||{},id=path.slice(8);
 const p=v.profileTarget===id?v.profile:null,auth=window.AURVEX_ID||{};
 if(!p)return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('socialPlayerProfile')+'</div>'+
   '<div class="friends-lock"><h1>'+t('socialPlayerProfile')+'</h1><p>'+t(v.profileLoading?'friendsLoading':'socialPlayerMissing')+'</p></div>';
 const art=p.bannerUrl?'<img class="player-cover-image" src="'+esc(p.bannerUrl)+'" alt="">':'<div class="player-cover-placeholder"><span class="player-cover-logo">A</span></div>';
 const avatar=p.avatarUrl?'<img src="'+esc(p.avatarUrl)+'" alt="">':icon('user',48);
 const links=Array.isArray(p.public_links)?p.public_links:[],games=Array.isArray(p.wishlist_products)?p.wishlist_products:[];
 const date=new Date(p.joined_at);
 const joined=Number.isFinite(date.getTime())?date.toLocaleDateString({en:'en-US',uk:'uk-UA',pl:'pl-PL',de:'de-DE'}[state.language]||'en-US',{year:'numeric',month:'long'}):'';
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('socialPlayerProfile')+'</div>'+
  '<div class="player-profile public-profile"'+shopStyleAttrs(p.shop_equipped)+'>'+
   '<div class="player-cover">'+art+'<div class="player-cover-shade"></div></div>'+
   '<div class="player-identity"><div class="player-avatar-frame">'+avatar+'</div>'+
    '<div class="player-name-stack"><div class="smallcaps">AURVEX PLAYER</div><h1>'+esc(p.nickname)+'</h1>'+
     officialProfileBadges(p.profileTitles)+
     '<p>'+icon('calendar',15)+' '+profileMemberSince(joined,p.profileTitles)+'</p>'+
     customStatusPill(currentCustomStatus(p))+
     renderProfileLinks(links,'header')+'</div></div>'+
   '<div class="public-profile-body">'+
     (auth.user?.id&&auth.user.id!==id&&auth.mfaVerified?
      '<div class="public-profile-actions"><button class="btn btn-outline" type="button" data-social37-action="'+
        ((window.AURVEX_SOCIAL37?.blocked||[]).some(b=>b.id===id)?'unblock':'block')+
        '" data-player-id="'+esc(id)+'">'+icon('ban',16)+' '+t((window.AURVEX_SOCIAL37?.blocked||[]).some(b=>b.id===id)?'social37Unblock':'social37Block')+'</button></div>':'')+
    (auth.user?.id===id?'<div class="public-preview-note">'+icon('info',16)+' '+t('socialPreviewHint')+
     ' <a href="#/id">'+t('socialBackSettings')+'</a></div>':'')+
    (p.profile_bio?'<section class="public-block profile-about-public"><div class="smallcaps">AURVEX PLAYER</div>'+
       '<h2>'+t('profileAboutTitle')+'</h2><p>'+esc(p.profile_bio)+'</p></section>':'')+
    (links.some(l=>(l.slot||'main')==='main')?
      '<section class="public-block"><h2>'+t('socialLinksTitle')+'</h2>'+
      renderProfileLinks(links,'main')+'</section>':'')+
    '<section class="public-block"><h2>'+t('profileWishlist')+'</h2>'+
     (!p.wishlist_visible?'<div class="friends-empty">'+icon('shield',20)+' '+t('socialWishHidden')+'</div>':
      games.length?'<div class="public-links">'+games.map(g=>g==='devive'?
       '<a href="#/game/devive">'+icon('gamepad',17)+' Devive</a>':'<span>'+icon('gamepad',17)+' '+esc(g)+'</span>').join('')+'</div>':
       '<div class="friends-empty">'+t('socialWishEmpty')+'</div>')+'</section>'+
       renderProfileLinks(links,'footer')+'</div></div>';
}


function inventoryPage(){
 const auth=window.AURVEX_ID||{},sh=window.AURVEX_SHOP||{},m=window.AURVEX_INVENTORY||{};
 const signed=!!auth.user?.id&&auth.mfaVerified===true;
 const rows=signed&&sh.userId===auth.user.id&&sh.ready?(sh.inventory||[]):[];
 const games=signed&&m.userId===auth.user.id&&m.ready?(m.gameItems||[]):[];
 const friends=(window.AURVEX_FRIENDS?.relations||[]).filter(x=>x.relation==='friend'&&x.peer_id);
 const title=ref=>{const k='shopItem_'+ref;return t(k)===k?ref:t(k)};
 const shopItems=sh.catalog||[];
 const safeTheme=x=>['violet','ruby','cyan','gold','emerald','cosmic','frost','flame'].includes(x)?x:'violet';
 const owned=rows.map(x=>{const item=shopItems.find(v=>v.id===x.item_id);
   return {kind:'cosmetic',ref:x.item_id,name:title(x.item_id),section:'frames',
     theme:safeTheme(item?.theme||x.item_id.split('_').at(-1)),subtype:item?.kind||'avatar',
     game:'AURVEX',tradable:true,equipped:!!item&&sh.equipped?.[item.kind]===x.item_id};
 }).concat(games.map(x=>({kind:'game',ref:x.id,name:x.name,section:'games',
   theme:'game',subtype:x.item_code||'item',game:x.game_id,tradable:x.tradable===true,equipped:false})));
 const key=x=>x.kind+':'+x.ref;
 const sel=owned.find(x=>key(x)===m.selectedKey)||owned[0]||null;
 const category=m.category||'all',screen=m.screen==='trades'?'trades':'items';
 const visible=owned.filter(x=>(category==='all'||category==='tradable'&&x.tradable||
   category==='frames'&&x.section==='frames'||category==='games'&&x.section==='games')&&
   (!m.search||[x.name,x.game,x.subtype].join(' ').toLowerCase().includes(String(m.search).toLowerCase())));
 const peer=(m.peerItems||[]).filter(x=>x.tradable!==false).map(x=>({
   kind:x.kind,ref:x.ref,name:x.kind==='cosmetic'?title(x.ref):x.name,
   section:x.kind==='cosmetic'?'frames':'games',game:x.game_id||'AURVEX',
   theme:x.kind==='cosmetic'?safeTheme(x.ref.split('_').at(-1)):'game',tradable:true
 }));
 const selectedGive=Array.isArray(m.give)?m.give:[];
 const selectedTake=Array.isArray(m.take)?m.take:[];
 const art=(x,big)=>'<span class="si-art si-art-'+safeTheme(x.theme)+' '+(x.kind==='game'?'si-art-game':'')+(big?' is-large':'')+'">'+
  (x.kind==='game'?icon('gamepad',big?66:34):
   '<span class="si-orbit"><span class="si-orbit-core">'+icon('sparkle',big?42:22)+'</span></span>')+'</span>';
 const tile=(x,action,chosen)=>'<button type="button" class="si-tile'+(chosen?' is-selected':'')+'"'+
   ' data-inventory-action="'+action+'" data-inv-key="'+esc(key(x))+'"'+
   ' data-si-search="'+esc((x.name+' '+x.game+' '+x.subtype).toLowerCase())+'"'+
   ' title="'+esc(x.name)+'" aria-pressed="'+String(!!chosen)+'">'+
   art(x,false)+'<span class="si-tile-title">'+esc(x.name)+'</span>'+
   (x.equipped?'<span class="si-tile-equipped">'+icon('check',12)+'</span>':'')+
   (chosen&&action!=='inspect'?'<span class="si-tile-check">'+icon('check',14)+'</span>':'')+
   '</button>';
 const option=(v,label)=>'<option value="'+esc(v)+'"'+(m.peerId===v?' selected':'')+'>'+esc(label)+'</option>';
 const offerItems=(items)=>Array.isArray(items)?items:[];
 const summary=(items)=>items.length?'<div class="si-summary-items">'+items.slice(0,10).map(x=>
   '<span class="si-summary-chip">'+icon(x.kind==='game'?'gamepad':'sparkle',13)+' '+esc(x.kind==='cosmetic'?title(x.ref):
     (owned.find(v=>v.ref===x.ref)||peer.find(v=>v.ref===x.ref))?.name||t('invGame'))+'</span>').join('')+
   (items.length>10?'<span class="si-summary-chip">+'+(items.length-10)+'</span>':'')+'</div>':
   '<p class="si-summary-empty">'+t('siNothing')+'</p>';
 const offers=(m.offers||[]).map(o=>{
   const incoming=o.receiver_id===auth.user?.id;
   const pending=o.status==='pending'&&Date.parse(o.expires_at)>Date.now();
   const status=pending?'pending':o.status==='pending'?'expired':o.status;
   const sent=offerItems(o.offered_items),asked=offerItems(o.requested_items);
   const giving=incoming?asked:sent,getting=incoming?sent:asked;
   const gift=(incoming?asked:asked).length===0;
   return '<article class="si-offer"><div class="si-offer-head"><div><span class="smallcaps">'+
     t(incoming?'invIncoming':'invOutgoing')+'</span><h3>'+esc(o.peer_nickname||t('friendsUnknown'))+'</h3></div>'+
     '<span class="si-status">'+t('invStatus_'+status)+'</span></div>'+
     '<div class="si-offer-columns"><div><strong>'+t('invGive')+' · '+giving.length+'</strong>'+
      summary(giving)+'</div><div><strong>'+t('invGet')+' · '+getting.length+'</strong>'+
      summary(getting)+'</div></div>'+
     (gift?'<p class="si-gift-label">'+icon('gift',15)+' '+t('siGiftNotice')+'</p>':'')+
     (pending?(incoming?'<div class="si-offer-controls"><button type="button" class="btn btn-primary" data-inventory-action="accept" data-offer-id="'+esc(o.id)+'">'+t('invAccept')+'</button>'+
       '<button type="button" class="btn btn-outline" data-inventory-action="decline" data-offer-id="'+esc(o.id)+'">'+t('invDecline')+'</button></div>':
       '<div class="si-offer-controls"><button type="button" class="btn btn-outline" data-inventory-action="cancel" data-offer-id="'+esc(o.id)+'">'+t('invCancel')+'</button></div>'):'')+
     '</article>';
 }).join('');
 const nav='<div class="si-top-tabs" role="group" aria-label="'+esc(t('inventoryNav'))+'">'+
   '<button type="button" class="'+(screen==='items'?'active':'')+'" data-inventory-action="view-items">'+icon('layers',17)+' '+t('siInventoryTab')+'</button>'+
   '<button type="button" class="'+(screen==='trades'?'active':'')+'" data-inventory-action="view-trades">'+icon('arrow',17)+' '+t('siTradesTab')+
   (m.offers?.filter(x=>x.status==='pending'&&x.receiver_id===auth.user?.id).length?' <span class="si-tab-count">'+m.offers.filter(x=>x.status==='pending'&&x.receiver_id===auth.user?.id).length+'</span>':'')+'</button>'+
   '<button type="button" class="si-refresh" data-inventory-action="refresh" title="'+esc(t('siRefresh'))+'">'+icon('refresh',17)+'</button></div>';
 const cards=visible.length?'<div class="si-grid">'+visible.map(x=>tile(x,'inspect',sel&&key(sel)===key(x))).join('')+'</div>':
   '<div class="si-empty">'+icon('layers',40)+'<strong>'+t(owned.length?'siNoMatches':'siEmptyInventory')+'</strong>'+
   '<span>'+t(owned.length?'siAdjustFilters':'invNoFrames')+'</span><a href="#/shop">'+t('shopNav')+' '+icon('arrow',14)+'</a></div>';
 const tabs=[['all','siAll',owned.length],['frames','invFrames',rows.length],
   ['games','invGames',games.length],['tradable','siTradable',owned.filter(x=>x.tradable).length]];
 const detail=sel?'<div class="si-detail"><div class="smallcaps">'+esc(sel.game)+'</div>'+
   '<div class="si-detail-art">'+art(sel,true)+'</div><div class="si-detail-body"><h2>'+esc(sel.name)+'</h2>'+
   '<p>'+t(sel.section==='frames'?'siFrameDescription':'siGameDescription')+'</p>'+
   '<dl><div><dt>'+t('siCollection')+'</dt><dd>'+esc(sel.game)+'</dd></div>'+
   '<div><dt>'+t('siType')+'</dt><dd>'+t(sel.section==='frames'?'invFrames':'invGames')+'</dd></div>'+
   '<div><dt>'+t('siTradeStatus')+'</dt><dd>'+t(sel.tradable?'invTradable':'invNotTradable')+'</dd></div></dl>'+
   (sel.section==='frames'&&shopItems.some(z=>z.id===sel.ref)?'<button type="button" class="btn btn-primary" data-shop-action="'+(sel.equipped?'unequip':'equip')+
      '" data-item-id="'+esc(sel.ref)+'" data-kind="'+esc(sel.subtype)+'"'+(sh.busy?' disabled':'')+'>'+
     icon('sparkle',16)+' '+t(sel.equipped?'shopUnequip':'shopEquip')+'</button>':'')+
   (sel.tradable?'<button type="button" class="btn btn-outline" data-inventory-action="trade-selected">'+icon('arrow',16)+' '+t('siTradeThis')+'</button>':'')+
   '</div></div>':
   '<div class="si-detail si-detail-placeholder">'+icon('layers',40)+'<strong>'+t('siSelectItem')+'</strong></div>';
 const browser='<div class="si-workspace"><aside class="si-categories"><div class="si-categories-title">'+t('siCollections')+'</div>'+
   tabs.map(([cat,label,count])=>'<button type="button" class="'+(category===cat?'active':'')+'" data-inventory-action="category" data-inv-category="'+cat+'">'+
     icon(cat==='frames'?'sparkle':cat==='games'?'gamepad':cat==='tradable'?'arrow':'layers',17)+'<span>'+t(label)+'</span><b>'+count+'</b></button>').join('')+
   '</aside><section class="si-browser"><div class="si-browser-toolbar"><div><span class="smallcaps">'+t('siYourItems')+'</span>'+
   '<h2>'+t('siInventoryTab')+' <span>'+visible.length+' / '+owned.length+'</span></h2></div>'+
   '<label class="si-search">'+icon('search',16)+'<input data-inventory-search type="search" value="'+esc(m.search||'')+'" placeholder="'+esc(t('siSearch'))+'" autocomplete="off"></label></div>'+
   '<div class="si-browser-scroll">'+cards+'</div></section><aside class="si-details-col">'+detail+'</aside></div>';
 const giveItems=owned.filter(x=>x.tradable);
 const giveCount=selectedGive.length,takeCount=selectedTake.length;
 const tradeBox=(items,action,selected)=>{
   if(!items.length)return '<div class="si-mini-empty">'+t(action==='give-toggle'?'siNoTradable':'siPeerEmpty')+'</div>';
   return '<div class="si-mini-grid">'+items.map(x=>tile(x,action,selected.includes(key(x)))).join('')+'</div>';
 };
 const tradeScreen='<div class="si-trade-top"><div><span class="smallcaps">'+t('siTradeOffer')+'</span>'+
   '<h2>'+t('siBuildTrade')+'</h2><p>'+t('siTradeDescription')+'</p></div>'+
   '<label>'+t('invFriend')+'<select data-inventory-peer>'+
    option('',t('invSelectFriend'))+friends.map(x=>option(x.peer_id,x.nickname||x.peer_id)).join('')+
   '</select></label></div>'+
   (friends.length?'<div class="si-trade-columns"><section class="si-trade-column"><div class="si-trade-column-head"><div><span class="smallcaps">'+t('siYou')+'</span>'+
       '<h3>'+t('invGive')+' <span>'+giveCount+'</span></h3></div>'+
       '<div class="si-trade-tools"><button type="button" data-inventory-action="give-all">'+t('siSelectAll')+'</button>'+
       '<button type="button" data-inventory-action="give-clear">'+t('siClear')+'</button></div></div>'+
       tradeBox(giveItems,'give-toggle',selectedGive)+'</section>'+
     '<section class="si-trade-column"><div class="si-trade-column-head"><div><span class="smallcaps">'+t('siOtherPlayer')+'</span>'+
       '<h3>'+t('invGet')+' <span>'+takeCount+'</span></h3></div>'+
       '<div class="si-trade-tools"><button type="button" data-inventory-action="take-clear">'+t('siClear')+'</button></div></div>'+
       (!m.peerId?'<div class="si-mini-empty">'+t('siChooseFriend')+'</div>':
        !m.peerItemsReady?'<div class="si-mini-empty">'+t('invLoading')+'</div>':
        tradeBox(peer,'take-toggle',selectedTake))+'</section></div>'+
    '<div class="si-trade-review"><div>'+icon('shield',23)+'<div><strong>'+
     (takeCount===0?t('siGiftTitle'):t('siTradeTitle'))+'</strong><p>'+
      (takeCount===0?t('siGiftNotice'):t('siFinalNotice'))+'</p></div></div>'+
    '<div class="si-review-counts"><span>'+t('invGive')+': <b>'+giveCount+'</b></span><span>'+t('invGet')+': <b>'+takeCount+'</b></span></div>'+
    '<button type="button" class="btn btn-primary" data-inventory-action="send"'+
      (m.busy||!m.peerId||!m.peerItemsReady||!giveCount||giveCount>500?' disabled':'')+'>'+
      icon('arrow',17)+' '+t(takeCount===0?'siSendGift':'invSend')+'</button></div>':
     '<div class="si-empty">'+icon('users',36)+'<h3>'+t('invNeedFriends')+'</h3><a href="#/friends" class="btn btn-outline">'+t('friendsNav')+'</a></div>')+
   '<div class="si-trade-history"><div class="si-offers-title"><h2>'+t('invOffers')+'</h2><span>'+((m.offers||[]).length)+'</span></div>'+
   (offers?'<div class="si-offers">'+offers+'</div>':'<div class="si-mini-empty">'+t('invNoOffers')+'</div>')+'</div>';
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('inventoryNav')+'</span></div>'+
   '<section class="si-shell"><header class="si-header"><div><span class="smallcaps">AURVEX / COMMUNITY</span>'+
    '<h1>'+t('inventoryNav')+'</h1><p>'+t('invIntro')+'</p></div>'+
    '<div class="si-header-stats"><span>'+icon('layers',19)+'<b>'+owned.length+'</b> '+t('siItemsTotal')+'</span>'+
      '<span>'+icon('sparkle',18)+'<b>'+rows.length+'</b> '+t('invFrames')+'</span></div></header>'+
   (!signed?'<div class="si-login">'+icon('shield',32)+'<h2>'+t('invLogin')+'</h2>'+
      '<a href="#/id" class="btn btn-primary">'+t('idSignIn')+'</a></div>':
    nav+(m.messageKey?'<p class="shop-feedback'+(m.error?' is-error':'')+'" role="status">'+t(m.messageKey)+'</p>':'')+
      (screen==='items'?browser:tradeScreen))+'</section>';
}

function shopPage(){
 const m=window.AURVEX_SHOP||{},auth=window.AURVEX_ID||{};
 const signed=!!auth.user?.id&&auth.mfaVerified;
 const owned=new Set((m.userId===auth.user?.id&&m.inventory||[]).map(x=>x.item_id));
 const equipped=m.userId===auth.user?.id?m.equipped||{}:{};
 const balance=signed&&m.ready?String(m.balance??0):'—';
 const displayItem=item=>{
   const title=t('shopItem_'+item.id),kind=item.kind==='avatar'?'avatar':'profile';
   const isOwned=owned.has(item.id),isEquipped=equipped[kind]===item.id;
   const preview=m.previewId===item.id;
   const pts=Number.isSafeInteger(item.price_points)?item.price_points:0;
   const money=formatShopMoney(item.price_uah_kop);
   return '<article class="shop-card">'+
     '<div class="shop-card-preview" data-shop-card-theme="'+esc(item.theme)+'" data-shop-card-kind="'+kind+'" data-shop-card-id="'+esc(item.id)+'">'+
       '<span class="shop-art-ring"></span><span class="shop-art-core">A</span>'+
       '<span class="shop-art-smallcaps">AURVEX</span></div>'+
     '<div class="shop-card-body"><span class="smallcaps">'+t(kind==='avatar'?'shopAvatar':'shopProfile')+'</span>'+
     '<h3>'+esc(title)+'</h3><div class="shop-prices">'+
       '<span>'+icon('sparkle',15)+' '+pts+' '+t('shopPoints')+'</span><span>'+esc(money)+'</span></div>'+
     '<div class="shop-card-actions"><button class="btn btn-outline" type="button" data-shop-action="preview" data-item-id="'+esc(item.id)+'">'+
       icon('eye',15)+' '+t(preview?'shopHidePreview':'shopPreview')+'</button>'+
     (isOwned?'<button class="btn btn-primary" type="button" data-shop-action="'+(isEquipped?'unequip':'equip')+'" data-kind="'+kind+'" data-item-id="'+esc(item.id)+'"'+(m.busy?' disabled':'')+'>'+
         t(isEquipped?'shopUnequip':'shopEquip')+'</button>':
       '<button class="btn btn-primary" type="button" data-shop-action="buy-points" data-item-id="'+esc(item.id)+'"'+
       (!signed||!m.ready||m.busy||m.balance<pts?' disabled':'')+'>'+t('shopBuyPoints')+'</button>')+
     (isOwned?'':'<a class="btn btn-outline shop-money-button" href="#/checkout?kind=cosmetic&sku='+encodeURIComponent(item.id)+'">'+
       esc(money)+' · '+t('payPriceCheckout')+'</a>')+'</div>'+
     (preview?'<div class="shop-tryon"'+shopStyleAttrs(kind==='avatar'?{avatar:item.id}:{profile:item.id})+'>'+
       '<div class="shop-tryon-card"><div class="shop-tryon-avatar">A</div><strong>'+esc(auth.profile?.nickname||'AURVEX PLAYER')+'</strong>'+
       '<small>'+t('shopPreviewOnly')+'</small></div></div>':'')+
     '</div></article>';
 };
 const catalog=Array.isArray(m.catalog)?m.catalog:[];
 const list=kind=>catalog.filter(x=>x.kind===kind).map(displayItem).join('');
 const wallet=signed?('<div class="shop-wallet">'+icon('sparkle',25)+
   '<div><span>'+t('shopBalance')+'</span><strong>'+balance+' '+t('shopPoints')+'</strong></div>'+
   '<button class="btn btn-primary" type="button" data-action="stars-packs">'+icon('sparkle',15)+' '+t('starsBuyTitle')+'</button>'+
    '<a class="btn btn-outline" href="#/inventory">'+t('shopInventory')+' '+icon('arrow',15)+'</a></div>'):
   '<div class="shop-wallet">'+icon('shield',23)+' <p>'+t('shopSignInHint')+'</p>'+
   '<a href="#/id" class="btn btn-primary">'+t('idSignIn')+'</a></div>';
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('shopNav')+'</span></div>'+
   '<header class="shop-hero"><div class="smallcaps">AURVEX · STARS</div>'+
   '<h1>'+t('shopTitle')+'</h1><p>'+t('shopIntro')+'</p></header>'+
   wallet+
   '<p class="shop-currency-notice">'+t('currencyEstimate')+' · '+state.currency+(state.currency!=='UAH'&&currencyRate()===null?' · '+t('currencyUnavailable'):'')+'</p>'+ 
   (m.messageKey?'<p class="shop-feedback'+(m.error?' is-error':'')+'" role="status">'+t(m.messageKey)+'</p>':'')+
   (!m.catalogReady?'<div class="friends-empty">'+t('shopLoading')+'</div>':
     m.catalogError?'<div class="friends-empty">'+t('shopLoadError')+
       '<button class="btn btn-outline" type="button" data-shop-action="retry">'+t('shopRetry')+'</button></div>':
     '<section class="shop-section"><h2>'+icon('user',20)+' '+t('shopAvatarFrames')+'</h2><div class="shop-grid">'+list('avatar')+'</div></section>'+
     '<section class="shop-section"><h2>'+icon('layers',20)+' '+t('shopProfileFrames')+'</h2><div class="shop-grid">'+list('profile')+'</div></section>')+
   (signed&&m.ready?'<section class="shop-collection"><h2>'+icon('layers',19)+' '+t('shopCollectionTitle')+'</h2>'+
     '<p>'+t('shopCollectionCount')+': '+owned.size+'</p>'+
     (owned.size?'<div class="shop-collection-pills">'+(m.inventory||[]).map(x=>{
       const item=catalog.find(i=>i.id===x.item_id);
       if(!item)return '';
       const wearing=equipped[item.kind]===item.id;
       return '<span>'+esc(t('shopItem_'+item.id))+(wearing?' · '+t('shopEquipped'):'')+'</span>';
     }).join('')+'</div>':'<p>'+t('shopCollectionEmpty')+'</p>')+
     (Array.isArray(m.history)&&m.history.length?'<details><summary>'+t('shopHistory')+'</summary>'+
       '<div class="shop-history">'+m.history.slice(0,10).map(h=>
         '<div><span>'+(h.reason==='welcome'?t('shopWelcomeTransaction'):h.reason==='sale_payout'?t('shopSalePayout'):t('shopPurchaseTransaction'))+
         (h.item_id?' · '+esc(t('shopItem_'+h.item_id)):'')+'</span><strong>'+
         (h.points_delta>0?'+':'')+Number(h.points_delta||0)+' '+t('shopPoints')+'</strong></div>').join('')+'</div></details>':'')+
     '</section>':'')+
   '<section class="stars-packs"><div class="inventory-section-head"><h2>'+icon('sparkle',21)+' '+t('starsBuyTitle')+'</h2></div>'+
 '<p>'+t('starsBuyIntro')+'</p><div class="stars-pack-grid">'+[[100,3900],[350,11900],[800,24900],[1800,49900]].map(([stars,kop])=>
 '<article class="stars-pack"><strong>'+stars+' Stars</strong><span>'+esc(formatShopMoney(kop))+'</span>'+
 '<a class="btn btn-outline" href="#/checkout?kind=stars&sku=stars_'+stars+'">'+t('starsBuyButton')+' '+icon('arrow',15)+'</a></article>').join('')+'</div>'+
 '<p>'+t('starsBuyDisabled')+'</p></section>'+
    '<section class="shop-explainer"><h2>'+t('shopHow')+'</h2>'+
     '<p>'+t('shopWelcomeNote')+'</p><p>'+t('shopMoneyPending')+'</p>'+
     '<p>'+t('shopPointsDisclaimer')+'</p></section>';
}


function balancePage(){
 const id=window.AURVEX_ID||{},m=window.AURVEX_WALLET||{},payment=window.AURVEX_PAYMENTS||{};
 const signed=!!id.user?.id&&id.mfaVerified===true;
 const ready=signed&&m.userId===id.user.id&&m.ready;
 const sum=ready?formatAccountBalance(m.balanceUahKop):'— '+state.currency;
 const history=ready&&Array.isArray(m.entries)?m.entries:[];
 const rows=history.map(x=>'<div class="money-ledger-row"><span class="money-ledger-icon">'+icon('plus',17)+'</span>'+
   '<div><strong>'+t('balanceDeposit')+'</strong><small>'+esc(new Date(x.createdAt).toLocaleDateString(localeTags[state.language]||'en-US'))+
   '</small></div><b>+'+esc(formatAccountBalance(x.amountUahKop))+'</b></div>').join('');
 const cards=walletPacks.map(([uah,kop])=>
  '<a class="money-deposit-option" href="#/checkout?kind=wallet&sku=wallet_'+uah+'">'+
  '<span class="money-deposit-option-icon">'+icon('plus',18)+'</span><strong>'+esc(formatAccountBalance(kop))+'</strong>'+
  '<small>'+uah+' ₴ '+(state.currency==='UAH'?'':'· '+t('balanceApproximate'))+'</small>'+
  '<span class="money-deposit-arrow">'+icon('arrow',16)+'</span></a>').join('');
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('balanceNav')+'</span></div>'+
 '<section class="money-hero"><div class="money-hero-head"><span class="smallcaps">AURVEX ID · WALLET</span>'+
  '<span class="money-wallet-status">'+icon('shield',15)+' '+t('balanceProtected')+'</span></div>'+
  '<div class="money-hero-main"><div><p>'+t('balanceAvailable')+'</p><h1>'+esc(sum)+'</h1>'+
    '<div class="money-hero-sub">'+icon('globe',15)+' '+t('balanceCurrency')+': <strong>'+state.currency+'</strong>'+
      (ready?'<span>· '+t('balanceBase')+': '+esc((m.balanceUahKop/100).toFixed(2))+' ₴</span>':'')+'</div></div>'+
   '<div class="money-hero-mark">'+icon('wallet',48)+'</div></div>'+
  '<p class="money-hero-foot">'+t('balanceSeparateStars')+'</p></section>'+
 (!signed?'<section class="money-panel money-signin"><h2>'+t('balanceSignInTitle')+'</h2><p>'+t('balanceSignInHint')+'</p>'+
    '<a class="btn btn-primary" href="#/id">'+t('paySignIn')+' '+icon('arrow',16)+'</a></section>':
  '<div class="money-content"><section class="money-panel"><div class="money-section-heading"><div>'+
     '<span class="smallcaps">'+t('balanceTopUpSubtitle')+'</span><h2>'+t('balanceTopUp')+'</h2></div>'+
     icon('plus',22)+'</div><p>'+t('balanceChoose')+'</p>'+
     '<div class="money-deposit-grid">'+cards+'</div>'+
     '<p class="money-wallet-note">'+icon('info',17)+' '+t('balancePaymentPending')+'</p></section>'+
   '<section class="money-panel money-history"><div class="money-section-heading"><div><span class="smallcaps">AURVEX WALLET</span><h2>'+
     t('balanceHistory')+'</h2></div><button type="button" class="money-refresh" data-wallet-action="refresh"'+(m.loading?' disabled':'')+
     '>'+icon('refresh',16)+' '+t('balanceRefresh')+'</button></div>'+
     (!ready?'<p class="money-empty">'+t(m.error?'balanceLoadError':'balanceLoading')+'</p>':
       rows?'<div class="money-ledger-list">'+rows+'</div>':
        '<div class="money-history-empty">'+icon('wallet',31)+'<strong>'+t('balanceNoHistory')+'</strong><p>'+t('balanceNoHistoryHint')+'</p></div>')+
   '</section></div>')+
 '<p class="money-legal-note">'+t('balanceConversionNote')+'</p>';
}

function paymentCheckoutPage(route){
 const sku=route.params.get('sku'),kind=route.params.get('kind');
 const packs={stars_100:[100,3900],stars_350:[350,11900],stars_800:[800,24900],stars_1800:[1800,49900]};
 const walletPack=kind==='wallet'?walletPacks.find(x=>'wallet_'+x[0]===sku):null;
 const pack=kind==='stars'?packs[sku]:null;
 const frame=kind==='cosmetic'?(window.AURVEX_SHOP?.catalog||[]).find(x=>x.id===sku):null;
 const cents=walletPack?walletPack[1]:pack?pack[1]:frame?.price_uah_kop;
 if(!Number.isInteger(cents))return '<section class="pay-screen"><h1>'+t('payUnavailable')+'</h1><a href="#/shop">'+t('shopNav')+'</a></section>';
 const model=window.AURVEX_PAYMENTS||{},auth=window.AURVEX_ID||{};
 const title=walletPack?t('balanceDeposit')+' · '+walletPack[0]+' ₴':pack?pack[0]+' Stars':t('shopItem_'+sku);
 const actual=Array.isArray(model.checkoutCurrencies)&&model.checkoutCurrencies.includes(state.currency)?state.currency:'UAH';
 const ready=model.ready&&!!auth.user?.id&&auth.mfaVerified&&!model.busy;
 return '<div class="breadcrumb"><a href="#/shop">'+t('shopNav')+'</a>'+icon('arrow',13)+'<span>'+t('payTitle')+'</span></div>'+
  '<div class="pay-screen"><div class="smallcaps">AURVEX · PAYMENTS</div><h1>'+t('payTitle')+'</h1>'+
   '<p>'+t('payIntroduction')+'</p><div class="pay-product">'+
    '<span>'+icon(walletPack?'wallet':pack?'sparkle':'layers',30)+'</span><strong>'+esc(title)+'</strong></div>'+
   '<div class="pay-details"><div><span>'+t('payOriginal')+'</span><strong>'+(cents/100).toFixed(2)+' UAH</strong></div>'+
    '<div><span>'+t('payShown')+'</span><strong>'+state.currency+'</strong></div>'+
    '<div><span>'+t('payEstimate')+'</span><strong>'+esc(formatShopMoney(cents))+'</strong></div>'+
    '<div><span>'+t('payDebited')+'</span><strong>'+(model.ready?actual:t('payPending'))+'</strong></div></div>'+
   '<p class="pay-disclaimer">'+t('payRateDisclaimer')+'</p>'+
   (model.message?'<p class="shop-feedback'+(model.error?' is-error':'')+'" role="status">'+t(model.message)+'</p>':'')+
   '<div class="pay-buttons">'+(!auth.user?.id||!auth.mfaVerified?
    '<a class="btn btn-primary" href="#/id">'+t('paySignIn')+'</a>':
    '<button class="btn btn-primary" type="button" data-payment-action="checkout" data-kind="'+esc(kind)+'" data-sku="'+esc(sku)+'" data-currency="'+state.currency+'"'+
      (ready?'':' disabled')+'>'+icon('shield',16)+' '+t(ready?'payContinue':'payDisabled')+'</button>')+
   '<a class="btn btn-outline" href="#/shop">'+t('payBack')+'</a></div>'+
   '<div class="pay-safety">'+icon('shield',19)+' <p>'+t('paySafety')+'</p></div>'+
   '<div class="pay-safety">'+icon('globe',19)+' <p>'+t('payAllCurrencies')+'</p></div></div>';
}
function paymentResultPage(route){
 const id=route.params.get('order')||'';
 const model=window.AURVEX_PAYMENTS||{},orders=model.orders||[];
 const record=orders.find(x=>x.id===id);
 const status=record?.status||'pending';
 const label=status==='paid'?t('paySuccessful'):
   ['refunded','disputed','failed','refund_review'].includes(status)?t('payIssue'):t('payWaiting');
 return '<div class="pay-screen pay-result"><h1>'+t('payStatus')+'</h1><p>'+label+'</p>'+
   '<p>'+t('payCallbackOnly')+'</p>'+
   (record?'<strong>'+esc(record.sku)+' · '+esc(record.chargeCurrency)+' · '+esc(record.status)+'</strong>':'')+
   '<div class="pay-buttons"><button type="button" class="btn btn-outline" data-payment-action="refresh">'+
    icon('refresh',16)+' '+t('payRefresh')+'</button><a href="#/shop" class="btn btn-primary">'+t('payBack')+'</a></div></div>';
}

function familyPage(route){
 const auth=window.AURVEX_ID||{},m=window.AURVEX_SOCIAL||{},invite=route.params.get('invite');
 if(!auth.user||!auth.mfaVerified)return '<div class="breadcrumb">'+t('familyNav')+'</div>'+
  '<div class="friends-lock"><div class="friends-lock-icon">'+icon('shield',35)+'</div>'+
  '<h1>'+t('familyTitle')+'</h1><p>'+t('familyInvitePending')+'</p>'+
  '<a class="btn btn-primary" href="#/id">'+t('friendsOpenProfile')+'</a></div>';
 const note=m.message?'<p class="friends-alert'+(m.error?' friends-error':'')+'" role="status">'+t(m.message)+'</p>':'';
 if(!m.familyReady)return '<div class="friends-lock"><h1>'+t('familyTitle')+'</h1><p>'+t('friendsLoading')+'</p></div>';
 const f=m.family;
 if(!f)return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('familyNav')+'</div>'+
  '<header class="friends-hero"><div class="smallcaps">AURVEX</div><h1>'+t('familyTitle')+'</h1><p>'+t('familyNoFamily')+'</p></header>'+note+
  (invite?'<section class="family-panel"><h2>'+t('familyJoin')+'</h2><p>'+t('familyInvitePending')+'</p>'+
    '<button class="btn btn-accent" data-social-action="family-join" type="button"'+(m.busy?' disabled':'')+'>'+t('familyJoin')+'</button></section>':'')+
  '<section class="family-panel"><h2>'+t('familyCreateTitle')+'</h2>'+
   '<form id="family-create-form" class="id-form"><label for="family-name">'+t('familyName')+'</label>'+
    '<input id="family-name" type="text" name="family_name" required minlength="3" maxlength="40">'+
    '<button class="btn btn-primary" type="submit"'+(m.busy?' disabled':'')+'>'+t('familyCreate')+'</button></form>'+
   '<p class="social-muted">'+t('familyInviteOnly')+'</p></section>';
 const members=Array.isArray(f.members)?f.members:[],owned=Array.isArray(f.owned_shareable)?f.owned_shareable:[],
  shared=Array.isArray(f.shares)?f.shares:[],mine=f.owner_id===auth.user.id;
 const base='https://zalzsgfufvppvgvqfocf.supabase.co/storage/v1/object/public/aurvex-profile-media/';
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('familyNav')+'</div>'+
  '<header class="friends-hero"><div class="smallcaps">AURVEX FAMILY</div><h1>'+esc(f.name)+'</h1>'+
    '<p>'+t('familyLead')+'</p><div class="friends-stats"><span>'+icon('users',17)+' '+members.length+'/6 '+t('familyMembers')+'</span></div></header>'+note+
  '<div class="family-columns"><section class="family-panel"><h2>'+t('familyMembers')+'</h2>'+
   '<div class="friends-list">'+members.map(u=>'<div class="friends-player">'+
    '<div class="friends-avatar">'+(u.avatar_path?'<img src="'+esc(base+u.avatar_path.split('/').map(encodeURIComponent).join('/'))+'" alt="">':icon('user',25))+'</div>'+
    '<div class="friends-player-info"><strong><a href="#/player/'+esc(u.id)+'">'+esc(u.nickname)+'</a></strong>'+
      '<span>'+(u.is_owner?t('familyOwner'):'AURVEX ID')+'</span></div>'+
    (mine&&!u.is_owner?'<button class="btn btn-outline" type="button" data-social-action="family-kick" data-member-id="'+esc(u.id)+'"'+(m.busy?' disabled':'')+'>'+t('familyKick')+'</button>':'')+
    '</div>').join('')+'</div></section>'+
  '<section class="family-panel"><h2>'+t('familyOwned')+'</h2>'+
   (owned.length?'<div class="family-products">'+owned.map(g=>{
    const on=shared.some(sh=>sh.product_id===g&&sh.owner_id===auth.user.id);
    return '<div class="family-product"><strong>'+esc(g)+'</strong>'+
      '<button class="btn btn-outline" type="button" data-social-action="family-share" data-game="'+esc(g)+'" data-enabled="'+String(on)+'"'+(m.busy?' disabled':'')+'>'+
       t(on?'familyShareOff':'familyShareOn')+'</button></div>';
   }).join('')+'</div>':'<p class="social-muted">'+t('familyNoGames')+'</p>')+
   '<h2>'+t('familyShared')+'</h2>'+
   (shared.length?'<div class="family-products">'+shared.map(sh=>'<div class="family-product">'+icon('gamepad',18)+' '+esc(sh.product_id)+'</div>').join('')+'</div>':
      '<p class="social-muted">'+t('familyNoGames')+'</p>')+'</section>'+
  '<section class="family-panel"><h2>'+t('familyInviteLink')+'</h2><p>'+t('familyInviteInfo')+'</p>'+
   (mine?'<button class="btn btn-accent" data-social-action="family-invite" type="button"'+(m.busy?' disabled':'')+'>'+
       icon('arrowUp',16)+' '+t('familyInviteButton')+'</button>':'')+
   (m.inviteUrl?'<div class="family-invite"><input type="text" readonly value="'+esc(m.inviteUrl)+'" aria-label="'+t('familyInviteLink')+'">'+
    '<button class="btn btn-outline" type="button" data-social-action="copy-invite">'+t('familyCopyInvite')+'</button></div>':'')+
   '<p class="social-muted">'+t('familyPrivacy')+'</p>'+
   (mine&&members.length>1?'<p class="social-muted">'+t('familyOwnerLeave')+'</p>':
     '<button type="button" class="btn btn-outline" data-social-action="family-leave"'+(m.busy?' disabled':'')+'>'+
      t('familyLeave')+'</button>')+'</section></div>';
}

function socialNotificationsPage(route){
  const auth=window.AURVEX_ID||{}, social=window.AURVEX_SOCIAL37||{};
  if(!auth.user||!auth.mfaVerified)return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('social37Nav')+'</div>'+
    '<section class="friends-lock notifications-auth-gate"><div class="friends-lock-icon">'+icon('shield',36)+'</div><h1>'+t('social37Title')+'</h1>'+
      '<p>'+t('social37Login')+'</p><a class="btn btn-primary" href="#/id">'+t('friendsOpenProfile')+'</a></section>';
  const notes=Array.isArray(social.notifications)?social.notifications:[],blocked=Array.isArray(social.blocked)?social.blocked:[];
  const unread=notes.filter(n=>!n.read).length;
  const familyNotes=notes.filter(n=>n.kind==='family_invite'),friendNotes=notes.filter(n=>n.kind!=='family_invite');
  const filterValues=['all','unread','friends','family'];
  const requested=route?.params?.get('filter')||'all';
  const filter=filterValues.includes(requested)?requested:'all';
  const visible=notes.filter(n=>filter==='unread'?!n.read:filter==='friends'?n.kind!=='family_invite':filter==='family'?n.kind==='family_invite':true);
  const counts={all:notes.length,unread,friends:friendNotes.length,family:familyNotes.length};
  const labels={all:t('social37AllFilter'),unread:t('social37UnreadFilter'),friends:t('social37FriendsFilter'),family:t('social37FamilyFilter')};
  const filters=filterValues.map(key=>'<a class="notification-filter'+(filter===key?' active':'')+'" href="#/notifications?filter='+key+'"'+(filter===key?' aria-current="page"':'')+'>'+
    '<span>'+labels[key]+'</span><span class="notification-filter-count">'+counts[key]+'</span></a>').join('');
  const msg=social.status?'<div class="friends-alert'+(social.error?' friends-error':'')+'" role="status">'+t(social.status)+'</div>':'';
  const entries=visible.map(n=>{
    const family=n.kind==='family_invite',uid=esc(n.actor_id),nid=esc(n.id),avatar=n.avatarUrl?
      '<img src="'+esc(n.avatarUrl)+'" alt="">':icon('user',24);
    const title=family?'social37FamilyInvite':'social37FriendRequest';
    const created=Date.parse(n.created_at||''),delta=created-Date.now(),absolute=Math.abs(delta);
    const timeUnit=absolute<60000?'second':absolute<3600000?'minute':absolute<86400000?'hour':'day';
    const timeDivisor=timeUnit==='second'?1000:timeUnit==='minute'?60000:timeUnit==='hour'?3600000:86400000;
    const timeLabel=Number.isFinite(created)?'<time class="notification-time" datetime="'+new Date(created).toISOString()+'">'+
      esc(new Intl.RelativeTimeFormat(state.language,{numeric:'auto'}).format(Math.round(delta/timeDivisor),timeUnit))+'</time>':'';
    return '<article class="social-notification'+(n.read?' is-read':' is-unread')+'">'+
      '<div class="friends-avatar">'+avatar+'</div><div class="social-notification-copy">'+
      '<div class="notification-item-heading"><strong><a href="#/player/'+uid+'">'+esc(n.nickname||t('friendsUnknown'))+'</a></strong>'+
      '<span class="notification-item-meta">'+timeLabel+(!n.read?'<span class="notification-unread-badge">'+t('social37Unread')+'</span>':'')+'</span></div>'+
      '<p>'+t(title)+'</p><div class="social-notification-actions">'+
      (family?'<button type="button" class="btn btn-accent" data-social37-action="open-invite" data-notification-id="'+nid+'"'+(social.busy?' disabled':'')+'>'+
       icon('home',15)+' '+t('social37OpenInvite')+'</button>':
       '<a href="#/friends" class="btn btn-outline">'+icon('users',15)+' '+t('social37OpenFriends')+'</a>')+
      (!n.read?'<button type="button" class="btn btn-outline" data-social37-action="read" data-notification-id="'+nid+'"'+(social.busy?' disabled':'')+'>'+
       icon('check',14)+' '+t('social37Read')+'</button>':'')+
      '</div></div></article>';
  }).join('');
  const emptyMessage=filter==='unread'?t('social37CaughtUp'):(notes.length===0?t('social37Empty'):t('social37FilteredEmpty'));
  const notificationList=entries||'<div class="notification-empty-state"><span class="empty-icon">'+icon('bell',24)+'</span><strong>'+emptyMessage+'</strong></div>';
  const blockedList=blocked.length?blocked.map(b=>'<div class="friends-player">'+
    '<div class="friends-player-info"><strong>'+esc(b.nickname||t('friendsUnknown'))+'</strong></div>'+
    '<button type="button" class="btn btn-outline" data-social37-action="unblock" data-player-id="'+esc(b.id)+'"'+(social.busy?' disabled':'')+'>'+
      icon('ban',14)+' '+t('social37Unblock')+'</button></div>').join(''):
    '<div class="friends-empty">'+t('social37BlockedEmpty')+'</div>';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('social37Nav')+'</span></div>'+
    '<header class="friends-hero notifications-hero"><div class="smallcaps">'+t('social37Kicker')+'</div><h1>'+t('social37Title')+'</h1>'+
      '<p>'+t('social37Lead')+'</p><div class="notification-hero-stats"><span><strong>'+notes.length+'</strong> '+t('social37AllFilter')+'</span>'+
      '<span><strong>'+unread+'</strong> '+t('social37Unread')+'</span></div></header>'+msg+
    '<div class="social-notifications-layout"><div class="social-notifications-main"><section class="friends-panel notifications-panel">'+
      '<div class="notifications-toolbar"><nav class="notification-filters" aria-label="'+t('social37Nav')+'">'+filters+'</nav>'+
      (unread?'<button type="button" class="btn btn-outline notification-mark-all" data-social37-action="read-all"'+(social.busy?' disabled':'')+'>'+
        icon('check',15)+' '+t('social37MarkAll')+'</button>':'<span class="notification-caught-up">'+icon('check',14)+' '+t('social37CaughtUp')+'</span>')+
      '</div><div class="notifications-list">'+notificationList+'</div>'+
      '<p class="social-muted">'+t('social37FamilyInvitationHelp')+'</p></section></div>'+
      '<aside class="social-notification-settings"><details class="friends-panel social-notifications-blocked"><summary><span>'+t('social37BlockedTitle')+'</span>'+
        '<span class="notification-filter-count">'+blocked.length+'</span></summary><div class="friends-list">'+blockedList+'</div>'+
        '<p class="social-muted">'+t('social37BlockedNote')+'</p></details></aside></div>';
}
function footer(){
  const year=new Date().getFullYear();
  return '<footer class="footer"><div class="footer-inner"><div><h3>AURVEX<span style="color:var(--accent)">.</span></h3>'+
    '<p>'+t('footerTag')+'</p></div><div class="footer-links"><a href="#/browse">'+t('footerExplore')+'</a>'+
    '<a href="#/games">'+t('games')+'</a><a href="#/apps">'+t('apps')+'</a>'+
    '<a href="#/desktop">'+esc(launcherT('nav'))+'</a><a href="'+repoUrl+'" target="_blank" rel="noopener noreferrer">'+t('github')+' '+icon('arrowUp',13)+'</a></div></div>'+
    '<div class="footer-bottom"><span>© '+year+' AURVEX Team. '+t('footerRights')+'</span><span>'+t('footerLegal')+'</span><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API</a></div></footer>';
}
function render(keepScroll=false){
  const pos=window.scrollY;
  const route=routeInfo();route.path=safeRoute(route.path);
  document.documentElement.lang=state.language;
  document.documentElement.dataset.theme=state.theme;
  let page;
  if(route.path==='/')page=home();
  else if(route.path==='/desktop')page=desktopPage(route);
   
  else if(route.path==='/game/devive')page=gamePage();
  else if(route.path==='/rewards'||route.path==='/free')page=rewardsPage();
  else if(route.path==='/saved')page=savedPage();
  else if(route.path==='/id')page=idPage(route);
  else if(route.path==='/shop')page=shopPage();
  else if(route.path==='/balance')page=balancePage();
  else if(route.path==='/checkout')page=paymentCheckoutPage(route);
  else if(route.path==='/payment')page=paymentResultPage(route);
  else if(route.path==='/inventory')page=inventoryPage();
  else if(route.path==='/library')page='<section id="aurvex-library" class="library-page"></section>';
  else if(route.path==='/friends')page=friendsPage();
  else if(route.path==='/chat')page=communityChatPage();
  else if(route.path==='/notifications')page=socialNotificationsPage(route);
  else if(route.path==='/family')page=familyPage(route);
  else if(route.path.startsWith('/player/'))page=publicPlayerPage(route.path);
  else page=catalog(route);
  const title=route.path==='/game/devive'?'Devive':route.path==='/saved'?t('saved'):route.path==='/rewards'||route.path==='/free'?t('freeRewards'):route.path==='/id'?t('aurvexId'):route.path==='/shop'?t('shopNav'):route.path==='/balance'?t('balanceNav'):route.path==='/checkout'?t('payTitle'):route.path==='/payment'?t('payStatus'):route.path==='/inventory'?t('inventoryNav'):route.path==='/library'?t('libraryNav'):route.path==='/friends'?t('friendsNav'):route.path==='/chat'?t('chatNav'):route.path==='/notifications'?t('social37Nav'):route.path==='/family'?t('familyNav'):route.path==='/desktop'?launcherT('nav'):route.path.startsWith('/player/')?t('socialPlayerProfile'):route.path==='/'?'Store':t('browse');
  document.title=title+' | AURVEX';
  document.getElementById('app').innerHTML=header(route.path)+sidebar(route.path)+mobileNav(route.path)+
    '<main class="main" id="main-content"><div class="content">'+page+footer()+'</div></main>';
  if(route.path==='/library')window.dispatchEvent(new Event('aurvex:library-route'));
  document.body.classList.remove('menu-open');
  if(route.path==='/chat'){window.AURVEX_CHAT_MOUNT?.();window.AURVEX_CHAT_ADMIN_MOUNT?.();}
  if(keepScroll)window.scrollTo(0,pos);
}
function syncCatalogUrl(){
  const route=routeInfo();
  if(!['/browse','/games','/apps'].includes(route.path))return;
  if(typeof history==='undefined'||typeof history.replaceState!=='function')return;
  const params=new URLSearchParams();
  if(state.query.trim())params.set('q',state.query.trim());
  if(state.kind!=='all')params.set('kind',state.kind);
  if(state.genre!=='all')params.set('genre',state.genre);
  if(state.minPrice!=='')params.set('min',state.minPrice);
  if(state.maxPrice!=='')params.set('max',state.maxPrice);
  if(state.releaseYear!=='')params.set('year',state.releaseYear);
  const next='#'+route.path+(params.toString()?'?'+params.toString():'');
  if(next!==location.hash)history.replaceState(null,'',location.pathname+location.search+next);
}
function updateFilterUi(){
  const label=document.getElementById('genre-filter-label');
  const selected=selectedGenres();
  if(label){
    const name=selected.length===1?gameGenres.find(function(x){return x[0]===selected[0]})?.[1]:null;
    label.textContent=selected.length===0?t('allGenres'):selected.length===1?t(name):selected.length+' '+t('genresSelected');
  }
  const bubble=document.querySelector('#filter-genre .selection-bubble');
  if(bubble){bubble.textContent=String(selected.length);bubble.hidden=!selected.length}
  const count=document.getElementById('genre-selected-count');
  if(count)count.textContent=String(selected.length);
  const active=document.getElementById('active-filters');
  if(active)active.innerHTML=activeFilters();
}
function closeFilterMenus(except){
  document.querySelectorAll('details.filter-dropdown[open]').forEach(function(dropdown){
    if(dropdown!==except)dropdown.open=false;
  });
}
function refreshCatalog(){
  const route=routeInfo();route.path=safeRoute(route.path);
  const results=document.getElementById('catalog-results');
  const count=document.getElementById('catalog-count');
  if(!results||!count)return;
  const matches=catalogMatches(route).length;
  results.innerHTML=resultHTML(route);
  count.textContent=matches+' '+t(matches===1?'oneResult':'results');
  updateFilterUi();
  syncCatalogUrl();
}
function legacyCopyText(text){
  const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();field.setSelectionRange(0,field.value.length);
  let copied=false;try{copied=document.execCommand('copy')}catch{/* Clipboard fallback unavailable */}field.remove();return copied;
}
function copyTextToClipboard(text){
  if(legacyCopyText(text))return Promise.resolve();
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('clipboard-unavailable'));
}
function toast(message){
  const node=document.getElementById('toast');
  if(!node)return;
  node.textContent=message;node.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){node.classList.remove('show')},2600);
}
function setMenu(open){
  document.body.classList.toggle('menu-open',open);
  const toggle=document.querySelector('[data-action="menu"]');
  if(toggle)toggle.setAttribute('aria-expanded',String(open));
}
document.addEventListener('click',function(event){
  if(notificationsOpen&&!event.target.closest('.notification-popover-wrap')){
    notificationsOpen=false;
    const panel=document.getElementById('notifications-popover');if(panel)panel.hidden=true;
    document.querySelector('[data-action="notifications-toggle"]')?.setAttribute('aria-expanded','false');
  }
  const profileTab=event.target.closest('button[data-profile-tab]');
  if(profileTab){
    const next=profileTab.dataset.profileTab;
    if(!['overview','links'].includes(next))return;
    state.profileTab=next;
    const workspace=document.querySelector('[data-profile-workspace]');
    if(workspace)workspace.dataset.activeProfileTab=next;
    document.querySelectorAll('button[data-profile-tab]').forEach(button=>{
      const active=button.dataset.profileTab===next;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
    });
    document.querySelectorAll('.profile-tab-panel').forEach(panel=>{
      panel.hidden=panel.id!=='profile-panel-'+next;
    });
    return;
  }

  if(event.target.closest('.sidebar a,.mobile-bottom a'))setMenu(false);
  const dropdown=event.target.closest('details.filter-dropdown');
  if(!dropdown)closeFilterMenus();
  const choice=event.target.closest('[data-filter-choice]');
  if(choice){
    const filter=choice.dataset.filterChoice,value=choice.dataset.value;
    if(filter==='kind'&&['all','game','app'].includes(value))state.kind=value;
    if(filter==='year'&&(/^\d{4}$/.test(value)||value===''))state.releaseYear=value;
    if(filter==='sort'&&['featured','name','free'].includes(value))state.sort=value;
    const group=choice.closest('details.filter-dropdown');
    if(group){
      const display=group.querySelector('.filter-current');
      if(display)display.textContent=choice.querySelector('span')?.textContent||'';
      group.querySelectorAll('[data-filter-choice]').forEach(function(option){
        const chosen=option===choice;
        option.classList.toggle('chosen',chosen);
        option.setAttribute('aria-pressed',String(chosen));
      });
      group.open=false;
    }
    refreshCatalog();
    return;
  }
  const removable=event.target.closest('[data-remove-filter]');
  if(removable){
    const type=removable.dataset.removeFilter;
    if(type==='genre')state.genre=selectedGenres().filter(function(g){return g!==removable.dataset.value}).join(',')||'all';
    if(type==='kind')state.kind='all';
    if(type==='min')state.minPrice='';
    if(type==='max')state.maxPrice='';
    if(type==='year')state.releaseYear='';
    // Re-render to sync the filter controls with the removed chip.
    syncCatalogUrl();
    render(true);
    return;
  }
  const langChoice=event.target.closest('[data-pref-lang]');
  if(langChoice){
    const lang=langChoice.dataset.prefLang;
    if(supportedLanguages.includes(lang)){state.language=lang;store(STORAGE.locale,lang);render(true)}
    return;
  }
  const currencyChoice=event.target.closest('[data-pref-currency]');
  if(currencyChoice){
    const code=currencyChoice.dataset.prefCurrency;
    if(currencyCodes.has(code)){
      state.currency=code;store(STORAGE.currency,code);
      state.minPrice='';state.maxPrice='';syncCatalogUrl();render(true);
      if(currencyRate()===null)refreshCurrencyRates();
    }
    return;
  }
  if(!event.target.closest('details.pref-dropdown'))document.querySelectorAll('details.pref-dropdown[open]').forEach(x=>{x.open=false});
  const button=event.target.closest('[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='copy-launcher-command'){
    const command=document.querySelector('[data-launcher-command]')?.textContent||'';
    if(!command){toast(launcherT('copyFailed'));return}
    copyTextToClipboard(command).then(function(){toast(launcherT('copySuccess'))}).catch(function(){toast(launcherT('copyFailed'))});
    return;
  }
  if(action==='notifications-toggle'){notificationsOpen=!notificationsOpen;render(true);document.querySelector('[data-action="notifications-toggle"]')?.focus();return}
  if(action==='notifications-close'){notificationsOpen=false;render(true);document.querySelector('[data-action="notifications-toggle"]')?.focus();return}
  if(action==='menu'){setMenu(!document.body.classList.contains('menu-open'));return}
  if(action==='close-menu'){setMenu(false);return}
  if(action==='share'){
    const url=new URL('#/game/devive',document.baseURI).href;
    if(navigator.share){navigator.share({title:'Devive — AURVEX',url}).catch(function(){});}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){toast(t('linkCopied'))}).catch(function(){window.prompt(t('copyLink'),url)});}
    else window.prompt(t('copyLink'),url);
    return;
  }
  if(action==='genre-clear'){
    state.genre='all';
    document.querySelectorAll('[data-genre-option]').forEach(function(box){box.checked=false});
    refreshCatalog();
    return;
  }
  if(action==='dropdown-done'){
    const parent=button.closest('details.filter-dropdown');
    if(parent)parent.open=false;
    return;
  }
  if(action==='clear-filters'){
    state.query='';state.kind='all';state.genre='all';state.minPrice='';state.maxPrice='';state.releaseYear='';state.sort='featured';
    const route=routeInfo();
    if(route.path!=='/browse'||route.params.toString())location.hash='/browse';
    else render(true);
    return;
  }
  if(action==='stars-packs'){document.querySelector('.stars-packs')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(action==='theme'){
    state.theme=state.theme==='dark'?'light':'dark';
    store(STORAGE.theme,state.theme);render(true);return;
  }
  if(action==='claim-devive'){
    if(!window.AURVEX_ID?.user?.id||window.AURVEX_ID?.mfaVerified!==true){location.hash='#/id';return}
    if(!isDeviveOwned()&&!window.AURVEX_ID?.claimingGame)window.dispatchEvent(new CustomEvent('aurvex:claim-devive'));return;
  }
  if(action==='wishlist'){
    if(isDeviveOwned())return;
    state.wished=!state.wished;store(STORAGE.wish,state.wished?'1':'0');
    render(true);toast(t(state.wished?'savedAdded':'savedRemoved'));
    if(typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('aurvex:wishlist-changed',{detail:{wished:state.wished}}));return;
  }
});
document.addEventListener('change',function(event){
  if(event.target.matches('[data-genre-option]')){
    const selected=new Set(selectedGenres());
    if(event.target.checked)selected.add(event.target.value);
    else selected.delete(event.target.value);
    state.genre=[...selected].filter(function(g){return gameGenres.some(function(x){return x[0]===g})}).join(',')||'all';
    refreshCatalog();
  }
});
document.addEventListener('input',function(event){
  if(event.target.matches('[data-pref-search]')){
    const phrase=event.target.value.trim().toLowerCase();
    const panel=event.target.closest('.pref-panel');
    panel?.querySelectorAll('.pref-option').forEach(opt=>{opt.hidden=!opt.dataset.prefName.includes(phrase)});
    return;
  }
  if(event.target.id==='id-nickname'&&window.AURVEX_ID?.user?.id){
    state.profileNicknameOwner=window.AURVEX_ID.user.id;
    state.profileNicknameDraft=event.target.value;
    return;
  }
  if(event.target.id==='genre-lookup'){
    const query=event.target.value.trim().toLocaleLowerCase(state.language);
    document.querySelectorAll('[data-genre-row]').forEach(function(row){row.hidden=!!query&&!row.dataset.genreName.includes(query)});
    return;
  }
  if(event.target.id==='catalog-search'){
    state.query=event.target.value;refreshCatalog();
  }else if(event.target.id==='filter-min-price'){
    state.minPrice=event.target.value;refreshCatalog();
  }else if(event.target.id==='filter-max-price'){
    state.maxPrice=event.target.value;refreshCatalog();
  }
});
document.addEventListener('submit',function(event){
  if(event.target.id==='global-search-form'){
    event.preventDefault();
    const text=new FormData(event.target).get('q')?.toString().trim()||'';
    const url='/browse'+(text?'?q='+encodeURIComponent(text):'');
    if(location.hash==='#'+url)render(true);else location.hash=url;
  }
});
window.addEventListener('aurvex:id-state',function(){render(true)});
window.addEventListener('aurvex:library-claim-result',function(event){toast(t(event.detail?.success?'libraryAdded':'libraryClaimError'))});
window.addEventListener('aurvex:friends-state',function(){render(true)});
window.addEventListener('aurvex:shop-state',function(){render(true)});
window.addEventListener('aurvex:payment-state',function(){if(['/shop','/checkout','/payment'].includes(routeInfo().path))render(true)});
window.addEventListener('aurvex:wallet-state',function(){render(true)});
window.addEventListener('aurvex:inventory-state',function(){if(routeInfo().path==='/inventory')render(true)});
window.addEventListener('aurvex:social-state',function(){render(true)});
window.addEventListener('aurvex:social37-state',function(){render(true)});
window.addEventListener('aurvex:sync-wishlist',function(event){
  if(!event.detail||typeof event.detail.wished!=='boolean')return;
  state.wished=event.detail.wished;store(STORAGE.wish,state.wished?'1':'0');render(true);
});
window.addEventListener('hashchange',function(){notificationsOpen=false;render();window.scrollTo(0,0)});
window.addEventListener('keydown',function(event){
  const tab=event.target.closest?.('button[data-profile-tab]');
  if(tab&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
    const buttons=[...document.querySelectorAll('button[data-profile-tab]')];
    const current=buttons.indexOf(tab);
    if(current>=0){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
        (current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[next].click();
      buttons[next].focus();
      return;
    }
  }
  if(event.key==='Escape'){
    notificationsOpen=false;const pop=document.getElementById('notifications-popover');if(pop)pop.hidden=true;
    document.querySelector('[data-action="notifications-toggle"]')?.setAttribute('aria-expanded','false');
    document.querySelectorAll('details.pref-dropdown[open]').forEach(x=>{x.open=false});
    closeFilterMenus();setMenu(false);return;
  }
  if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable]')){
    const target=document.querySelector('#catalog-search')||document.querySelector('.top-search input');
    if(target){event.preventDefault();target.focus()}
  }
});
render();
refreshCurrencyRates();
