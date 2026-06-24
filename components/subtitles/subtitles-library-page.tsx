'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Subtitle } from '@/lib/types/database';
import { formatBytes } from '@/lib/utils/format';
import { deleteSubtitle, deleteSubtitles, duplicateSubtitle, getDownloadUrl } from '@/lib/actions/subtitles';
import {
  Search,
  LayoutGrid,
  List,
  Subtitles as SubtitlesIcon,
  Trash2,
  Download,
  Copy,
  MoreHorizontal,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'size';

const ITEMS_PER_PAGE = 20;

function encodeIdClient(path: string): string {
  return btoa(path).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getFormat(filename: string): 'srt' | 'vtt' {
  return filename.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt';
}

function formatTitle(filename: string): string {
  return filename.replace(/\.(srt|vtt)$/i, '');
}

export function SubtitlesLibraryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingNavId, setPendingNavId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchSubtitles = async ({ pageParam = 0 }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('jobs')
      .select('*')
      .not('subtitle_file', 'is', null)
      .eq('user_id', user.id);

    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title-asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title-desc':
        query = query.order('title', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: jobs, error } = await query.range(from, to);
    if (error) throw new Error(error.message);

    const storagePromises = (jobs || []).map(async (job) => {
      const path = job.subtitle_file;
      const filename = path.split('/').pop() || '';
      const size = 0;

      return {
        id: encodeIdClient(path),
        user_id: user.id,
        title: job.title || formatTitle(filename),
        format: getFormat(filename),
        line_count: 0,
        size: size,
        subtitle_content: '',
        path,
        created_at: job.created_at,
        updated_at: job.updated_at,
        job_status: job.status
      } as Subtitle;
    });

    const items = await Promise.all(storagePromises);
    return { 
      items, 
      nextCursor: jobs?.length === ITEMS_PER_PAGE ? pageParam + 1 : null 
    };
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['subtitles', debouncedSearch, sort],
    queryFn: fetchSubtitles,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const subtitles = data?.pages.flatMap(page => page.items) || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setSelectedIds(new Set());
  };

  const handleSortChange = (value: string) => {
    setSort(value as SortOption);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subtitles.length && subtitles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subtitles.map((s) => s.id)));
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteSubtitle(id);
    if (error) {
      toast.error('Failed to delete subtitle');
    } else {
      toast.success('Subtitle deleted');
      refetch();
    }
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await deleteSubtitles(ids);
    if (error) {
      toast.error('Failed to delete subtitles');
    } else {
      setSelectedIds(new Set());
      toast.success(`${ids.length} subtitles deleted`);
      refetch();
    }
    setBulkDeleting(false);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    const { data: result, error } = await duplicateSubtitle(id);
    if (error) {
      toast.error('Failed to duplicate subtitle');
    } else if (result) {
      toast.success('Subtitle duplicated');
      refetch();
    }
    setDuplicatingId(null);
  };

  const handleDownload = async (subtitle: Subtitle) => {
    const { url, error } = await getDownloadUrl(subtitle.id);
    if (error || !url) {
      toast.error('Failed to generate download link');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subtitle.title}.${subtitle.format}`; 
    a.target = '_blank';
    a.click();
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="app-page space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SubtitlesIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Subtitles Library</h1>
            <p className="text-sm text-muted-foreground">Manage your subtitle files</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="surface-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subtitles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </form>

            <Select value={sort} onValueChange={handleSortChange}>
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
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
            <Checkbox
              checked={selectedIds.size === subtitles.length && subtitles.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {status === 'pending' ? (
        <div className="surface-panel flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : status === 'error' ? (
        <div className="surface-panel flex h-64 flex-col items-center justify-center text-destructive">
          <p>Error loading subtitles.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : subtitles.length === 0 ? (
        <div className="surface-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No results found</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className="surface-panel interactive-card group relative cursor-pointer overflow-hidden p-5 flex flex-col h-full"
              onClick={() => router.push(`/library/subtitles/${subtitle.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(subtitle.id)}
                    onCheckedChange={() => toggleSelect(subtitle.id)}
                    className="mt-0.5"
                  />
                  <div className="relative flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <SubtitlesIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 rounded bg-foreground/80 px-1 text-[9px] font-bold text-background uppercase">
                      {subtitle.format}
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground mb-1">
                      File: {subtitle.title}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/library/subtitles/${subtitle.id}`)}>
                      Open Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(subtitle)}>
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(subtitle.id)}>
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(subtitle.id)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex-1">
                <h3 className="line-clamp-2 font-semibold text-lg leading-snug break-words min-h-[56px]" title={subtitle.title}>
                  {subtitle.title}
                </h3>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <span className="uppercase font-medium">{subtitle.format} Subtitle</span>
                    <span>·</span>
                    <span>{formatBytes(subtitle.size)}</span>
                  </p>
                  <p>Uploaded {formatRelativeDate(subtitle.created_at)}</p>
                  <p className="capitalize">Status: {subtitle.job_status || 'Ready'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-panel divide-y divide-border/50 overflow-hidden">
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/30 cursor-pointer"
              onClick={() => router.push(`/library/subtitles/${subtitle.id}`)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(subtitle.id)}
                  onCheckedChange={() => toggleSelect(subtitle.id)}
                />
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 relative">
                <SubtitlesIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-[2]">
                <p className="truncate text-sm font-medium" title={subtitle.title}>{subtitle.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="uppercase font-semibold">{subtitle.format} Subtitle</span>
                  <span>·</span>
                  <span>{formatBytes(subtitle.size)}</span>
                </div>
              </div>
              
              <div className="hidden md:flex flex-col min-w-0 flex-[1.5] px-2 text-xs">
                  <p className="text-muted-foreground capitalize">Status: {subtitle.job_status || 'Ready'}</p>
              </div>

              <div className="hidden lg:flex flex-col gap-0.5 text-xs text-muted-foreground w-32 items-end mr-4">
                <span>{new Date(subtitle.created_at).toLocaleDateString()}</span>
                <span className="text-[10px]">{formatRelativeDate(subtitle.created_at)}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground mb-1">
                    File: {subtitle.title}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/library/subtitles/${subtitle.id}`)}>
                    Open Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(subtitle)}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(subtitle.id)}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(subtitle.id)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {subtitles.length > 0 && hasNextPage && (
        <div className="flex justify-center mt-8 pb-8">
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
