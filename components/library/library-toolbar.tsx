'use client';

import { ChangeEvent } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface LibraryToolbarProps {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  shownCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onViewChange: (value: 'grid' | 'list') => void;
}

export function LibraryToolbar({
  searchTerm,
  statusFilter,
  sortBy,
  viewMode,
  shownCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onViewChange,
}: LibraryToolbarProps) {
  return (
    <div className="surface-panel p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              placeholder="Search videos by name..."
              className="pl-10 bg-background/50"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px] bg-background/50">
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

          {/* Sort */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px] bg-background/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(val) => val && onViewChange(val as 'grid' | 'list')}
            className="bg-background/50 rounded-md border border-border shrink-0"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="px-3">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground flex justify-between items-center px-1">
        <p>Showing <span className="font-medium text-foreground">{shownCount}</span> of <span className="font-medium text-foreground">{totalCount}</span> videos</p>
      </div>
    </div>
  );
}
