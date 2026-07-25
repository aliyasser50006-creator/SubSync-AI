import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { parseLibraryPage, parseLibraryQuery, parseLibraryStatus, LibrarySearchParams } from '@/lib/data/library';
import { getRandomLibraryPageData } from '@/lib/data/random-videos';
import { RandomResultsClient } from '@/components/library/random-results-client';

export const metadata: Metadata = {
  title: 'Random Videos | Library',
  description: 'View a randomly selected set of videos from your library.',
};

function parseSeed(value: string | string[] | undefined): string {
  const seed = Array.isArray(value) ? value[0] : value;
  return (seed || '').trim().slice(0, 100);
}

function parseCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw || '10', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 10;
}

export default async function RandomPage({ searchParams }: { searchParams: LibrarySearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const seed = parseSeed(searchParams.seed);
  if (!seed) redirect('/library');

  const count = parseCount(searchParams.count);
  const page = parseLibraryPage(searchParams.page);
  const searchQuery = parseLibraryQuery(searchParams.q) || undefined;
  const status = parseLibraryStatus(searchParams.status);

  const data = await getRandomLibraryPageData({
    page,
    requestedCount: count,
    searchQuery,
    status,
    seed,
  });

  if (page > data.totalPages && data.totalPages > 0) {
    const params = new URLSearchParams();
    params.set('count', String(count));
    params.set('seed', seed);
    params.set('page', String(data.totalPages));
    if (searchQuery) params.set('q', searchQuery);
    if (status !== 'all') params.set('status', status);
    redirect(`/library/random?${params.toString()}`);
  }

  return (
    <div className="app-page pb-24">
      <RandomResultsClient
        videos={data.videos}
        currentPage={data.page}
        pageSize={data.pageSize}
        requestedCount={data.requestedCount}
        selectedCount={data.selectedCount}
        availableCount={data.availableCount}
        totalPages={data.totalPages}
        searchQuery={searchQuery || ''}
        status={status}
        seed={seed}
      />
    </div>
  );
}
