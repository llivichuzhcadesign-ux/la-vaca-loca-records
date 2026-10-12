import {json,cookie,getToken,digest,sameOrigin} from '../../_lib/auth.js';
export async function onRequestPost(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const token=getToken(context.request);
 if(context.env.DB&&/^[a-f0-9]{64}$/.test(token))await context.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
 return json({ok:true},200,{'set-cookie':cookie('',0)});
}