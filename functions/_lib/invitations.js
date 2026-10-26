import {digest} from './auth.js';

export const INVITE_TTL_MS=48*60*60*1000;
export const INVITE_ROLES=new Set(['owner','admin','editor']);
export const normalizeEmail=value=>String(value||'').trim().toLowerCase();
export const validEmail=email=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validToken=token=>/^[a-f0-9]{64}$/.test(token);

export function generateInviteToken(){
 return Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export const inviteTokenHash=token=>digest(token);

// The SQL migration is retained in /migrations/0003_admin_invitations.sql.
// CREATE IF NOT EXISTS makes the feature work on existing D1 bindings at deploy time.
export async function ensureInvitations(db){
 if(!db)throw Error('Missing D1 binding');
 await db.prepare(`CREATE TABLE IF NOT EXISTS admin_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','admin','editor')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  revoked_at INTEGER
 )`).run();
}
export function invitationIsValid(invite,now=Date.now()){
 return !!invite&&!invite.used_at&&!invite.revoked_at&&Number(invite.expires_at)>now;
}
