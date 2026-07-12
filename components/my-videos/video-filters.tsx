import { CheckCircle2, VideoOff, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@/components/videos/search-bar';
import { cn } from '@/lib/utils';

export type AvailabilityFilter = 'available' | 'unavailable';

interface VideoFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filter: AvailabilityFilter;
  onFilterChange: (filter: AvailabilityFilter) => void;
  availableCount: number;
  unavailableCount: number;
  resultCount: number;
}

export function VideoFilters({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  availableCount,
  unavailableCount,
  resultCount,
}: VideoFiltersProps) {
  return (
    <div className="surface-panel p-4 mb-6 border border-border/60 shadow-soft">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onSearch={onSearchChange}
            placeholder="Search videos by project title..."
            resultCount={resultCount}
            totalCount={filter === 'available' ? availableCount : unavailableCount}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-xl border border-border/60 bg-background/60 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => onFilterChange('available')}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                filter === 'available'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Processed</span>
              <span
                className={cn(
                  'inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                  filter === 'available'
                    ? 'bg-black/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {availableCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('unavailable')}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                filter === 'unavailable'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              )}
            >
              <VideoOff className="h-3.5 w-3.5" />
              <span>Unprocessed</span>
              <span
                className={cn(
                  'inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                  filter === 'unavailable'
                    ? 'bg-black/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {unavailableCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
