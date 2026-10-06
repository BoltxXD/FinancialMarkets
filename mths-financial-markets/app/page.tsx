/* The fallback deliberately catches content-store failures at the route boundary. */
/* eslint-disable react-hooks/error-boundaries, @next/next/no-html-link-for-pages */
import Home from './site-experience';
import {readContent} from '@/lib/content-store';
export const dynamic='force-dynamic';
export default async function Page(){try{const {content}=await readContent();return <Home content={content}/>}catch(e){console.error('Content load failed',e);return <main className="wrap section"><h1>We will be right back.</h1><p>The website content is temporarily unavailable. Please reload in a moment.</p><a href="/">Try again</a></main>}}
