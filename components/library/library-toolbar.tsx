'use client';

import { ChangeEvent, FormEvent } from 'react';
import { Search, LayoutGrid, List, Shuffle, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface LibraryToolbarProps {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onViewChange: (value: 'grid' | 'list') => void;
  onRandomClick?: () => void;
}

export function LibraryToolbar({
  searchTerm,
  statusFilter,
  sortBy,
  viewMode,
  rangeStart,
  rangeEnd,
  totalCount,
  isPending,
  onSearchChange,
  onSearchSubmit,
  onStatusChange,
  onSortChange,
  onViewChange,
  onRandomClick,
}: LibraryToolbarProps) {
  return (
    <div className="surface-panel p-4 mb-6 transition-all duration-200">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form className="relative flex-1 min-w-[240px]" role="search" onSubmit={onSearchSubmit}>
            <button
              type="submit"
              aria-label="Search video library"
              disabled={isPending}
              className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input
              value={searchTerm}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
              placeholder="Search projects by title or filename..."
              className="pl-10 h-10 bg-background/60 shadow-xs focus-visible:border-primary"
              aria-label="Search projects by title or filename"
            />
          </form>

          {onRandomClick && (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="h-10 gap-2 bg-background/60 text-xs font-medium shadow-xs shrink-0"
              disabled={isPending}
              onClick={onRandomClick}
            >
              <Shuffle className="h-4 w-4" />
              Random
            </Button>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1 hidden sm:flex">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter & Sort</span>
            </div>

            <Select value={statusFilter} onValueChange={onStatusChange} disabled={isPending}>
              <SelectTrigger className="w-[140px] h-10 bg-background/60 text-xs font-medium shadow-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortChange} disabled={isPending}>
              <SelectTrigger className="w-[160px] h-10 bg-background/60 text-xs font-medium shadow-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Title (A-Z)</SelectItem>
                <SelectItem value="name-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && onViewChange(value as 'grid' | 'list')}
              className="bg-background/60 rounded-lg border border-border/60 p-0.5 shadow-xs shrink-0"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="h-8 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center px-1 font-mono">
        <div>
          Showing <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> of{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> items
        </div>
      </div>
    </div>
  );
}
