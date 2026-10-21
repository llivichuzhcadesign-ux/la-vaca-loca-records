import {json,currentSession,sameOrigin,passwordHash} from '../../../_lib/auth.js';
const roles=new Set(['owner','admin','editor']);
async function owner(context){const s=await currentSession(context);return s?.role==='owner'&&s.active?null:json({ok:false,error:'Owner access required.'},403)}
export async function onRequestGet(context){
 const reject=await owner(context);if(reject)return reject;
 const {results}=await context.env.DB.prepare('SELECT id,email,role,active FROM admin_users ORDER BY email').all();
 return json({ok:true,users:results});
}
export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const reject=await owner(context);if(reject)return reject;
 let b;try{b=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),role=String(b.role||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<14||password.length>1024||!roles.has(role))
   return json({ok:false,error:'Valid email, role and password (14+ characters) required.'},400);
 const salt=crypto.randomUUID(),hash=await passwordHash(password,salt);
 try{await context.env.DB.prepare('INSERT INTO admin_users(id,email,password_hash,salt,role,active) VALUES(?,?,?,?,?,1)').bind(crypto.randomUUID(),email,hash,salt,role).run()}
 catch{return json({ok:false,error:'This email is already registered.'},409)}
 return json({ok:true});
}
export async function onRequestPatch(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const reject=await owner(context);if(reject)return reject;
 let b;try{b=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const id=String(b.id||''),role=b.role===undefined?undefined:String(b.role),active=b.active===undefined?undefined:Number(b.active);
 const db=context.env.DB;
 const target=await db.prepare('SELECT id,role,active FROM admin_users WHERE id=?').bind(id).first();
 if(!target)return json({ok:false,error:'User not found.'},404);
 if(role!==undefined&&!roles.has(role))return json({ok:false,error:'Invalid role.'},400);
 if(active!==undefined&&![0,1].includes(active))return json({ok:false,error:'Invalid account status.'},400);
 const nextRole=role??target.role,nextActive=active??target.active;
 if(target.role==='owner'&&(nextRole!=='owner'||!nextActive)){
  const count=await db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='owner' AND active=1").first();
  if(count.n<=1)return json({ok:false,error:'Cannot deactivate the last active owner.'},409);
 }
 await db.prepare('UPDATE admin_users SET role=?,active=? WHERE id=?').bind(nextRole,nextActive,id).run();
 if(!nextActive||nextRole!==target.role)await db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id).run();
 return json({ok:true});
}
export async function onRequestDelete(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const reject=await owner(context);if(reject)return reject;
 let b;try{b=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const id=String(b.id||''),password=String(b.password||'');
 if(!id||password.length<14||password.length>1024)return json({ok:false,error:'User ID and new password required (14+ characters).'},400);
 const salt=crypto.randomUUID(),hash=await passwordHash(password,salt),db=context.env.DB;
 const result=await db.prepare('UPDATE admin_users SET password_hash=?,salt=? WHERE id=?').bind(hash,salt,id).run();
 if(!result.meta.changes)return json({ok:false,error:'User not found.'},404);
 await db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id).run();
 return json({ok:true});
}