import { Subtitles } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AppBrandProps {
  compact?: boolean;
  className?: string;
}

export function AppBrand({ compact = false, className }: AppBrandProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform duration-200 hover:scale-105">
        <Subtitles className="h-4 w-4" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">
            SubSync<span className="text-primary ml-0.5">AI</span>
          </p>
        </div>
      )}
    </div>
  );
}
