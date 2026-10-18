# AURVEX global community chat — v3.16 (2026-10-18)

## Behavior
- Public read-only feed at \`#/chat\`, accessible to visitors with no AURVEX ID.
- Write/report only after AURVEX ID with confirmed email, completed TOTP 2FA (JWT \`aal2\`), and an existing nickname. This is enforced by database RPCs, **not** merely disabled browser buttons.
- Single global room, most recent 60 posts, with nickname, avatar, timestamp and link to the author's public profile.
- Text-only messages 1–500 characters. HTTP links, WWW links and email addresses are disallowed; no file/image attachments, embeds or clickable HTML.
- Slow mode 12 seconds, up to 20 posts per 10 minutes and 120 posts per 24 hours. Rates and sender identity are checked server-side under a per-user row lock. Duplicate submission keys are idempotent.
- Public only sees visible posts; three reports from distinct verified accounts automatically put a post on hold. Each reporter may file at most 15 reports a day and cannot report their own post.
- Reports support: spam, harassment, unsafe content, privacy, other. Hide a user locally from the browser UI with a reset control. Only server moderators can lift holds, remove posts, mute or ban users.
- Realtime uses a lightweight \`aurvex_chat_pulses\` PostgreSQL publication: events contain only pulse IDs, **never** message text or user data. Client refetches the filtered 60-message snapshot on pulse events. A periodic 14-second refetch is a fallback and runs only when the user is viewing chat.
- EN, UK, PL and DE text, theme-aware desktop/mobile layout.

## Storage/security
- \`aurvex_chat_messages\`: private table; only filtered \`aurvex_chat_feed()\` allows public read access. No direct browser selects or writes.
- \`aurvex_chat_controls\`: private mutes, bans, lock timestamps.
- \`aurvex_chat_reports\`: private reports; only author/reporting metadata is server-side.
- \`aurvex_chat_moderators\`: server-only grant list.
- \`aurvex_chat_pulses\`: public, minimal change notification; no client writes allowed.
- All tables RLS enabled and client table permissions revoked.
- Only privileged moderator users (AAL2 + membership of \`aurvex_chat_moderators\`) can invoke \`aurvex_chat_moderate_message\` or \`aurvex_chat_moderate_user\`.

## Before inviting a large audience
- **Appoint a trusted adult or approved staff moderator**. The new moderators table is intentionally empty: connecting as admin does not automatically make someone a moderator. Using a secure Supabase server-side operator session, insert the trusted moderator's auth UUID into \`public.aurvex_chat_moderators\`. Never share service keys publicly or add a "become moderator" browser button.
- Assign clear moderation rules, monitor open reports and configure regular deletion/retention policies and backups. The first release has **no automated moderation queue dashboard**; review held messages in Supabase until one exists.
- Define a child/teen-safety response process and privacy contact before promoting public chat. Email verification + 2FA are not proof of safe behavior.
- Test at least two real verified accounts, one signed-out browser, reports crossing the 3-reporter threshold, banned/muted users and Realtime subscribe. CI covers syntax, UI routing, translations and static SQL security properties; it does not substitute for multi-user end-to-end moderation testing.
- As users grow, switch from Postgres Changes pulses to a private Realtime Broadcast or managed websocket service for better scale.

### Administrative console examples (server operators only)
\`\`\`sql
-- Give a trusted admin (verify the user UUID independently).
insert into public.aurvex_chat_moderators(user_id)
values ('<trusted-auth-user-uuid>');
-- Manual moderation, using an authorised moderator AAL2 session:
select public.aurvex_chat_moderate_message(123,'removed');
select public.aurvex_chat_moderate_user('<abusive-auth-user-uuid>','mute_1d');
-- Server operator may also review private report metadata in the Supabase Dashboard.
\`\`\`

**Reminder:** This is a community chat, not an end-to-end encrypted private messenger. Do not post sensitive personal information.
