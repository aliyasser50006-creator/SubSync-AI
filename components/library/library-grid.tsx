import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { LibraryCard } from './library-card';
import { LibraryListItem } from './library-list-item';
import { LibraryEmptyState } from './library-empty-state';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LibraryGridProps {
  videos: (BrowseVideo & { status?: Job['status'] })[];
  viewMode: 'grid' | 'list';
  isSearchingOrFiltering: boolean;
  onClearFilters: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function LibraryGrid({
  videos,
  viewMode,
  isSearchingOrFiltering,
  onClearFilters,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: LibraryGridProps) {
  if (videos.length === 0) {
    return (
      <LibraryEmptyState 
        type={isSearchingOrFiltering ? 'no-results' : 'empty'} 
        onClearFilters={onClearFilters} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <LibraryCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <LibraryListItem key={video.id} video={video} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="pt-4 pb-8 flex justify-center">
          <Button 
            variant="secondary" 
            onClick={onLoadMore} 
            disabled={isFetchingNextPage} 
            className="min-w-[200px]"
          >
            {isFetchingNextPage ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading more...</>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
