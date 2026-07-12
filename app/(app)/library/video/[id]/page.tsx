import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { VideoDetailPage } from '@/components/library/video-detail/video-detail-page';
import { getJobById } from '@/lib/actions/jobs';
import { normalizeLibraryVideoId } from '@/lib/utils/library-video-route';

interface Props {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Video Details',
  description: 'View video, subtitle, and file details.',
};

export default async function VideoDetailsRoute({ params }: Props) {
  const receivedRouteParameter = params.id;

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[Library video route] received route parameter:', receivedRouteParameter);
  }

  const videoId = normalizeLibraryVideoId(receivedRouteParameter);
  if (!videoId) {
    throw new Error('The video details route received an invalid video ID.');
  }

  const result = await getJobById(videoId);

  if (result.error === 'Unauthorized') redirect('/login');
  if (result.notFound) notFound();
  if (result.error || !result.data) {
    throw new Error(result.error || 'The video lookup failed without returning a result.');
  }

  return <VideoDetailPage job={result.data} returnTo="/library?page=1" />;
}
