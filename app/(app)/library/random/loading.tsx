import { LibrarySkeleton } from '@/components/library/library-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function RandomLoading() {
  return (
    <div className="app-page pb-24">
      {/* Random results header placeholder */}
      <header className="mb-8 border-b border-border/40 pb-6">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </header>

      {/* Info banner placeholder */}
      <div className="surface-panel p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-[80px] ml-auto" />
        </div>
      </div>

      <LibrarySkeleton viewMode="grid" count={12} />
    </div>
  );
}
