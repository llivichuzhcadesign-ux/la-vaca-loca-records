const encoder=new TextEncoder();
export const COOKIE='lvl_admin_session';
const TTL=30*24*60*60*1000;
export const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'cache-control':'no-store',...headers}});
export function same(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
export const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)))}
export async function passwordHash(password,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256));
}
export function cookie(token,maxAge){return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export function getToken(request){const match=(request.headers.get('cookie')||'').match(/(?:^|;\s*)lvl_admin_session=([^;]+)/);return match?.[1]||''}
export function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin}
export async function currentSession(context){
 const token=getToken(context.request);if(!/^[a-f0-9]{64}$/.test(token)||!context.env.DB)return null;
 const tokenHash=await digest(token);
 const row=await context.env.DB.prepare('SELECT s.id,s.user_id,u.email,u.role,u.active FROM admin_sessions s JOIN admin_users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,Date.now()).first();
 return row?.active?row:null;
}
export async function requireSession(context){
 if(!context.env.DB)return json({ok:false,error:'Admin database is not configured.'},503);
 const session=await currentSession(context);
 return session?null:json({ok:false,error:'Sign in required.'},401);
}