'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, LayoutGrid, List, RefreshCw, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LibraryGrid } from './library-grid';
import { LibraryPagination } from './library-pagination';
import { LibrarySkeleton } from './library-skeleton';
import type { LibraryStatus, LibraryVideo } from '@/lib/data/library';
import { buildLibraryVideoUrl, normalizeLibraryVideoId } from '@/lib/utils/library-video-route';

interface RandomResultsClientProps {
  videos: LibraryVideo[];
  currentPage: number;
  pageSize: number;
  requestedCount: number;
  selectedCount: number;
  availableCount: number;
  totalPages: number;
  searchQuery: string;
  status: LibraryStatus;
  seed: string;
}

export function RandomResultsClient({
  videos,
  currentPage,
  pageSize,
  requestedCount,
  selectedCount,
  availableCount,
  totalPages,
  searchQuery,
  status,
  seed,
}: RandomResultsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const previousPage = useRef(currentPage);

  useEffect(() => {
    if (previousPage.current !== currentPage) {
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
      previousPage.current = currentPage;
    }
  }, [currentPage]);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('count', String(requestedCount));
    params.set('seed', seed);
    if (page > 1) params.set('page', String(page));
    if (searchQuery) params.set('q', searchQuery);
    if (status !== 'all') params.set('status', status);
    return `/library/random?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    startTransition(() => router.push(buildHref(page), { scroll: false }));
  };

  const handleRegenerate = () => {
    const newSeed = crypto.randomUUID();
    const params = new URLSearchParams();
    params.set('count', String(requestedCount));
    params.set('seed', newSeed);
    if (searchQuery) params.set('q', searchQuery);
    if (status !== 'all') params.set('status', status);
    startTransition(() => router.push(`/library/random?${params.toString()}`, { scroll: false }));
  };

  const handleBackToLibrary = () => {
    router.push('/library');
  };

  const handleOpenVideo = (video: LibraryVideo) => {
    const extractedId = normalizeLibraryVideoId(video?.id);
    const generatedUrl = buildLibraryVideoUrl(extractedId);
    if (!extractedId || !generatedUrl) {
      toast.error('This video has an invalid ID and cannot be opened.');
      return false;
    }
    return true;
  };

  const handleClearFilters = () => {
    router.push('/library');
  };

  const showWarning = selectedCount < requestedCount;
  const rangeStart = selectedCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = selectedCount === 0 ? 0 : rangeStart + videos.length - 1;

  return (
    <>
      {/* Header */}
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between border-b border-border/40 pb-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Shuffle className="h-3.5 w-3.5" />
            Random Selection
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Random Videos
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {searchQuery
              ? <>Showing {selectedCount} random video{selectedCount !== 1 ? 's' : ''} from search &quot;{searchQuery}&quot;</>
              : <>Showing {selectedCount} random video{selectedCount !== 1 ? 's' : ''} from your entire library</>}
          </p>
        </div>
      </header>

      {/* Info banner + controls */}
      <div className="surface-panel p-4 mb-6 transition-all duration-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="default"
              className="h-10 gap-2 text-xs font-medium"
              onClick={handleBackToLibrary}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Button>

            <Button
              variant="outline"
              size="default"
              className="h-10 gap-2 text-xs font-medium"
              disabled={isPending}
              onClick={handleRegenerate}
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
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

        {/* Warning if fewer found */}
        {showWarning && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Only <strong>{selectedCount}</strong> matching video{selectedCount !== 1 ? 's were' : ' was'} found out of {requestedCount} requested.
            </span>
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center px-1 font-mono">
          <div>
            Showing <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> of{' '}
            <span className="font-semibold text-foreground">{selectedCount}</span> random items
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="transition-opacity duration-200" aria-live="polite" aria-busy={isPending}>
        {isPending ? (
          <LibrarySkeleton viewMode={viewMode} count={pageSize} />
        ) : (
          <LibraryGrid
            videos={videos}
            viewMode={viewMode}
            isSearchingOrFiltering={false}
            onClearFilters={handleClearFilters}
            onOpenVideo={handleOpenVideo}
          />
        )}
      </div>

      {/* Pagination */}
      {videos.length > 0 && totalPages > 1 && (
        <LibraryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={buildHref}
          onPageChange={handlePageChange}
          disabled={isPending}
        />
      )}
    </>
  );
}
