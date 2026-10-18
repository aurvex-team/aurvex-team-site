import { translations, supportedLanguages } from './i18n.js?v=20261018-391';

const repoUrl='https://github.com/aurvex-team/aurvex-team-site';
const sceneUrl='./assets/devive-scene.svg';
const galleryUrls=[sceneUrl,'./assets/devive-interior.svg','./assets/devive-hallway.svg'];
const STORAGE={locale:'aurvex.locale',theme:'aurvex.theme',wish:'aurvex.wishlist.devive'};
function getStored(k){try{return localStorage.getItem(k)}catch{return null}}
function store(k,v){try{localStorage.setItem(k,v)}catch{/* Browsing still works without storage */}}
const state={
  language:supportedLanguages.includes(getStored(STORAGE.locale))?getStored(STORAGE.locale):'en',
  theme:getStored(STORAGE.theme)==='light'?'light':'dark',
  wished:getStored(STORAGE.wish)==='1',
  query:'',sort:'featured',kind:'all',genre:'all',minPrice:'',maxPrice:'',releaseYear:'',profileTab:'overview',profileNicknameDraft:null,profileNicknameOwner:''
};
let toastTimer=0;
const pathIcons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2.2 5.2L9 15l2.2-5.2z"/>',
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
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>'
};
function icon(name,size=19){return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(pathIcons[name]||pathIcons.sparkle)+'</svg>'}
function t(key){return translations[state.language]?.[key]||translations.en[key]||key}
function esc(str){return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
function href(route){return '#'+route}
function routeInfo(){
  const raw=(location.hash||'#/').slice(1);
  const question=raw.indexOf('?');
  const path=(question<0?raw:raw.slice(0,question))||'/';
  const params=new URLSearchParams(question<0?'':raw.slice(question+1));
  return {path,params};
}
function safeRoute(path){return /^\/player\/[0-9a-f-]{36}$/i.test(path)?path:['/','/browse','/games','/apps','/free','/rewards','/saved','/about','/team','/support','/id','/friends','/family','/notifications','/shop','/game/devive'].includes(path)?path:'/'}
function isActive(path,where){
  if(where==='/browse')return ['/browse','/games','/apps'].includes(path);
  if(where==='/rewards')return path==='/rewards'||path==='/free';
  return where===path;
}
function navLink(route,key,ico,path,counter){
  return '<a class="side-link'+(isActive(path,route)?' active':'')+'" href="'+href(route)+'">'+icon(ico,18)+'<span>'+t(key)+'</span>'+(counter?'<span class="counter">'+counter+'</span>':'')+'</a>';
}
function header(path){
  const id=window.AURVEX_ID;
  const profileAvatar=id?.user&&id?.avatarUrl?
    '<img class="top-account-avatar" src="'+esc(id.avatarUrl)+'" alt="">':icon('user',17);
  const profileLabel=id?.user?(id.profile?.nickname||t('idAccount')):t('idSignIn');
  const langOptions=supportedLanguages.map(function(code){return '<option value="'+code+'"'+(state.language===code?' selected':'')+'>'+code.toUpperCase()+'</option>'}).join('');
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
    '<nav class="top-links" aria-label="Main navigation"><a href="#/" class="'+(path==='/'?'active':'')+'">'+t('discover')+'</a>'+
    '<a href="#/browse" class="'+(isActive(path,'/browse')?'active':'')+'">'+t('browse')+'</a>'+
    '<a href="#/shop" class="'+(path==='/shop'?'active':'')+'">'+t('shopNav')+'</a>'+
    '<a href="#/about" class="'+(path==='/about'?'active':'')+'">'+t('about')+'</a></nav>'+
    '<form id="global-search-form" class="top-search" role="search">'+icon('search',18)+'<input type="search" name="q" aria-label="'+t('search')+'" placeholder="'+t('searchPlaceholder')+'" maxlength="120"></form>'+
    '<div class="top-actions">'+liveBadge+'<label class="language-control" aria-label="'+t('language')+'">'+icon('globe',16)+'<select id="language-select" aria-label="'+t('language')+'">'+langOptions+'</select></label>'+
    '<button class="icon-btn" type="button" data-action="theme" title="'+t('toggleTheme')+'" aria-label="'+t('toggleTheme')+'">'+icon(state.theme==='dark'?'sun':'moon',18)+'</button>'+
    '<a class="icon-btn" href="#/saved" aria-label="'+t('saved')+'">'+icon('heart',19)+(state.wished?'<span class="wish-dot"></span>':'')+'</a>'+
    '<a class="icon-btn social-bell'+(path==='/notifications'?' active':'')+'" href="#/notifications" title="'+t('social37Nav')+'" aria-label="'+t('social37Nav')+'">'+
      icon('bell',19)+((window.AURVEX_SOCIAL37?.notifications||[]).some(x=>!x.read)?'<span class="wish-dot"></span>':'')+'</a>'+
    '<a class="account-header-btn'+(path==='/id'?' active':'')+'" href="#/id" aria-label="'+t('aurvexId')+'">'+profileAvatar+'<span>'+esc(profileLabel)+'</span></a></div></header>';
}
function sidebar(path){
  return '<div class="sidebar-shade" data-action="close-menu"></div><aside class="sidebar" id="site-sidebar">'+
    '<div class="side-group"><div class="side-label">'+t('store')+'</div>'+
      navLink('/','home','home',path)+navLink('/browse','browse','compass',path)+
      navLink('/rewards','free','gift',path)+navLink('/shop','shopNav','sparkle',path)+'</div>'+
    '<div class="side-group"><div class="side-label">'+t('yourSpace')+'</div>'+navLink('/saved','saved','heart',path)+navLink('/id','profileNav','user',path)+
      navLink('/friends','friendsNav','users',path,
        (window.AURVEX_FRIENDS?.relations||[]).filter(x=>x.relation==='incoming').length||0)+navLink('/family','familyNav','home',path)+navLink('/notifications','social37Nav','bell',path,
      (window.AURVEX_SOCIAL37?.notifications||[]).filter(n=>!n.read).length)+'</div>'+
    '<div class="side-group"><div class="side-label">'+t('more')+'</div>'+
      navLink('/team','team','layers',path)+navLink('/support','supportTeam','heart',path)+navLink('/about','about','info',path)+'</div>'+
    '<div class="side-space"></div><div class="side-promo"><div class="smallcaps">AURVEX</div><strong>'+t('bannerTitle')+'</strong>'+
    '<a href="#/about">'+t('bannerButton')+' '+icon('arrow',12)+'</a></div>'+
    '<div class="side-version">AURVEX STORE • PREVIEW 2.1</div></aside>';
}
function mobileNav(path){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation">'+
   mobileLink('/','home','home',path)+mobileLink('/browse','browse','compass',path)+mobileLink('/shop','shopNav','sparkle',path)+mobileLink('/friends','friendsNav','users',path)+mobileLink('/notifications','social37Nav','bell',path)+mobileLink('/id','profileNav','user',path)+'</nav>';
}
function mobileLink(route,key,ico,path){return '<a href="'+href(route)+'" class="'+(isActive(path,route)?'active':'')+'">'+icon(ico,19)+'<span>'+t(key)+'</span></a>'}
function tag(key,cls){return '<span class="tag'+(cls?' '+cls:'')+'">'+t(key)+'</span>'}
function wishlistButton(){return '<button class="heart-btn'+(state.wished?' is-saved':'')+'" type="button" data-action="wishlist" aria-pressed="'+String(state.wished)+'" aria-label="'+t(state.wished?'removeWish':'addWish')+'" title="'+t(state.wished?'removeWish':'addWish')+'">'+icon('heart',17)+'</button>'}
function gameCard(){
  return '<article class="game-card"><a href="#/game/devive" class="game-cover"><img src="'+sceneUrl+'" loading="lazy" alt="'+esc(t('conceptArtwork'))+'"><span class="cover-label">'+t('twoD')+'</span><span class="cover-logo">DEVIVE</span></a>'+
    '<div class="game-card-body"><div class="game-name"><h3><a href="#/game/devive">Devive</a></h3>'+tag('freeAtLaunch','tag-green')+'</div><p>'+t('deviveShort')+'</p>'+
    '<div class="card-meta">'+tag('gameType')+tag('horror')+tag('genrePsychological')+tag('inDevelopment','tag-amber')+'</div>'+
    '<div class="card-actions"><a class="btn btn-outline" href="#/game/devive">'+t('viewDetails')+' '+icon('arrow',14)+'</a>'+wishlistButton()+'</div></div></article>';
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
function ctaBand(){
  return '<div class="cta-band"><div><div class="smallcaps">'+t('bannerKicker')+'</div><h2>'+t('bannerTitle')+'</h2></div>'+
    '<a class="btn btn-primary" href="#/about">'+t('bannerButton')+' '+icon('arrow',16)+'</a></div>';
}
function home(){
  return '<div class="welcome-bar"><div><div class="smallcaps">'+t('beta')+'</div><h1>'+t('welcomeTitle')+'</h1><p>'+t('welcomeText')+'</p></div><span class="round-badge">✦ AURVEX STORE v2.0</span></div>'+
  '<section class="hero" aria-label="Devive game spotlight"><img class="hero-background" src="'+sceneUrl+'" alt="'+esc(t('conceptArtwork'))+'" fetchpriority="high">'+
    '<div class="hero-content"><div class="hero-label">'+t('eyebrow')+'</div><div class="hero-wordmark">DEVIVE</div>'+
    '<h2 class="hero-headline">'+t('heroTitle')+'<br>'+t('heroTitleAccent')+'</h2><p class="hero-description">'+t('heroCopy')+'</p>'+
    '<div class="hero-actions"><a class="btn btn-primary" href="#/game/devive">'+t('exploreDevive')+' '+icon('arrow',16)+'</a>'+
    '<button class="btn btn-soft" type="button" data-action="wishlist">'+icon('heart',17)+' '+t(state.wished?'removeWish':'addWish')+'</button></div>'+
    '<div class="hero-facts"><span>'+icon('gift',15)+' '+t('freeAtLaunch')+'</span><span>'+icon('clock',15)+' '+t('inDevelopment')+'</span><span>'+icon('gamepad',15)+' '+t('twoD')+'</span></div></div>'+
    '<span class="art-note">'+t('conceptArtwork')+'</span></section>'+
  '<section class="section">'+sectionHead('explore','discoverTitle','discoverText',null,null)+
    '<div class="category-grid">'+categoryCard('/games','gamepad','collectionGames','collectionGamesDesc','#6a65fd55')+
    categoryCard('/apps','laptop','collectionApps','collectionAppsDesc','#478fc955')+
    categoryCard('/rewards','gift','collectionFree','collectionFreeDesc','#3f9d8255')+
    categoryCard('/about','sparkle','collectionUpcoming','collectionUpcomingDesc','#c18a5b40')+'</div></section>'+
  '<section class="section">'+sectionHead('selectionKicker','selectionTitle','selectionSubtitle','showAll','/browse')+
    '<div class="editorial-grid">'+gameCard()+upcomingCard()+'</div></section>'+
  '<section class="section">'+sectionHead('whyKicker','whyTitle','whyText',null,null)+features()+'</section>'+
  '<section class="section">'+sectionHead('editorialKicker','editorialTitle','editorialDesc',null,null)+
    '<div class="feature-story"><div class="story-content"><div class="smallcaps">'+t('firstRelease')+'</div><h2>'+t('deviveQuote')+'</h2><p>'+t('deviveLong')+'</p>'+
    '<a href="#/game/devive" class="btn btn-soft">'+t('editorialLink')+' '+icon('arrow',16)+'</a></div></div></section>'+
  '<section class="section">'+sectionHead('whatsNext','announcing','announcementDesc',null,null)+
    '<div class="announcement-grid"><a href="#/about" class="announcement-card"><small>'+t('announcement')+'</small><h3>'+t('announcing')+'</h3><p>'+t('announcementDesc')+'</p></a>'+
    '<a href="#/game/devive" class="announcement-card"><small>'+t('firstRelease')+'</small><h3>'+t('updateDevive')+'</h3><p>'+t('updateDeviveDesc')+'</p></a></div></section>'+ctaBand();
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
    if(min!==null&&(!Number.isFinite(min)||min<0||product.price<min))return false;
    if(max!==null&&(!Number.isFinite(max)||max<0||product.price>max))return false;
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
  if(state.minPrice!=='')list.push(['min','',t('minPriceUah')+': '+state.minPrice]);
  if(state.maxPrice!=='')list.push(['max','',t('maxPriceUah')+': '+state.maxPrice]);
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
        '<label class="filter-field"><span>'+t('minPriceUah')+'</span><input id="filter-min-price" type="number" min="0" max="9999999" step="1" inputmode="numeric" placeholder="0" value="'+esc(state.minPrice)+'"></label>'+
        '<label class="filter-field"><span>'+t('maxPriceUah')+'</span><input id="filter-max-price" type="number" min="0" max="9999999" step="1" inputmode="numeric" placeholder="'+t('anyPrice')+'" value="'+esc(state.maxPrice)+'"></label>'+
        customChoice('filter-year',t('releaseYear'),yearList,state.releaseYear,'year','year-dropdown')+
      '</div>'+
      '<p class="filter-note">'+icon('info',15)+' '+t('filtersNote')+'</p>'+
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
    '<button class="btn btn-outline" type="button" data-action="wishlist">'+icon('heart',17)+' '+t(state.wished?'removeWish':'addWish')+'</button></div>'+
    '<p class="notice">'+t('devStatusNotice')+'</p><dl class="specs">'+specItems.map(function(x){return '<div><dt>'+t(x[0])+'</dt><dd>'+(x[1]==='AURVEX Team'?'AURVEX Team':t(x[1]))+'</dd></div>'}).join('')+'</dl></aside></div>'+ctaBand();
}
function savedPage(){
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('saved')+'</div>'+
    heading('savedTitle','savedSub','savedKicker')+
    (state.wished?'<div class="catalog-results">'+gameCard()+'</div>':'<div class="empty-state"><div class="empty-icon">'+icon('heart',30)+'</div><h3>'+t('savedEmpty')+'</h3><p>'+t('savedEmptyDesc')+'</p><a href="#/browse" class="btn btn-accent">'+t('exploreStore')+' '+icon('arrow',15)+'</a></div>')+
    '<div class="saved-banner">'+icon('shield',20)+t(window.AURVEX_ID?.user?'idWishlistSync':'localOnly')+'</div>';
}
function teamPage(){
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('team')+'</span></div>'+
    '<section class="team-hero"><div class="team-hero-copy"><div class="smallcaps">'+t('teamEyebrow')+'</div>'+
      '<h1>'+t('teamTitle')+'</h1><p>'+t('teamIntro')+'</p>'+
      '<div class="team-hero-actions"><a class="btn btn-accent team-join-btn" href="https://discord.gg/KWD2rfy2Vh" target="_blank" rel="noopener noreferrer" aria-label="'+t('teamJoin')+' — Discord">'+
        icon('arrowUp',17)+' '+t('teamJoin')+'</a>'+
      '<a class="btn btn-soft" href="#/game/devive">'+t('teamVisitGame')+' '+icon('arrow',15)+'</a></div>'+
      '<p class="team-join-hint">'+t('teamJoinHint')+'</p></div>'+
      '<div class="team-art" aria-hidden="true"><div class="team-orbit team-orbit-first"></div><div class="team-orbit team-orbit-second"></div>'+
        '<div class="team-symbol">A</div><div class="team-symbol-badge badge-one">'+icon('gamepad',25)+'</div>'+
        '<div class="team-symbol-badge badge-two">'+icon('sparkle',25)+'</div><div class="team-symbol-badge badge-three">'+icon('laptop',25)+'</div></div></section>'+
    '<section class="team-project"><div class="team-project-image"><img src="'+sceneUrl+'" loading="lazy" alt="'+esc(t('conceptArtwork'))+'"></div>'+
      '<div class="team-project-content"><span class="smallcaps">'+t('heroTag')+'</span><h2>'+t('teamWorkTitle')+'</h2>'+
      '<p>'+t('teamWorkCopy')+'</p><a href="#/game/devive" class="btn btn-outline">'+t('teamVisitGame')+' '+icon('arrow',15)+'</a></div></section>';
}
function supportPage(){
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('supportTeam')+'</span></div>'+
    '<section class="support-hero"><div class="support-hero-glow"></div><div class="support-hero-content">'+
      '<div class="smallcaps">'+t('supportEyebrow')+'</div><h1>'+t('supportTitle')+'</h1>'+
      '<p>'+t('supportIntro')+'</p><button class="btn btn-primary" type="button" data-action="share-site">'+
      icon('arrowUp',17)+' '+t('supportShareButton')+'</button></div>'+
      '<span class="support-decoration" aria-hidden="true">'+icon('heart',210)+'</span></section>'+
    '<div class="support-options">'+
      '<article class="support-option"><span class="support-icon">'+icon('arrowUp',24)+'</span>'+
        '<h2>'+t('supportShareTitle')+'</h2><p>'+t('supportShareDesc')+'</p>'+
        '<button class="btn btn-outline" type="button" data-action="share-site">'+t('supportShareButton')+' '+icon('arrow',15)+'</button></article>'+
      '<article class="support-option"><span class="support-icon">'+icon('heart',24)+'</span>'+
        '<h2>'+t('supportFundingTitle')+'</h2><p>'+t('supportFundingDesc')+'</p>'+
        '<span class="tag tag-amber">'+icon('clock',14)+' '+t('supportFundingStatus')+'</span></article>'+
      '<article class="support-option"><span class="support-icon">'+icon('gamepad',24)+'</span>'+
        '<h2>'+t('supportExploreTitle')+'</h2><p>'+t('supportExploreDesc')+'</p>'+
        '<a class="btn btn-outline" href="#/game/devive">'+t('teamVisitGame')+' '+icon('arrow',15)+'</a></article>'+
    '</div><div class="saved-banner">'+icon('shield',20)+'<span>'+t('supportNote')+'</span></div>';
}
function mfaGatePage(auth){
  const enrollment=auth.mfaEnrollment||null;
  const isBackup=!!(enrollment&&auth.mfaVerified);
  const enrollNeeded=!auth.mfaHasFactors&&!enrollment;
  const title=isBackup?t('mfaBackupTitle'):
    enrollment?t('mfaSetupTitle'):(enrollNeeded?t('mfaSetupTitle'):t('mfaChallengeTitle'));
  const description=auth.mfaHasFactors&&!enrollment?t('mfaChallengeIntro'):t('mfaSetupIntro');
  const setupSecret=enrollment?.secret||'';
  // Only trust the QR data-URI scheme expected from Supabase Auth.
  const qr=(typeof enrollment?.qr==='string'&&enrollment.qr.startsWith('data:image/svg+xml'))
    ?enrollment.qr:'';
  const qrBlock=enrollment?
    '<div class="mfa-qr-wrap">'+(qr?'<img src="'+esc(qr)+'" alt="TOTP QR" class="mfa-qr">':'')+
      '<div class="mfa-scan-note">'+t('mfaScan')+'</div></div>'+
    '<div class="mfa-secret"><div>'+t('mfaManual')+'</div>'+
      '<code>'+esc(setupSecret)+'</code></div>'+
    '<p class="mfa-warning">'+icon('shield',16)+' '+t('mfaSecretWarn')+'</p>':'';
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
function profileVisualAttrs(raw){
 const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const safe=(key,valid,fallback)=>valid.includes(v[key])?v[key]:fallback;
 const parts=[
  ['font',safe('font',['system','modern','rounded','mono','serif'],'system')],
  ['avatar',safe('avatar_frame',['none','violet','red','cyan','emerald','gold'],'violet')],
  ['frame',safe('profile_frame',['none','violet','red','cyan','emerald','gold'],'none')],
  ['color',safe('glow_color',['violet','red','cyan','emerald','gold'],'violet')]
 ];
 for(const zone of ['avatar','banner','name','links','profile']){
   parts.push(['glow-'+zone,v['glow_'+zone]===true?'on':'off']);
 }
 return parts.map(([key,val])=>' data-pf-'+key+'="'+val+'"').join('');
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
  const shownWishlist=socialDraft?socialDraft.wishlistPublic:!!auth.profile?.wishlist_public;
  const appearanceDraft=window.AURVEX_SOCIAL?.appearanceUserId===auth.user?.id?window.AURVEX_SOCIAL?.appearanceDraft:null;
  const appearance=appearanceDraft?.appearance||auth.profile?.profile_appearance||{};
  const hiddenTitles=appearanceDraft?.hidden||auth.profile?.hidden_title_codes||[];
  const visibleTitles=(auth.profileTitles||[]).filter(code=>!hiddenTitles.includes(code));
  const profileLinks=auth.profile?.public_links||[];
  const activeTab=['overview','links','appearance'].includes(state.profileTab)?state.profileTab:'overview';
  const tabData=[
    ['overview','user','profileTabOverview'],
    ['links','globe','profileTabLinks'],
    ['appearance','sparkle','profileTabAppearance']
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
    '<div class="player-profile"'+profileVisualAttrs(appearance)+shopStyleAttrs(window.AURVEX_SHOP?.userId===auth.user?.id?window.AURVEX_SHOP.equipped:null)+'>'+
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
        renderProfileLinks(profileLinks,'main')+
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
             '<label class="social-wish-toggle"><input type="checkbox" name="wishlist_public"'+(shownWishlist?' checked':'')+'>'+
               '<span><strong>'+t('socialWishlistPublic')+'</strong><small>'+t('socialWishlistPrivate')+'</small></span></label>'+
             '<button class="btn btn-primary" type="submit"'+saving+'>'+icon('check',17)+' '+t('socialSave')+'</button></form></section>'+
        '</div>'+
        panelStart('appearance')+
        '<section class="profile-custom-editor"><div class="smallcaps">'+t('customStudio')+'</div>'+
         '<h2>'+icon('sparkle',21)+' '+t('customStudio')+'</h2><p>'+t('customIntro')+'</p>'+
         '<form id="profile-appearance-form" class="id-form">'+
         '<div class="custom-select-grid">'+
         '<label>'+t('customFont')+'<select name="font">'+appearanceOptions([
           ['system','customFontSystem'],['modern','customFontModern'],['rounded','customFontRounded'],
           ['mono','customFontMono'],['serif','customFontSerif']
         ],appearance.font||'system')+'</select></label>'+
         '<label>'+t('customAvatarFrame')+'<select name="avatar_frame">'+appearanceOptions([
           ['none','customNone'],['violet','customViolet'],['red','customRed'],
           ['cyan','customCyan'],['emerald','customEmerald'],['gold','customGold']
         ],appearance.avatar_frame||'violet')+'</select></label>'+
         '<label>'+t('customProfileFrame')+'<select name="profile_frame">'+appearanceOptions([
           ['none','customNone'],['violet','customViolet'],['red','customRed'],
           ['cyan','customCyan'],['emerald','customEmerald'],['gold','customGold']
         ],appearance.profile_frame||'none')+'</select></label>'+
         '<label>'+t('customGlowColor')+'<select name="glow_color">'+appearanceOptions([
           ['violet','customViolet'],['red','customRed'],['cyan','customCyan'],
           ['emerald','customEmerald'],['gold','customGold']
         ],appearance.glow_color||'violet')+'</select></label></div>'+
         '<h3>'+icon('sparkle',17)+' '+t('customGlowZones')+'</h3>'+
         '<div class="custom-switch-grid">'+
         [['avatar','customGlowAvatar'],['banner','customGlowBanner'],
          ['name','customGlowName'],['links','customGlowLinks'],['profile','customGlowProfile']]
           .map(([key,label])=>'<label class="custom-switch"><input type="checkbox" name="glow_'+key+'"'+(appearance['glow_'+key]?' checked':'')+'>'+
           '<span>'+t(label)+'</span></label>').join('')+'</div>'+
         ((auth.profileTitles||[]).length?
           '<h3>'+icon('shield',17)+' '+t('customTitles')+'</h3><p>'+t('customTitlesHelp')+'</p>'+
           '<div class="custom-switch-grid">'+(auth.profileTitles||[]).map(code=>
             '<label class="custom-switch"><input type="checkbox" name="show_'+code+'"'+(!hiddenTitles.includes(code)?' checked':'')+'>'+
             '<span>'+t(code==='aurvex_ceo'?'profileTitleCeo':'profileTitleDeveloper')+'</span></label>').join('')+'</div>':'')+
         '<button class="btn btn-primary" type="submit"'+(window.AURVEX_SOCIAL?.busy?' disabled':'')+'>'+
          icon('check',17)+' '+t('customSave')+'</button></form></section>'+
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
  '<div class="player-profile public-profile"'+profileVisualAttrs(p.profile_appearance)+shopStyleAttrs(p.shop_equipped)+'>'+
   '<div class="player-cover">'+art+'<div class="player-cover-shade"></div></div>'+
   '<div class="player-identity"><div class="player-avatar-frame">'+avatar+'</div>'+
    '<div class="player-name-stack"><div class="smallcaps">AURVEX PLAYER</div><h1>'+esc(p.nickname)+'</h1>'+
     officialProfileBadges(p.profileTitles)+
     '<p>'+icon('calendar',15)+' '+profileMemberSince(joined,p.profileTitles)+'</p>'+
     renderProfileLinks(links,'header')+'</div></div>'+
   '<div class="public-profile-body">'+
     (auth.user?.id&&auth.user.id!==id&&auth.mfaVerified?
      '<div class="public-profile-actions"><button class="btn btn-outline" type="button" data-social37-action="'+
        ((window.AURVEX_SOCIAL37?.blocked||[]).some(b=>b.id===id)?'unblock':'block')+
        '" data-player-id="'+esc(id)+'">'+icon('ban',16)+' '+t((window.AURVEX_SOCIAL37?.blocked||[]).some(b=>b.id===id)?'social37Unblock':'social37Block')+'</button></div>':'')+
    (auth.user?.id===id?'<div class="public-preview-note">'+icon('info',16)+' '+t('socialPreviewHint')+
     ' <a href="#/id">'+t('socialBackSettings')+'</a></div>':'')+
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
   const hryvnia=Number.isSafeInteger(item.price_uah_kop)?(item.price_uah_kop/100).toFixed(0):'—';
   return '<article class="shop-card">'+
     '<div class="shop-card-preview" data-shop-card-theme="'+esc(item.theme)+'" data-shop-card-kind="'+kind+'">'+
       '<span class="shop-art-ring"></span><span class="shop-art-core">A</span>'+
       '<span class="shop-art-smallcaps">AURVEX</span></div>'+
     '<div class="shop-card-body"><span class="smallcaps">'+t(kind==='avatar'?'shopAvatar':'shopProfile')+'</span>'+
     '<h3>'+esc(title)+'</h3><div class="shop-prices">'+
       '<span>'+icon('sparkle',15)+' '+pts+' '+t('shopPoints')+'</span><span>'+hryvnia+' ₴</span></div>'+
     '<div class="shop-card-actions"><button class="btn btn-outline" type="button" data-shop-action="preview" data-item-id="'+esc(item.id)+'">'+
       icon('eye',15)+' '+t(preview?'shopHidePreview':'shopPreview')+'</button>'+
     (isOwned?'<button class="btn btn-primary" type="button" data-shop-action="'+(isEquipped?'unequip':'equip')+'" data-kind="'+kind+'" data-item-id="'+esc(item.id)+'"'+(m.busy?' disabled':'')+'>'+
         t(isEquipped?'shopUnequip':'shopEquip')+'</button>':
       '<button class="btn btn-primary" type="button" data-shop-action="buy-points" data-item-id="'+esc(item.id)+'"'+
       (!signed||!m.ready||m.busy||m.balance<pts?' disabled':'')+'>'+t('shopBuyPoints')+'</button>')+
     '<button class="btn btn-outline shop-money-button" type="button" disabled title="'+esc(t('shopMoneyPending'))+'">'+
       hryvnia+' ₴ · '+t('shopComingSoon')+'</button></div>'+
     (preview?'<div class="shop-tryon"'+shopStyleAttrs(kind==='avatar'?{avatar:item.id}:{profile:item.id})+'>'+
       '<div class="shop-tryon-card"><div class="shop-tryon-avatar">A</div><strong>'+esc(auth.profile?.nickname||'AURVEX PLAYER')+'</strong>'+
       '<small>'+t('shopPreviewOnly')+'</small></div></div>':'')+
     '</div></article>';
 };
 const catalog=Array.isArray(m.catalog)?m.catalog:[];
 const list=kind=>catalog.filter(x=>x.kind===kind).map(displayItem).join('');
 const wallet=signed?('<div class="shop-wallet">'+icon('sparkle',25)+
   '<div><span>'+t('shopBalance')+'</span><strong>'+balance+' '+t('shopPoints')+'</strong></div>'+
   '<a class="btn btn-outline" href="#/id">'+t('shopInventory')+' '+icon('arrow',15)+'</a></div>'):
   '<div class="shop-wallet">'+icon('shield',23)+' <p>'+t('shopSignInHint')+'</p>'+
   '<a href="#/id" class="btn btn-primary">'+t('idSignIn')+'</a></div>';
 return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('shopNav')+'</span></div>'+
   '<header class="shop-hero"><div class="smallcaps">AURVEX · POINTS SHOP</div>'+
   '<h1>'+t('shopTitle')+'</h1><p>'+t('shopIntro')+'</p></header>'+
   wallet+
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
         '<div><span>'+t(h.reason==='welcome'?'shopWelcomeTransaction':'shopPurchaseTransaction')+
         (h.item_id?' · '+esc(t('shopItem_'+h.item_id)):'')+'</span><strong>'+
         (h.points_delta>0?'+':'')+Number(h.points_delta||0)+'</strong></div>').join('')+'</div></details>':'')+
     '</section>':'')+
   '<section class="shop-explainer"><h2>'+t('shopHow')+'</h2>'+
     '<p>'+t('shopWelcomeNote')+'</p><p>'+t('shopMoneyPending')+'</p>'+
     '<p>'+t('shopPointsDisclaimer')+'</p></section>';
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

function socialNotificationsPage(){
  const auth=window.AURVEX_ID||{}, social=window.AURVEX_SOCIAL37||{};
  if(!auth.user||!auth.mfaVerified)return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('social37Nav')+'</div>'+
    '<section class="friends-lock"><div class="friends-lock-icon">'+icon('shield',36)+'</div><h1>'+t('social37Title')+'</h1>'+
      '<p>'+t('social37Login')+'</p><a class="btn btn-primary" href="#/id">'+t('friendsOpenProfile')+'</a></section>';
  const notes=Array.isArray(social.notifications)?social.notifications:[],blocked=Array.isArray(social.blocked)?social.blocked:[];
  const unread=notes.filter(n=>!n.read).length;
  const msg=social.status?'<div class="friends-alert'+(social.error?' friends-error':'')+'" role="status">'+t(social.status)+'</div>':'';
  const entries=notes.map(n=>{
    const family=n.kind==='family_invite',uid=esc(n.actor_id),nid=esc(n.id),avatar=n.avatarUrl?
      '<img src="'+esc(n.avatarUrl)+'" alt="">':icon('user',24);
    const title=family?'social37FamilyInvite':'social37FriendRequest';
    return '<article class="social-notification'+(n.read?' is-read':' is-unread')+'">'+
      '<div class="friends-avatar">'+avatar+'</div><div class="social-notification-copy">'+
      '<strong><a href="#/player/'+uid+'">'+esc(n.nickname||t('friendsUnknown'))+'</a></strong>'+
      '<p>'+t(title)+'</p><div class="social-notification-actions">'+
      (family?'<button type="button" class="btn btn-accent" data-social37-action="open-invite" data-notification-id="'+nid+'"'+(social.busy?' disabled':'')+'>'+
       icon('home',15)+' '+t('social37OpenInvite')+'</button>':
       '<a href="#/friends" class="btn btn-outline">'+icon('users',15)+' '+t('social37OpenFriends')+'</a>')+
      (!n.read?'<button type="button" class="btn btn-outline" data-social37-action="read" data-notification-id="'+nid+'"'+(social.busy?' disabled':'')+'>'+
       icon('check',14)+' '+t('social37Read')+'</button>':'')+
      '</div></div></article>';
  }).join('');
  const blockedList=blocked.length?blocked.map(b=>'<div class="friends-player">'+
    '<div class="friends-player-info"><strong>'+esc(b.nickname||t('friendsUnknown'))+'</strong></div>'+
    '<button type="button" class="btn btn-outline" data-social37-action="unblock" data-player-id="'+esc(b.id)+'"'+(social.busy?' disabled':'')+'>'+
      icon('ban',14)+' '+t('social37Unblock')+'</button></div>').join(''):
    '<div class="friends-empty">'+t('social37BlockedEmpty')+'</div>';
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+'<span>'+t('social37Nav')+'</span></div>'+
    '<header class="friends-hero"><div class="smallcaps">AURVEX SOCIAL</div><h1>'+t('social37Title')+'</h1>'+
      '<p>'+t('social37Lead')+'</p><div class="friends-stats"><span>'+icon('bell',17)+' '+unread+' '+t('social37Unread')+'</span></div></header>'+msg+
    '<div class="social-notifications-layout"><div class="social-notifications-main"><section class="friends-panel">'+
      '<h2>'+t('social37Nav')+'</h2>'+
      (entries||'<div class="friends-empty">'+icon('bell',24)+' '+t('social37Empty')+'</div>')+
      '<p class="social-muted">'+t('social37FamilyInvitationHelp')+'</p></section></div>'+
      '<aside class="social-notification-settings"><section class="friends-panel">'+
        '<div class="smallcaps">'+t('social37Settings')+'</div><h2>'+t('social37Settings')+'</h2>'+
        '<label class="social-wish-toggle social37-online-control">'+
        '<input type="checkbox" data-social37-action="visibility"'+(social.showOnline?' checked':'')+(social.busy?' disabled':'')+'>'+
        '<span><strong>'+t('social37ShowOnline')+'</strong><small>'+t('social37Privacy')+'</small></span></label>'+
       '</section><section class="friends-panel"><div class="smallcaps">'+t('social37BlockedTitle')+'</div>'+
        '<h2>'+t('social37BlockedTitle')+'</h2><div class="friends-list">'+blockedList+'</div>'+
        '<p class="social-muted">'+t('social37BlockedNote')+'</p></section></aside></div>';
}
function aboutPage(){
  const steps=[['roadmap1','roadmap1Desc','roadmapDone','tag-green'],['roadmap2','roadmap2Desc','roadmapProgress','tag-amber'],
               ['roadmap3','roadmap3Desc','roadmapPlanned',''],['roadmap4','roadmap4Desc','roadmapPlanned',''],['roadmap5','roadmap5Desc','roadmapPlanned','']];
  return '<div class="breadcrumb"><a href="#/">'+t('home')+'</a>'+icon('arrow',13)+t('about')+'</div>'+
    '<div class="about-hero"><div><div class="smallcaps">'+t('aboutKicker')+'</div><h1>'+t('aboutTitle')+'</h1><p>'+t('aboutSub')+'</p>'+
    '<a href="#/browse" class="btn btn-accent">'+t('exploreStore')+' '+icon('arrow',16)+'</a></div>'+
    '<div class="about-graphic" aria-hidden="true"><span class="about-orbit"></span><span class="about-orbit"></span><span class="about-emblem">A</span></div></div>'+
    '<section class="section"><div class="mission-card"><h2>'+t('mission')+'</h2><p>'+t('missionCopy')+'</p></div></section>'+
    '<section class="section">'+sectionHead('roadmapLabel','roadmap','roadmapSub',null,null)+
    '<div class="roadmap-list">'+steps.map(function(item,idx){return '<article class="roadmap-item"><div class="smallcaps">0'+(idx+1)+' / AURVEX</div>'+
    '<h3>'+t(item[0])+'</h3><p>'+t(item[1])+'</p>'+tag(item[2],item[3])+'</article>'}).join('')+'</div>'+
    '<div class="saved-banner">'+icon('info',19)+'<span>'+t('honestNote')+'</span></div></section>'+ctaBand();
}
function footer(){
  const year=new Date().getFullYear();
  return '<footer class="footer"><div class="footer-inner"><div><h3>AURVEX<span style="color:var(--accent)">.</span></h3>'+
    '<p>'+t('footerTag')+'</p></div><div class="footer-links"><a href="#/browse">'+t('footerExplore')+'</a>'+
    '<a href="#/games">'+t('games')+'</a><a href="#/apps">'+t('apps')+'</a>'+
    '<a href="#/about">'+t('about')+'</a><a href="#/team">'+t('team')+'</a><a href="#/support">'+t('supportTeam')+'</a><a href="'+repoUrl+'" target="_blank" rel="noopener noreferrer">'+t('github')+' '+icon('arrowUp',13)+'</a></div></div>'+
    '<div class="footer-bottom"><span>© '+year+' AURVEX Team. '+t('footerRights')+'</span><span>'+t('footerLegal')+'</span></div></footer>';
}
function render(keepScroll=false){
  const pos=window.scrollY;
  const route=routeInfo();route.path=safeRoute(route.path);
  document.documentElement.lang=state.language;
  document.documentElement.dataset.theme=state.theme;
  let page;
  if(route.path==='/')page=home();
  else if(route.path==='/game/devive')page=gamePage();
  else if(route.path==='/rewards'||route.path==='/free')page=rewardsPage();
  else if(route.path==='/saved')page=savedPage();
  else if(route.path==='/about')page=aboutPage();
  else if(route.path==='/team')page=teamPage();
  else if(route.path==='/support')page=supportPage();
  else if(route.path==='/id')page=idPage(route);
  else if(route.path==='/shop')page=shopPage();
  else if(route.path==='/friends')page=friendsPage();
  else if(route.path==='/notifications')page=socialNotificationsPage();
  else if(route.path==='/family')page=familyPage(route);
  else if(route.path.startsWith('/player/'))page=publicPlayerPage(route.path);
  else page=catalog(route);
  const title=route.path==='/game/devive'?'Devive':route.path==='/saved'?t('saved'):route.path==='/rewards'||route.path==='/free'?t('freeRewards'):route.path==='/about'?t('about'):route.path==='/team'?t('team'):route.path==='/support'?t('supportTeam'):route.path==='/id'?t('aurvexId'):route.path==='/shop'?t('shopNav'):route.path==='/friends'?t('friendsNav'):route.path==='/notifications'?t('social37Nav'):route.path==='/family'?t('familyNav'):route.path.startsWith('/player/')?t('socialPlayerProfile'):route.path==='/'?'Store':t('browse');
  document.title=title+' | AURVEX';
  document.getElementById('app').innerHTML=header(route.path)+sidebar(route.path)+mobileNav(route.path)+
    '<main class="main" id="main-content"><div class="content">'+page+footer()+'</div></main>';
  document.body.classList.remove('menu-open');
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
  const profileTab=event.target.closest('button[data-profile-tab]');
  if(profileTab){
    const next=profileTab.dataset.profileTab;
    if(!['overview','links','appearance'].includes(next))return;
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
  const button=event.target.closest('[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='menu'){setMenu(!document.body.classList.contains('menu-open'));return}
  if(action==='close-menu'){setMenu(false);return}
  if(action==='share-site'){
    const url=new URL('#/',document.baseURI).href;
    if(navigator.share){
      navigator.share({title:'AURVEX Store',url}).catch(function(){});
    }else if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){toast(t('supportCopySuccess'))}).catch(function(){window.prompt(t('supportCopyPrompt'),url)});
    }else window.prompt(t('supportCopyPrompt'),url);
    return;
  }
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
  if(action==='theme'){
    state.theme=state.theme==='dark'?'light':'dark';
    store(STORAGE.theme,state.theme);render(true);return;
  }
  if(action==='wishlist'){
    state.wished=!state.wished;store(STORAGE.wish,state.wished?'1':'0');
    render(true);toast(t(state.wished?'savedAdded':'savedRemoved'));
    if(typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('aurvex:wishlist-changed',{detail:{wished:state.wished}}));return;
  }
});
document.addEventListener('change',function(event){
  if(event.target.id==='language-select'){
    const lang=event.target.value;
    if(!supportedLanguages.includes(lang))return;
    state.language=lang;store(STORAGE.locale,lang);render(true);
  }else if(event.target.matches('[data-genre-option]')){
    const selected=new Set(selectedGenres());
    if(event.target.checked)selected.add(event.target.value);
    else selected.delete(event.target.value);
    state.genre=[...selected].filter(function(g){return gameGenres.some(function(x){return x[0]===g})}).join(',')||'all';
    refreshCatalog();
  }
});
document.addEventListener('input',function(event){
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
window.addEventListener('aurvex:friends-state',function(){render(true)});
window.addEventListener('aurvex:shop-state',function(){render(true)});
window.addEventListener('aurvex:social-state',function(){render(true)});
window.addEventListener('aurvex:social37-state',function(){render(true)});
window.addEventListener('aurvex:sync-wishlist',function(event){
  if(!event.detail||typeof event.detail.wished!=='boolean')return;
  state.wished=event.detail.wished;store(STORAGE.wish,state.wished?'1':'0');render(true);
});
window.addEventListener('hashchange',function(){render();window.scrollTo(0,0)});
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
  if(event.key==='Escape'){closeFilterMenus();setMenu(false);return}
  if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable]')){
    const target=document.querySelector('#catalog-search')||document.querySelector('.top-search input');
    if(target){event.preventDefault();target.focus()}
  }
});
render();
