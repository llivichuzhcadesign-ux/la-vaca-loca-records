import {json,requireSession,sameOrigin,currentSession} from '../../_lib/auth.js';
export async function onRequest(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const rejected=await requireSession(context);if(rejected)return rejected;
 const session=await currentSession(context);
 if(session.role==='editor'&&context.request.method!=='GET')return json({ok:false,error:'Editors cannot publish or upload media.'},403);
 return context.next();
}