// AURVEX ID public configuration.
// Only publish the Supabase PROJECT URL and its sb_publishable_ key here.
// NEVER commit service_role, secret API keys, Google OAuth client secrets,
// XONI integration keys or any private credentials to this repository.
export const ID_CONFIG=Object.freeze({
  supabaseUrl:'https://zalzsgfufvppvgvqfocf.supabase.co',
  supabasePublishableKey:'sb_publishable_TbkBRf0gcJwdQpXNE7SSwg_WLe8FrXr',
  googleEnabled:true,
  emailEnabled:false,
  xoniEnabled:false
});
export function isIdConfigured(){
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(ID_CONFIG.supabaseUrl)
    && /^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(ID_CONFIG.supabasePublishableKey);
}
