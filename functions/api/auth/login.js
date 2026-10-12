import {json,sameOrigin,digest,passwordHash,cookie} from '../../_lib/auth.js';
export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const db=context.env.DB;if(!db)return json({ok:false,error:'Database not configured.'},503);
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
 if(!email||!password||password.length>1024)return json({ok:false,error:'Invalid credentials.'},401);
 const fingerprint=await digest((context.request.headers.get('CF-Connecting-IP')||'unknown')+':'+email);
 const attempts=await db.prepare('SELECT count,blocked_until FROM login_attempts WHERE fingerprint=?').bind(fingerprint).first();
 if(attempts?.blocked_until>Date.now())return json({ok:false,error:'Too many attempts. Try again later.'},429);
 const user=await db.prepare('SELECT id,email,password_hash,salt FROM admin_users WHERE email=?').bind(email).first();
 const salt=user?.salt||'00000000-0000-0000-0000-000000000000';
 const computed=await passwordHash(password,salt);
 if(!user||computed!==user.password_hash){
   const count=(attempts?.count||0)+1;
   await db.prepare('INSERT INTO login_attempts(fingerprint,count,blocked_until) VALUES(?,?,?) ON CONFLICT(fingerprint) DO UPDATE SET count=excluded.count,blocked_until=excluded.blocked_until').bind(fingerprint,count>=5?0:count,count>=5?Date.now()+15*60*1000:0).run();
   return json({ok:false,error:'Invalid email or password.'},401);
 }
 await db.prepare('DELETE FROM login_attempts WHERE fingerprint=?').bind(fingerprint).run();
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 await db.prepare('INSERT INTO admin_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),user.id,await digest(token),Date.now()+30*24*60*60*1000).run();
 return json({ok:true,email:user.email},200,{'set-cookie':cookie(token,30*24*60*60)});
}