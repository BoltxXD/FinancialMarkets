import {isEditor} from '@/lib/editor-auth';
import {contentSchema} from '@/lib/site-content';
import {saveContent} from '@/lib/content-store';
export async function PUT(request:Request){
 if(!await isEditor())return Response.json({error:'Only the site owner can save changes.'},{status:403});
 if(request.headers.get('x-mths-editor')!=='1'||!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Invalid editor request.'},{status:400});
 const origin=request.headers.get('origin');if(origin&&origin!=='https://mths-financial-markets.snottyfive.chatgpt.site'&&origin!==new URL(request.url).origin)return Response.json({error:'Invalid request origin.'},{status:403});
 try{const raw=await request.text();if(raw.length>750000)return Response.json({error:'Content is too large.'},{status:413});const input=JSON.parse(raw);if(!Number.isInteger(input.revision)||input.revision<0)return Response.json({error:'Invalid revision.'},{status:400});const parsed=contentSchema.safeParse(input.content);if(!parsed.success)return Response.json({error:parsed.error.issues.map(x=>`${x.path.join('.')}: ${x.message}`).join('; ')},{status:400});const result=await saveContent(parsed.data,input.revision);if(!result.saved)return Response.json({error:'Another tab saved newer changes. Copy your edits, then reload before saving.'},{status:409});return Response.json(result,{headers:{'Cache-Control':'no-store'}})}catch(e){console.error('Content save failed',e);return Response.json({error:'Changes could not be saved. Your edits are still here; please try again.'},{status:503})}
}
