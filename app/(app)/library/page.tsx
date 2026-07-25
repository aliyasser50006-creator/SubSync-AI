import { Metadata } from 'next';
import { LibraryRoutePage } from '@/components/library/library-route-page';
import { LibrarySearchParams } from '@/lib/data/library';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Manage your uploaded videos, track processing status, and review generated subtitles.',
};

export default function LibraryPage({ searchParams }: { searchParams: LibrarySearchParams }) {
  return <LibraryRoutePage searchParams={searchParams} />;
}
