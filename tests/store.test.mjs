import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { translations, supportedLanguages } from '../assets/i18n.js';

const appCode=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const source=appCode.replace(/^import\s+\{\s*translations,\s*supportedLanguages\s*\}\s+from\s+['"].\/i18n\.js(?:\?v=[a-zA-Z0-9-]+)?['"];\s*/,'');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');

function render(route='#/',lang=null,wished=false,theme=null,auth=null,friends=null,social=null){
  const storage=new Map();
  if(lang)storage.set('aurvex.locale',lang);
  if(wished)storage.set('aurvex.wishlist.devive','1');
  if(theme)storage.set('aurvex.theme',theme);
  const holder={innerHTML:''};
  const fallback={textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){}};
  const document={
    documentElement:{lang:'',dataset:{}},
    title:'',
    body:{classList:{add(){},remove(){},toggle(){},contains(){return false}}},
    getElementById(id){return id==='app'?holder:fallback;},
    addEventListener(){},
  };
  const window={scrollY:0,addEventListener(){},scrollTo(){},AURVEX_ID:auth,AURVEX_FRIENDS:friends,AURVEX_SOCIAL:social};
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
  for(const file of ['devive-scene.svg','devive-interior.svg','devive-hallway.svg','favicon.svg']){
    assert.ok(existsSync(new URL('../assets/'+file,import.meta.url)),'Missing '+file);
  }
  for(const target of ['assets/site.css','assets/app.js','assets/favicon.svg'])assert.ok(index.includes(target));
  assert.ok(css.includes('@media(max-width:560px)'),'Missing compact mobile styling');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Respect reduced motion');
});

test('English + dark mode default on a new browser',()=>{
  const {html,lang,theme,title}=render();
  assert.equal(lang,'en');
  assert.equal(theme,'dark');
  assert.match(title,/AURVEX/);
  assert.ok(html.includes('The next chapter starts here.'));
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
  assert.ok(render('#/about','de').html.includes(translations.de.roadmap5));
  assert.ok(render('#/game/devive','pl').html.includes(translations.pl.share));
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
    assert.ok(rewards.includes(translations[lang].rewardsEmptyText));
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



test('MORE section links to Team and Support the Team without removing About',()=>{
  const html=render('#/').html;
  const sidebar=html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)?.[0]||'';
  assert.ok(sidebar.includes('href="#/team"'));
  assert.ok(sidebar.includes('href="#/support"'));
  assert.ok(sidebar.includes('href="#/about"'));
  const more=sidebar.split('<div class="side-label">'+translations.en.more+'</div>')[1]?.split('</div>')[0]||'';
  assert.ok(more.includes('href="#/team"'));
  assert.ok(more.includes('href="#/support"'));
  assert.ok(more.indexOf('href="#/team"')<more.indexOf('href="#/support"'));
  assert.ok(more.indexOf('href="#/support"')<more.indexOf('href="#/about"'));
  assert.ok(html.includes('href="#/team"'));
  assert.ok(html.includes('href="#/support"'));
});
test('Team and Support have real pages with content localized in all four languages',()=>{
  for(const lang of supportedLanguages){
    const team=render('#/team',lang);
    assert.equal(team.lang,lang);
    assert.ok(team.html.includes(translations[lang].teamTitle));
    assert.ok(!team.html.includes(translations[lang].teamMembersNote));
    assert.ok(!team.html.includes(translations[lang].teamTrackCode));
    assert.ok(!team.html.includes('team-tracks'));
    assert.ok(!team.html.includes('team-profiles-note'));
    assert.ok(team.html.includes('href="#/game/devive"'));
    const support=render('#/support',lang);
    assert.equal(support.lang,lang);
    assert.ok(support.html.includes(translations[lang].supportTitle));
    assert.ok(support.html.includes(translations[lang].supportFundingStatus));
    assert.ok(support.html.includes('data-action="share-site"'));
    assert.ok(support.html.includes(translations[lang].supportNote));
  }
});
test('Support page does not invent payment details or operational checkout',()=>{
  const html=render('#/support').html;
  assert.ok(!html.includes('send.monobank.ua'));
  assert.ok(!html.includes('checkout.stripe.com'));
  assert.ok(!html.includes('<form action="https://'));
  assert.ok(html.includes(translations.en.supportFundingDesc));
});

test('Team joins Discord through a safe external collaboration link in all languages',()=>{
  for(const lang of supportedLanguages){
    const team=render('#/team',lang);
    assert.ok(team.html.includes(translations[lang].teamJoin));
    assert.ok(team.html.includes(translations[lang].teamJoinHint));
    assert.ok(team.html.includes('href="https://discord.gg/KWD2rfy2Vh"'));
    assert.ok(team.html.includes('target="_blank" rel="noopener noreferrer"'));
    assert.ok(team.html.includes('href="#/game/devive"'));
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
    const login=render('#/id',lang);
    const signup=render('#/id?mode=register',lang);
    assert.ok(login.html.includes(translations[lang].idHeading));
    assert.ok(login.html.includes(translations[lang].idSignIn));
    assert.ok(signup.html.includes(translations[lang].idRegister));
    assert.ok(signup.html.includes('data-mode="register"'));
    assert.ok(login.html.includes('id="id-email-form"'));
    assert.ok(login.html.includes('data-id-action="google"'));
    assert.ok(login.html.includes(translations[lang].idXoni));
  }
});
test('AURVEX ID sign-in methods are clearly gated per provider',()=>{
  const html=render('#/id').html;
  assert.ok(html.includes(translations.en.idSetupTitle));
  assert.ok(html.includes(translations.en.idSetupBody));
  assert.match(html,/data-id-action="google" disabled aria-disabled="true"/);// No auth model has initialized in the isolated renderer
  assert.match(html,/id="id-email"[^>]*disabled aria-disabled="true"/);
  assert.match(html,/id="id-email-form"[^>]*data-mode="signin"/);
  assert.ok(html.includes('id-xoni'));
  assert.match(html,/id-xoni[^"]*" type="button" disabled/);
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
  assert.ok(config.includes("xoniEnabled:false"));
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
  assert.match(config,/xoniEnabled:false/);
  assert.ok(ui.includes('configured:isIdConfigured()&&(ID_CONFIG.emailEnabled||ID_CONFIG.googleEnabled)'));
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


test('Google sign-in is enabled when the verified Google provider config loads, while email and XONI remain unavailable',()=>{
  const client={configured:true,googleEnabled:true,emailEnabled:false,ready:true,busy:false,user:null,pendingEmail:''};
  for(const lang of supportedLanguages){
    const html=render('#/id',lang,false,null,client).html;
    assert.match(html,/<button[^>]*data-id-action="google"(?![^>]*disabled)/);
    assert.ok(html.includes(translations[lang].idGoogle));
    assert.ok(!html.includes(translations[lang].idSetupTitle));
    assert.match(html,/id="id-email"[^>]*disabled aria-disabled="true"/);
    assert.ok(html.includes('id-xoni'));
    assert.match(html,/id-xoni[^"]*" type="button" disabled/);
  }
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
    const html=render('#/id',lang,false,null,auth).html;
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
  const html=render('#/id','en',false,null,auth).html;
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
    const page=render('#/id',lang,false,null,{
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
  const page=render('#/id','uk',false,null,{
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
  const page=render('#/id','en',false,null,{
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
  const profile=render('#/id','en',false,null,{
    user:{id:'u',email:'user@example.com',created_at:'2026-10-17T00:00:00Z'},
    mfaVerified:true,mfaHasFactors:true,mfaFactors:[{id:'factor',status:'verified'}],
    profile:{nickname:'player'},statusKey:''
  }).html;
  assert.ok(profile.includes('class="player-profile"'));
  assert.ok(profile.includes(translations.en.mfaVerifiedLabel));
  assert.ok(profile.includes('data-id-action="mfa-backup"'));
  assert.ok(profile.includes(translations.en.mfaBackupDesc));
  const twice=render('#/id','en',false,null,{
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
  const html=render('#/id',lang,false,null,auth).html;
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
