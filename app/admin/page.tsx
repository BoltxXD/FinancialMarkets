/* The route intentionally handles auth/content failures at the server boundary. */
/* eslint-disable react-hooks/error-boundaries, @next/next/no-html-link-for-pages */
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {isEditor} from '@/lib/editor-auth';
import {readContent} from '@/lib/content-store';
import Editor from './editor';
export const dynamic='force-dynamic';
export default async function Admin(){await requireChatGPTUser('/admin');if(!await isEditor())return <main className="wrap section"><h1>Owner access only</h1><p>This editing page is reserved for the site owner.</p><a href="/">Back to the website</a></main>;try{return <Editor initial={await readContent()}/>}catch(e){console.error(e);return <main className="wrap section"><h1>The editor is temporarily unavailable.</h1><p>Saved content has not been changed. Please reload to try again.</p><a href="/admin">Retry</a></main>}}
