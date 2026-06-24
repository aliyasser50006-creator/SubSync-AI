import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobById } from '@/lib/actions/jobs';
import { VideoDetailPage } from '@/components/library/video-detail/video-detail-page';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data, error } = await getJobById(params.id);
  
  if (error || !data) {
    return {
      title: 'Video Not Found',
    };
  }
  
  return {
    title: data.title || 'Video Details',
    description: `View details and subtitles for ${data.title || 'this video'}`,
  };
}

export default async function LibraryDetailRoutePage({ params }: Props) {
  // We can do a server-side check here to fast-fail if the ID is invalid
  const { data, error } = await getJobById(params.id);
  
  if (error || !data) {
    notFound();
  }

  return <VideoDetailPage id={params.id} />;
}
