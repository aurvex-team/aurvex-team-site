// Public profile links: browser-independent normalization and validation.
// The database runs its own HTTPS-only validation; client checks are UX only.
const LABELS=[
  ['github.com','GitHub'],['tiktok.com','TikTok'],['instagram.com','Instagram'],
  ['youtube.com','YouTube'],['youtu.be','YouTube'],['discord.gg','Discord'],
  ['discord.com','Discord'],['twitch.tv','Twitch'],['x.com','X'],
  ['twitter.com','X'],['facebook.com','Facebook'],['threads.net','Threads'],
  ['linktr.ee','Linktree'],['steamcommunity.com','Steam']
];
export function normalizePublicLinks(fields){
  if(!Array.isArray(fields)||fields.length>3)throw new Error('LINK_LIMIT');
  const result=[];
  for(const field of fields){
    const givenTitle=String(field?.title??'').trim();
    const raw=String(field?.url??'').trim();
    if(!givenTitle&&!raw)continue;
    if(!raw)throw new Error('LINK_MISSING_URL');
    // Plain github.com/name or pasted URLs without a scheme work too.
    const candidate=/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:'https://'+raw;
    let parsed;
    try{parsed=new URL(candidate)}catch{throw new Error('LINK_INVALID_URL')}
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||
       !parsed.hostname.includes('.')||parsed.hostname.endsWith('.')||
       parsed.hostname==='localhost'||parsed.hostname.length>253){
      throw new Error('LINK_INVALID_URL');
    }
    const url=parsed.href;
    if(url.length>220)throw new Error('LINK_TOO_LONG');
    const hostname=parsed.hostname.toLowerCase().replace(/^www\./,'');
    const found=LABELS.find(([domain])=>hostname===domain||hostname.endsWith('.'+domain));
    const title=givenTitle||(found?found[1]:hostname);
    if(title.length<1||title.length>40||/[\u0000-\u001f<>]/.test(title)){
      throw new Error('LINK_INVALID_TITLE');
    }
    if(result.some(link=>link.url===url))throw new Error('LINK_DUPLICATE');
    result.push({title,url});
  }
  return result;
}
