import {digest} from './auth.js';

export const RESET_TOKEN_TTL=30*60*1000;
export const RESET_REQUEST_TTL=7*24*60*60*1000;
export const RESET_RATE_WINDOW=15*60*1000;
export const MAX_REQUESTS_PER_IP=8;
export const normalizeResetEmail=value=>String(value||'').trim().toLowerCase();
export const isValidResetEmail=email=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidResetToken=token=>/^[a-f0-9]{64}$/.test(token);
export const newResetToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
export const resetTokenDigest=token=>digest(token);

export async function ensurePasswordResetTables(db){
 if(!db)throw Error('D1 binding DB is missing');
 await db.prepare(`CREATE TABLE IF NOT EXISTS admin_password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  requested_at INTEGER NOT NULL,
  approved_at INTEGER,
  approved_by TEXT,
  token_hash TEXT UNIQUE,
  expires_at INTEGER,
  used_at INTEGER,
  revoked_at INTEGER
 )`).run();
 await db.prepare(`CREATE TABLE IF NOT EXISTS admin_password_reset_limits (
  fingerprint TEXT PRIMARY KEY,
  window_started INTEGER NOT NULL,
  request_count INTEGER NOT NULL
 )`).run();
}
export async function isAllowedResetRequest(db,request,now){
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 const fingerprint=await digest('lvl-password-recovery-v1:'+ip);
 const existing=await db.prepare('SELECT window_started,request_count FROM admin_password_reset_limits WHERE fingerprint=?')
  .bind(fingerprint).first();
 const withinWindow=existing&&now-Number(existing.window_started)<RESET_RATE_WINDOW;
 if(withinWindow&&Number(existing.request_count)>=MAX_REQUESTS_PER_IP)return false;
 // Fixed-window throttle, separate from the ordinary login lockout counters.
 await db.prepare(`INSERT INTO admin_password_reset_limits(fingerprint,window_started,request_count)
  VALUES(?,?,1) ON CONFLICT(fingerprint) DO UPDATE SET
  window_started=excluded.window_started,
  request_count=CASE WHEN admin_password_reset_limits.window_started=? THEN admin_password_reset_limits.request_count+1 ELSE 1 END`)
  .bind(fingerprint,withinWindow?Number(existing.window_started):now,withinWindow?Number(existing.window_started):-1).run();
 return true;
}
export function resetRequestIsActive(row,now=Date.now()){
 return !!row&&!row.used_at&&!row.revoked_at&&Number(row.requested_at)>now-RESET_REQUEST_TTL;
}
export function resetLinkIsValid(row,now=Date.now()){
 return resetRequestIsActive(row,now)&&!!row.approved_at&&!!row.token_hash&&Number(row.expires_at)>now;
}
