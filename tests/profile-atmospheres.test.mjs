import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {translations,supportedLanguages} from '../assets/i18n.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const themes=['galaxy','summer','winter','aurora','neon','ocean','sunset','forest','rose','midnight','sakura','desert','autumn','arctic','volcanic','starlight'];
const accents=['rose','violet','blue','gold','emerald','cyan','red','orange','white','mint','teal','indigo','coral','lavender','silver'];
const shopItems=['avatar_violet','avatar_ruby','avatar_cyan','avatar_gold','avatar_summer','avatar_frostnova','avatar_galaxy','avatar_nebula','avatar_aurora',
 'profile_emerald','profile_cosmic','profile_frost','profile_flame','profile_summer','profile_winter','profile_galaxy','profile_neon','profile_solarflare','profile_voidglass'];

test('All profile themes and accents are available, visually distinct and translated',()=>{
 const app=read('assets/app.js'),css=read('assets/site.css'),i18n=read('assets/i18n.js');
 for(const theme of themes){
  assert.ok(app.includes("'"+theme+"','profileTheme"),'missing choice '+theme);
  assert.ok(css.includes('data-profile-theme="'+theme+'"'),'missing visual theme '+theme);
  const key='profileTheme'+theme[0].toUpperCase()+theme.slice(1);
  for(const lang of supportedLanguages)assert.ok(translations[lang][key],lang+': '+key);
 }
 for(const color of accents){
  assert.ok(app.includes("'"+color+"','profileColor"),'missing accent choice '+color);
  assert.ok(css.includes('data-profile-color="'+color+'"'),'missing accent style '+color);
  const key='profileColor'+color[0].toUpperCase()+color.slice(1);
  for(const lang of supportedLanguages)assert.ok(translations[lang][key],lang+': '+key);
 }
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('aurvex-profile-fall'));
 assert.ok(css.includes("url('./profile-summer-beach.png')"));
 assert.ok(existsSync(new URL('../assets/profile-summer-beach.png',import.meta.url)));
});

test('Every active Stars cosmetic applies to avatars or full profile frames',()=>{
 const app=read('assets/app.js'),css=read('assets/site.css');
 const helper=app.slice(app.indexOf('function shopStyleAttrs'),app.indexOf('function profilePresentationAttrs'));
 for(const item of shopItems){
  const kind=item.startsWith('avatar_')?'avatar':'profile';
  assert.ok(helper.includes(item),'profile allowlist missing '+item);
  assert.ok(css.includes('data-shop-'+kind+'="'+item+'"'),'cosmetic has no profile effect: '+item);
 }
});

test('Server appearance validation accepts the full safe profile palette',()=>{
 const sql=read('supabase/migrations/20261027123000_profile_atmospheres.sql');
 for(const theme of themes)assert.ok(sql.includes("'"+theme+"'"),theme);
 for(const color of accents)assert.ok(sql.includes("'"+color+"'"),color);
 assert.ok(sql.includes('aurvex_valid_appearance'));
});
