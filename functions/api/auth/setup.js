import {json,same,sameOrigin,passwordHash} from '../../_lib/auth.js';
export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const db=context.env.DB,secret=context.env.ADMIN_SETUP_TOKEN;
 if(!db||!secret)return json({ok:false,error:'Database or setup secret missing.'},503);
 let body;try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
 if(!same(body.setupToken,secret))return json({ok:false,error:'Invalid setup token.'},403);
 const existing=await db.prepare('SELECT id FROM admin_users LIMIT 1').first();
 if(existing)return json({ok:false,error:'Administrator already created. Setup is disabled.'},409);
 const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<14||password.length>1024)return json({ok:false,error:'Enter a valid email and a password of at least 14 characters.'},400);
 const salt=crypto.randomUUID(),hash=await passwordHash(password,salt);
 try{await db.prepare('INSERT INTO admin_users(id,email,password_hash,salt) VALUES(?,?,?,?)').bind(crypto.randomUUID(),email,hash,salt).run()}
 catch{return json({ok:false,error:'Administrator account already exists.'},409)}
 return json({ok:true,message:'Administrator created. Remove ADMIN_SETUP_TOKEN from Cloudflare settings after setup.'});
}