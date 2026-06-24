import { LayoutGrid, List, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'size';

interface SubtitlesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  sort: SortOption;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAllToggle: () => void;
  onBulkDelete: () => void;
}

export function SubtitlesToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onSelectAllToggle,
  onBulkDelete,
}: SubtitlesToolbarProps) {
  return (
    <div className="surface-panel p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <form onSubmit={onSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subtitles..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </form>

          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <Checkbox
            checked={selectedCount === totalCount && totalCount > 0}
            onCheckedChange={onSelectAllToggle}
          />
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Button size="sm" variant="destructive" onClick={onBulkDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
