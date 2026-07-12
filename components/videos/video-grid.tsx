'use client';

import { ListVideo, SearchX } from 'lucide-react';

import { BrowseVideo } from '@/lib/types/video-browser';
import { Skeleton } from '@/components/ui/skeleton';

import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: BrowseVideo[];
  isLoading: boolean;
  selectedVideoId: string | null;
  searchTerm: string;
  onSelectVideo: (video: BrowseVideo) => void;
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={`video-skeleton-${index}`} className="rounded-lg border border-border/60 bg-background/45 p-3">
          <Skeleton className="h-5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function VideoGrid({
  videos,
  isLoading,
  selectedVideoId,
  searchTerm,
  onSelectVideo,
}: VideoGridProps) {
  if (isLoading) {
    return <LoadingList />;
  }

  if (!videos.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background/45 px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
          <SearchX className="h-7 w-7 text-primary" />
        </div>
        <h3 className="mt-5 text-xl font-semibold">No videos found</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {searchTerm ? `No name matches for "${searchTerm}".` : 'No videos found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <ListVideo className="h-4 w-4" />
        <span>Video Names</span>
      </div>
      <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isActive={selectedVideoId === video.id}
            onSelect={onSelectVideo}
          />
        ))}
      </div>
    </div>
  );
}
