import {json,sameOrigin,passwordHash} from '../../_lib/auth.js';
import {
 RESET_REQUEST_TTL,normalizeResetEmail,isValidResetEmail,isValidResetToken,
 resetTokenDigest,ensurePasswordResetTables,isAllowedResetRequest,resetLinkIsValid
} from '../../_lib/password-resets.js';

const publicAcknowledgement=()=>json({
 ok:true,
 message:'If this email belongs to an eligible administrator, your request has been recorded. Contact the website owner for a private reset link.'
});

export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const db=context.env.DB;
 if(!db)return json({ok:false,error:'Password recovery is unavailable. Contact the website owner.'},503);
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 const action=String(body?.action||'');
 if(!['request','inspect','complete'].includes(action))
  return json({ok:false,error:'Invalid recovery action.'},400);

 try{
  await ensurePasswordResetTables(db);
  if(action==='request'){
   const email=normalizeResetEmail(body?.email);
   if(!isValidResetEmail(email))return publicAcknowledgement();
   const now=Date.now();
   if(!await isAllowedResetRequest(db,context.request,now))return publicAcknowledgement();
   const account=await db.prepare('SELECT id,active FROM admin_users WHERE email=?').bind(email).first();
   const first=await db.prepare('SELECT id FROM admin_users ORDER BY rowid ASC LIMIT 1').first();
   if(!account||!account.active||account.id===first?.id)return publicAcknowledgement();
   const pending=await db.prepare(`SELECT id FROM admin_password_resets
    WHERE user_id=? AND revoked_at IS NULL AND used_at IS NULL AND requested_at>? LIMIT 1`)
    .bind(account.id,now-RESET_REQUEST_TTL).first();
   if(!pending)await db.prepare(`INSERT INTO admin_password_resets(id,user_id,requested_at)
    VALUES(?,?,?)`).bind(crypto.randomUUID(),account.id,now).run();
   return publicAcknowledgement();
  }

  const token=String(body?.token||'');
  if(!isValidResetToken(token))
   return json({ok:false,error:'Invalid or expired password reset link.'},400);
  const tokenHash=await resetTokenDigest(token);
  const reset=await db.prepare(`SELECT r.id,r.user_id,r.requested_at,r.approved_at,r.expires_at,
   r.used_at,r.revoked_at,r.token_hash,u.email,u.active
   FROM admin_password_resets r JOIN admin_users u ON r.user_id=u.id
   WHERE r.token_hash=?`).bind(tokenHash).first();
  const founder=await db.prepare('SELECT id FROM admin_users ORDER BY rowid ASC LIMIT 1').first();
  if(!reset||!reset.active||reset.user_id===founder?.id||!resetLinkIsValid(reset))
   return json({ok:false,error:'This password reset link has expired or is no longer valid. Request another link.'},410);
  if(action==='inspect')return json({ok:true,email:reset.email,expiresAt:reset.expires_at});

  const password=String(body?.password||''),confirmation=String(body?.confirmPassword||'');
  if(password.length<14||password.length>1024)
   return json({ok:false,error:'Use a password between 14 and 1024 characters.'},400);
  if(password!==confirmation)return json({ok:false,error:'Passwords do not match.'},400);
  const salt=crypto.randomUUID(),hash=await passwordHash(password,salt),now=Date.now();
  // D1 batch operations run in a transaction. A token can only be consumed once,
  // and the password update is coupled to that one-time consumption.
  const writes=await db.batch([
   db.prepare(`UPDATE admin_password_resets SET used_at=?
    WHERE token_hash=? AND used_at IS NULL AND revoked_at IS NULL
    AND approved_at IS NOT NULL AND expires_at>? AND requested_at>?
    AND user_id IN (SELECT id FROM admin_users WHERE active=1)`)
    .bind(now,tokenHash,now,now-RESET_REQUEST_TTL),
   db.prepare(`UPDATE admin_users SET password_hash=?,salt=?
    WHERE active=1 AND id=(SELECT user_id FROM admin_password_resets
     WHERE token_hash=? AND used_at=?)`).bind(hash,salt,tokenHash,now),
   db.prepare(`DELETE FROM admin_sessions
    WHERE user_id=(SELECT user_id FROM admin_password_resets
     WHERE token_hash=? AND used_at=?)`).bind(tokenHash,now),
   db.prepare(`UPDATE admin_password_resets SET revoked_at=?
    WHERE user_id=(SELECT user_id FROM admin_password_resets WHERE token_hash=?)
    AND used_at IS NULL AND revoked_at IS NULL`).bind(now,tokenHash)
  ]);
  if(!writes[0]?.meta?.changes||!writes[1]?.meta?.changes)
   return json({ok:false,error:'This link has already been used or expired. Request another reset link.'},409);
  return json({ok:true,message:'Password updated. Sign in with your new password.'});
 }catch(error){
  console.error('Password recovery failed',error?.name||'Error');
  return json({ok:false,error:'Password recovery is temporarily unavailable. Please try again.'},503);
 }
}
