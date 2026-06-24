import { Badge } from '@/components/ui/badge';

interface LibraryHeaderProps {
  totalCount: number;
  readyCount: number;
  processingCount: number;
}

export function LibraryHeader({ totalCount, readyCount, processingCount }: LibraryHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="eyebrow">Video Library</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your Library</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage your uploaded videos, track processing status, and review generated subtitles.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="justify-center px-3 py-1 text-muted-foreground">
          {totalCount} total
        </Badge>
        {readyCount > 0 && (
          <Badge variant="outline" className="justify-center border-success/25 bg-success/10 px-3 py-1 text-success">
            {readyCount} ready
          </Badge>
        )}
        {processingCount > 0 && (
          <Badge variant="outline" className="justify-center border-primary/25 bg-primary/10 px-3 py-1 text-primary">
            {processingCount} processing
          </Badge>
        )}
      </div>
    </header>
  );
}
