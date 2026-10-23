import {json,currentSession,sameOrigin,passwordHash} from '../../_lib/auth.js';

const roles=new Set(['owner','admin','editor']);

async function owner(context){
 const session=await currentSession(context);
 return session?.role==='owner'&&session.active
  ? {session}
  : {error:json({ok:false,error:'Owner access required.'},403)};
}

// The initial setup account is the first D1 admin_users row. No schema migration
// is necessary, and changing email or creating another Owner cannot unprotect it.
async function foundingOwnerId(db){
 const row=await db.prepare('SELECT id FROM admin_users ORDER BY rowid ASC LIMIT 1').first();
 return row?.id||null;
}

async function readBody(context){
 try{return await context.request.json()}catch{return null}
}

export async function onRequestGet(context){
 const access=await owner(context);if(access.error)return access.error;
 const db=context.env.DB;
 const [{results},primaryId]=await Promise.all([
  db.prepare('SELECT id,email,role,active FROM admin_users ORDER BY email').all(),
  foundingOwnerId(db)
 ]);
 return json({ok:true,users:results.map(user=>({
  ...user,
  protected:user.id===primaryId,
  self:user.id===access.session.user_id
 }))});
}

export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await owner(context);if(access.error)return access.error;
 const b=await readBody(context);if(!b)return json({ok:false,error:'Invalid JSON.'},400);
 const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),role=String(b.role||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<14||password.length>1024||!roles.has(role))
  return json({ok:false,error:'Valid email, role and password (14+ characters) required.'},400);
 const salt=crypto.randomUUID(),hash=await passwordHash(password,salt);
 try{
  await context.env.DB.prepare('INSERT INTO admin_users(id,email,password_hash,salt,role,active) VALUES(?,?,?,?,?,1)')
   .bind(crypto.randomUUID(),email,hash,salt,role).run();
 }catch{return json({ok:false,error:'This email is already registered.'},409)}
 return json({ok:true});
}

export async function onRequestPatch(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await owner(context);if(access.error)return access.error;
 const b=await readBody(context);if(!b)return json({ok:false,error:'Invalid JSON.'},400);
 const id=String(b.id||''),role=b.role===undefined?undefined:String(b.role);
 const active=b.active===undefined?undefined:Number(b.active),db=context.env.DB;
 if(role!==undefined&&!roles.has(role))return json({ok:false,error:'Invalid role.'},400);
 if(active!==undefined&&![0,1].includes(active))return json({ok:false,error:'Invalid account status.'},400);
 if(role===undefined&&active===undefined)return json({ok:false,error:'No changes supplied.'},400);
 const target=await db.prepare('SELECT id,role,active FROM admin_users WHERE id=?').bind(id).first();
 if(!target)return json({ok:false,error:'Account not found.'},404);
 const nextRole=role??target.role,nextActive=active??target.active;
 if(id===await foundingOwnerId(db)&&(nextRole!=='owner'||!nextActive))
  return json({ok:false,error:'The primary designer account cannot be deactivated or have its Owner role changed.'},403);
 if(access.session.user_id===id&&(!nextActive||nextRole!=='owner'))
  return json({ok:false,error:'You cannot deactivate or remove your own Owner access.'},409);
 if(target.role==='owner'&&(nextRole!=='owner'||!nextActive)){
  const count=await db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='owner' AND active=1").first();
  if(count.n<=1)return json({ok:false,error:'Cannot deactivate the last active owner.'},409);
 }
 await db.prepare('UPDATE admin_users SET role=?,active=? WHERE id=?')
  .bind(nextRole,nextActive,id).run();
 if(!nextActive||nextRole!==target.role)
  await db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id).run();
 return json({ok:true});
}

// Password changes use PUT, so DELETE can mean permanent account deletion.
export async function onRequestPut(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await owner(context);if(access.error)return access.error;
 const b=await readBody(context);if(!b)return json({ok:false,error:'Invalid JSON.'},400);
 const id=String(b.id||''),password=String(b.password||''),db=context.env.DB;
 if(!id||password.length<14||password.length>1024)
  return json({ok:false,error:'Account and new password required (14+ characters).'},400);
 const primaryId=await foundingOwnerId(db);
 if(id===primaryId&&access.session.user_id!==id)
  return json({ok:false,error:'Only the primary designer can change the primary account password.'},403);
 const salt=crypto.randomUUID(),hash=await passwordHash(password,salt);
 const result=await db.prepare('UPDATE admin_users SET password_hash=?,salt=? WHERE id=?')
  .bind(hash,salt,id).run();
 if(!result.meta.changes)return json({ok:false,error:'Account not found.'},404);
 await db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id).run();
 return json({ok:true});
}

export async function onRequestDelete(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const access=await owner(context);if(access.error)return access.error;
 const b=await readBody(context);if(!b)return json({ok:false,error:'Invalid JSON.'},400);
 const id=String(b.id||''),email=String(b.email||'').trim().toLowerCase();
 const db=context.env.DB;
 if(!id||b.confirm!=='DELETE'||!email)
  return json({ok:false,error:'Account email and DELETE confirmation are required.'},400);
 const target=await db.prepare('SELECT id,email,role,active FROM admin_users WHERE id=?').bind(id).first();
 if(!target)return json({ok:false,error:'Account not found.'},404);
 if(id===await foundingOwnerId(db))
  return json({ok:false,error:'The primary designer account is permanent and cannot be deleted.'},403);
 if(id===access.session.user_id)
  return json({ok:false,error:'You cannot delete your own signed-in account.'},403);
 if(email!==String(target.email).toLowerCase())
  return json({ok:false,error:'The confirmation email does not match this account.'},400);
 if(target.role==='owner'&&target.active){
  const count=await db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='owner' AND active=1").first();
  if(count.n<=1)return json({ok:false,error:'Cannot delete the last active owner.'},409);
 }
 // Delete the sessions and account atomically. D1 batches execute in a transaction.
 const result=await db.batch([
  db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id),
  db.prepare('DELETE FROM admin_users WHERE id=?').bind(id)
 ]);
 if(!result[1]?.meta?.changes)return json({ok:false,error:'Account could not be deleted.'},409);
 return json({ok:true,deleted:true});
}
