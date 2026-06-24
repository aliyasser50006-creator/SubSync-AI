'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { toast } from 'sonner';

import { LibraryToolbar } from './library-toolbar';
import { LibraryGrid } from './library-grid';
import { LibrarySkeleton } from './library-skeleton';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 12;

type VideoItem = BrowseVideo & { status?: Job['status'] };

interface LibraryClientProps {
  initialTotalCount: number;
}

export function LibraryClient({ initialTotalCount }: LibraryClientProps) {
  const supabase = useMemo(() => createClient(), []);

  // Filter/Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchVideos = async ({ pageParam = 0 }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (debouncedSearch.trim()) {
      query = query.ilike('title', `%${debouncedSearch.trim()}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name-asc':
        // Note: Sorts by title/name fallback. We'll sort by 'title' primarily, 
        // assuming 'title' is the main name field.
        query = query.order('title', { ascending: true });
        break;
      case 'name-desc':
        query = query.order('title', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: jobs, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);

    const rows = jobs || [];

    const normalizedVideos: VideoItem[] = rows
      .filter((item) => item?.id && item?.video_url)
      .map((item) => ({
        id: String(item.id),
        name: String(item.name ?? item.title ?? '').trim() || 'Untitled video',
        video_url: String(item.video_url).trim(),
        subtitle_url: item.subtitle_url?.trim() || null,
        subtitle_file: item.subtitle_file?.trim() || null,
        subtitle_settings: item.subtitle_settings || null,
        created_at: item.created_at || undefined,
        status: item.status as Job['status'],
      }));

    return {
      items: normalizedVideos,
      nextCursor: rows.length === ITEMS_PER_PAGE ? pageParam + 1 : null,
      totalCount: count || 0,
    };
  };

  const queryKey = ['library-videos', debouncedSearch, statusFilter, sortBy];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchVideos,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const videos = data?.pages.flatMap(page => page.items) || [];
  const currentTotalCount = data?.pages[0]?.totalCount ?? initialTotalCount;
  const isSearchingOrFiltering = debouncedSearch.trim().length > 0 || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive text-center">
        <h3 className="text-lg font-semibold mb-2">Failed to load library</h3>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <LibraryToolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortBy={sortBy}
        viewMode={viewMode}
        shownCount={videos.length}
        totalCount={currentTotalCount}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onSortChange={setSortBy}
        onViewChange={setViewMode}
      />

      {status === 'pending' ? (
        <LibrarySkeleton viewMode={viewMode} count={ITEMS_PER_PAGE} />
      ) : (
        <LibraryGrid
          videos={videos}
          viewMode={viewMode}
          isSearchingOrFiltering={isSearchingOrFiltering}
          onClearFilters={handleClearFilters}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}
    </>
  );
}

