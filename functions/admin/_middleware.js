import {currentSession} from '../_lib/auth.js';

export async function onRequest(context){
  const url=new URL(context.request.url);
  // Cloudflare Pages serves HTML with extensionless canonical URLs.
  // Both forms must be public to avoid /login.html <-> /login loops.
  const path=url.pathname.replace(/\/+$/,'')||'/';
  if(['/admin/login','/admin/login.html','/admin/setup','/admin/setup.html','/admin/invite','/admin/invite.html','/admin/forgot-password','/admin/forgot-password.html','/admin/reset-password','/admin/reset-password.html'].includes(path)){
    return context.next();
  }

  if(!context.env.DB){
    return Response.redirect(new URL('/admin/login?error=setup',url),302);
  }
  try{
    const session=await currentSession(context);
    if(!session)return Response.redirect(new URL('/admin/login',url),302);
  }catch{
    return new Response('Admin authentication is temporarily unavailable. Check the D1 database binding and schema.',{status:503,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  }
  return context.next();
}
