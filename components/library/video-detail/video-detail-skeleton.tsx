import { Skeleton } from '@/components/ui/skeleton';

export function VideoDetailSkeleton() {
  return (
    <div className="app-page">
      {/* Breadcrumb + Title area */}
      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-3/4 max-w-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
        {/* Left Column - Player & Subtitles */}
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <div className="flex-1" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
          
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
