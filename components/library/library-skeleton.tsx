import { Skeleton } from '@/components/ui/skeleton';

interface LibrarySkeletonProps {
  viewMode: 'grid' | 'list';
  count?: number;
}

export function LibrarySkeleton({ viewMode, count = 12 }: LibrarySkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex w-full items-center gap-4 rounded-xl border border-border/60 bg-card p-3">
            <Skeleton className="h-16 w-28 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-4 items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="hidden md:block h-4 w-24" />
              <Skeleton className="hidden md:block h-6 w-20 rounded-full" />
              <div className="hidden sm:flex justify-end pr-2">
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden h-full">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-4 flex flex-col flex-1 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <div className="mt-auto pt-2">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
