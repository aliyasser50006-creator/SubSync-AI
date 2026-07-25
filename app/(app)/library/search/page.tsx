import { Metadata } from 'next';
import { LibraryRoutePage } from '@/components/library/library-route-page';
import { LibrarySearchParams, parseLibraryQuery } from '@/lib/data/library';

export function generateMetadata({ searchParams }: { searchParams: LibrarySearchParams }): Metadata {
  const query = parseLibraryQuery(searchParams.q);
  return {
    title: query ? `Search: ${query} | Library` : 'Search Library',
    description: query ? `Video library results matching ${query}.` : 'Search your video library.',
  };
}

export default function LibrarySearchPage({ searchParams }: { searchParams: LibrarySearchParams }) {
  return <LibraryRoutePage searchParams={searchParams} isSearchPage />;
}
