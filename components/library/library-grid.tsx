import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { LibraryCard } from './library-card';
import { LibraryListView } from './library-list-view';
import { LibraryEmptyState } from './library-empty-state';
import { buildLibraryVideoUrl } from '@/lib/utils/library-video-route';

type LibraryGridVideo = BrowseVideo & { status?: Job['status'] };

interface LibraryGridProps {
  videos: LibraryGridVideo[];
  viewMode: 'grid' | 'list';
  isSearchingOrFiltering: boolean;
  searchQuery?: string;
  onClearFilters: () => void;
  onOpenVideo: (video: LibraryGridVideo) => boolean;
}

export function LibraryGrid({
  videos,
  viewMode,
  isSearchingOrFiltering,
  searchQuery,
  onClearFilters,
  onOpenVideo,
}: LibraryGridProps) {
  if (videos.length === 0) {
    return (
      <LibraryEmptyState
        type={isSearchingOrFiltering ? 'no-results' : 'empty'}
        searchQuery={searchQuery}
        onClearFilters={onClearFilters}
      />
    );
  }

  const handleBeforeOpen = (video: LibraryGridVideo) => {
    const url = buildLibraryVideoUrl(video?.id);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Clicked video:', video);
      console.log('video.id:', video?.id);
      console.log('Generated URL:', url);
    }

    return onOpenVideo(video);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <LibraryCard key={video.id} video={video} onBeforeOpen={() => handleBeforeOpen(video)} />
          ))}
        </div>
      ) : (
        <LibraryListView videos={videos} onBeforeOpen={handleBeforeOpen} />
      )}
    </div>
  );
}
