import { Clapperboard } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AppBrandProps {
  compact?: boolean;
  className?: string;
}

export function AppBrand({ compact = false, className }: AppBrandProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-primary text-primary-foreground shadow-soft">
        <Clapperboard className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            SubSync AI
          </p>
          <p className="truncate text-xs text-muted-foreground">Subtitle operations</p>
        </div>
      )}
    </div>
  );
}
