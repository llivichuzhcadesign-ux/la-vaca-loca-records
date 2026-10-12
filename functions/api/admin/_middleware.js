import {json,requireSession,sameOrigin} from '../../_lib/auth.js';
export async function onRequest(context){
 if(!sameOrigin(context.request))return json({ok:false,error:'Invalid origin.'},403);
 const rejected=await requireSession(context);
 return rejected||context.next();
}