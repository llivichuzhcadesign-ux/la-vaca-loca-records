import {json,sameOrigin,passwordHash} from '../../_lib/auth.js';
import {normalizeEmail,validToken,inviteTokenHash,ensureInvitations,invitationIsValid} from '../../_lib/invitations.js';

// Public only to anyone in possession of a valid, unexpired, one-time invite.
// All requests are POST: invitation tokens never appear in an API URL or a log.
export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403,{'referrer-policy':'no-referrer'});
 const db=context.env.DB;
 if(!db)return json({ok:false,error:'Admin database unavailable.'},503);
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 const token=String(body?.token||'');
 const action=String(body?.action||'');
 if(!validToken(token)||!['inspect','accept'].includes(action))
  return json({ok:false,error:'This invitation link is invalid or expired.'},400);
 try{
  await ensureInvitations(db);
  const hash=await inviteTokenHash(token);
  const invite=await db.prepare(`SELECT id,email,role,expires_at,used_at,revoked_at
     FROM admin_invitations WHERE token_hash=?`).bind(hash).first();
  if(!invitationIsValid(invite))
   return json({ok:false,error:'This invitation has expired or is no longer valid. Request a new link.'},410);
  if(action==='inspect'){
   const existing=await db.prepare('SELECT id FROM admin_users WHERE email=?').bind(normalizeEmail(invite.email)).first();
   if(existing)return json({ok:false,error:'This email already has an administrator account.'},409);
   return json({ok:true,email:invite.email,role:invite.role,expiresAt:invite.expires_at});
  }
  const password=String(body?.password||'');
  if(password.length<14||password.length>1024)
   return json({ok:false,error:'Use a password between 14 and 1024 characters.'},400);
  if(password!==String(body?.confirmPassword||''))
   return json({ok:false,error:'Passwords do not match.'},400);
  const salt=crypto.randomUUID(),password_hash=await passwordHash(password,salt);
  const now=Date.now();
  // Both steps form one transaction. The INSERT only succeeds for a valid,
  // unused invitation and an email that does not yet have an account.
  const results=await db.batch([
   db.prepare(`INSERT INTO admin_users(id,email,password_hash,salt,role,active)
      SELECT ?,i.email,?,?,i.role,1 FROM admin_invitations i
      WHERE i.id=? AND i.token_hash=? AND i.used_at IS NULL AND i.revoked_at IS NULL
      AND i.expires_at>? AND NOT EXISTS(SELECT 1 FROM admin_users u WHERE u.email=i.email)`)
    .bind(crypto.randomUUID(),password_hash,salt,invite.id,hash,now),
   db.prepare(`UPDATE admin_invitations SET used_at=?
      WHERE id=? AND token_hash=? AND used_at IS NULL AND revoked_at IS NULL
      AND EXISTS(SELECT 1 FROM admin_users WHERE email=admin_invitations.email)`)
    .bind(now,invite.id,hash)
  ]);
  if(!results[0]?.meta?.changes||!results[1]?.meta?.changes)
   return json({ok:false,error:'This invitation has already been used or is no longer valid.'},409);
  return json({ok:true,message:'Your account is ready. Sign in with your new password.'});
 }catch(error){
  if(/UNIQUE|constraint/i.test(error?.message||''))
   return json({ok:false,error:'This invitation has already been used or the account exists.'},409);
  console.error('Invite acceptance failed',error?.name||'Error');
  return json({ok:false,error:'Unable to complete invitation. Please try again.'},503);
 }
}
