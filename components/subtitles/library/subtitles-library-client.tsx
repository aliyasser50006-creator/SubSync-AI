'use client';

import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Subtitle } from '@/lib/types/database';
import { deleteSubtitle, deleteSubtitles, duplicateSubtitle, getDownloadUrl } from '@/lib/actions/subtitles';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { SubtitlesToolbar, SortOption, ViewMode } from './subtitles-toolbar';
import { SubtitlesGridView } from './subtitles-grid-view';
import { SubtitlesListView } from './subtitles-list-view';

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

export function SubtitlesLibraryClient() {
  const supabase = useMemo(() => createClient(), []);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      let size = 0;
      // Skipping individual storage.info() calls to avoid N+1

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

    const results = await Promise.allSettled(storagePromises);
    const items = results
      .filter((r): r is PromiseFulfilledResult<Subtitle> => r.status === 'fulfilled')
      .map((r) => r.value);

    return { 
      items, 
      nextCursor: jobs?.length === ITEMS_PER_PAGE ? pageParam + 1 : null 
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
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
    try {
      const { error } = await deleteSubtitle(id);
      if (error) throw new Error('Failed to delete subtitle');
      toast.success('Subtitle deleted');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete subtitle');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      const { error } = await deleteSubtitles(ids);
      if (error) throw new Error('Failed to delete subtitles');
      setSelectedIds(new Set());
      toast.success(`${ids.length} subtitles deleted`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete subtitles');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { data: result, error } = await duplicateSubtitle(id);
      if (error || !result) throw new Error('Failed to duplicate subtitle');
      toast.success('Subtitle duplicated');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to duplicate subtitle');
    }
  };

  const handleDownload = async (subtitle: Subtitle) => {
    try {
      const { url, error } = await getDownloadUrl(subtitle.id);
      if (error || !url) throw new Error('Failed to generate download link');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subtitle.title}.${subtitle.format}`; 
      a.target = '_blank';
      a.click();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to download subtitle');
    }
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
    <>
      <SubtitlesToolbar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        sort={sort}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedIds.size}
        totalCount={subtitles.length}
        onSelectAllToggle={toggleSelectAll}
        onBulkDelete={handleBulkDelete}
      />

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
        <SubtitlesGridView
          subtitles={subtitles}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDownload={handleDownload}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          formatRelativeDate={formatRelativeDate}
        />
      ) : (
        <SubtitlesListView
          subtitles={subtitles}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDownload={handleDownload}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          formatRelativeDate={formatRelativeDate}
        />
      )}

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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading more...</>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </>
  );
}
