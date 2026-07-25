import { Badge } from '@/components/ui/badge';
import { Clapperboard, Sparkles } from 'lucide-react';

interface LibraryHeaderProps {
  totalCount: number;
  readyCount: number;
  processingCount: number;
}

export function LibraryHeader({ totalCount, readyCount, processingCount }: LibraryHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between border-b border-border/40 pb-6">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary mb-3 ring-1 ring-primary/20">
          <Clapperboard className="h-3.5 w-3.5" />
          Production Library
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Video Projects
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Browse media assets, monitor realtime encoding statuses, and launch into the subtitle studio editor.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold bg-card/60 shadow-xs">
          {totalCount} Total Projects
        </Badge>
        {readyCount > 0 && (
          <Badge variant="outline" className="border-success/30 bg-success/15 px-3 py-1.5 text-xs font-semibold text-success shadow-xs">
            {readyCount} Ready
          </Badge>
        )}
        {processingCount > 0 && (
          <Badge variant="outline" className="border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary animate-pulse shadow-xs">
            {processingCount} Processing
          </Badge>
        )}
      </div>
    </header>
  );
}
