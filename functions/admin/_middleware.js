import {currentSession} from '../_lib/auth.js';
export async function onRequest(context){
 const url=new URL(context.request.url);
 if(url.pathname==='/admin/login.html'||url.pathname==='/admin/setup.html')return context.next();
 if(!context.env.DB)return Response.redirect(new URL('/admin/login.html?error=setup',url),302);
 const session=await currentSession(context);
 if(!session)return Response.redirect(new URL('/admin/login.html',url),302);
 return context.next();
}