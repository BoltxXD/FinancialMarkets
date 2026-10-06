import {env} from 'cloudflare:workers';
import {contentSchema,defaultContent,type SiteContent} from './site-content';
export function contentDB(){if(!env.DB)throw Error('Content storage is unavailable.');return env.DB;}
export async function readContent(){const row=await contentDB().prepare('SELECT body, revision, updated_at FROM site_content WHERE id = 1').first<{body:string;revision:number;updated_at:string}>();return row?{content:normalizeContent(contentSchema.parse(JSON.parse(row.body))),revision:row.revision,updatedAt:row.updated_at}:{content:defaultContent,revision:0,updatedAt:null};}
export async function saveContent(content:SiteContent,revision:number){const db=contentDB();const body=JSON.stringify(content),now=new Date().toISOString();const result=revision===0?await db.prepare('INSERT OR IGNORE INTO site_content (id,body,revision,updated_at) VALUES (1,?,1,?)').bind(body,now).run():await db.prepare('UPDATE site_content SET body=?, revision=revision+1, updated_at=? WHERE id=1 AND revision=?').bind(body,now,revision).run();return {saved:result.meta.changes===1,revision:revision+1,updatedAt:now};}

function normalizeContent(content:SiteContent):SiteContent {
 return {...content,heroTitle:content.heroTitle === 'MTHS\nFINANCIAL\nMARKETS.' ? 'MTHS\nFINANCIAL MARKETS' : content.heroTitle};
}
