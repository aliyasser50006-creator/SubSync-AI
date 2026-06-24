'use client';

import { useCallback, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search videos...',
  resultCount,
  totalCount,
}: SearchBarProps) {
  const showMeta = resultCount !== undefined && totalCount !== undefined;
  const isFiltering = value.trim().length > 0;

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(value.trim());
    }
  }, [onSearch, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    onChange('');
    if (onSearch) {
      onSearch('');
    }
  }, [onChange, onSearch]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 group">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="video-search"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {isFiltering && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          id="video-search-button"
          type="button"
          onClick={handleSearch}
          className="shrink-0 gap-2 px-5 sm:w-auto"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      {showMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <span>
            Showing{' '}
            <span className="font-medium text-foreground">{resultCount}</span> of{' '}
            <span className="font-medium text-foreground">{totalCount}</span>{' '}
            videos
          </span>
          {isFiltering && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-primary'
              )}
            >
              <Search className="h-3 w-3" />
              Filtering by &quot;{value}&quot;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
