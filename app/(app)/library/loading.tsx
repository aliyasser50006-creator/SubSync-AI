import { LibraryHeader } from '@/components/library/library-header';
import { LibrarySkeleton } from '@/components/library/library-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryLoading() {
  return (
    <div className="app-page pb-24">
      <LibraryHeader totalCount={0} readyCount={0} processingCount={0} />
      
      {/* Toolbar placeholder */}
      <div className="surface-panel p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[160px]" />
            <Skeleton className="h-10 w-[80px]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>

      <LibrarySkeleton viewMode="grid" count={12} />
    </div>
  );
}
