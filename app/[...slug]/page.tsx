/* eslint-disable react-hooks/error-boundaries, @next/next/no-html-link-for-pages */
import SiteExperience from '../site-experience';
import { readContent } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

export default async function SectionPage() {
  try {
    const { content } = await readContent();
    return <SiteExperience content={content} />;
  } catch (error) {
    console.error('Content load failed', error);
    return <main className="fmc-shell fmc-page-view"><h1>Website content is temporarily unavailable.</h1><p>Please reload in a moment.</p><a href="/">Return home</a></main>;
  }
}
