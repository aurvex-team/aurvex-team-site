import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {translations,supportedLanguages} from '../assets/i18n.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('assets/app.js').replace(/^import\s+\{\s*translations,\s*supportedLanguages\s*\}\s+from\s+['"].\/i18n\.js(?:\?v=[a-zA-Z0-9-]+)?['"];\s*/,'')
 .replace(/^import\s+['"][^'"]+['"];\s*/gm,'');
function view(hash,lang='en'){
 const holder={innerHTML:''};
 const fallback={textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){}};
 const document={documentElement:{lang:'',dataset:{}},title:'',
  body:{classList:{add(){},remove(){},toggle(){},contains(){return false}}},
  getElementById(k){return k==='app'?holder:fallback},addEventListener(){}};
 const window={scrollY:0,addEventListener(){},scrollTo(){}};
 const location={hash};
 const localStorage={getItem(k){return k==='aurvex.locale'?lang:null},setItem(){}};
 new Function('translations','supportedLanguages','document','window','location','localStorage',code)
 (translations,supportedLanguages,document,window,location,localStorage);
 return holder.innerHTML;
}
test('Community chat page, route and navigation are fully removed',()=>{
 for(const lang of supportedLanguages){
  const html=view('#/chat',lang);
  assert.ok(!html.includes('id="chat-message-feed"'));
  assert.ok(!html.includes('class="chat-layout"'));
  assert.ok(!html.includes('href="#/chat"'));
 }
 const app=read('assets/app.js');
 assert.ok(!app.includes("route.path==='/chat'"));
 assert.ok(!app.includes('communityChatPage'));
 assert.ok(!app.includes('AURVEX_CHAT_MOUNT'));
 const index=read('index.html');
 assert.ok(!index.includes('assets/chat-ui.js'));
 assert.ok(!index.includes('assets/chat-admin-ui.js'));
 const workflow=read('.github/workflows/pages.yml');
 assert.ok(workflow.includes('node --check assets/chat-ui.js'));
});
test('Public chat feed is a server-filtered read-only RPC and no direct database messaging API',()=>{
 const src=read('assets/chat-ui.js');
 assert.ok(src.includes("rpc('aurvex_chat_feed')"));
 assert.ok(src.includes("rpc('aurvex_chat_send'"));
 assert.ok(src.includes("rpc('aurvex_chat_report'"));
 assert.ok(src.includes("table:'aurvex_chat_pulses'"));
 assert.ok(src.includes("schema:'public'"));
 assert.ok(src.includes("window.AURVEX_ID?.mfaVerified===true"));
 assert.ok(src.includes("if(!verified()||s.busy)return"));
 assert.ok(src.includes("if(!verified()||s.busy||!Number.isSafeInteger(messageId)"));
 assert.ok(src.includes("crypto.randomUUID()"));
 assert.ok(!src.includes(".from('aurvex_chat_messages'"));
 assert.ok(!src.includes(".from('aurvex_chat_controls'"));
 assert.ok(!src.includes(".from('aurvex_chat_reports'"));
 assert.ok(!src.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(!src.includes('authorization:'));
});
test('Server provides verification, rate limiting, abuse reports, moderation and no guest access',()=>{
 const sql=read('supabase/migrations/aurvex_global_chat_moderated_20261018.sql');
 for(const required of [
  'alter table public.aurvex_chat_messages enable row level security',
  'alter table public.aurvex_chat_reports enable row level security',
  'alter table public.aurvex_chat_controls enable row level security',
  'revoke all on public.aurvex_chat_messages,public.aurvex_chat_controls',
  'grant select on public.aurvex_chat_pulses to anon,authenticated',
  'aurvex_chat_feed()', "where status='visible' order by id desc limit 60",
  'grant execute on function public.aurvex_chat_feed() to anon,authenticated',
  'revoke all on function public.aurvex_chat_send(text,uuid) from public,anon',
  'grant execute on function public.aurvex_chat_send(text,uuid) to authenticated',
  "who:=public.aurvex_shop_actor()",
  'u.email_confirmed_at is not null',
  "c.last_sent_at>now()-interval '12 seconds'",
  "created_at>now()-interval '10 minutes'",
  "created_at>now()-interval '24 hours'",
  "char_length(body) between 1 and 500",
  "'CHAT_MESSAGE_INVALID_OR_LINK'",
  'on conflict(author_id,client_request)',
  'count(*) into total from public.aurvex_chat_reports',
  'if total>=3 then',
  "set status='held'",
  'aurvex_chat_moderators',
  "when decision='ban_7d'",
  'alter publication supabase_realtime add table public.aurvex_chat_pulses']){
   // The idempotency unique index is represented as a table constraint.
   const match=required==='on conflict(author_id,client_request)'?
     sql.includes('unique(author_id,client_request)'):sql.includes(required);
   assert.ok(match,'Missing security control: '+required);
 }
 assert.ok(!sql.includes('grant insert on public.aurvex_chat_messages'));
 assert.ok(!sql.includes('grant execute on function public.aurvex_chat_send(text,uuid) to anon'));
 assert.ok(!sql.includes('insert into public.aurvex_chat_moderators(user_id) values'));
});
test('Chat escapes posted HTML, displays accounts and includes abuse-safety affordances',()=>{
 const src=read('assets/chat-ui.js');
 assert.ok(src.includes("replaceAll('<','&lt;')"));
 assert.ok(src.includes("esc(String(x.body||'').slice(0,500))"));
 assert.ok(src.includes('href="#/player/'));
 assert.ok(src.includes('data-chat-report='));
 assert.ok(src.includes('data-chat-hide='));
 assert.ok(src.includes('data-chat-action'));
 assert.ok(src.includes("if(!verified()||s.busy)return"));
 const css=read('assets/site.css');
 for(const selector of ['.chat-layout{','.chat-room,.chat-guidelines{','.chat-message-feed{','.chat-composer-row{',
  '.chat-report-tools{','@media(max-width:700px)'])
  assert.ok(css.includes(selector));
 assert.ok(existsSync(new URL('../docs/AURVEX-CHAT.md',import.meta.url)));
});
