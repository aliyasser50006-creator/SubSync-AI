import { Skeleton } from '@/components/ui/skeleton';

export default function SubtitlesLibraryLoading() {
  return (
    <div className="app-page space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="surface-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-full max-w-sm rounded-md" />
            <Skeleton className="h-9 w-[130px] rounded-md" />
          </div>
          <Skeleton className="h-9 w-[80px] rounded-md" />
        </div>
      </div>

      {/* Content Skeleton (Grid View Default) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface-panel p-5 flex flex-col h-[180px]">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Skeleton className="mt-0.5 h-4 w-4 rounded" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="mt-4 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <div className="mt-4 space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
