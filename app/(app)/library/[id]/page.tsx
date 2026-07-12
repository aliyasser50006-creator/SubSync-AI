import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { normalizeLibraryVideoId } from '@/lib/utils/library-video-route';

interface Props {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Video Details',
};

export default function LegacyLibraryDetailRoute({ params }: Props) {
  const videoId = normalizeLibraryVideoId(params.id);

  // Reserved words such as `video` must never be treated as database IDs.
  if (!videoId) notFound();

  redirect(`/library/video/${videoId}`);
}
