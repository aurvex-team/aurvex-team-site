import { translations, supportedLanguages } from './i18n.js?v=20261017-320';

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
  query:'',sort:'featured',kind:'all',genre:'all',minPrice:'',maxPrice:'',releaseYear:''
};
let toastTimer=0;
const pathIcons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2.2 5.2L9 15l2.2-5.2z"/>',
 gamepad:'<path d="M6.5 8.5h11a4 4 0 0 1 3.9 3.1l.5 3.8a2.8 2.8 0 0 1-4.5 2.6l-2.2-1.8H8.8l-2.2 1.8a2.8 2.8 0 0 1-4.5-2.6l.5-3.8a4 4 0 0 1 3.9-3.1Z"/><path d="M7 12v4m-2-2h4m7-1h.01M19 15h.01"/>',
 apps:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
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
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>',
 pin:'<path d="M12 22s7-7.1 7-13a7 7 0 0 0-14 0c0 5.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/>'
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
function safeRoute(path){return ['/','/browse','/games','/apps','/free','/rewards','/saved','/about','/team','/support','/id','/game/devive'].includes(path)?path:'/'}
function isActive(path,where){
  if(where==='/browse')return ['/browse','/games','/apps'].includes(path);
  if(where==='/rewards')return path==='/rewards'||path==='/free';
  return where===path;
}
function navLink(route,key,ico,path,counter){
  return '<a class="side-link'+(isActive(path,route)?' active':'')+'" href="'+href(route)+'">'+icon(ico,18)+'<span>'+t(key)+'</span>'+(counter?'<span class="counter">'+counter+'</span>':'')+'</a>';
}
function header(path){
  const langOptions=supportedLanguages.map(function(code){return '<option value="'+code+'"'+(state.language===code?' selected':'')+'>'+code.toUpperCase()+'</option>'}).join('');
  return '<header class="topbar">'+
    '<button class="icon-btn menu-trigger" type="button" data-action="menu" aria-label="'+t('menu')+'" aria-expanded="false">'+icon('menu',20)+'</button>'+
    '<a class="top-brand" href="#/" aria-label="AURVEX Store">'+
    '<span class="brand-crest"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4 29 27H3L16 4Z" stroke="white" stroke-width="2.8" stroke-linejoin="round"/><path d="M16 13 22 24H10l6-11Z" fill="white"/></svg></span><span>AURVEX</span></a>'+
    '<nav class="top-links" aria-label="Main navigation"><a href="#/" class="'+(path==='/'?'active':'')+'">'+t('discover')+'</a>'+
    '<a href="#/browse" class="'+(isActive(path,'/browse')?'active':'')+'">'+t('browse')+'</a>'+
    '<a href="#/about" class="'+(path==='/about'?'active':'')+'">'+t('about')+'</a></nav>'+
    '<form id="global-search-form" class="top-search" role="search">'+icon('search',18)+'<input type="search" name="q" aria-label="'+t('search')+'" placeholder="'+t('searchPlaceholder')+'" maxlength="120"></form>'+
    '<div class="top-actions"><label class="language-control" aria-label="'+t('language')+'">'+icon('globe',16)+'<select id="language-select" aria-label="'+t('language')+'">'+langOptions+'</select></label>'+
    '<button class="icon-btn" type="button" data-action="theme" title="'+t('toggleTheme')+'" aria-label="'+t('toggleTheme')+'">'+icon(state.theme==='dark'?'sun':'moon',18)+'</button>'+
    '<a class="icon-btn" href="#/saved" aria-label="'+t('saved')+'">'+icon('heart',19)+(state.wished?'<span class="wish-dot"></span>':'')+'</a>'+
    '<a class="account-header-btn'+(path==='/id'?' active':'')+'" href="#/id">'+icon('user',17)+'<span>'+t(window.AURVEX_ID?.user?'idAccount':'idSignIn')+'</span></a></div></header>';
}
function sidebar(path){
  return '<div class="sidebar-shade" data-action="close-menu"></div><aside class="sidebar" id="site-sidebar">'+
    '<div class="side-group"><div class="side-label">'+t('store')+'</div>'+
      navLink('/','home','home',path)+navLink('/browse','browse','compass',path)+
      navLink('/rewards','free','gift',path)+'</div>'+
    '<div class="side-group"><div class="side-label">'+t('yourSpace')+'</div>'+navLink('/saved','saved','heart',path)+navLink('/id','aurvexId','user',path)+'</div>'+
    '<div class="side-group"><div class="side-label">'+t('more')+'</div>'+
      navLink('/team','team','layers',path)+navLink('/support','supportTeam','heart',path)+navLink('/about','about','info',path)+'</div>'+
    '<div class="side-space"></div><div class="side-promo"><div class="smallcaps">AURVEX</div><strong>'+t('bannerTitle')+'</strong><p>'+t('bannerDesc')+'</p>'+
    '<a href="#/about">'+t('bannerButton')+' '+icon('arrow',12)+'</a></div>'+
    '<div class="side-version">AURVEX STORE • PREVIEW 2.1</div></aside>';
}
function mobileNav(path){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation">'+
   mobileLink('/','home','home',path)+mobileLink('/browse','browse','compass',path)+mobileLink('/saved','saved','heart',path)+mobileLink('/about','about','info',path)+'</nav>';
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
  return '<div class="cta-band"><div><div class="smallcaps">'+t('bannerKicker')+'</div><h2>'+t('bannerTitle')+'</h2><p>'+t('bannerDesc')+'</p></div>'+
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
    '<div class="saved-banner">'+icon('shield',20)+t('localOnly')+'</div>';
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
function idPage(route){
  const auth=window.AURVEX_ID||{};
  const configured=auth.configured===true;
  const signedIn=!!auth.user;
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
  else page=catalog(route);
  const title=route.path==='/game/devive'?'Devive':route.path==='/saved'?t('saved'):route.path==='/rewards'||route.path==='/free'?t('freeRewards'):route.path==='/about'?t('about'):route.path==='/team'?t('team'):route.path==='/support'?t('supportTeam'):route.path==='/id'?t('aurvexId'):route.path==='/'?'Store':t('browse');
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
window.addEventListener('aurvex:sync-wishlist',function(event){
  if(!event.detail||typeof event.detail.wished!=='boolean')return;
  state.wished=event.detail.wished;store(STORAGE.wish,state.wished?'1':'0');render(true);
});
window.addEventListener('hashchange',function(){render();window.scrollTo(0,0)});
window.addEventListener('keydown',function(event){
  if(event.key==='Escape'){closeFilterMenus();setMenu(false);return}
  if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable]')){
    const target=document.querySelector('#catalog-search')||document.querySelector('.top-search input');
    if(target){event.preventDefault();target.focus()}
  }
});
render();
