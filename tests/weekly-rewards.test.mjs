import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations,supportedLanguages} from '../assets/i18n.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const migration=read('../supabase/migrations/20261027080642_aurvex_weekly_stars_rewards.sql');
const rewardClient=read('../assets/weekly-rewards-ui.js');
const app=read('../assets/app.js');
const css=read('../assets/site.css');

test('weekly Stars rewards are Sunday-only, account-bound and recorded atomically',()=>{
  assert.match(migration,/primary key\(user_id,week_start\)/);
  assert.match(migration,/unique\(user_id,week_number\)/);
  assert.match(migration,/public\.aurvex_shop_actor\(\)/);
  assert.match(migration,/dow<>0 or utc_today<season_start/);
  assert.match(migration,/insert into public\.aurvex_weekly_star_claims/);
  assert.match(migration,/insert into public\.aurvex_shop_ledger\(user_id,points_delta,reason\)/);
  assert.match(migration,/values\(who,amount,'weekly_reward'\)/);
  assert.match(migration,/500\+200\*\(\(week_no-1\)\/2\)/);
  assert.match(rewardClient,/rpc\('aurvex_weekly_star_claim'\)/);
  assert.doesNotMatch(rewardClient,/from\('aurvex_shop_wallets'\)|update\(/);
});

test('Sunday reward and theme controls have translations in every enabled language',()=>{
  for(const lang of supportedLanguages){
    for(const key of ['weeklyRewardTitle','weeklyRewardIntro','weeklyRewardClaim','weeklyRewardClaimed','weeklyRewardSundayOnly','themeMenu','themeCosmicRed','themeNebulaBlue','themeAurora','themeLight']){
      assert.ok(translations[lang][key],lang+': '+key);
    }
  }
  for(const theme of ['dark','light','blue','aurora']){
    assert.ok(app.includes("'"+theme+"'"),'theme picker missing '+theme);
  }
  assert.match(css,/:root\[data-theme=blue\]/);
  assert.match(css,/:root\[data-theme=aurora\]/);
});

test('new Stars items are named in each enabled language',()=>{
  for(const lang of supportedLanguages){
    for(const id of ['avatar_summer','avatar_frostnova','avatar_galaxy','profile_summer','profile_winter','profile_galaxy','profile_neon']){
      assert.ok(translations[lang]['shopItem_'+id],lang+': shopItem_'+id);
    }
  }
});
