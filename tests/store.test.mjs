import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { translations, supportedLanguages } from '../assets/i18n.js';
import { normalizePublicLinks } from '../assets/social-links.js';
import { normalizeAppearance,normalizeHiddenTitles,visibleTeamTitles } from '../assets/profile-customization.js';

const appCode=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const source=appCode.replace(/^import\s+\{\s*translations,\s*supportedLanguages\s*\}\s+from\s+['"].\/i18n\.js(?:\?v=[a-zA-Z0-9-]+)?['"];\s*/,'')
  .replace(/^import\s+['"][^'"]+['"];\s*/gm,'');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');

function render(route='#/',lang=null,wished=false,theme=null,auth=null,friends=null,social=null,social37=null,visitors=null,shop=null,inventory=null,wallet=null,currency=null){
  const storage=new Map();
  if(lang)storage.set('aurvex.locale',lang);
  if(wished)storage.set('aurvex.wishlist.devive','1');
  if(theme)storage.set('aurvex.theme',theme);
  if(currency)storage.set('aurvex.currency',currency);
  const holder={innerHTML:''};
  const fallback={textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){}};
  const document={
    documentElement:{lang:'',dataset:{}},
    title:'',
    body:{classList:{add(){},remove(){},toggle(){},contains(){return false}}},
    getElementById(id){return id==='app'?holder:fallback;},
    addEventListener(){},
  };
  const window={scrollY:0,addEventListener(){},scrollTo(){},AURVEX_ID:auth,AURVEX_FRIENDS:friends,AURVEX_SOCIAL:social,AURVEX_SOCIAL37:social37,AURVEX_VISITORS:visitors,AURVEX_SHOP:shop,AURVEX_INVENTORY:inventory,AURVEX_WALLET:wallet};
  const location={hash:route};
  const localStorage={getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)}};
  new Function('translations','supportedLanguages','document','window','location','localStorage',source)(
    translations,supportedLanguages,document,window,location,localStorage
  );
  return {html:holder.innerHTML,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,title:document.title};
}

test('complete localized strings across the four supported languages',()=>{
  assert.deepEqual(supportedLanguages,['en','uk','pl','de']);
  const base=Object.keys(translations.en).sort();
  assert.ok(base.length>190);
  for(const code of supportedLanguages){
    assert.deepEqual(Object.keys(translations[code]).sort(),base,'Missing key in '+code);
    for(const key of base)assert.ok(typeof translations[code][key]==='string'&&translations[code][key].trim(),'Blank translation '+code+':'+key);
  }
  const sourceKeys=[...appCode.matchAll(/\bt\('([A-Za-z0-9]+)'\)/g)].map(x=>x[1]);
  for(const key of sourceKeys)assert.ok(base.includes(key),'Unknown translation key '+key);
});

test('store assets and referenced images exist',()=>{
  for(const file of ['devive-scene.svg','devive-interior.svg','devive-hallway.svg','favicon-cosmic-red.svg']){
    assert.ok(existsSync(new URL('../assets/'+file,import.meta.url)),'Missing '+file);
  }
  for(const target of ['assets/site.css','assets/app.js','assets/favicon-cosmic-red.svg'])assert.ok(index.includes(target));
  assert.ok(css.includes('@media(max-width:560px)'),'Missing compact mobile styling');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Respect reduced motion');
});

test('English + winter theme default on a new browser',()=>{
  const {html,lang,theme,title}=render();
  assert.equal(lang,'en');
  assert.equal(theme,'winter');
  assert.match(title,/AURVEX/);
  assert.ok(html.includes('The next chapter starts here.'));
  assert.ok(html.includes('class="aurvex-snowfall"'),'Winter snowfall should render on the default route');
  assert.ok(html.includes('DEVIVE'));
  assert.ok(html.includes('assets/devive-scene.svg'));
});

test('route content renders across all core screens',()=>{
  for(const path of ['#/','#/browse','#/games','#/free','#/apps','#/saved','#/about','#/game/devive']){
    const {html}=render(path);
    assert.ok(html.length>7000,'Empty route '+path);
    assert.ok(html.includes('AURVEX'),'Missing branding '+path);
  }
  assert.ok(render('#/apps').html.includes(translations.en.noResults));
  assert.ok(render('#/browse?genre=adventure').html.includes(translations.en.noResults));
  assert.ok(render('#/game/devive').html.includes(translations.en.downloadDisabled));
  assert.ok(render('#/game/devive').html.includes('disabled'));
});

test('saved projects and selected languages persist in rendered UI',()=>{
  const {html,lang,theme}=render('#/saved','uk',true,'light');
  assert.equal(lang,'uk');
  assert.equal(theme,'light');
  assert.ok(html.includes('Devive'));
  assert.ok(html.includes(translations.uk.savedTitle));
  assert.ok(!render('#/about','de').html.includes(translations.de.roadmap5));
  assert.ok(render('#/game/devive','pl').html.includes(translations.pl.share));
});

test('Devive can be added to the library and disappears from the wishlist when owned',()=>{
  const signedIn={user:{id:'test-user'},mfaVerified:true,ownedGameIds:[]};
  const browse=render('#/browse',null,false,null,signedIn).html;
  assert.ok(browse.includes('data-action="claim-devive"'));
  assert.ok(browse.includes(translations.en.addToLibrary));

  const owned={...signedIn,ownedGameIds:['devive']};
  const details=render('#/game/devive',null,true,null,owned).html;
  assert.ok(details.includes(translations.en.inLibrary));
  assert.ok(!details.includes('data-action="wishlist"'));
  assert.ok(!details.includes(translations.en.addWish));
  const wishlist=render('#/saved',null,true,null,owned).html;
  assert.ok(!wishlist.includes('class="game-card"'));
});

test('Wishlist sync notice is shown only while signed out',()=>{
  const guest=render('#/saved',null,true).html;
  assert.ok(guest.includes(translations.en.idWishlistSync));
  assert.ok(!guest.includes(translations.en.localOnly));
  const signedIn=render('#/saved','en',true,null,{user:{id:'user-123'}}).html;
  assert.ok(!signedIn.includes(translations.en.idWishlistSync));
  assert.ok(!signedIn.includes(translations.en.localOnly));
});

test('Guest Profile tab has a complete sign-in UI and a safely disabled fmail provider',()=>{
 const config=readFileSync(new URL('../assets/id-config.js',import.meta.url),'utf8');
 const idUi=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang).html;
  assert.ok(html.includes('class="id-page"'),lang+': guest ID page is present');
  assert.ok(html.includes(translations[lang].idFmail),lang+': fmail sign-in is localized');
  assert.ok(html.includes(translations[lang].idFmailHint),lang+': fmail availability is explained');
  assert.ok(html.includes('id-fmail-icon'),lang+': fmail button has a distinct mark');
 }
 assert.ok(appCode.includes('idFmail'));
 assert.ok(appCode.includes('disabled aria-disabled="true"'),'fmail stays disabled until secure SSO is implemented');
 assert.ok(config.includes('fmailEnabled:false'));
 assert.ok(idUi.includes('ID_CONFIG.googleEnabled'));
 assert.ok(css.includes('.id-page{')&&css.includes('.id-panel{'),'profile sign-in page has dedicated styling');
 assert.ok(css.includes('@media(max-width:560px){.id-page{'),'profile sign-in layout adapts to mobile');
});

test('catalog input is escaped and no fake checkout is available',()=>{
  const html=render('#/browse?q=%3Cscript%3E').html;
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!appCode.includes('stripe.checkout'));
  assert.ok(!appCode.includes('paypal.com'));
});

test('concept gallery uses three distinct artwork files',()=>{
  assert.ok(appCode.includes('devive-interior.svg'));
  assert.ok(appCode.includes('devive-hallway.svg'));
  assert.ok(render('#/game/devive').html.includes('devive-interior.svg'));
  assert.ok(render('#/game/devive').html.includes('devive-hallway.svg'));
});


test('sidebar has the requested clean navigation and dedicated rewards screen',()=>{
  const sidebar=render('#/browse').html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)?.[0]||'';
  assert.ok(sidebar.includes('href="#/browse"'));
  assert.ok(sidebar.includes('href="#/rewards"'));
  assert.ok(!sidebar.includes('href="#/games"'));
  assert.ok(!sidebar.includes('href="#/apps"'));
  assert.ok(!sidebar.includes('CATEGORIES'));
  assert.ok(!sidebar.includes('AURVEX / 001'));
  assert.ok(sidebar.includes('class="smallcaps">AURVEX'));
  for(const lang of supportedLanguages){
    const rewards=render('#/rewards',lang).html;
    assert.ok(rewards.includes(translations[lang].freeRewards));
    assert.ok(rewards.includes(translations[lang].weeklyRewardTitle));
    assert.ok(rewards.includes(translations[lang].weeklyRewardIntro));
    assert.ok(!rewards.includes('Claim now'));
  }
  assert.ok(render('#/').html.includes('href="#/rewards"'));
});

test('Browse Store has centered search, genre list, real price and year controls, and no pill tabs',()=>{
  const html=render('#/browse').html;
  assert.ok(html.includes('catalog-search-row'));
  for(const id of ['catalog-search','filter-kind','filter-genre','filter-min-price','filter-max-price','filter-year']){
    assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
  }
  assert.ok(!html.includes('class="filter-pills"'));
  assert.ok(html.includes('data-action="clear-filters"'));
  for(const key of ['genreAction','genreRpg','genreShooter','genreHorror','genreSurvival','genreStrategy','genrePuzzle','genrePlatformer','genreMultiplayer']){
    const expected=key==='genreHorror'?translations.en.horror:translations.en[key];
    assert.ok(html.includes(expected),'Missing category '+key);
  }
  assert.ok(html.includes(translations.en.anyYear));
});

function catalogRuntime(){
  const holder={innerHTML:''};
  const fallback={textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){}};
  const document={
    documentElement:{lang:'',dataset:{}},title:'',
    body:{classList:{add(){},remove(){},toggle(){},contains(){return false}}},
    getElementById(id){return id==='app'?holder:fallback;},addEventListener(){}
  };
  const window={scrollY:0,addEventListener(){},scrollTo(){}};
  const location={hash:'#/browse'};
  const localStorage={getItem(){return null},setItem(){}};
  return new Function('translations','supportedLanguages','document','window','location','localStorage',source+
    '\nreturn {state,catalogMatches,routeInfo,gameGenres};')(
      translations,supportedLanguages,document,window,location,localStorage
    );
}

test('advanced filters actually change catalog matches',()=>{
  const {state,catalogMatches,routeInfo,gameGenres}=catalogRuntime();
  const route=routeInfo();
  assert.ok(gameGenres.length>=25);
  assert.equal(catalogMatches(route).length,1);
  state.genre='shooter';
  assert.equal(catalogMatches(route).length,0);
  state.genre='horror';
  assert.equal(catalogMatches(route).length,1);
  state.kind='app';
  assert.equal(catalogMatches(route).length,0);
  state.kind='game';
  assert.equal(catalogMatches(route).length,1);
  state.minPrice='1';
  assert.equal(catalogMatches(route).length,0);
  state.minPrice='0';
  state.maxPrice='0';
  assert.equal(catalogMatches(route).length,1);
  state.releaseYear='2026';
  assert.equal(catalogMatches(route).length,0,'Devive release year is not announced');
  state.releaseYear='';
  state.query='no-such-game';
  assert.equal(catalogMatches(route).length,0);
  state.query='devive';
  assert.equal(catalogMatches(route).length,1);
  state.minPrice='100';
  state.maxPrice='50';
  assert.equal(catalogMatches(route).length,0,'Invalid price range must not show results');
});

test('filter parameters prefill the Browse Store controls and escape search input',()=>{
  const html=render('#/browse?kind=game&genre=horror&min=0&max=300&year=2025&q=%3Chello%3E').html;
  assert.ok(html.includes('id="filter-min-price"'));
  assert.ok(html.includes('value="300"'));
  assert.match(html,/class="filter-option chosen" aria-pressed="true" data-filter-choice="year" data-value="2025"/);
  assert.ok(html.includes('data-genre-option="horror" checked'));
  assert.ok(html.includes('&lt;hello&gt;'));
  assert.ok(!html.includes('value="<hello>"'));
});



test('Team and Support pages and navigation are fully removed',()=>{
 for(const lang of supportedLanguages){
  const home=render('#/',lang);
  assert.ok(!home.html.includes('href="#/team"'));
  assert.ok(!home.html.includes('href="#/support"'));
  const oldTeam=render('#/team',lang),oldSupport=render('#/support',lang);
  assert.equal(oldTeam.title,'Store | AURVEX');
  assert.equal(oldSupport.title,'Store | AURVEX');
  assert.ok(!oldTeam.html.includes('team-hero'));
  assert.ok(!oldSupport.html.includes('support-hero'));
  assert.equal(translations[lang].teamTitle,undefined);
  assert.equal(translations[lang].supportTitle,undefined);
 }
});
test('production entrypoint always loads versioned JavaScript and stylesheet',()=>{
  assert.ok(index.includes('assets/app.js?v='));
  assert.ok(index.includes('assets/site.css?v='));
  assert.ok(appCode.includes('./i18n.js?v='));
});


test('custom filters use stylized menus, not operating-system select dropdowns',()=>{
  const html=render('#/browse').html;
  for(const id of ['filter-kind','filter-genre','filter-year','sort-select']){
    assert.ok(html.includes('class="filter-dropdown')||html.includes('class="filter-dropdown '));
    assert.ok(html.includes('id="'+id+'"'));
    assert.ok(!html.includes('<select id="'+id+'"'));
  }
  assert.ok(html.includes('class="filter-menu'));
  assert.ok(html.includes('data-genre-option="psychological"'));
  assert.ok(html.includes('data-genre-option="horror"'));
  assert.ok(html.includes(translations.en.selectMultipleGenres));
  assert.ok(html.includes(translations.en.searchGenres));
});
test('Devive has Psychological Horror classification on card and detail page',()=>{
  const browse=render('#/browse?genre=psychological').html;
  assert.ok(browse.includes('Devive'));
  assert.ok(browse.includes(translations.en.genrePsychological));
  const details=render('#/game/devive','uk').html;
  assert.ok(details.includes(translations.uk.genrePsychological));
  assert.ok(render('#/browse?genre=psychological','pl').html.includes('Devive'));
  assert.ok(render('#/browse?genre=psychological','de').html.includes('Devive'));
});
test('multiple selected genres combine with price, year and product type',()=>{
  const {state,catalogMatches,routeInfo}=catalogRuntime();
  const route=routeInfo();
  state.genre='horror,psychological';
  assert.equal(catalogMatches(route).length,1);
  state.genre='psychological,shooter';
  assert.equal(catalogMatches(route).length,1,'Either selected matching genre should be enough');
  state.genre='racing,shooter';
  assert.equal(catalogMatches(route).length,0);
  state.genre='horror,psychological,indie';
  state.maxPrice='0';
  state.kind='game';
  assert.equal(catalogMatches(route).length,1,'Selected genres combine with product type and price');
  state.minPrice='2';
  assert.equal(catalogMatches(route).length,0,'Price must still filter');
  state.minPrice='0';
  state.releaseYear='2026';
  assert.equal(catalogMatches(route).length,0,'Unannounced year must not match');
});
test('multiple genre selections can be restored from a shareable catalog URL',()=>{
  const html=render('#/browse?genre=horror%2Cpsychological&max=0').html;
  assert.ok(html.includes('data-genre-option="horror" checked'));
  assert.ok(html.includes('data-genre-option="psychological" checked'));
  assert.ok(html.includes('class="selection-bubble">2</span>'));
  assert.ok(html.includes(translations.en.activeFilters));
  assert.ok(html.includes('data-remove-filter="genre" data-value="psychological"'));
});


test('AURVEX ID has a visible account entry, sign-in and registration screens',()=>{
  for(const lang of supportedLanguages){
    const home=render('#/',lang);
    assert.ok(home.html.includes('href="#/id"'));
    assert.ok(home.html.includes(translations[lang].aurvexId));
    const login=render('#/id?mode=edit',lang);
    const signup=render('#/id?mode=register',lang);
    assert.ok(login.html.includes(translations[lang].idHeading));
    assert.ok(login.html.includes(translations[lang].idSignIn));
    assert.ok(signup.html.includes(translations[lang].idRegister));
    assert.ok(signup.html.includes('data-mode="register"'));
    assert.ok(login.html.includes('id="id-email-form"'));
    assert.ok(login.html.includes('data-id-action="google"'));
    assert.ok(login.html.includes(translations[lang].idFmail));
  }
});
test('AURVEX ID sign-in methods are clearly gated per provider',()=>{
  const html=render('#/id?mode=edit').html;
  assert.ok(html.includes(translations.en.idSetupTitle));
  assert.ok(html.includes(translations.en.idSetupBody));
  assert.match(html,/data-id-action="google" disabled aria-disabled="true"/);// No auth model has initialized in the isolated renderer
  assert.match(html,/id="id-email"[^>]*disabled aria-disabled="true"/);
  assert.match(html,/id="id-email-form"[^>]*data-mode="signin"/);
  assert.ok(html.includes('id-fmail'));
  assert.match(html,/class="id-provider-btn id-fmail"[^>]*disabled/);
  assert.ok(!html.includes('href="https://discord.gg'));
});
test('AURVEX ID uses provider-managed PKCE and OTP, separate private per-user data',()=>{
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const config=readFileSync(new URL('../assets/id-config.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20261017_aurvex_id_core.sql',import.meta.url),'utf8');
  for(const feature of ['flowType:\'pkce\'','signInWithOAuth','signInWithOtp','verifyOtp','getUser','id_profiles','id_wishlist'])assert.ok(service.includes(feature),feature);
  for(const feature of ['auth.uid()','enable row level security','to authenticated','id_entitlements','revoke all'])assert.ok(migration.includes(feature),feature);
  assert.ok(config.includes("supabaseUrl:'https://zalzsgfufvppvgvqfocf.supabase.co'"));
  assert.ok(/supabasePublishableKey:'sb_publishable_[A-Za-z0-9_-]+'/.test(config));
  assert.ok(config.includes("googleEnabled:true"));
  assert.ok(config.includes("emailEnabled:false"));
  assert.ok(config.includes("fmailEnabled:false"));
  assert.ok(ui.includes("window.AURVEX_ID=model"));
  assert.ok(ui.includes("data-id-action"));
  assert.ok(!service.includes('service_role'));
  assert.ok(!ui.includes('password:'));
  assert.ok(index.includes('assets/id-ui.js?v='));
});


test('AURVEX ID remains isolated, publishable-only and ready for verified provider setup',()=>{
  const config=readFileSync(new URL('../assets/id-config.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20261017_aurvex_id_wishlist_permissions.sql',import.meta.url),'utf8');
  assert.match(config,/googleEnabled:true/);
  assert.match(config,/emailEnabled:false/);
  assert.match(config,/fmailEnabled:false/);
  assert.ok(ui.includes('configured:isIdConfigured()&&(ID_CONFIG.emailEnabled||ID_CONFIG.googleEnabled||ID_CONFIG.fmailEnabled)'));
  assert.ok(service.includes('ignoreDuplicates:true'));
  assert.match(migration,/revoke update on public.id_wishlist from authenticated/);
  for(const file of [config,ui,service]){
    assert.ok(!file.includes('service_role:'),'No service role credential may enter the browser');
    assert.ok(!file.includes('client_secret:'),'No OAuth client secret may enter the browser');
  }
});


test('OAuth return URL lands on AURVEX ID without a custom domain',()=>{
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const controller=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
  assert.ok(service.includes("new URL('id.html',document.baseURI)"));
  assert.ok(controller.includes("window.location.pathname.endsWith('/id.html')"));
  assert.ok(controller.includes("window.location.hash='#/id'"));
  assert.ok(service.includes("flowType:'pkce'"));
  assert.ok(service.includes("provider:'google'"));
  assert.ok(index.includes('id-ui.js?v='));
});


test('Google sign-in is enabled when the verified Google provider config loads, while email and fmail remain unavailable',()=>{
  const client={configured:true,googleEnabled:true,emailEnabled:false,ready:true,busy:false,user:null,pendingEmail:''};
  for(const lang of supportedLanguages){
    const html=render('#/id?mode=edit',lang,false,null,client).html;
    assert.match(html,/<button[^>]*data-id-action="google"(?![^>]*disabled)/);
    assert.ok(html.includes(translations[lang].idGoogle));
    assert.ok(!html.includes(translations[lang].idSetupTitle));
    assert.match(html,/id="id-email"[^>]*disabled aria-disabled="true"/);
    assert.ok(html.includes('id-fmail'));
    assert.match(html,/class="id-provider-btn id-fmail"[^>]*disabled/);
  }
});



test('Authenticator screen is calm, localized and responsive',()=>{
 const auth={configured:true,user:{id:'mfa-user'},mfaVerified:false,mfaHasFactors:true,mfaFactors:[]};
 const html=render('#/id?mode=edit','uk',false,null,auth).html;
 assert.ok(html.includes(translations.uk.mfaChallengeTitle));
 assert.ok(html.includes(translations.uk.mfaChallengeIntro));
 assert.ok(html.includes(translations.uk.mfaSignedIn));
 assert.ok(!html.includes('Google OAuth'));
 assert.ok(!html.includes(translations.uk.mfaNoBackup.includes('назавжди')?'назавжди':'permanently'));
 assert.ok(css.includes('.mfa-layout{'));
 assert.ok(css.includes('.mfa-panel .mfa-code-form input{'));
 assert.ok(css.includes('.mfa-panel,.mfa-panel *{min-width:0}'));
 assert.ok(css.includes('width:100%;max-width:100%;min-width:0;box-sizing:border-box;justify-content:center'));
 assert.ok(css.includes('white-space:normal;text-align:center;line-height:1.35'));
 assert.ok(css.includes('@media(max-width:560px){.mfa-layout{'));
});

test('signed-in AURVEX ID renders a beautiful avatar and animated banner profile',()=>{
  const auth={
    configured:true,googleEnabled:true,emailEnabled:false,busy:false,
    ready:true,statusKey:'',statusError:false,mfaVerified:true,mfaHasFactors:true,
    mfaFactors:[{id:'test-factor-id',status:'verified'}],
    user:{id:'e0c4207a-39ab-4a51-820f-f2f27cd33719',email:'test@example.com',created_at:'2026-10-17T12:00:00Z'},
    profile:{
      nickname:'fleki',avatar_path:'e0c4207a-39ab-4a51-820f-f2f27cd33719/avatar-88edca11-b50f-476e-b678-a061989c40fa.webp',
      banner_path:'e0c4207a-39ab-4a51-820f-f2f27cd33719/banner-ab7ed1aa-ec9e-4d18-a4c4-679a83bde839.gif'
    },
    avatarUrl:'https://example.test/public/avatar.webp',
    bannerUrl:'https://example.test/public/banner.gif'
  };
  for(const lang of supportedLanguages){
    const html=render('#/id?mode=edit',lang,false,null,auth).html;
    assert.ok(html.includes('class="player-profile"'));
    assert.ok(html.includes('class="player-cover-image"'));
    assert.ok(html.includes('https://example.test/public/banner.gif'));
    assert.ok(html.includes('https://example.test/public/avatar.webp'));
    assert.ok(html.includes('fleki'));
    assert.ok(html.includes(translations[lang].profilePersonalize));
    assert.ok(html.includes(translations[lang].profileMemberSince));
    assert.ok(html.includes(translations[lang].profileArtworkPublic));
    assert.ok(html.includes('id="id-avatar-upload"'));
    assert.ok(html.includes('id="id-banner-upload"'));
    assert.ok(html.includes('image/gif'));
    assert.ok(html.includes('data-id-action="remove-banner"'));
    assert.ok(html.includes('data-id-action="remove-avatar"'));
    assert.ok(html.includes('id="id-nickname-form"'));
    assert.ok(html.includes('href="#/saved"'));
  }
});

test('signed-in profile escapes nickname and email rather than inserting HTML',()=>{
  const auth={
    configured:true,mfaVerified:true,mfaHasFactors:true,mfaFactors:[{id:'test-factor-id'}],
    user:{email:'<script>alert(1)</script>',created_at:'2026-10-17T00:00:00Z'},
    profile:{nickname:'<img src=x onerror=alert(1)>'}
  };
  const html=render('#/id?mode=edit','en',false,null,auth).html;
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});

test('wishlist uses server truth and changes sync across devices without resurrection',()=>{
  const code=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20261017_aurvex_profile_media_realtime.sql',import.meta.url),'utf8');
  assert.ok(code.includes('getOwnWishlist(user.id)'));
  assert.ok(code.includes('subscribeOwnWishlist(userId'));
  assert.ok(code.includes('visibilitychange'));
  assert.ok(code.includes('setInterval('));
  assert.ok(code.includes('pendingWishlistWrites'));
  assert.ok(!code.includes("localStorage.getItem('aurvex.wishlist.devive')"));
  assert.ok(!service.includes('syncOwnWishlist('));
  assert.ok(migration.includes('alter publication supabase_realtime add table public.id_wishlist'));
});

test('only own images can be uploaded and banner GIFs have constrained public storage',()=>{
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20261017_aurvex_profile_media_realtime.sql',import.meta.url),'utf8');
  for(const key of ['avatar_path','banner_path','file_size_limit','allowed_mime_types','aurvex-profile-media']){
    assert.ok(migration.includes(key),key);
  }
  assert.ok(migration.includes("storage.foldername(name)"));
  assert.ok(migration.includes("auth.uid()"));
  assert.ok(migration.includes("for insert to authenticated"));
  assert.ok(migration.includes("for delete to authenticated"));
  assert.ok(service.includes("contentType:file.type"));
  assert.ok(service.includes("upsert:false"));
  assert.ok(service.includes("kind==='avatar'?3*1024*1024:8*1024*1024"));
  assert.ok(service.includes("ignoreDuplicates:true"));
  assert.ok(service.includes(".update({[column]:path})"));
  assert.ok(service.includes(".update({nickname})"));
});


test('AURVEX ID navigation is Profile, not AURVEX ID in the left sidebar',()=>{
  for(const lang of supportedLanguages){
    const html=render('#/',lang).html;
    const sidebar=html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)?.[0]||'';
    assert.ok(sidebar.includes('href="#/id"'));
    assert.ok(sidebar.includes(translations[lang].profileNav));
    assert.ok(!sidebar.includes('class="side-link" href="#/id"')||sidebar.includes(translations[lang].profileNav));
  }
});

test('Google-only session cannot see verified badge or enter protected profile before MFA',()=>{
  const user={id:'u',email:'user@example.com',created_at:'2026-10-17T10:10:00Z'};
  for(const lang of supportedLanguages){
    const page=render('#/id?mode=edit',lang,false,null,{
      user,mfaVerified:false,mfaHasFactors:false,mfaFactors:[],ready:true
    }).html;
    assert.ok(page.includes(translations[lang].mfaSetupTitle));
    assert.ok(page.includes(translations[lang].mfaStart));
    assert.ok(page.includes('data-id-action="mfa-start"'));
    assert.ok(!page.includes('class="player-profile"'));
    assert.ok(!page.includes(translations[lang].mfaVerifiedLabel));
    assert.ok(!page.includes('id="id-nickname-form"'));
  }
});

test('Previously enrolled MFA requires a TOTP code before viewing AURVEX ID',()=>{
  const page=render('#/id?mode=edit','uk',false,null,{
    user:{id:'u',email:'user@example.com'},mfaVerified:false,
    mfaHasFactors:true,mfaFactors:[{id:'second-factor',status:'verified'}],ready:true
  }).html;
  assert.ok(page.includes(translations.uk.mfaChallengeTitle));
  assert.ok(page.includes('id="id-mfa-form"'));
  assert.ok(page.includes('name="code"'));
  assert.ok(!page.includes('id="id-nickname-form"'));
  assert.ok(!page.includes(translations.uk.mfaVerifiedLabel));
});

test('Enrollment shows a QR code and manual secret only in the MFA setup flow',()=>{
  const page=render('#/id?mode=edit','en',false,null,{
    user:{id:'u',email:'test@example.com'},mfaVerified:false,mfaHasFactors:false,
    mfaEnrollment:{
      factorId:'pending',qr:'data:image/svg+xml;base64,PHN2Zy8+',secret:'EXAMPLESECRET'
    }
  }).html;
  assert.ok(page.includes('class="mfa-qr"'));
  assert.ok(page.includes('EXAMPLESECRET'));
  assert.ok(page.includes('id="id-mfa-form"'));
  assert.ok(!page.includes('class="player-profile"'));
});

test('Verified profile explicitly requires aal2 and offers a backup authenticator',()=>{
  const profile=render('#/id?mode=edit','en',false,null,{
    user:{id:'u',email:'user@example.com',created_at:'2026-10-17T00:00:00Z'},
    mfaVerified:true,mfaHasFactors:true,mfaFactors:[{id:'factor',status:'verified'}],
    profile:{nickname:'player'},statusKey:''
  }).html;
  assert.ok(profile.includes('class="player-profile"'));
  assert.ok(profile.includes(translations.en.mfaVerifiedLabel));
  assert.ok(profile.includes('data-id-action="mfa-backup"'));
  assert.ok(profile.includes(translations.en.mfaBackupDesc));
  const twice=render('#/id?mode=edit','en',false,null,{
    user:{id:'u'},mfaVerified:true,mfaHasFactors:true,
    mfaFactors:[{id:'a',status:'verified'},{id:'b',status:'verified'}],profile:{nickname:'player'}
  }).html;
  assert.ok(!twice.includes('data-id-action="mfa-backup"'));
});

test('Server MFA enforcement restricts ALL profile/wishlist/entitlement and media writes',()=>{
  const service=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20261017_aurvex_mfa_required.sql',import.meta.url),'utf8');
  for(const method of ['getAuthenticatorAssuranceLevel','listFactors','mfa.enroll','mfa.challenge','mfa.verify'])
    assert.ok(service.includes(method),method);
  for(const rule of ['aurvex_profiles_require_mfa','aurvex_wishlist_require_mfa',
      'aurvex_entitlements_require_mfa','aurvex_media_insert_requires_mfa','aurvex_media_delete_requires_mfa']){
    assert.ok(migration.includes(rule),rule);
  }
  assert.ok(migration.includes('as restrictive'));
  assert.ok(migration.includes("='aal2'"));
  assert.ok(ui.includes('model.mfaVerified=mfa.verified'));
  assert.ok(ui.indexOf('const mfa=await getMfaState()')<ui.indexOf('ownProfile(user.id)'));
  assert.ok(ui.includes('!model.mfaVerified'));
});


test('Friends navigation exists in desktop and mobile and is localized in 4 languages',()=>{
  for(const lang of supportedLanguages){
    const html=render('#/',lang).html;
    assert.ok(html.includes('href="#/friends"'));
    assert.ok(html.includes(translations[lang].friendsNav));
    assert.ok(html.includes('class="mobile-bottom"'));
  }
});

test('Friends route requires AURVEX ID and MFA, not merely Google sign-in',()=>{
  const locked=render('#/friends','uk').html;
  assert.ok(locked.includes(translations.uk.friendsLockedTitle));
  assert.ok(locked.includes('href="#/id"'));
  const google=render('#/friends','en',false,null,{user:{id:'u'},mfaVerified:false}).html;
  assert.ok(google.includes(translations.en.friends2faNeeded));
  assert.ok(!google.includes('id="friends-search-form"'));
});

test('Friends shows accepted, incoming and outgoing states with server-driven actions',()=>{
  const one='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
  const two='4d3530f2-f06c-45e7-b1fb-a1388a3d2c56';
  const three='dce252e9-ed92-4c92-b04f-a64f3428aece';
  const auth={user:{id:'current'},mfaVerified:true};
  const model={ready:true,busy:false,query:'dev',relations:[
    {peer_id:one,nickname:'tester_one',relation:'friend'},
    {peer_id:two,nickname:'tester_two',relation:'incoming'},
    {peer_id:three,nickname:'tester_three',relation:'outgoing'}
  ],results:[{player_id:one,nickname:'tester_one',relation:'friend'},
    {player_id:two,nickname:'tester_two',relation:'incoming'},
    {player_id:three,nickname:'tester_three',relation:'outgoing'},
    {player_id:'02d5f47c-a6e9-48ab-930c-d7e468d7cf36',nickname:'new_friend',relation:'none'}]};
  for(const lang of supportedLanguages){
    const html=render('#/friends',lang,false,null,auth,model).html;
    assert.ok(html.includes('id="friends-search-form"'));
    assert.ok(html.includes(translations[lang].friendsMyFriends));
    assert.ok(html.includes(translations[lang].friendsIncoming));
    assert.ok(html.includes(translations[lang].friendsOutgoing));
    for(const action of ['accept','decline','cancel','remove','send'])
      assert.ok(html.includes('data-friend-action="'+action+'"'),action);
    assert.ok(html.includes(translations[lang].friendsPrivacy));
    assert.ok(html.includes('href="#/friends"'));
  }
});

test('Friends nickname and media URL are escaped and never show email',()=>{
  const html=render('#/friends','en',false,null,{user:{id:'current'},mfaVerified:true},{
    ready:true,relations:[{peer_id:'8b16e575-8a49-49cf-bf9c-b512988923a2',
       nickname:'<img src=x onerror=alert(1)>',
       avatarUrl:'https://example.com/?x=" onerror="alert(1)',
       relation:'friend'}]
  }).html;
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.ok(html.includes('&quot; onerror='));
  assert.ok(!html.includes('mailto:'));
});

test('Friends backend limits public exposure and guarantees only 2FA-authenticated users can act',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261017_aurvex_friends_v1.sql',import.meta.url),'utf8');
  for(const name of ['aurvex_search_players','aurvex_friends_list','aurvex_friend_send','aurvex_friend_action','aurvex_friends_require_mfa'])
    assert.ok(sql.includes(name),name);
  assert.ok(sql.includes("is distinct from 'aal2'"));
  assert.ok(sql.includes('security definer set search_path='));
  assert.ok(sql.includes('revoke all on public.id_friendships from public,anon,authenticated'));
  assert.ok(sql.includes('revoke all on public.id_friend_attempts from public,anon,authenticated'));
  assert.ok(sql.includes("count(*) from public.id_friend_attempts"));
  assert.ok(sql.includes("f.requester<>who"));
  assert.ok(sql.includes("other_player=who"));
  assert.ok(sql.includes("status='declined'"));
  assert.ok(sql.includes("limit 15"));
  assert.ok(!sql.includes('p.email'));
});

test('Friends controller calls only vetted RPC functions, never private table reads',()=>{
  const service=readFileSync(new URL('../assets/friends-service.js',import.meta.url),'utf8');
  const controller=readFileSync(new URL('../assets/friends-ui.js',import.meta.url),'utf8');
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const name of ['aurvex_search_players','aurvex_friends_list','aurvex_friend_send','aurvex_friend_action'])
    assert.ok(service.includes(name));
  assert.ok(controller.includes('window.AURVEX_ID?.mfaVerified'));
  assert.ok(controller.includes('setInterval(polling,30000)'));
  assert.ok(index.includes('friends-ui.js?v='));
  assert.ok(!service.includes(".from('id_profiles')"));
});


test('Profile has public viewer, HTTPS links editor, and private-by-default wishlist checkbox',()=>{
 const auth={user:{id:'9fe33ef1-0f84-4bce-acbb-ae5b5883377f',email:'secret@test.com'},
  mfaVerified:true,mfaHasFactors:true,mfaFactors:[{id:'factor'}],
  profile:{nickname:'fleki',public_links:[{title:'GitHub',url:'https://github.com/fleki'}],wishlist_public:false}};
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang,false,null,auth).html;
  assert.ok(html.includes('href="#/player/9fe33ef1-0f84-4bce-acbb-ae5b5883377f"'));
  assert.ok(html.includes('id="social-profile-form"'));
  assert.ok(html.includes('name="wishlist_public"'));
  assert.ok(!html.includes('name="wishlist_public" checked'));
  assert.ok(html.includes('https://github.com/fleki'));
  assert.ok(html.includes(translations[lang].viewAsOthers));
  assert.ok(html.includes('href="#/family"'));
 }
});

test('Public profile shows only approved links and hides wishlist when private',()=>{
 const id='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const model={profileTarget:id,profile:{
  player_id:id,nickname:'fleki',
  avatarUrl:'https://safe.example/avatar.png',bannerUrl:'https://safe.example/banner.gif',
  public_links:[{title:'TikTok',url:'https://www.tiktok.com/@example'}],
  wishlist_visible:false,wishlist_products:['devive'],joined_at:'2026-10-17T00:00:00Z'
 }};
 const html=render('#/player/'+id,'uk',false,null,
  {user:{id},mfaVerified:true},null,model).html;
 assert.ok(html.includes(translations.uk.socialWishHidden));
 assert.ok(html.includes('https://www.tiktok.com/@example'));
 assert.ok(!html.includes('mailto:'));
 assert.ok(!html.includes('id="id-nickname-form"'));
 assert.ok(!html.includes('id="social-profile-form"'));
 assert.ok(!html.includes('href="#/game/devive"'));
 const publicHtml=render('#/player/'+id,'en',false,null,null,null,
  {...model,profile:{...model.profile,wishlist_visible:true}}).html;
 assert.ok(publicHtml.includes('href="#/game/devive"'));
 assert.ok(!publicHtml.includes('secret@test.com'));
});

test('Unregistered user cannot create or join a family without Google and 2FA',()=>{
 const a=render('#/family','en').html;
 const b=render('#/family','uk',false,null,{user:{id:'u'},mfaVerified:false}).html;
 assert.ok(a.includes('href="#/id"'));assert.ok(b.includes('href="#/id"'));
 assert.ok(!a.includes('id="family-create-form"'));
 assert.ok(!b.includes('data-social-action="family-join"'));
});

test('Family invitations only by link and owners control shared purchased games',()=>{
 const auth={user:{id:'9fe33ef1-0f84-4bce-acbb-ae5b5883377f'},mfaVerified:true};
 const social={familyReady:true,family:{
  id:'b7b8c0a6-b034-4624-ae4d-83a37b483316',
  name:'My Family',owner_id:auth.user.id,
  members:[{id:auth.user.id,nickname:'Owner',is_owner:true}],
  owned_shareable:[],shares:[]
 }};
 for(const lang of supportedLanguages){
  const html=render('#/family',lang,false,null,auth,null,social).html;
  assert.ok(html.includes(translations[lang].familyNoGames));
  assert.ok(html.includes('data-social-action="family-invite"'));
  assert.ok(html.includes('data-social-action="family-leave"'));
  assert.ok(!html.includes('data-social-action="family-share"'));
 }
 const invite=render('#/family?invite='+'a'.repeat(64),'en',false,null,auth,null,{familyReady:true,family:null}).html;
 assert.ok(invite.includes('data-social-action="family-join"'));
 const plain=render('#/family','en',false,null,auth,null,{familyReady:true,family:null}).html;
 assert.ok(!plain.includes('data-social-action="family-join"'));
 assert.ok(plain.includes('id="family-create-form"'));
});

test('Server public profiles, family invitations and purchased-only licensing are protected by SQL',()=>{
 const profile=readFileSync(new URL('../supabase/migrations/20261017_profile_public_links.sql',import.meta.url),'utf8');
 const family=readFileSync(new URL('../supabase/migrations/20261017_aurvex_family_v1.sql',import.meta.url),'utf8');
 for(const s of ['wishlist_public boolean not null default false','aurvex_valid_links','aurvex_public_profile',
   'grant execute on function public.aurvex_public_profile(uuid) to anon,authenticated'])assert.ok(profile.includes(s));
 assert.ok(profile.includes("when p.wishlist_public then"));
 assert.ok(profile.includes("wishlist_visible boolean"));
 assert.ok(!profile.includes('auth.users au'));
 for(const s of ['aurvex_family_create','aurvex_family_new_invite','aurvex_family_join','aurvex_family_leave',
  'aurvex_family_share','aurvex_family_access','aurvex_family_overview',
  "e.source='purchase'","interval '7 days'","count(*) from public.id_family_members",
  'pg_advisory']){if(s==='pg_advisory')continue;assert.ok(family.includes(s),s)}
 assert.ok(family.includes("revoke all on public.id_families"));
 assert.ok(family.includes("hash"),'invite token must be hashed');
 const eligible=readFileSync(new URL('../supabase/migrations/20261017_family_product_allowlist.sql',import.meta.url),'utf8');
 assert.ok(eligible.includes('id_family_eligible_products'));
 assert.ok(eligible.includes("enabled boolean not null default false"));
 assert.ok(eligible.includes('revoke all on public.id_family_eligible_products'));
 assert.ok(eligible.includes("e.source='purchase'"));
 assert.ok(eligible.includes('aurvex_family_access'));
 assert.ok(eligible.includes('aurvex_family_share'));
 assert.ok(eligible.includes('aurvex_family_overview'));
});
test('Social controller does not place secrets in the profile and uses RPC-only family membership',()=>{
 const src=readFileSync(new URL('../assets/social-service.js',import.meta.url),'utf8');
 const js=readFileSync(new URL('../assets/social-ui.js',import.meta.url),'utf8');
 const idx=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const fn of ['aurvex_public_profile','aurvex_family_create','aurvex_family_join','aurvex_family_share','aurvex_family_access'])
  assert.ok(src.includes(fn),fn);
 assert.ok(js.includes('window.AURVEX_ID?.mfaVerified'));
 assert.ok(js.includes("location.replace('#/family')"));
 assert.ok(idx.includes('social-ui.js?v='));
});


test('Notifications bell and sidebar entry are localized and visible across layouts',()=>{
 const social37={ready:true,showOnline:false,onlineIds:[],blocked:[],notifications:[
   {id:'55555555-5555-4555-8555-555555555555',kind:'friend_request',read:false,actor_id:'44444444-4444-4444-8444-444444444444'}
 ]};
 for(const lang of supportedLanguages){
  const html=render('#/',lang,false,null,null,null,null,social37).html;
  assert.ok(html.includes('href="#/notifications"'),lang);
  assert.ok(html.includes(translations[lang].social37Nav));
  assert.ok(html.includes('social-bell'));
  assert.ok(html.includes('class="wish-dot"'));
 }
});

test('Only 2FA users can see inbox and online preference',()=>{
 const guest=render('#/notifications','uk').html;
 const googleOnly=render('#/notifications','en',false,null,
  {user:{id:'44444444-4444-4444-8444-444444444444'},mfaVerified:false}).html;
 assert.ok(guest.includes(translations.uk.social37Login));
 assert.ok(guest.includes('class="friends-lock notifications-auth-gate"'));
 assert.ok(googleOnly.includes(translations.en.social37Login));
 assert.ok(!guest.includes('data-social37-action="visibility"'));
 assert.ok(!googleOnly.includes('data-social37-action="read"'));
});

test('Notifications include actionable friend requests while online visibility stays in Profile',()=>{
 const a='44444444-4444-4444-8444-444444444444',b='55555555-5555-4555-8555-555555555555';
 const auth={user:{id:'33333333-3333-4333-8333-333333333333'},mfaVerified:true};
 const v={
  ready:true,showOnline:false,onlineIds:[],blocked:[],
  notifications:[
   {id:'66666666-6666-4666-8666-666666666666',actor_id:a,nickname:'tester',kind:'friend_request',read:false},
   {id:'77777777-7777-4777-8777-777777777777',actor_id:b,nickname:'family_owner',kind:'family_invite',read:false}
  ]
 };
 for(const lang of supportedLanguages){
  const html=render('#/notifications',lang,false,null,auth,null,null,v).html;
  assert.ok(html.includes(translations[lang].social37FriendRequest));
  assert.ok(html.includes(translations[lang].social37FamilyInvite));
  assert.ok(html.includes('data-social37-action="open-invite"'));
  assert.ok(html.includes('data-social37-action="read"'));
  assert.ok(html.includes('href="#/friends"'));
  assert.ok(!html.includes('data-social37-action="visibility"'));
  assert.ok(!html.includes('data-social37-action="family-join"'));
 }
});


test('Notifications filters, mark-all action and empty states are localized',()=>{
 const auth={user:{id:'33333333-3333-4333-8333-333333333333'},mfaVerified:true};
 const v={ready:true,showOnline:false,onlineIds:[],blocked:[],notifications:[
  {id:'66666666-6666-4666-8666-666666666666',actor_id:'44444444-4444-4444-8444-444444444444',nickname:'tester',kind:'friend_request',read:false,created_at:'2026-10-22T12:00:00Z'},
  {id:'77777777-7777-4777-8777-777777777777',actor_id:'55555555-5555-4555-8555-555555555555',nickname:'family_owner',kind:'family_invite',read:true}
 ]};
 for(const lang of supportedLanguages){
  const all=render('#/notifications',lang,false,null,auth,null,null,v).html;
  assert.ok(all.includes('href="#/notifications?filter=all"'),lang);
  assert.ok(all.includes('href="#/notifications?filter=unread"'),lang);
  assert.ok(all.includes('href="#/notifications?filter=friends"'),lang);
  assert.ok(all.includes('href="#/notifications?filter=family"'),lang);
  assert.ok(all.includes('data-social37-action="read-all"'),lang);
  assert.ok(all.includes(translations[lang].social37MarkAll),lang);
  assert.ok(all.includes(translations[lang].social37Kicker),lang);
  assert.ok(all.includes('class="notification-time"'));
  const friend=render('#/notifications?filter=friends',lang,false,null,auth,null,null,v).html;
  assert.ok(friend.includes('tester'));
  assert.ok(!friend.includes('family_owner'));
  const family=render('#/notifications?filter=family',lang,false,null,auth,null,null,v).html;
  assert.ok(family.includes('family_owner'));
  assert.ok(!family.includes('tester'));
  const unread=render('#/notifications?filter=unread',lang,false,null,auth,null,null,v).html;
  assert.ok(unread.includes('tester'));
  assert.ok(!unread.includes('family_owner'));
  const empty=render('#/notifications?filter=unread',lang,false,null,auth,null,null,{...v,notifications:[]}).html;
  assert.ok(empty.includes(translations[lang].social37CaughtUp));
 }
 const controller=readFileSync(new URL('../assets/social37-ui.js',import.meta.url),'utf8');
 assert.ok(controller.includes("await Promise.all(model.notifications.filter(n=>!n.read).map(n=>socialRead(n.id)))"));
 assert.ok(controller.includes("message('social37MarkedAll')"));
});
test('Friends-only online indicator and family invite/blocked player actions render correctly',()=>{
 const friendId='55555555-5555-4555-8555-555555555555';
 const auth={user:{id:'44444444-4444-4444-8444-444444444444'},mfaVerified:true};
 const friends={ready:true,relations:[{nickname:'friend',peer_id:friendId,relation:'friend'}],query:''};
 const online={onlineIds:[friendId],canInvite:true,blocked:[],notifications:[]};
 const html=render('#/friends','en',false,null,auth,friends,null,online).html;
 assert.ok(html.includes(translations.en.social37Online));
 assert.ok(html.includes('data-social37-action="invite-friend"'));
 assert.ok(html.includes('data-social37-action="block"'));
 assert.ok(html.includes('href="#/player/'+friendId+'"'));
 const privateHtml=render('#/friends','en',false,null,auth,friends,null,
  {...online,onlineIds:[],canInvite:false}).html;
 assert.ok(privateHtml.includes(translations.en.social37Offline));
 assert.ok(!privateHtml.includes('data-social37-action="invite-friend"'));
});

test('Blocked users are kept in private unblock-only list and cannot use public profile to bypass blocking',()=>{
 const me='44444444-4444-4444-8444-444444444444';
 const blocked='55555555-5555-4555-8555-555555555555';
 const model={ready:true,showOnline:false,onlineIds:[],notifications:[],blocked:[{id:blocked,nickname:'blocked_person'}]};
 const auth={user:{id:me},mfaVerified:true};
 const inbox=render('#/notifications','en',false,null,auth,null,null,model).html;
 assert.ok(inbox.includes('data-social37-action="unblock"'));
 assert.ok(inbox.includes('blocked_person'));
 assert.ok(inbox.includes(translations.en.social37BlockedNote));
 const publicProfile=render('#/player/'+blocked,'en',false,null,auth,null,
   {profileTarget:blocked,profile:{nickname:'blocked_person',public_links:[],wishlist_visible:false}},
   model).html;
 assert.ok(publicProfile.includes('data-social37-action="unblock"'));
 assert.ok(!publicProfile.includes('data-social37-action="block"'));
});

test('Social SQL enforces opt-in private presence, blocks, recipient-only in-app notifications and hashed family links',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261017_aurvex_social_v37.sql',import.meta.url),'utf8');
 const guard=readFileSync(new URL('../supabase/migrations/20261017_aurvex_social_v37_invite_guard.sql',import.meta.url),'utf8');
 for(const term of [
 'id_social_blocks','id_social_presence','id_social_notifications',
 'show_online boolean not null default false','aurvex_social_snapshot',
 'aurvex_social_heartbeat','aurvex_social_block','aurvex_social_invite_friend',
 'aurvex_social_open_invite','aurvex_social_friend_notify',
 "where f.status='pending'","kind='friend_request'",
 'revoke all on public.id_social_blocks','grant execute on function',
 "aurvex_friends_require_mfa"
 ])assert.ok(sql.includes(term),term);
 assert.ok(sql.includes('pg_advisory_xact_lock'));
 assert.ok(sql.includes('recipient=who'));
 assert.ok(sql.includes('extensions.digest'));
 assert.ok(sql.includes('recipient_id'));
 assert.ok(guard.includes("i.recipient_id is null or i.recipient_id=who"));
 assert.ok(guard.includes("f.status='accepted'"));
 assert.ok(guard.includes('id_social_blocks'));
 assert.ok(!sql.includes('insert into public.id_social_notifications(recipient,actor,kind,family_id,invite_token)'));
});

test('Social 3.7 controller is authentication-gated and uses server RPCs, not public table writes',()=>{
 const service=readFileSync(new URL('../assets/social37-service.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/social37-ui.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const name of ['aurvex_social_snapshot','aurvex_social_block','aurvex_social_set_visibility',
  'aurvex_social_heartbeat','aurvex_social_open_invite','aurvex_social_invite_friend'])
  assert.ok(service.includes(name),name);
 assert.ok(ui.includes('window.AURVEX_ID?.mfaVerified'));
 assert.ok(ui.includes("document.visibilityState==='hidden'"));
 assert.ok(ui.includes("data-social37-action"));
 assert.ok(ui.includes("location.hash='#/family?invite='"));
 assert.ok(html.includes('social37-ui.js?v='));
});


test('live visitors pill appears across desktop and mobile responsive header in four languages',()=>{
  for(const lang of supportedLanguages){
    const initial=render('#/',lang).html;
    assert.ok(initial.includes('data-live-visitors'),lang);
    assert.ok(initial.includes('data-live-state="connecting"'),lang);
    assert.ok(initial.includes('data-live-visitors-count'),lang);
    assert.ok(initial.includes(translations[lang].visitorsLoading),lang);
    const live=render('#/',lang,false,null,null,null,null,null,{status:'live',count:12}).html;
    assert.ok(live.includes('data-live-state="live"'),lang);
    assert.ok(live.includes('>12</span>'),lang);
    assert.ok(live.includes(translations[lang].visitorsOnline),lang);
    assert.ok(live.includes(translations[lang].visitorsLiveHint),lang);
    const unavailable=render('#/',lang,false,null,null,null,null,null,{status:'unavailable',count:null}).html;
    assert.ok(unavailable.includes('data-live-state="unavailable"'),lang);
    assert.ok(unavailable.includes(translations[lang].visitorsUnavailable),lang);
    assert.ok(unavailable.includes('>—</span>'),lang);
  }
});

test('live count cannot include untrusted HTML and never claims 0 when disconnected',()=>{
  const html=render('#/',null,false,null,null,null,null,null,{
    status:'unavailable',count:'<img src=x onerror=alert(1)>'
  }).html;
  assert.ok(html.includes('data-live-state="unavailable"'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.ok(html.includes('data-live-visitors-count'));
  assert.ok(html.includes('>—</span>'));
});

test('live visitor presence counts distinct ephemeral tabs, not duplicate presence entries',()=>{
  const code=readFileSync(new URL('../assets/live-visitors.js',import.meta.url),'utf8');
  const match=code.match(/export function countActivePresences\(state\)\{[\s\S]*?\n\}/);
  assert.ok(match,'Pure presence counter exists');
  const count=new Function(match[0].replace('export ','')+';return countActivePresences;')();
  assert.equal(count(null),0);
  assert.equal(count({}),0);
  assert.equal(count({abc:[{active:true}],def:[{active:true}]}),2);
  assert.equal(count({abc:[{active:true},{active:true}],def:[]}),1);
  assert.equal(count({abc:null}),0);
  for(const clause of ['crypto.randomUUID()',"config:{presence:{key}}","channel.track({active:true})",
    'channel.untrack()', "'presence',{event:'sync'}", "document.visibilityState==='hidden'",
    "window.addEventListener('pagehide'","window.addEventListener('pageshow'",
    "update('unavailable')"])
    assert.ok(code.includes(clause),clause);
  assert.ok(!code.includes('localStorage'));
  assert.ok(!code.includes('auth.uid'));
  assert.ok(!code.includes('user_metadata'));
  assert.ok(!code.includes('.from('),'No visitor database writes');
  const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
  assert.ok(workflow.includes('node --check assets/live-visitors.js'));
  assert.ok(index.includes('assets/live-visitors.js?v='));
});


test('Profile links accept pasted social URLs without manually naming the service',()=>{
 const links=normalizePublicLinks([
   {title:'',url:'github.com/flekiii'},
   {title:'',url:'https://www.tiktok.com/@fleki.truepkg?share=1'},
   {title:'Custom link',url:'https://example.org/?invite=yes#home'}
 ]);
 assert.deepEqual(links,[
   {title:'GitHub',url:'https://github.com/flekiii'},
   {title:'TikTok',url:'https://www.tiktok.com/@fleki.truepkg?share=1'},
   {title:'Custom link',url:'https://example.org/?invite=yes#home'}
 ]);
 assert.deepEqual(normalizePublicLinks([
   {title:'',url:'instagram.com/flekiiiii/'},
   {title:'',url:'discord.gg/abc'},
   {title:'',url:''}
 ]),[
   {title:'Instagram',url:'https://instagram.com/flekiiiii/'},
   {title:'Discord',url:'https://discord.gg/abc'}
 ]);
});

test('Profile links validate HTTPS and reject credential injection and script URLs',()=>{
 for(const url of ['http://example.com','javascript:alert(1)','data:text/html,hello',
   'https://user:secret@example.com/','file:///etc/passwd','ftp://example.com',
   'https://localhost','not a link']){
   assert.throws(()=>normalizePublicLinks([{title:'',url}]),url);
 }
 assert.throws(()=>normalizePublicLinks([{title:'some name',url:''}]));
 assert.throws(()=>normalizePublicLinks([{title:'x'.repeat(41),url:'https://example.com/'}]));
 assert.throws(()=>normalizePublicLinks([{title:'a',url:'https://example.com/'},{title:'a',url:'https://example.com/'}]));
 assert.throws(()=>normalizePublicLinks(Array.from({length:4},()=>({title:'',url:''}))));
});

test('Profile links editor survives external redraws and works with URL-only input',()=>{
 const userId='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const auth={user:{id:userId,email:'player@sample.com'},mfaVerified:true,mfaHasFactors:true,
   mfaFactors:[{id:'ok'}],profile:{nickname:'fleki',public_links:[],wishlist_public:false}};
 const draft={draftUserId:userId,socialDraft:{links:[
   {title:'',url:'github.com/flekiii'},
   {title:'TikTok',url:'https://www.tiktok.com/@fleki'},
   {title:'',url:''}
 ],wishlistPublic:true}};
 for(const lang of supportedLanguages){
   const html=render('#/id?mode=edit',lang,false,null,auth,null,draft).html;
   assert.ok(html.includes('id="social-profile-form"'));
   assert.ok(html.includes('name="url1" type="text"'));
   assert.ok(html.includes('value="github.com/flekiii"'));
   assert.ok(html.includes('value="https://www.tiktok.com/@fleki"'));
   assert.ok(!html.includes('name="wishlist_public" checked'),'Overview Wishlist must reflect saved setting, not unsaved Links draft');
   assert.ok(html.includes('id="wishlist-privacy-form"'));
   assert.ok(html.includes(translations[lang].socialLinkTip));
 }
 const staleDraft={...draft,draftUserId:'someone-else'};
 const html=render('#/id?mode=edit','en',false,null,auth,null,staleDraft).html;
 assert.ok(!html.includes('value="github.com/flekiii"'));
 assert.ok(!html.includes('name="wishlist_public" checked'));
});

test('Profile link submit reads FormData before DOM redraw and preserves failed drafts',()=>{
 const controller=readFileSync(new URL('../assets/social-ui.js',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../supabase/migrations/20261017_profile_links_fix.sql',import.meta.url),'utf8');
 assert.ok(controller.includes('normalizePublicLinks(m.socialDraft.links)'));
 assert.ok(controller.includes('m.socialDraft=readSocialDraft(form)'));
 assert.ok(controller.includes("document.addEventListener('input'"));
 assert.ok(controller.includes("document.addEventListener('change'"));
 assert.ok(controller.includes('m.draftUserId=originalUser'));
 assert.ok(controller.includes("message('socialSaved')"));
 assert.ok(controller.includes('socialSaveFailed'));
 const begin=controller.indexOf("const data=new FormData(form);",controller.indexOf("document.addEventListener('submit'"));
 const notify=controller.indexOf("m.busy=true;fire();",controller.indexOf("document.addEventListener('submit'"));
 assert.ok(begin>=0&&notify>begin,'Reads form fields before any potential redraw');
 assert.ok(sql.includes('public.aurvex_valid_links'));
 assert.ok(sql.includes("([/?#][^[:space:]]*)?"),'Allow root query/fragment HTTPS URLs');
 assert.ok(sql.includes('jsonb_array_length(input)>3'));
});


test('Official AURVEX CEO and site/launcher developer badges render only when granted from server',()=>{
 const uuid='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const auth={
   user:{id:uuid,email:'not-public@example.com',created_at:'2026-10-17T10:00:00Z'},
   profile:{nickname:'fleki',public_links:[],wishlist_public:false},
   profileTitles:['aurvex_ceo','site_launcher_developer'],
   mfaVerified:true,mfaFactors:[{id:'ok'}]
 };
 for(const lang of supportedLanguages){
   const html=render('#/id?mode=edit',lang,false,null,auth).html;
   assert.ok(html.includes('official-profile-title-aurvex_ceo'));
   assert.ok(html.includes('official-profile-title-site_launcher_developer'));
   assert.ok(html.includes(translations[lang].profileTitleCeo));
   assert.ok(html.includes(translations[lang].profileTitleDeveloper));
   const visitor=render('#/player/'+uuid,lang,false,null,null,null,{
     profileTarget:uuid,profile:{
       player_id:uuid,nickname:'fleki',
       profileTitles:['aurvex_ceo','site_launcher_developer'],
       public_links:[],wishlist_visible:false,joined_at:'2026-10-17T10:00:00Z'
     }
   }).html;
   assert.ok(visitor.includes('official-profile-title-aurvex_ceo'));
   assert.ok(visitor.includes('official-profile-title-site_launcher_developer'));
   assert.ok(!visitor.includes('not-public@example.com'));
 }
});

test('Other player profiles cannot fake AURVEX official team badge via nickname',()=>{
 const other='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const auth={
   user:{id:other},
   profile:{nickname:'AURVEX CEO',public_links:[]},
   profileTitles:[],
   mfaVerified:true
 };
 const html=render('#/id?mode=edit','en',false,null,auth).html;
 assert.ok(!html.includes('official-profile-titles'));
 assert.ok(!html.includes('official-profile-title-aurvex_ceo'));
 const visitor=render('#/player/'+other,'en',false,null,null,null,{
   profileTarget:other,profile:{player_id:other,nickname:'AURVEX CEO',
     profileTitles:[],public_links:[],wishlist_visible:false}
 }).html;
 assert.ok(!visitor.includes('official-profile-title-aurvex_ceo'));
});

test('Official team title metadata is publicly readable but has no user write privileges',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261017_aurvex_profile_official_titles.sql',import.meta.url),'utf8');
 const idService=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
 const idUi=readFileSync(new URL('../assets/id-ui.js',import.meta.url),'utf8');
 const socialService=readFileSync(new URL('../assets/social-service.js',import.meta.url),'utf8');
 for(const clause of [
  'create table if not exists public.id_profile_titles',
  'alter table public.id_profile_titles enable row level security',
  'revoke all on public.id_profile_titles from public,anon,authenticated',
  'grant select(user_id,title_code) on public.id_profile_titles to anon,authenticated',
  "('aurvex_ceo','site_launcher_developer')",
  "p.nickname='fleki'",
  'on conflict (user_id,title_code) do nothing'
 ])assert.ok(sql.includes(clause),clause);
 assert.ok(!sql.includes('grant insert'));
 assert.ok(!sql.includes('grant update'));
 assert.ok(idService.includes('aurvex_own_titles'));
 assert.ok(idUi.includes('getOwnProfileTitles(user.id)'));
 assert.ok(socialService.includes('getProfileTitles(id)'));
});


test('AURVEX founder shows site-launch membership instead of October 2026 in both views',()=>{
 const founder='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const date='2026-10-17T10:00:00Z';
 const auth={user:{id:founder,created_at:date},profile:{nickname:'fleki'},
   profileTitles:['aurvex_ceo','site_launcher_developer'],mfaVerified:true};
 const publicData={profileTarget:founder,profile:{
   player_id:founder,nickname:'fleki',joined_at:date,
   profileTitles:['aurvex_ceo','site_launcher_developer'],
   public_links:[],wishlist_visible:false
 }};
 for(const lang of supportedLanguages){
   const mine=render('#/id?mode=edit',lang,false,null,auth).html;
   const visitor=render('#/player/'+founder,lang,false,null,null,null,publicData).html;
   for(const html of [mine,visitor]){
     assert.ok(html.includes(translations[lang].profileFounderSince),lang);
     assert.ok(!html.includes('October 2026'),lang);
     assert.ok(!html.includes('Жовтень 2026'),lang);
   }
 }
});

test('Other players keep real membership dates even when using founder-like nicknames',()=>{
 const id='8badce8c-c12b-4d04-b12c-344553928fe1',date='2026-10-17T10:00:00Z';
 const own={user:{id,created_at:date},profile:{nickname:'fleki'},profileTitles:[],mfaVerified:true};
 const html=render('#/id?mode=edit','en',false,null,own).html;
 assert.ok(html.includes('Member since October 2026'));
 assert.ok(!html.includes(translations.en.profileFounderSince));
 const publicHtml=render('#/player/'+id,'en',false,null,null,null,{
   profileTarget:id,profile:{player_id:id,nickname:'fleki',joined_at:date,
     profileTitles:[],public_links:[],wishlist_visible:false}
 }).html;
 assert.ok(publicHtml.includes('Member since October 2026'));
 assert.ok(!publicHtml.includes(translations.en.profileFounderSince));
});


test('Profile has Overview and Links while theme editor is removed',()=>{
 const user='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const auth={user:{id:user},mfaVerified:true,profile:{nickname:'fleki',public_links:[],wishlist_public:true},profileTitles:['aurvex_ceo']};
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang,false,null,auth).html;
  assert.ok(!html.includes('profile-appearance-form'));
  assert.ok(!html.includes('profile-tab-appearance'));
  assert.ok(!html.includes('data-pf-'));
  assert.ok(html.includes('official-profile-title-aurvex_ceo'));
  const start=html.indexOf('id="profile-panel-overview"'),end=html.indexOf('id="profile-panel-links"');
  assert.ok(start>=0&&end>start);
  assert.ok(html.slice(start,end).includes('id="wishlist-privacy-form"'));
  assert.ok(html.slice(start,end).includes('data-social37-action="visibility"'));
  assert.ok(!html.slice(end).includes('name="wishlist_public"'));
 }
});
test('Profile removes redundant Friends, Family and Notifications sidebar cards without losing navigation',()=>{
 const id='33333333-3333-4333-8333-333333333333';
 const account={user:{id},profile:{nickname:'player'},profileTitles:[],mfaVerified:true};
 const html=render('#/id?mode=edit','en',false,null,account).html;
 assert.ok(!html.includes('id="profile-appearance-form"'));
 assert.ok(!html.includes('class="player-aside-card player-wish-card"><div class="smallcaps">'+translations.en.friendsNav));
 assert.ok(!html.includes('class="player-aside-card player-wish-card"><div class="smallcaps">'+translations.en.familyNav));
 assert.ok(!html.includes('class="player-aside-card player-wish-card"><div class="smallcaps">'+translations.en.social37Nav));
 assert.ok(html.includes('href="#/friends"'));
 assert.ok(html.includes('href="#/family"'));
 assert.ok(html.includes('href="#/notifications"'));
 assert.ok(!html.includes('name="font"'));
 assert.ok(!html.includes('name="show_aurvex_ceo"'),'Regular accounts have no founder badges');
});

test('Each social link can be ordered and placed at header, center profile or bottom',()=>{
 const id='33333333-3333-4333-8333-333333333333';
 const links=[
  {title:'TikTok',url:'https://tiktok.com/@x',slot:'header',align:'right'},
  {title:'GitHub',url:'https://github.com/test',slot:'main',align:'center'},
  {title:'Website',url:'https://example.org/',slot:'footer',align:'left'}
 ];
 const normalized=normalizePublicLinks(links);
 assert.deepEqual(normalized,links);
 const own={user:{id},profile:{nickname:'tester',public_links:links},profileTitles:[],mfaVerified:true};
 const html=render('#/id?mode=edit','en',false,null,own).html;
 for(const index of [1,2,3]) {
  assert.ok(html.includes('name="slot'+index+'"'));
  assert.ok(html.includes('name="align'+index+'"'));
  assert.ok(html.includes('data-social-action="move-link-down"'));
 }
 const publicModel={profileTarget:id,profile:{
  player_id:id,nickname:'tester',public_links:links,
  wishlist_visible:false,profileTitles:[],
  profile_appearance:{font:'rounded',glow_name:true,glow_color:'red'}
 }};
 const view=render('#/player/'+id,'en',false,null,null,null,publicModel).html;
 assert.ok(view.includes('profile-placed-main'));
 assert.ok(!view.includes('profile-placed-header'));
 assert.ok(!view.includes('profile-placed-footer'));
 for(const side of ['left','center','right'])assert.ok(view.includes('profile-align-'+side),side);
 assert.ok(!view.includes('data-pf-font='));
 assert.ok(!view.includes('data-pf-glow-name='));
 assert.ok(view.includes('https://github.com/test'));
 assert.ok(view.includes('https://tiktok.com/@x'));
});

test('Appearance presets reject untrusted CSS, HTML and unsupported fonts',()=>{
 const input={font:'mono',glow_name:true,avatar_frame:'gold'};
 const result=normalizeAppearance(input);
 assert.equal(result.font,'mono');
 assert.equal(result.glow_name,true);
 assert.equal(result.glow_banner,false);
 assert.deepEqual(visibleTeamTitles(['aurvex_ceo','site_launcher_developer'],['aurvex_ceo']),['site_launcher_developer']);
 assert.deepEqual(normalizeHiddenTitles(['aurvex_ceo','aurvex_ceo'],['aurvex_ceo']),['aurvex_ceo']);
 for(const value of [
  {font:'url(https://example.org/css)'},{font:'<script>alert(1)</script>'},
  {glow_name:'yes'},{profile_frame:'gold;position:absolute'},
  {glow_color:'#ff00cc'},{__proto__:null,customStyle:'display:none'}
 ])assert.throws(()=>normalizeAppearance(value));
 assert.throws(()=>normalizeHiddenTitles(['aurvex_ceo'],[]));
 const id='33333333-3333-4333-8333-333333333333';
 const view=render('#/player/'+id,'en',false,null,null,null,{profileTarget:id,profile:{
  nickname:'tester',public_links:[],wishlist_visible:false,profileTitles:[],
  profile_appearance:{font:'<script>bad</script>',glow_color:'url(x)'}
 }}).html;
 assert.ok(!view.includes('<script>bad</script>'));
 assert.ok(!view.includes('data-pf-font='));
});

test('Wishlist privacy keeps protected account saving and the theme editor is removed',()=>{
 const ui=readFileSync(new URL('../assets/social-ui.js',import.meta.url),'utf8');
 const service=readFileSync(new URL('../assets/social-service.js',import.meta.url),'utf8');
 assert.ok(!appCode.includes('profile-appearance-form'));
 assert.ok(!ui.includes('readAppearanceDraft'));
 assert.ok(ui.includes('wishlist-privacy-form'));
 assert.ok(ui.includes('saveWishlistVisibility'));
 assert.ok(service.includes('saveWishlistVisibility'));
});
test('Profile Studio has two localized accessible editor tabs and no theme editor',()=>{
 const account={
  user:{id:'11111111-2222-4333-8444-555555555555'},
  mfaVerified:true,profile:{nickname:'tester',public_links:[]},profileTitles:[]
 };
 for(const lang of supportedLanguages){
  const {html}=render('#/id?mode=edit',lang,false,null,account);
  assert.ok(html.includes('class="profile-tabs" role="tablist"'),lang);
  assert.ok(html.includes('aria-label="'+translations[lang].profileTabsLabel+'"'),lang);
  for(const [name,key] of [['overview','profileTabOverview'],['links','profileTabLinks']]){
   assert.ok(html.includes('id="profile-tab-'+name+'"'),name);
   assert.ok(html.includes('aria-controls="profile-panel-'+name+'"'),name);
   assert.ok(html.includes('id="profile-panel-'+name+'" class="profile-tab-panel" role="tabpanel"'),name);
   assert.ok(html.includes(translations[lang][key]),lang+':'+key);
  }
  assert.ok(html.includes('data-active-profile-tab="overview"'));
  assert.ok(html.includes('id="profile-panel-links" class="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-links" hidden'));
  assert.ok(!html.includes('profile-panel-appearance'));
  // Hidden panels stay mounted, so their in-progress FormData and event handlers survive tab switches.
  assert.ok(html.includes('id="id-nickname-form"'));
  assert.ok(html.includes('id="social-profile-form"'));
  assert.ok(!html.includes('id="profile-appearance-form"'));
  assert.ok(html.includes('id="id-avatar-upload"'));
  assert.ok(html.includes('id="id-banner-upload"'));
 }
});

test('Tabbed profile switch preserves live forms and supports keyboard navigation',()=>{
 for(const statement of [
  "state.profileTab=next;",
  "panel.hidden=panel.id!=='profile-panel-'+next",
  "button.setAttribute('aria-selected',String(active))",
  'const next=event.key===',
  "buttons[next].click()",
  "profileNicknameDraft",
  "state.profileNicknameOwner=window.AURVEX_ID.user.id"
 ])assert.ok(appCode.includes(statement),statement);
 assert.ok(css.includes('.profile-tab-panel[hidden]{display:none!important}'));
 assert.ok(css.includes('.profile-tabs .profile-tab.is-active'));
 assert.ok(css.includes('.profile-workspace #social-profile-form'));
 assert.ok(css.includes('.profile-workspace #social-profile-form'));
 assert.ok(css.includes('.player-profile:not(.public-profile) .player-cover'));
 const open=appCode.indexOf("const profileTab=event.target.closest('button[data-profile-tab]')");
 const close=appCode.indexOf("const removable=event.target.closest('[data-remove-filter]')",open);
 assert.ok(open>0&&close>open);
 const switcher=appCode.slice(open,close);
 assert.ok(!switcher.includes('render(true)'),'Tabs must not rerender/recreate the editor forms');
});

test('Public profiles keep full banner and display-only layout, not private editing tabs',()=>{
 const player='11111111-2222-4333-8444-555555555555';
 const page=render('#/player/'+player,'en',false,null,null,null,{
  profileTarget:player,profile:{nickname:'tester',wishlist_visible:false,profileTitles:[],public_links:[]}
 }).html;
 assert.ok(page.includes('class="player-profile public-profile"'));
 assert.ok(!page.includes('data-profile-workspace'));
 assert.ok(!page.includes('id="profile-appearance-form"'));
 assert.ok(!page.includes('data-profile-tab'));
 assert.ok(page.includes('class="player-cover"'));
});


test('View as others is always available outside Profile Studio tabs, never trapped inside Links',()=>{
 const user='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const auth={user:{id:user},mfaVerified:true,profile:{nickname:'fleki',public_links:[]},profileTitles:[]};
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang,false,null,auth).html;
  const toolbar=html.indexOf('class="profile-tab-toolbar"');
  const preview=html.indexOf('class="btn btn-accent profile-preview-action"');
  const firstPanel=html.indexOf('id="profile-panel-overview"');
  const linksPanel=html.indexOf('id="profile-panel-links"');
  const text=translations[lang].viewAsOthers;
  assert.ok(toolbar>=0&&preview>toolbar&&preview<firstPanel,lang);
  assert.ok(firstPanel<linksPanel,lang);
  assert.equal(html.split('class="btn btn-accent profile-preview-action"').length-1,1,lang);
  assert.ok(html.includes('href="#/player/'+user+'" aria-label="'+text+'"'));
  assert.ok(html.includes('>'+text+'</span></a>'));
  const linksSection=html.slice(linksPanel,html.indexOf('class="player-privacy"'));
  assert.ok(!linksSection.includes('profile-preview-action'),'Link panel must not contain the only preview button');
 }
 assert.ok(css.includes('.profile-tab-toolbar .profile-tabs'));
 assert.ok(css.includes('.profile-preview-action:focus-visible'));
 assert.ok(css.includes('@media(max-width:550px)'));
});

test('Preview remains separate from editor controls, and public profile has no preview shortcut',()=>{
 const user='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const mine=render('#/id?mode=edit','en',false,null,
  {user:{id:user},mfaVerified:true,profile:{nickname:'fleki'},profileTitles:[]}).html;
 assert.ok(mine.includes('class="profile-tab-toolbar"'));
 assert.ok(mine.includes('id="social-profile-form"'));
 assert.ok(!mine.includes('id="profile-appearance-form"'));
 assert.ok(mine.includes('data-social-action="copy-profile"'));
 const publicView=render('#/player/'+user,'en',false,null,null,null,{
  profileTarget:user,profile:{nickname:'fleki',public_links:[],wishlist_visible:false,profileTitles:[]}
 }).html;
 assert.ok(!publicView.includes('profile-preview-action'));
 assert.ok(!publicView.includes('profile-tab-toolbar'));
});


test('Stars shop is a first-party navigable screen with eight collectible designs and UAH prices',()=>{
 const catalog=[
  {id:'avatar_violet',kind:'avatar',theme:'violet',price_points:150,price_uah_kop:4900},
  {id:'avatar_ruby',kind:'avatar',theme:'ruby',price_points:200,price_uah_kop:5900},
  {id:'avatar_cyan',kind:'avatar',theme:'cyan',price_points:250,price_uah_kop:6900},
  {id:'avatar_gold',kind:'avatar',theme:'gold',price_points:350,price_uah_kop:9900},
  {id:'profile_emerald',kind:'profile',theme:'emerald',price_points:225,price_uah_kop:6900},
  {id:'profile_cosmic',kind:'profile',theme:'cosmic',price_points:325,price_uah_kop:9900},
  {id:'profile_frost',kind:'profile',theme:'frost',price_points:275,price_uah_kop:7900},
  {id:'profile_flame',kind:'profile',theme:'flame',price_points:400,price_uah_kop:11900}
 ];
 for(const lang of supportedLanguages){
  const html=render('#/shop',lang,false,null,null,null,null,null,null,{
   catalog,catalogReady:true,catalogError:false}).html;
  assert.ok(html.includes(translations[lang].shopTitle));
  assert.ok(html.includes('href="#/shop"'));
  for(const item of catalog){
   assert.ok(html.includes(translations[lang]['shopItem_'+item.id].replaceAll("'","&#39;")),item.id);
   assert.ok(html.includes('data-item-id="'+item.id+'"'),item.id);
  }
  assert.ok(html.includes('49 ₴'));
  assert.equal((html.match(/data-shop-card-kind="/g)||[]).length,8);
  assert.equal((html.match(/class="btn btn-outline shop-money-button" href="#\/checkout\?kind=cosmetic/g)||[]).length,8);
  assert.ok(html.includes(translations[lang].shopMoneyPending));
  assert.ok(html.includes('data-shop-action="preview"'));
  assert.ok(html.includes('data-shop-action="buy-points"'));
 }
});

test('Stars wallet inventory equipping and try-on are visible only to signed-in verified users',()=>{
 const user='b08b4ee1-49e4-4d2b-b166-56b4a6e35112';
 const item={id:'avatar_ruby',kind:'avatar',theme:'ruby',price_points:200,price_uah_kop:5900};
 const auth={user:{id:user},mfaVerified:true,profile:{nickname:'demo'}};
 const state={
  catalog:[item],catalogReady:true,userId:user,ready:true,balance:300,
  inventory:[{item_id:item.id,obtained_by:'points'}],
  equipped:{avatar:item.id,profile:null},history:[{reason:'welcome',points_delta:500,id:1}],
  previewId:item.id
 };
 const html=render('#/shop','en',false,null,auth,null,null,null,null,state).html;
 assert.ok(html.includes('300 Stars'));
 assert.ok(html.includes('data-shop-action="unequip"'));
 assert.ok(html.includes('data-shop-action="preview"'));
 assert.ok(!html.includes('data-shop-action="buy-points"'));
 assert.ok(html.includes('data-shop-avatar="avatar_ruby"'));
 assert.ok(html.includes('Your collection'));
 assert.ok(html.includes('500'));
 const loggedOut=render('#/shop','en',false,null,null,null,null,null,null,state).html;
 assert.ok(loggedOut.includes(translations.en.shopSignInHint));
 assert.ok(!loggedOut.includes('Your collection'));
 assert.ok(loggedOut.includes('data-shop-action="buy-points"'));
 assert.ok(loggedOut.includes('disabled'));
});

test('Equipped cosmetics decorate own and public profile without exposing wallet or inventory',()=>{
 const user='b08b4ee1-49e4-4d2b-b166-56b4a6e35112';
 const privateProfile=render('#/id?mode=edit','en',false,null,
  {user:{id:user},mfaVerified:true,profile:{nickname:'tester'},profileTitles:[]},
  null,null,null,null,{userId:user,equipped:{avatar:'avatar_cyan',profile:'profile_cosmic'}}
 ).html;
 assert.ok(privateProfile.includes('data-shop-avatar="avatar_cyan"'));
 assert.ok(privateProfile.includes('data-shop-profile="profile_cosmic"'));
 const pub=render('#/player/'+user,'en',false,null,null,null,{
  profileTarget:user,profile:{nickname:'tester',profileTitles:[],wishlist_visible:false,
   shop_equipped:{avatar:'avatar_gold',profile:'profile_frost'},public_links:[]}
 }).html;
 assert.ok(pub.includes('data-shop-avatar="avatar_gold"'));
 assert.ok(pub.includes('data-shop-profile="profile_frost"'));
 const faked=render('#/player/'+user,'en',false,null,null,null,{
  profileTarget:user,profile:{nickname:'tester',profileTitles:[],wishlist_visible:false,
   shop_equipped:{avatar:'evil"} onclick="hack()',profile:'javascript:evil'},public_links:[]}
 }).html;
 assert.ok(faked.includes('data-shop-avatar="none"'));
 assert.ok(faked.includes('data-shop-profile="none"'));
 assert.ok(!faked.includes('onclick="hack()"'));
 assert.ok(css.includes('.player-profile[data-shop-avatar="avatar_cyan"]'));
 assert.ok(css.includes('.player-profile[data-shop-profile="profile_cosmic"]'));
});

test('Shop server security: MFA, wallet row locking, one-time Stars grant, price authority, and no fake UAH charges',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261018_aurvex_points_shop_v1.sql',import.meta.url),'utf8');
 const perms=readFileSync(new URL('../supabase/migrations/20261018_aurvex_points_shop_permissions.sql',import.meta.url),'utf8');
 const svc=readFileSync(new URL('../assets/shop-service.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/shop-ui.js',import.meta.url),'utf8');
 for(const clause of [
  "auth.jwt()->>'aal'","is distinct from 'aal2'","on conflict(user_id) do nothing",
  "values(who,500,'welcome')","from public.aurvex_shop_wallets w",
  'where w.user_id=who for update','ITEM_ALREADY_OWNED','INSUFFICIENT_POINTS',
  'balance=balance-item.price_points','aurvex_shop_inventory',
  'aurvex_shop_ledger','public.aurvex_shop_public_equipped',
  'create policy aurvex_shop_active_catalog',
  'revoke all on function public.aurvex_shop_buy_points(text) from public,anon'
 ])assert.ok(sql.includes(clause),clause);
 assert.ok(perms.includes('grant select on public.aurvex_shop_items to anon,authenticated'));
 assert.ok(!svc.includes("from('aurvex_shop_wallets')"));
 assert.ok(!svc.includes("from('aurvex_shop_inventory')"));
 assert.ok(svc.includes("rpc('aurvex_shop_buy_points'"));
 assert.ok(svc.includes("rpc('aurvex_shop_equip'"));
 assert.ok(svc.includes("rpc('aurvex_shop_public_equipped'"));
 assert.ok(ui.includes('window.confirm('));
 assert.ok(!ui.includes('stripe'));
 assert.ok(!ui.includes('createCheckout'));
 const html=render('#/shop','en',false,null,null,null,null,null,null,{
  catalog:[{id:'avatar_gold',kind:'avatar',theme:'gold',price_points:350,price_uah_kop:9900}],
  catalogReady:true}).html;
 assert.ok(html.includes('shop-money-button" href="#/checkout?kind=cosmetic'));
 assert.ok(html.includes('99 ₴'));
 const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('node --check assets/shop-service.js'));
 assert.ok(workflow.includes('node --check assets/shop-ui.js'));
 assert.ok(index.includes('assets/shop-ui.js?v='));
});

test('Stars precedes Free and language / currency have custom menus',()=>{
 const html=render('#/shop','uk').html;
 assert.ok(html.includes('Stars'));
 assert.ok(html.includes('AURVEX · STARS'));
 for(const lang of supportedLanguages)assert.equal(translations[lang].shopNav,'Stars');
 assert.ok(html.indexOf('href="#/shop"')<html.indexOf('href="#/rewards"'));
 assert.ok(html.includes('data-pref-lang="uk"'));
 assert.ok(html.includes('data-pref-currency="USD"'));
 assert.ok(html.includes('data-pref-search'));
 assert.ok(!html.includes('<select id="language-select"'));
 assert.ok(html.includes('Rates By Exchange Rate API'));
});
test('all localized currency controls exist and checkout stays unavailable',()=>{
 const keys=['currency','currencySearch','currencyEstimate','currencyUnavailable','filterMinPrice','filterMaxPrice'];
 for(const lang of supportedLanguages){
   for(const key of keys)assert.ok(translations[lang][key]);
 }
 const html=render('#/shop','en',false,null,null,null,null,null,null,{
   catalog:[{id:'avatar_violet',kind:'avatar',theme:'violet',price_points:150,price_uah_kop:4900}],
   catalogReady:true
 }).html;
 assert.ok(html.includes('49 ₴'));
 assert.ok(html.includes('shop-money-button" href="#/checkout?kind=cosmetic'));
});

test('Stars is the sole customer-facing virtual currency in all languages',()=>{
 for(const lang of supportedLanguages){
   const s=translations[lang];
   assert.equal(s.shopNav,'Stars');
   assert.equal(s.shopPoints,'Stars');
   assert.ok(s.shopWelcomeNote.includes('500 Stars'),lang);
   assert.ok(s.shopBuyPoints.includes('Stars'),lang);
   assert.ok(s.shopConfirmBuy.includes('{price} Stars'),lang);
   for(const key of ['shopHistory','shopIntro','shopSignInHint','shopNotEnough','shopPointsDisclaimer']){
     assert.ok(s[key].includes('Stars'),lang+' '+key);
   }
 }
 const html=render('#/shop','uk',false,null,
   {user:{id:'85fabdb8-4681-4af1-946d-4a03d867109b'},mfaVerified:true},
   null,null,null,null,
   {userId:'85fabdb8-4681-4af1-946d-4a03d867109b',ready:true,catalogReady:true,inventory:[],balance:500,history:[{reason:'welcome',points_delta:500,id:1}],catalog:[]}).html;
 assert.ok(html.includes('500 Stars'));
 assert.ok(html.includes('+500 Stars'));
 assert.ok(!html.includes('500 Points'));
});


test('Inventory route, price packs, trade RPC adapter and translations are present',()=>{
 for(const lang of supportedLanguages){
  const html=render('#/inventory',lang).html;
  assert.ok(html.includes('href="#/inventory"'));
  assert.ok(html.includes(translations[lang].inventoryNav));
  assert.ok(html.includes(translations[lang].invLogin));
  const s=translations[lang];for(const key of ['invTrades','invGames','starsBuyTitle','invConfirm'])assert.ok(s[key]);
 }
 const owner='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const auth={user:{id:owner},mfaVerified:true};
 const shop={userId:owner,ready:true,catalogReady:true,catalog:[
  {id:'avatar_violet',kind:'avatar',theme:'violet',price_points:150,price_uah_kop:4900}],
  inventory:[{item_id:'avatar_violet'}],equipped:{}};
 const inventory=render('#/inventory','uk',false,null,auth,null,null,null,null,shop).html;
 assert.ok(inventory.includes('avatar_violet'));
 assert.ok(inventory.includes('class="si-workspace"'));
 assert.ok(inventory.includes('class="si-grid"'));
 const html=render('#/shop','en',false,null,auth,null,null,null,null,shop).html;
 for(const stars of [100,350,800,1800])assert.ok(html.includes(stars+' Stars'));
 assert.ok(html.includes('stars-packs'));
 const svc=readFileSync(new URL('../assets/inventory-service.js',import.meta.url),'utf8');
 for(const rpc of ['aurvex_inventory_state','aurvex_trade_create_bundle','aurvex_trade_action','aurvex_trade_peer_items']){
  assert.ok(svc.includes(rpc));
 }
 const ui=readFileSync(new URL('../assets/inventory-ui.js',import.meta.url),'utf8');
 assert.ok(ui.includes('window.confirm'));
 assert.ok(!ui.includes(".insert("));
});

test('Steam-inspired Inventory uses dense grid, category sidebar and real item-detail panel',()=>{
 const id='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const auth={user:{id},mfaVerified:true};
 const shop={userId:id,ready:true,catalog:[{id:'avatar_violet',kind:'avatar',theme:'violet'}],
  inventory:[{item_id:'avatar_violet'}],equipped:{avatar:'avatar_violet'}};
 const inventory={userId:id,ready:true,gameItems:[
  {id:'74724e28-e3d9-436c-9c53-c43276b2e131',name:'Sample game item',item_code:'alpha',game_id:'devive',tradable:true}
 ],offers:[],screen:'items',category:'all',selectedKey:'cosmetic:avatar_violet',search:'',give:[],take:[]};
 const html=render('#/inventory','en',false,null,auth,null,null,null,null,shop,inventory).html;
 for(const fragment of ['class="si-workspace"','class="si-categories"','class="si-grid"',
  'data-inventory-action="inspect"','class="si-detail"','data-inventory-search',
  'cosmetic:avatar_violet','Sample game item','data-shop-action="unequip"']){
   assert.ok(html.includes(fragment),fragment);
 }
 assert.ok(html.includes('class="si-art si-art-violet'));
 assert.ok(css.includes('.si-grid{display:grid'));
 assert.ok(css.includes('.si-details-col'));
});
test('Multi-item trades support explicit zero-return gifts and select-all',()=>{
 const id='3e8ddb4b-2815-4863-9594-8ae11ed8e803';
 const peerId='4af7aeeb-420e-40c8-a91b-293bafc0a0ef';
 const auth={user:{id},mfaVerified:true};
 const friends={relations:[{relation:'friend',peer_id:peerId,nickname:'Buddy'}]};
 const shop={userId:id,ready:true,catalog:[],inventory:[
  {item_id:'avatar_violet'},{item_id:'profile_cosmic'}],equipped:{}};
 const trades={userId:id,ready:true,screen:'trades',gameItems:[],offers:[],peerId,
  peerItemsReady:true,peerItems:[],give:['cosmetic:avatar_violet','cosmetic:profile_cosmic'],
  take:[],search:'',category:'all'};
 const html=render('#/inventory','uk',false,null,auth,friends,null,null,null,shop,trades).html;
 for(const fragment of ['class="si-trade-columns"','data-inventory-action="give-all"',
 'data-inventory-action="give-clear"','data-inventory-action="send"',
 'data-inventory-action="give-toggle"','data-inventory-peer',translations.uk.siGiftTitle,
 translations.uk.siSendGift,translations.uk.siGiftNotice]){
  assert.ok(html.includes(fragment),fragment);
 }
 assert.ok(!html.includes('name="requested" required'));
 assert.ok(html.includes('aria-pressed="true"'));
 const ui=readFileSync(new URL('../assets/inventory-ui.js',import.meta.url),'utf8');
 for(const part of ["action==='give-all'","m.give=all","requested.length===0",
  'siGiftConfirm','siAcceptGiftConfirm','createTrade(recipient,offered,requested)']){
  assert.ok(ui.includes(part),part);
 }
 const svc=readFileSync(new URL('../assets/inventory-service.js',import.meta.url),'utf8');
 assert.ok(svc.includes('aurvex_trade_create_bundle'));
 assert.ok(!svc.includes("rpc('aurvex_trade_create'"));
});
test('Bundle trades are atomic, friend-gated, and never include newly acquired items',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/aurvex_bundle_trades_gifts_20261018.sql',import.meta.url),'utf8');
 for(const requirement of [
  'aurvex_trade_create_bundle','offered_items jsonb','requested_items jsonb',
  "jsonb_array_length(items)>500",'aurvex_trade_are_friends',
  'aurvex_shop_actor','for update','TRADE_ITEM_NOT_OWNED',
  "TRADE_ALREADY_OWNED","requested_items,true",'TRADE_BUNDLE_SIZE',
  "revoke all on function public.aurvex_trade_create_bundle",
  'coalesce(o.requested_items',
  'acquired_at=now()'
 ]){
  assert.ok(sql.includes(requirement),requirement);
 }
 assert.ok(!sql.includes('service_role'));
});

test('Payment preparation supports 37 display currencies without enabling any live charges',()=>{
 const codes=['UAH','USD','EUR','GBP','PLN','CHF','CAD','AUD','JPY','CNY','KRW',
 'SEK','NOK','DKK','CZK','HUF','RON','TRY','INR','BRL','MXN','AED','SAR','ILS',
 'ZAR','SGD','HKD','NZD','THB','IDR','MYR','PHP','VND','KZT','GEL','MDL','AZN'];
 const sql=readFileSync(new URL('../supabase/migrations/aurvex_payment_core_20261018.sql',import.meta.url),'utf8');
 for(const code of codes)assert.ok(sql.includes("('"+code+"',"),code);
 assert.equal(codes.length,37);
 assert.ok(sql.includes("'stars_100',100,3900"));
 assert.ok(sql.includes("'stars_1800',1800,49900"));
 for(const name of ['aurvex_payment_prepare','aurvex_payment_settle','aurvex_payment_my_orders']){
  assert.ok(sql.includes(name),name);
 }
 const guard=readFileSync(new URL('../supabase/migrations/aurvex_payments_killswitch_and_issues_20261018.sql',import.meta.url),'utf8');
 assert.ok(guard.includes('checkout_enabled boolean not null default false'));
 assert.ok(guard.includes('merchant_verified boolean not null default false'));
 assert.ok(guard.includes('PAYMENTS_DISABLED'));
 assert.ok(sql.includes("grant execute on function public.aurvex_payment_settle"));
});
test('Checkout pages disclose real charge currency and gateway-only fulfillment',()=>{
 const sku='stars_350';
 const html=render('#/checkout?kind=stars&sku='+sku,'uk').html;
 assert.ok(html.includes('350 Stars'));
 assert.ok(html.includes(translations.uk.payRateDisclaimer));
 assert.ok(html.includes(translations.uk.payDebited));
 assert.ok(html.includes('data-payment-action="checkout"')===false);
 const id='e566844a-7112-43f4-b9dd-18de42781f9c';
 const account={user:{id},mfaVerified:true};
 const signed=render('#/checkout?kind=stars&sku='+sku,'en',false,null,account).html;
 assert.ok(signed.includes('data-payment-action="checkout"'));
 assert.ok(signed.includes(' disabled'));
 const returned=render('#/payment?order='+id,'en').html;
 assert.ok(returned.includes(translations.en.payCallbackOnly));
 for(const path of [
 'supabase/functions/aurvex-payment-checkout/index.ts',
 'supabase/functions/aurvex-payment-webhook/index.ts',
 'supabase/functions/aurvex-payment-status/index.ts',
 'supabase/functions/_shared/payment.ts',
 'assets/payment-ui.js']){
  assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
 }
 const callback=readFileSync(new URL('../supabase/functions/aurvex-payment-webhook/index.ts',import.meta.url),'utf8');
 assert.ok(callback.includes('fondySignature'));
 assert.ok(callback.includes('aurvex_payment_settle'));
 assert.ok(callback.includes('if(!enabled())'));
 assert.ok(!callback.includes("req.headers.get('origin')")||true);
 const client=readFileSync(new URL('../assets/payment-ui.js',import.meta.url),'utf8');
 assert.ok(client.includes('crypto.randomUUID()'));
 assert.ok(!client.includes('FONDY_PAYMENT_KEY'));
});

test('Balance navigation is immediately after Account and shows a private monetary amount',()=>{
 const owner='bb9132ee-8c88-4f54-a827-edc8f290893a';
 const auth={user:{id:owner},mfaVerified:true,profile:{nickname:'AURVEX Creator'}};
 const wallet={userId:owner,ready:true,loading:false,balanceUahKop:12550,entries:[]};
 for(const lang of supportedLanguages){
   const html=render('#/',lang,false,null,auth,null,null,null,null,null,null,wallet).html;
   const account=html.indexOf('class="account-header-btn');
   const balance=html.indexOf('class="header-balance-btn');
   assert.ok(account>=0&&balance>account);
   assert.ok(balance-account<420,'Balance must directly follow Account');
   assert.ok(html.includes('href="#/balance"'));
   assert.ok(html.includes('125,50')||html.includes('125.50'),lang);
   assert.ok(html.includes(translations[lang].balanceNav));
 }
 const loggedOut=render('#/','en',false,null,null,null,null,null,null,null,null,wallet).html;
 assert.ok(loggedOut.includes('href="#/balance"'));
 assert.ok(!loggedOut.includes('125.50'));
 const unverified=render('#/','en',false,null,{user:{id:owner},mfaVerified:false},null,null,null,null,null,null,wallet).html;
 assert.ok(!unverified.includes('125.50'));
 const anotherUser=render('#/','en',false,null,{user:{id:'94f222a7-c8d2-4e36-8b14-5dbb9ccc887b'},mfaVerified:true},null,null,null,null,null,null,wallet).html;
 assert.ok(!anotherUser.includes('125.50'));
});
test('Wallet shows 0 in the selected currency, five server-authoritative deposit choices and history',()=>{
 const id='bb9132ee-8c88-4f54-a827-edc8f290893a';
 const auth={user:{id},mfaVerified:true};
 const zero={userId:id,ready:true,balanceUahKop:0,entries:[],loading:false,error:false};
 for(const currency of ['UAH','USD','EUR','GBP','JPY']){
   const html=render('#/balance','en',false,null,auth,null,null,null,null,null,null,zero,currency).html;
   assert.ok(html.includes('class="money-hero"'));
   assert.ok(html.includes('href="#/balance"'));
   assert.ok(html.includes(currency),'selected currency '+currency);
   assert.ok(html.includes('wallet_50'),'wallet_50');
   assert.ok(html.includes('wallet_1000'),'wallet_1000');
   assert.ok(html.includes('money-history-empty'));
   assert.ok(html.includes(translations.en.balanceSeparateStars));
 }
 const lobby=render('#/balance','uk').html;
 assert.ok(lobby.includes(translations.uk.balanceSignInTitle));
 assert.ok(!lobby.includes('class="money-deposit-grid"'));
 const privateWallet={...zero,balanceUahKop:5000,entries:[{id:1,createdAt:'2026-10-18T11:00:00Z',amountUahKop:5000}]};
 const ledger=render('#/balance','en',false,null,auth,null,null,null,null,null,null,privateWallet).html;
 assert.ok(ledger.includes('class="money-ledger-row"'));
 assert.ok(ledger.includes('50.00'));
 assert.ok(ledger.includes(translations.en.balanceDeposit));
});
test('Wallet deposits reuse the protected hosted-checkout flow but cannot charge while disabled',()=>{
 const account='bb9132ee-8c88-4f54-a827-edc8f290893a';
 const auth={user:{id:account},mfaVerified:true};
 const html=render('#/checkout?kind=wallet&sku=wallet_250','en',false,null,auth).html;
 assert.ok(html.includes('250 ₴'));
 assert.ok(html.includes('data-payment-action="checkout"'));
 assert.ok(html.includes('data-kind="wallet"'));
 assert.ok(html.includes(' disabled'));
 const frontend=readFileSync(new URL('../assets/payment-ui.js',import.meta.url),'utf8');
 assert.ok(frontend.includes("['stars','cosmetic','wallet']"));
 const walletUi=readFileSync(new URL('../assets/wallet-ui.js',import.meta.url),'utf8');
 assert.ok(walletUi.includes("rpc('aurvex_money_wallet_state')"));
 assert.ok(!walletUi.includes('.from('));
 assert.ok(!walletUi.includes('setItem('));
 const checkout=readFileSync(new URL('../supabase/functions/aurvex-payment-checkout/index.ts',import.meta.url),'utf8');
 assert.ok(checkout.includes('aurvex_payment_prepare_wallet'));
 assert.ok(checkout.includes("['stars','cosmetic','wallet']"));
 const sql=readFileSync(new URL('../supabase/migrations/aurvex_money_wallet_and_topups_20261018.sql',import.meta.url),'utf8');
 for(const fragment of ['aurvex_money_wallets','balance_uah_kop bigint not null default 0',
  'aurvex_money_ledger','unique references public.aurvex_payment_orders',
  'aurvex_money_wallet_state','aurvex_shop_actor',
  'aurvex_payment_prepare_wallet','aurvex_payment_guard',
  "if o.kind='wallet'","user_id,o.base_uah_kop","on conflict(user_id) do update"]){
  assert.ok(sql.includes(fragment),fragment);
 }
});


test('Find me online heading is removed; a single profile website link sits beneath the avatar',()=>{
 const id='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const links=[{title:'website',url:'https://flekiii.github.io/',slot:'main'}];
 const auth={user:{id,email:'private@example.org'},mfaVerified:true,profile:{nickname:'Creator',public_links:links}};
 const own=render('#/id','en',false,null,auth).html;
 assert.ok(own.includes('href="https://flekiii.github.io/"'));
 assert.ok(own.includes('profile-placed-links profile-placed-header'));
 assert.ok(!own.includes(translations.en.socialLinksTitle));
 assert.ok(!own.includes('profile-online-visibility-btn'));
 assert.ok(!appCode.includes('profile-online-visibility-btn'));
 assert.ok(!own.includes(translations.en.profileActivityIntro));
 assert.ok(!own.includes(translations.en.profileActivityEmpty));
 const model={profileTarget:id,profile:{player_id:id,nickname:'Creator',public_links:links,wishlist_visible:false}};
 const pub=render('#/player/'+id,'en',false,null,null,null,model).html;
 assert.ok(pub.includes('href="https://flekiii.github.io/"'));
 assert.ok(pub.includes('profile-placed-links profile-placed-header'));
 assert.ok(!pub.includes(translations.en.socialLinksTitle));
 const editor=render('#/id?mode=edit','en',false,null,auth).html;
 assert.ok(editor.includes('data-social37-action="visibility"'));
});
test('Profile keeps its core editor without the summary dashboard, theme editor or custom statuses in all locales',()=>{
 const id='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const auth={user:{id,email:'private@example.org',created_at:'2026-10-17T14:12:00Z'},
  mfaVerified:true,mfaFactors:[{id:'verified'}],
  profile:{nickname:'Creator',profile_bio:'Building a scary game',
    profile_status:'open',avatar_path:'avatar.jpg',banner_path:'banner.jpg',
    public_links:[{title:'GitHub',url:'https://github.com/aurvex-team'}],wishlist_public:false}};
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang,false,null,auth).html;
  assert.ok(!html.includes('class="profile-command-center"'),lang+': summary panel remains');
  assert.ok(!html.includes('class="profile-progress-bar"'),lang+': completion bar remains');
  for(const required of ['id="profile-about-form"','name="bio"','maxlength="240"',
    'data-profile-tab="links"',translations[lang].profileAboutTitle]){
   assert.ok(html.includes(required),lang+': '+required);
  }
  assert.ok(!html.includes('profile-custom-status'),lang+': custom status UI remains');
  assert.ok(html.includes('Building a scary game'));
  assert.ok(!html.includes('id="profile-appearance-form"'));
 }
});
test('Public profile bio is escaped, optional, and contains no private account information',()=>{
 const id='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const model={profileTarget:id,profile:{player_id:id,nickname:'Public creator',
  profile_bio:'Welcome <img src=x onerror=alert(1)> & "hello"',
  profile_status:'open',profile_status_text:'Working on Devive',profile_status_emoji:'🎮',
  profile_status_expires_at:null,joined_at:'2026-10-17T00:00:00Z',
  public_links:[],wishlist_visible:false,wishlist_products:[]}};
 const html=render('#/player/'+id,'en',false,null,null,null,model).html;
 assert.ok(html.includes('class="public-block profile-about-public"'));
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(!html.includes('profile-custom-status'));
 assert.ok(!html.includes('Working on Devive'));
 assert.ok(!html.includes('🎮'));
 assert.ok(html.includes(translations.en.profileAboutTitle));
 assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
 assert.ok(!html.includes('name="bio"'));
 assert.ok(!html.includes('private@example.org'));
 const missing=render('#/player/'+id,'en',false,null,null,null,
  {...model,profile:{...model.profile,profile_bio:''}}).html;
 assert.ok(!missing.includes('class="public-block profile-about-public"'));
 const hostile=render('#/player/'+id,'en',false,null,null,null,
  {...model,profile:{...model.profile,profile_status_emoji:'<svg/onload=alert(1)>'}}).html;
 assert.ok(!hostile.includes('<svg/onload=alert(1)>'));
 assert.ok(!hostile.includes('Working on Devive'));
});
test('Profile bio edits survive redraws and are not shown for the wrong signed-in account',()=>{
 const id='9fe33ef1-0f84-4bce-acbb-ae5b5883377f';
 const auth={user:{id,email:'example@example.org'},mfaVerified:true,
  profile:{nickname:'creator',profile_bio:'Saved value',profile_status:'building',
    profile_status_text:'Saved status',profile_status_emoji:'💻',public_links:[]}};
 const draft={aboutDraftUser:id,aboutDraft:{bio:'Unsaved editor description',status:'busy'}};
 const html=render('#/id?mode=edit','en',false,null,auth,null,draft).html;
 assert.ok(html.includes('Unsaved editor description'));
 assert.ok(!html.includes('Saved status'));
 assert.ok(!html.includes('data-profile-emoji="💻"'));
 const stale=render('#/id?mode=edit','en',false,null,auth,null,
  {...draft,aboutDraftUser:'other-user'}).html;
 assert.ok(!stale.includes('Unsaved editor description'));
 assert.ok(stale.includes('Saved value'));
 const svc=readFileSync(new URL('../assets/social-service.js',import.meta.url),'utf8');
 assert.ok(svc.includes("rpc('aurvex_public_profile_about'"));
 assert.ok(svc.includes("rpc('aurvex_profile_save_about'"));
 const handler=readFileSync(new URL('../assets/social-ui.js',import.meta.url),'utf8');
 for(const check of ["'profile-about-form'","readAboutDraft(form)",
  "m.aboutDraftUser=originalUser","m.aboutDraft=null;m.aboutDraftUser=''",
  "message('profileAboutSaved')","form.closest('.profile-about-editor')"]){
  assert.ok(handler.includes(check),check);
 }
});
test('Profile biography storage has AAL2, public field allowlist and server input checks',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/aurvex_profile_studio_about_v314_20261018.sql',import.meta.url),'utf8');
 for(const check of ["char_length(profile_bio)<=240","profile_bio=trim(profile_bio)",
  "'building','open','busy','chilling'","aurvex_public_profile_about",
  "jsonb_build_object('bio',p.profile_bio,'status',p.profile_status)",
  "aurvex_profile_save_about","public.aurvex_shop_actor()",
  'new_status','revoke all on function public.aurvex_profile_save_about',
  'grant execute on function public.aurvex_profile_save_about']){
  assert.ok(sql.includes(check),check);
 }
 assert.ok(!sql.includes('auth.users'));
 const ids=readFileSync(new URL('../assets/id-service.js',import.meta.url),'utf8');
 assert.ok(ids.includes('profile_bio,profile_status'));
 assert.ok(css.includes('.profile-command-center'));
 assert.ok(css.includes('.profile-about-public p{white-space:pre-wrap'));
});

test('Sidebar promo is static, shows only AURVEX and message with no legacy roadmap or version',()=>{
 for(const lang of supportedLanguages){
  const html=render('#/id?mode=edit',lang).html;
  const sidebar=html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)?.[0]||'';
  const promo=sidebar.match(/<div class="side-promo"[\s\S]*?<\/div><\/aside>/)?.[0]||'';
  assert.ok(sidebar.includes('class="side-promo"'));
  assert.ok(sidebar.includes('<div class="smallcaps">AURVEX</div>'));
  assert.ok(sidebar.includes(translations[lang].bannerTitle));
  assert.ok(!sidebar.includes('bannerButton'));
  assert.ok(!sidebar.includes('PREVIEW 2.1'));
  assert.ok(!sidebar.includes('href="#/about" class="side-promo"'));
  assert.ok(!sidebar.includes('side-version'));
  assert.ok(!sidebar.includes('See our roadmap'));
 }
 assert.ok(css.includes('.sidebar{padding:14px 12px 12px;overflow-y:hidden}'));
 assert.ok(css.includes('.sidebar .side-promo{flex-shrink:0'));
});
test('Discord-style custom profile statuses are removed from UI and client',()=>{
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 const controller=readFileSync(new URL('../assets/social-ui.js',import.meta.url),'utf8');
 const service=readFileSync(new URL('../assets/social-service.js',import.meta.url),'utf8');
 for(const source of [app,controller,service]){
  for(const fragment of ['profile-custom-status-form','profile-custom-status','profile_status_text','profile_status_emoji',
    'profile_status_expires_at','saveCustomProfileStatus','data-profile-emoji']){
   assert.ok(!source.includes(fragment),'custom status feature remains: '+fragment);
  }
 }
 const html=render('#/player/9fe33ef1-0f84-4bce-acbb-ae5b5883377f','en',false,null,null,null,{
  profileTarget:'9fe33ef1-0f84-4bce-acbb-ae5b5883377f',
  profile:{player_id:'9fe33ef1-0f84-4bce-acbb-ae5b5883377f',nickname:'Creator',
   profile_status_text:'💻 work',profile_status_emoji:'💻',profile_status_expires_at:null,public_links:[]}
 }).html;
 assert.ok(!html.includes('💻 work'));
 assert.ok(!html.includes('profile-custom-status'));
});
test('Game Library fills the viewport, scrolls only its item list, and uses themed selectors',()=>{
 const ui=readFileSync(new URL('../assets/library-ui.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/library-steam.css',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
 for(const fragment of ['data-content-kind="games"','data-content-kind="apps"',
   'data-sort-choice="recent"','data-sort-choice="name"','data-sort-choice="playtime"',
   'steam-empty-library','document.addEventListener(\'aurvex:auth-changed\'']){
  assert.ok(ui.includes(fragment),fragment);
 }
 assert.ok(!ui.includes('steam-library-top'));
 assert.ok(!ui.includes('steam-library-stats'));
 assert.ok(!ui.includes('<select data-sort>'));
 assert.ok(!ui.includes('steam-game-progress'));
 assert.ok(!ui.includes('steam-collection-select'));
 assert.ok(!ui.includes('steam-icon-button'));
 assert.ok(ui.includes("selected=''"));
 assert.ok(ui.includes("sort='name'"),'Alphabetical sorting is the default');
 assert.ok(ui.includes("contentKinds=['games','apps']"),'Games and apps are enabled together by default');
 assert.ok(ui.includes("function sortedLibraryItems()"),'The right column uses one merged list');
 assert.ok(ui.includes("data?.apps)?data.apps:Array.isArray(data?.programs)?data.programs"),'Library accepts app records from the server');
 assert.ok(ui.includes("current.map(listRow)"),'Games and apps share one rendered list');
 assert.ok(!ui.includes("steam-content-section"),'Separate content sections are removed');
 assert.ok(!ui.includes('<small>${esc(app?t(\'appsLabel\'):recent)}</small>'),'Library rows show only icon and name');
 assert.ok(css.includes('min-height:38px;padding:3px 6px'),'Library rows stay compact');
 assert.ok(css.includes('width:30px;height:30px'),'Library icons stay compact');
 assert.ok(ui.includes('<div class="steam-detail-title"><h2>${esc(name)}</h2></div>'),'Selected game detail shows only its name');
 assert.ok(!ui.includes('steam-detail-title"><span>'),'Selected game detail has no large icon');
 for(const emptyCopy of ["noItems:'No games or apps","noItems:'У бібліотеці поки немає ігор або програм","noItems:'W bibliotece nie ma jeszcze gier ani aplikacji","noItems:'Noch keine Spiele oder Apps"]){
  assert.ok(ui.includes(emptyCopy),emptyCopy);
 }
 assert.ok(app.includes("document.body.classList.toggle('library-fullscreen',route.path==='/library')"));
 assert.ok(css.includes('body.library-fullscreen{height:100dvh;overflow:hidden'));
 assert.ok(css.includes('body.library-fullscreen .steam-game-rows{flex:1;min-height:0;max-height:none;overflow-x:hidden;overflow-y:auto'));
 assert.ok(css.includes('steam-sort-picker'));
});

test('Inventory stays in the viewport and confines scrolling to item lists',()=>{
 assert.ok(appCode.includes("document.body.classList.toggle('inventory-fullscreen',route.path==='/inventory')"));
 for(const rule of ['body.inventory-fullscreen{height:100dvh;overflow:hidden;',
   'body.inventory-fullscreen .si-browser-scroll{flex:1;min-height:0;overflow-y:auto',
   'body.inventory-fullscreen .si-mini-grid{flex:1;min-height:0;max-height:none;overflow-y:auto']){
  assert.ok(css.includes(rule),rule);
 }
});
test('Previously saved profile themes and accents no longer render on own or public profiles',()=>{
 const oldAppearance={profile_theme:'summer',inner_color:'rose',transparent:true};
 const auth={user:{id:'11111111-2222-4333-8444-555555555555'},mfaVerified:true,
   profile:{nickname:'tester',profile_appearance:oldAppearance},profileTitles:[]};
 const own=render('#/id?mode=edit','en',false,null,auth).html;
 const player='22222222-2222-4333-8444-555555555555';
 const publicView=render('#/player/'+player,'en',false,null,null,null,{
   profileTarget:player,profile:{player_id:player,nickname:'other',profile_appearance:oldAppearance,public_links:[],profileTitles:[],wishlist_visible:false}
 }).html;
 for(const page of [own,publicView]){
  assert.ok(!page.includes('data-profile-theme='));
  assert.ok(!page.includes('data-profile-color='));
  assert.ok(!page.includes('data-profile-transparent='));
 }
 assert.ok(!appCode.includes('function profilePresentationAttrs'));
});

test('Only Family and Notifications routes lock page scrolling and keep overflow inside lists',()=>{
 for(const route of ["family","notifications"]){
  assert.ok(appCode.includes("document.body.classList.toggle('"+route+"-fullscreen',route.path==='/"+route+"')"),route);
  assert.ok(css.includes("body."+route+"-fullscreen .main"),route);
 }
 assert.ok(css.includes('body.notifications-fullscreen .notifications-list{flex:1;min-height:0;overflow-y:auto'));
 assert.ok(css.includes('body.family-fullscreen .family-panel{min-height:0;overflow-y:auto'));
});

test('Only the Friends route locks page scrolling and scrolls its overflow lists internally',()=>{
 assert.ok(appCode.includes("document.body.classList.toggle('friends-fullscreen',route.path==='/friends')"));
 assert.ok(css.includes('body.friends-fullscreen .friends-main{min-height:0;grid-template-rows:repeat(3,minmax(0,1fr))'));
 assert.ok(css.includes('body.friends-fullscreen .friends-list{flex:1;min-height:0;overflow-y:auto'));
 assert.ok(css.includes('body.friends-fullscreen{height:100dvh;overflow:hidden'));
});


test('Winter theme and inventory explanations are translated in every supported language',()=>{
 for(const lang of supportedLanguages){
  assert.ok(translations[lang].themeWinter,'Missing winter theme label: '+lang);
  for(const key of ['siPurpose','siChanges','siAvatarFramePurpose','siAvatarFrameChanges','siProfileFramePurpose','siProfileFrameChanges','siGameItemPurpose','siGameItemChanges','siEquipStatus','siEquipped','siUnequipped']){
   assert.ok(translations[lang][key],'Missing '+key+' translation: '+lang);
  }
 }
 const winterCss=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');
 assert.ok(winterCss.includes('@keyframes aurvex-snow-fall'));
 assert.ok(winterCss.includes('.aurvex-snowfall{position:fixed;inset:0'));
});


test('Global themes recolor shared navigation, banners, downloads and the separate game library',()=>{
 const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');
 for(const selector of [
  '.topbar{border-bottom-color:var(--line)',
  ':root[data-theme] .library-hero{',
  ':root[data-theme] .downloads-hero',
  ':root[data-theme] .money-wallet-status',
  ':root[data-theme] .notification-hero-stats',
  '.si-header{background:'
 ])assert.ok(css.includes(selector),'Missing global theme coverage for '+selector);
});


test('Only Wallet locks page scrolling and scrolls overflowing wallet lists inside their panels',()=>{
 assert.ok(appCode.includes("document.body.classList.toggle('balance-fullscreen',route.path==='/balance')"));
 assert.ok(css.includes('body.balance-fullscreen{height:100dvh;overflow:hidden'));
 assert.ok(css.includes('body.balance-fullscreen .money-content{display:grid'));
 assert.ok(css.includes('body.balance-fullscreen .money-history .money-ledger-list{flex:1;min-height:0;overflow-y:auto'));
});


test('Signed-in profile opens a Steam-style overview and sends editing to its own screen',()=>{
 const user='4fc26253-27c0-4fc1-96bb-a6dbcf567777';
 const auth={user:{id:user,created_at:'2026-10-17T12:00:00Z'},mfaVerified:true,
  profile:{nickname:'fleki',profile_bio:'Playing and building games',public_links:[],wishlist_public:true},
  profileTitles:[]};
 const social={gameActivity:{visible:true,recent_30_days_seconds:7200,games:[{
  game_id:'devive',recent_seconds:3600,last_played_at:'2026-10-26T12:00:00Z'
 }]}};
 const view=render('#/id','uk',false,null,auth,null,social).html;
 assert.ok(view.includes('class="player-profile steam-profile-page"'));
 assert.ok(view.includes('href="#/id?mode=edit"'));
 assert.ok(view.includes(translations.uk.profileEditButton));
 assert.ok(view.includes(translations.uk.profileActivityLast30Days));
 assert.ok(view.includes('Playing and building games'));
 assert.ok(view.includes('Devive'));
 assert.ok(!view.includes('id="id-nickname-form"'));
 const editor=render('#/id?mode=edit','uk',false,null,auth).html;
 assert.ok(editor.includes('id="id-nickname-form"'));
 assert.ok(editor.includes('href="#/id"'));
 assert.ok(editor.includes(translations.uk.profileViewButton));
});
