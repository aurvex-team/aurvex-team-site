import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { translations, supportedLanguages } from '../assets/i18n.js';

const appCode=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const source=appCode.replace(/^import\s+\{\s*translations,\s*supportedLanguages\s*\}\s+from\s+['"].\/i18n\.js(?:\?v=[a-zA-Z0-9-]+)?['"];\s*/,'');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');

function render(route='#/',lang=null,wished=false,theme=null,auth=null){
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
  const window={scrollY:0,addEventListener(){},scrollTo(){},AURVEX_ID:auth};
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

