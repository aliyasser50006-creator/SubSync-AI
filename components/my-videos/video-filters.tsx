import { CheckCircle2, VideoOff } from 'lucide-react';
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
    <>
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onSearch={onSearchChange}
          placeholder="Search by title..."
          resultCount={resultCount}
          totalCount={filter === 'available' ? availableCount : unavailableCount}
        />
      </div>

      <div className="mb-6">
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/50 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onFilterChange('available')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
              filter === 'available'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Available
            <span
              className={cn(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors',
                filter === 'available'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              )}
            >
              {availableCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('unavailable')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
              filter === 'unavailable'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <VideoOff className="h-4 w-4" />
            Unavailable
            <span
              className={cn(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors',
                filter === 'unavailable'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              )}
            >
              {unavailableCount}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
