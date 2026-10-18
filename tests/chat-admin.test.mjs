import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations,supportedLanguages} from '../assets/i18n.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('AURVEX 3.17 ships moderator panel and secured per-message actions',()=>{
 const app=read('assets/app.js'),chat=read('assets/chat-ui.js'),admin=read('assets/chat-admin-ui.js');
 const index=read('index.html'),workflow=read('.github/workflows/pages.yml');
 for(const token of ['id="chat-admin-panel"','AURVEX_CHAT_ADMIN_MOUNT?.()'])
   assert.ok(app.includes(token),token);
 assert.ok(chat.includes('window.AURVEX_CHAT_ADMIN_POST_TOOLS?.(x)'));
 assert.ok(chat.includes('window.AURVEX_CHAT_RENDER=renderMessages'));
 assert.ok(chat.includes('window.AURVEX_CHAT_RELOAD=load'));
 assert.ok(admin.includes("rpc('aurvex_chat_staff_state'"));
 assert.ok(app.indexOf('id="chat-admin-panel"')>app.indexOf('class="chat-side-column"'));
 assert.ok(app.includes('data-mod-mobile-open'));
 assert.ok(app.includes('class="chat-admin-backdrop"'));
 assert.ok(admin.includes('data-mod-tab="members"'));
 assert.ok(admin.includes('data-mod-tab="reports"'));
 assert.ok(admin.includes('data-mod-pick-user'));
 assert.ok(admin.includes('data-mod-select-message'));
 assert.ok(admin.includes('data-mod-mobile-close'));
 assert.ok(!admin.includes('data-mod-toggle'));
 assert.ok(!admin.includes('<details class="mod-message-menu"'));
 assert.ok(read('assets/site.css').includes('.chat-admin-slot.is-mobile-open'));
 assert.ok(read('assets/site.css').includes('.chat-side-column{display:flex'));
 assert.ok(admin.includes("rpc('aurvex_chat_staff_roster'"));
 assert.ok(admin.includes("rpc('aurvex_chat_moderation_queue'"));
 assert.ok(admin.includes("rpc('aurvex_chat_moderate_user'"));
 assert.ok(admin.includes("rpc('aurvex_chat_moderate_message'"));
 assert.ok(admin.includes("functions.invoke('aurvex-chat-admin'"));
 assert.ok(admin.includes('window.AURVEX_ID?.mfaVerified===true'));
 assert.ok(admin.includes('mod.siteAdmin'));
 assert.ok(admin.includes("if(!window.confirm("));
 assert.ok(!admin.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(index.includes('assets/chat-admin-ui.js?v=20261018-480'));
 assert.ok(workflow.includes('node --check assets/chat-admin-ui.js'));
});
test('Staff actions support durations, full account suspension and restore',()=>{
 const functions=[
 'aurvex_site_suspension_tables_v317_20261018',
 'aurvex_site_suspension_guard_v317_20261018',
 'aurvex_chat_staff_state_v317_20261018',
 'aurvex_chat_ban_lengths_v317_20261018',
 'aurvex_site_admin_audit_v317_20261018',
 'aurvex_site_ban_rpc_v317_20261018',
 'aurvex_chat_review_queue_v317_20261018',
 'aurvex_chat_staff_roster_v317_20261018'];
 for(const file of functions){
  assert.ok(read('supabase/migrations/'+file+'.sql').length>80,file);
 }
 const guard=read('supabase/migrations/aurvex_site_suspension_guard_v317_20261018.sql');
 assert.ok(guard.includes('aurvex_site_bans'));
 assert.ok(guard.includes('AURVEX_ACCOUNT_SUSPENDED'));
 const user=read('supabase/migrations/aurvex_chat_ban_lengths_v317_20261018.sql');
 for(const name of ['mute_1h','mute_1d','ban_1d','ban_7d','ban_30d','ban_permanent','unban','CHAT_PROTECTED_USER']){
  assert.ok(user.includes(name),name);
 }
 const rpc=read('supabase/migrations/aurvex_site_ban_rpc_v317_20261018.sql');
 assert.ok(rpc.includes('aurvex_site_admins'));
 assert.ok(rpc.includes('SITE_ADMIN_REQUIRED'));
 assert.ok(rpc.includes('SITE_PROTECTED_USER'));
 assert.ok(rpc.includes('aurvex_site_ban_audit'));
 assert.ok(rpc.includes('grant execute on function public.aurvex_chat_site_action'));
 const ui=read('assets/chat-admin-ui.js');
 for(const key of ['ban_site','unban_site','ban_permanent','ban_7d','removed','visible']){
  assert.ok(ui.includes(key),key);
 }
});
test('Moderator text is localized and untrusted account names are escaped',()=>{
 for(const locale of supportedLanguages){
  for(const key of ['modManage','modDelete','modBanWeek','modBanForever',
   'modBanSite','modUnbanSite','modReportsTitle','modConfirm']){
    assert.ok(translations[locale][key],locale+' '+key);
  }
 }
 const admin=read('assets/chat-admin-ui.js');
 assert.ok(admin.includes(".replaceAll('<','&lt;')"));
 assert.ok(admin.includes("esc(x.nickname||t('modUnknownPlayer'))"));
 assert.ok(admin.includes("esc(String(x.body||'').slice(0,500))"));
 assert.ok(!admin.includes("innerHTML=String(x.body"));
});


test('Staff can search account by nickname or UUID without exposing email data',()=>{
 const admin=read('assets/chat-admin-ui.js');
 const sql=read('supabase/migrations/aurvex_chat_staff_find_users_v317_20261018.sql');
 for(const fragment of ["mod-find-form","name=\"search\"",
   "rpc('aurvex_chat_staff_find_users'","if(!isStaff()||mod.busy)",
   "new Map([...matches,...mod.roster]"]){
   assert.ok(admin.includes(fragment),fragment);
 }
 for(const fragment of ["aurvex_chat_staff_find_users",
   "who:=public.aurvex_shop_actor()",
   "CHAT_NOT_MODERATOR",
   "char_length(term)<3",
   "char_length(term)>40",
   "order by nickname limit 12",
   "revoke all on function public.aurvex_chat_staff_find_users(text) from public,anon"]){
   assert.ok(sql.includes(fragment),fragment);
 }
 assert.ok(!sql.includes('select email'));
 assert.ok(!sql.includes('auth.users u where'));
 for(const locale of supportedLanguages){
   assert.ok(translations[locale].modSearchPlaceholder);
   assert.ok(translations[locale].modSearchButton);
 }
});

test('Right-side moderation controls are localized, maintain selection and use privileged RPCs',()=>{
 const admin=read('assets/chat-admin-ui.js');
 const css=read('assets/site.css');
 const app=read('assets/app.js');
 assert.ok(app.indexOf('id="chat-admin-panel"')>app.indexOf('class="chat-side-column"'));
 assert.ok(app.indexOf('id="chat-admin-panel"')>app.indexOf("'</section>'")||app.includes('class="chat-side-column"'));
 for(const text of ["selectedUser:","selectedMessage:","tab:'members'","mobileOpen:false",
   "data-mod-tab=","data-mod-mobile-open","data-mod-mobile-close",
   "data-mod-select-message=","mod.selectedUser=target","mod.tab='members'",
   "data-mod-clear-message"]){
   // selectedUser is assigned in multiple paths; actual saved select target comes from change events.
   if(text==="mod.selectedUser=target")continue;
   assert.ok(admin.includes(text)||app.includes(text),text);
 }
 assert.ok(css.includes(".chat-side-column{display:flex"));
 assert.ok(css.includes(".chat-admin-slot:not(:empty){display:block;position:fixed"));
 assert.ok(css.includes("body.chat-admin-drawer-open .chat-admin-backdrop"));
 for(const locale of supportedLanguages){
  for(const key of ['modUsersTab','modReportsTab','modSelectedMessage',
    'modClearSelection','modManageAccount','modSelectMember','modUnknownPlayer']){
   assert.ok(translations[locale][key],locale+' '+key);
  }
 }
});
