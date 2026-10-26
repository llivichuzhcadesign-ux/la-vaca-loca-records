import {json,currentSession,sameOrigin} from '../../_lib/auth.js';
import {
 RESET_TOKEN_TTL,RESET_REQUEST_TTL,newResetToken,resetTokenDigest,
 ensurePasswordResetTables,resetRequestIsActive
} from '../../_lib/password-resets.js';

async function ownerAccess(context){
 if(!context.env.DB)return {error:json({ok:false,error:'Admin database unavailable.'},503)};
 const session=await currentSession(context);
 return session?.role==='owner'&&session.active?{session}:
  {error:json({ok:false,error:'Owner access required.'},403)};
}
async function founderId(db){
 return (await db.prepare('SELECT id FROM admin_users ORDER BY rowid ASC LIMIT 1').first())?.id||null;
}
const validId=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);

export async function onRequestGet(context){
 const access=await ownerAccess(context);if(access.error)return access.error;
 const db=context.env.DB;
 try{
  await ensurePasswordResetTables(db);
  const primary=await founderId(db);
  const {results}=await db.prepare(`SELECT r.id,r.user_id,u.email,u.role,r.requested_at,
    r.approved_at,r.expires_at,r.used_at,r.revoked_at
    FROM admin_password_resets r JOIN admin_users u ON u.id=r.user_id
    WHERE r.requested_at>? AND r.used_at IS NULL AND r.revoked_at IS NULL
    AND r.user_id!=? ORDER BY r.requested_at DESC LIMIT 100`)
    .bind(Date.now()-RESET_REQUEST_TTL,primary||'').all();
  return json({ok:true,requests:results||[]});
 }catch(error){
  console.error('Unable to list password resets',error?.name||'Error');
  return json({ok:false,error:'Could not load password reset requests.'},503);
 }
}

export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await ownerAccess(context);if(access.error)return access.error;
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 const action=String(body?.action||''),db=context.env.DB;
 if(!['approve','direct'].includes(action))return json({ok:false,error:'Invalid reset action.'},400);
 try{
  await ensurePasswordResetTables(db);
  const now=Date.now(),primary=await founderId(db);
  let requestId=String(body?.id||''),target;
  if(action==='direct'){
   const id=String(body?.userId||'');
   if(!validId(id))return json({ok:false,error:'Invalid account.'},400);
   target=await db.prepare('SELECT id,email,active FROM admin_users WHERE id=?').bind(id).first();
   if(!target||!target.active)return json({ok:false,error:'Only active accounts can receive password reset links.'},404);
   if(id===primary)return json({ok:false,error:'The primary designer account cannot receive an administrator-generated reset link.'},403);
   const pending=await db.prepare(`SELECT id FROM admin_password_resets
     WHERE user_id=? AND used_at IS NULL AND revoked_at IS NULL AND requested_at>?
     ORDER BY requested_at DESC LIMIT 1`).bind(id,now-RESET_REQUEST_TTL).first();
   if(pending)requestId=pending.id;
   else{
    requestId=crypto.randomUUID();
    await db.prepare('INSERT INTO admin_password_resets(id,user_id,requested_at) VALUES(?,?,?)')
     .bind(requestId,id,now).run();
   }
  }else{
   if(!validId(requestId))return json({ok:false,error:'Invalid request.'},400);
   const request=await db.prepare(`SELECT r.id,r.user_id,r.requested_at,r.used_at,r.revoked_at,
     u.email,u.active FROM admin_password_resets r JOIN admin_users u ON u.id=r.user_id
     WHERE r.id=?`).bind(requestId).first();
   if(!resetRequestIsActive(request,now))return json({ok:false,error:'This recovery request is no longer active.'},410);
   if(!request.active)return json({ok:false,error:'This account is not active.'},403);
   if(request.user_id===primary)return json({ok:false,error:'The primary designer account is protected.'},403);
   target={id:request.user_id,email:request.email};
  }
  const token=newResetToken(),hash=await resetTokenDigest(token);
  const result=await db.prepare(`UPDATE admin_password_resets
    SET token_hash=?,approved_at=?,approved_by=?,expires_at=?
    WHERE id=? AND used_at IS NULL AND revoked_at IS NULL AND requested_at>? `)
   .bind(hash,now,access.session.user_id,now+RESET_TOKEN_TTL,requestId,now-RESET_REQUEST_TTL).run();
  if(!result.meta.changes)return json({ok:false,error:'This recovery request is no longer active.'},409);
  const url=new URL('/admin/reset-password.html',context.request.url);
  url.hash='token='+token;
  return json({ok:true,email:target.email,expiresAt:now+RESET_TOKEN_TTL,resetUrl:url.toString()});
 }catch(error){
  console.error('Unable to approve password reset',error?.name||'Error');
  return json({ok:false,error:'Could not generate a reset link. Check Cloudflare D1.'},503);
 }
}

export async function onRequestDelete(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await ownerAccess(context);if(access.error)return access.error;
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 const id=String(body?.id||'');
 if(!validId(id))return json({ok:false,error:'Invalid request.'},400);
 try{
  const db=context.env.DB;await ensurePasswordResetTables(db);
  const primary=await founderId(db);
  const result=await db.prepare(`UPDATE admin_password_resets SET revoked_at=?
    WHERE id=? AND user_id!=? AND used_at IS NULL AND revoked_at IS NULL`)
   .bind(Date.now(),id,primary||'').run();
  if(!result.meta.changes)return json({ok:false,error:'Recovery request already closed or not found.'},409);
  return json({ok:true});
 }catch(error){
  console.error('Unable to revoke password reset',error?.name||'Error');
  return json({ok:false,error:'Could not revoke the reset request.'},503);
 }
}
