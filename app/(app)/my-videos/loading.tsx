import { Skeleton } from '@/components/ui/skeleton';

export default function MyVideosLoading() {
  return (
    <div className="app-page">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-6 w-[400px] sm:w-[500px]" />
        </div>
      </header>

      <div className="mb-4">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-[250px] rounded-lg" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Skeleton className="h-[420px] rounded-xl xl:sticky xl:top-6" />
        
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
