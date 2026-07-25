'use client';

import { ChangeEvent, FormEvent } from 'react';
import { Search, LayoutGrid, List, Shuffle, SlidersHorizontal, Star, FolderOpen, Tag, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

      <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Placeholder tags for premium look without backend schema changes */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">Views</span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity bg-background/50 border-border/50 text-muted-foreground font-medium py-1 px-2.5 gap-1.5 flex items-center">
                <FolderOpen className="h-3 w-3" />
                Collections
                <Lock className="h-2.5 w-2.5 ml-0.5 text-muted-foreground/50" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Organize projects into folders (Pro Feature)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity bg-background/50 border-border/50 text-muted-foreground font-medium py-1 px-2.5 gap-1.5 flex items-center">
                <Star className="h-3 w-3" />
                Favorites
                <Lock className="h-2.5 w-2.5 ml-0.5 text-muted-foreground/50" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Pin favorite projects (Pro Feature)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity bg-background/50 border-border/50 text-muted-foreground font-medium py-1 px-2.5 gap-1.5 flex items-center">
                <Tag className="h-3 w-3" />
                Tags
                <Lock className="h-2.5 w-2.5 ml-0.5 text-muted-foreground/50" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Filter by custom tags (Pro Feature)</TooltipContent>
          </Tooltip>
        </div>

        <div className="text-xs text-muted-foreground font-mono bg-background/40 px-2.5 py-1 rounded-md border border-border/30">
          Showing <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> of{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> items
        </div>
      </div>
    </div>
  );
}
