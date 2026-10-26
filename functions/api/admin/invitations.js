import {json,currentSession,sameOrigin} from '../../_lib/auth.js';
import {INVITE_TTL_MS,INVITE_ROLES,normalizeEmail,validEmail,generateInviteToken,inviteTokenHash,ensureInvitations} from '../../_lib/invitations.js';

async function requireOwner(context){
 if(!context.env.DB)return {error:json({ok:false,error:'Admin database unavailable.'},503)};
 const session=await currentSession(context);
 return session?.role==='owner'&&session.active
  ? {session}
  : {error:json({ok:false,error:'Owner access required.'},403)};
}

export async function onRequestGet(context){
 const access=await requireOwner(context);if(access.error)return access.error;
 try{
  const db=context.env.DB;await ensureInvitations(db);
  const {results}=await db.prepare(`SELECT id,email,role,created_at,expires_at,used_at,revoked_at
   FROM admin_invitations ORDER BY created_at DESC LIMIT 100`).all();
  return json({ok:true,invitations:results||[]});
 }catch(error){
  console.error('Failed listing invitations',error?.name||'Error');
  return json({ok:false,error:'Could not load invitations.'},503);
 }
}

export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await requireOwner(context);if(access.error)return access.error;
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const email=normalizeEmail(body?.email),role=String(body?.role||'');
 if(!validEmail(email)||!INVITE_ROLES.has(role))
  return json({ok:false,error:'Valid email and role are required.'},400);
 const db=context.env.DB;
 try{
  await ensureInvitations(db);
  const existing=await db.prepare('SELECT id FROM admin_users WHERE email=?').bind(email).first();
  if(existing)return json({ok:false,error:'An account with this email already exists. Use account management instead.'},409);
  const now=Date.now(),token=generateInviteToken(),hash=await inviteTokenHash(token);
  // Reissuing an invitation invalidates earlier unredeemed links for this email.
  await db.batch([
   db.prepare(`UPDATE admin_invitations SET revoked_at=?
      WHERE email=? AND used_at IS NULL AND revoked_at IS NULL`).bind(now,email),
   db.prepare(`INSERT INTO admin_invitations
      (id,email,role,token_hash,invited_by,created_at,expires_at,used_at,revoked_at)
      VALUES(?,?,?,?,?,?,?,NULL,NULL)`)
      .bind(crypto.randomUUID(),email,role,hash,access.session.user_id,now,now+INVITE_TTL_MS)
  ]);
  const url=new URL('/admin/invite.html',context.request.url);
  url.hash='token='+token;
  return json({ok:true,email,role,expiresAt:now+INVITE_TTL_MS,inviteUrl:url.toString()});
 }catch(error){
  console.error('Failed creating invitation',error?.name||'Error');
  return json({ok:false,error:'Could not create invitation. Check Cloudflare D1.'},503);
 }
}

export async function onRequestDelete(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await requireOwner(context);if(access.error)return access.error;
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const id=String(body?.id||'');
 if(!/^[0-9a-f-]{36}$/i.test(id))return json({ok:false,error:'Invalid invitation.'},400);
 try{
  const db=context.env.DB;
  await ensureInvitations(db);
  const result=await db.prepare(`UPDATE admin_invitations SET revoked_at=?
    WHERE id=? AND revoked_at IS NULL AND used_at IS NULL`).bind(Date.now(),id).run();
  if(!result.meta.changes)return json({ok:false,error:'Invitation already used, revoked, or not found.'},409);
  return json({ok:true});
 }catch(error){
  console.error('Failed revoking invitation',error?.name||'Error');
  return json({ok:false,error:'Could not revoke invitation.'},503);
 }
}
