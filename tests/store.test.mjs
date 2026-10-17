import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { translations, supportedLanguages } from '../assets/i18n.js';

const appCode=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const source=appCode.replace(/^import\s+\{\s*translations,\s*supportedLanguages\s*\}\s+from\s+['"].\/i18n\.js['"];\s*/,'');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/site.css',import.meta.url),'utf8');

function render(route='#/',lang=null,wished=false,theme=null){
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
  const window={scrollY:0,addEventListener(){},scrollTo(){}};
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
