'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { LibraryGrid } from './library-grid';
import { LibraryPagination } from './library-pagination';
import { LibrarySkeleton } from './library-skeleton';
import { LibraryToolbar } from './library-toolbar';
import { RandomVideosDialog } from './random-videos-dialog';
import type { LibrarySort, LibraryStatus, LibraryVideo } from '@/lib/data/library';
import { buildLibraryVideoUrl, normalizeLibraryVideoId } from '@/lib/utils/library-video-route';

interface LibraryClientProps {
  videos: LibraryVideo[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchQuery: string;
  statusFilter: LibraryStatus;
  sortBy: LibrarySort;
  routePath: '/library' | '/library/search';
}

interface NavigationState {
  path?: '/library' | '/library/search';
  page?: number;
  query?: string;
  status?: LibraryStatus;
  sort?: LibrarySort;
  view?: 'grid' | 'list';
}

const SCROLL_KEY_PREFIX = 'subsync:library-scroll:';

export function LibraryClient({
  videos,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  searchQuery,
  statusFilter,
  sortBy,
  routePath,
}: LibraryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = searchParams.get('view') === 'list' ? 'list' : 'grid';
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>(statusFilter);
  const [selectedSort, setSelectedSort] = useState<LibrarySort>(sortBy);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(urlView);
  const [randomDialogOpen, setRandomDialogOpen] = useState(false);
  const [isRandomGenerating, setIsRandomGenerating] = useState(false);
  const previousLocation = useRef(`${routePath}:${currentPage}`);

  useEffect(() => setSearchTerm(searchQuery), [searchQuery]);
  useEffect(() => setSelectedStatus(statusFilter), [statusFilter]);
  useEffect(() => setSelectedSort(sortBy), [sortBy]);
  useEffect(() => setViewMode(urlView), [urlView]);

  useEffect(() => {
    const location = `${routePath}:${currentPage}`;
    if (previousLocation.current !== location) {
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
      previousLocation.current = location;
    }
  }, [currentPage, routePath]);

  const buildHref = ({
    path = routePath,
    page = currentPage,
    query = searchQuery,
    status = statusFilter,
    sort = sortBy,
    view = viewMode,
  }: NavigationState = {}) => {
    const params = new URLSearchParams();
    if (path === '/library/search' && query.trim()) params.set('q', query.trim());
    params.set('page', String(page));
    if (status !== 'all') params.set('status', status);
    if (sort !== 'newest') params.set('sort', sort);
    if (view === 'list') params.set('view', 'list');
    return `${path}?${params.toString()}`;
  };

  const libraryHref = buildHref();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`${SCROLL_KEY_PREFIX}${libraryHref}`);
    if (!savedScroll) return;
    const scrollTop = Number.parseFloat(savedScroll);
    if (!Number.isFinite(scrollTop)) return;
    window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.scrollTo({ top: scrollTop, behavior: 'auto' });
    });
  }, [libraryHref]);

  const navigate = (state: NavigationState) => {
    startTransition(() => router.push(buildHref(state), { scroll: false }));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate({
      path: query ? '/library/search' : '/library',
      page: 1,
      query,
      status: selectedStatus,
      sort: selectedSort,
    });
  };

  const handleStatusChange = (value: string) => {
    const status = value as LibraryStatus;
    setSelectedStatus(status);
    navigate({ page: 1, status, sort: selectedSort });
  };

  const handleSortChange = (value: string) => {
    const sort = value as LibrarySort;
    setSelectedSort(sort);
    navigate({ page: 1, status: selectedStatus, sort });
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    setViewMode(view);
    window.history.replaceState(window.history.state, '', buildHref({ view }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    navigate({ path: '/library', page: 1, query: '', status: 'all', sort: selectedSort });
  };

  const handleRandomGenerate = (options: { count: number; useSearchResults: boolean }) => {
    setIsRandomGenerating(true);
    try {
      const seed = crypto.randomUUID();
      const params = new URLSearchParams();
      params.set('count', String(options.count));
      params.set('seed', seed);
      if (options.useSearchResults && searchQuery.trim()) {
        params.set('q', searchQuery.trim());
        if (selectedStatus !== 'all') params.set('status', selectedStatus);
      }
      const main = document.getElementById('main-content');
      sessionStorage.setItem(`${SCROLL_KEY_PREFIX}${libraryHref}`, String(main?.scrollTop || 0));
      setRandomDialogOpen(false);
      router.push(`/library/random?${params.toString()}`);
    } catch {
      toast.error('Failed to generate random videos.');
    } finally {
      setIsRandomGenerating(false);
    }
  };

  const handleOpenVideo = (video: LibraryVideo) => {
    const extractedId = normalizeLibraryVideoId(video?.id);
    const generatedUrl = buildLibraryVideoUrl(extractedId);

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Library video click] clicked video object:', video);
      console.debug('[Library video click] extracted ID:', extractedId);
      console.debug('[Library video click] generated URL:', generatedUrl);
    }

    if (!extractedId || !generatedUrl) {
      console.error('[Library video click] prevented invalid video navigation:', video?.id);
      toast.error('This video has an invalid ID and cannot be opened.');
      return false;
    }

    const main = document.getElementById('main-content');
    sessionStorage.setItem(`${SCROLL_KEY_PREFIX}${libraryHref}`, String(main?.scrollTop || 0));
    return true;
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : rangeStart + videos.length - 1;
  const isSearchingOrFiltering = Boolean(searchQuery) || statusFilter !== 'all';

  return (
    <>
      <LibraryToolbar
        searchTerm={searchTerm}
        statusFilter={selectedStatus}
        sortBy={selectedSort}
        viewMode={viewMode}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalCount}
        isPending={isPending}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
        onRandomClick={() => setRandomDialogOpen(true)}
      />

      <RandomVideosDialog
        open={randomDialogOpen}
        onOpenChange={setRandomDialogOpen}
        searchQuery={searchQuery}
        searchResultCount={totalCount}
        libraryTotalCount={totalCount}
        isGenerating={isRandomGenerating}
        onGenerate={handleRandomGenerate}
      />

      {searchQuery && (
        <h2 className="mb-5 text-xl font-semibold tracking-tight" aria-live="polite">
          Results for &quot;{searchQuery}&quot;
        </h2>
      )}

      <div className="transition-opacity duration-200" aria-live="polite" aria-busy={isPending}>
        {isPending ? (
          <LibrarySkeleton viewMode={viewMode} count={pageSize} />
        ) : (
          <LibraryGrid
            videos={videos}
            viewMode={viewMode}
            isSearchingOrFiltering={isSearchingOrFiltering}
            searchQuery={searchQuery}
            onClearFilters={handleClearFilters}
            onOpenVideo={handleOpenVideo}
          />
        )}
      </div>

      {videos.length > 0 && (
        <LibraryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={(page) => buildHref({ page })}
          onPageChange={(page) => navigate({ page })}
          disabled={isPending}
        />
      )}
    </>
  );
}
