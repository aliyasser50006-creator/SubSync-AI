'use client';

import { useCallback, useEffect, useMemo, useRef, useState, memo, type KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import {
  Clock3,
  Loader2,
  PlayCircle,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Subtitles,
  X,
} from 'lucide-react';

import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { SubtitleSettings } from '@/lib/types/database';
import { BrowseVideo } from '@/lib/types/video-browser';
import { cn } from '@/lib/utils';
import { useOptimizedSearch } from '@/hooks/use-optimized-search';

const DEFAULT_RANDOM_COUNT = 5;
const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 30,
  fontColor: '#FFFFFF',
  position: 'bottom',
  alignment: 'center',
  background: false,
  outlineColor: '#000000',
  outlineWidth: 0,
};

// ── Only the columns needed for the list + player; avoids SELECT * ───────────
const LIST_SELECT_COLUMNS =
  'id, title, video_url, img_url, subtitle_url, subtitle_file, subtitle_settings, created_at';

// ── How many results to fetch on initial load and on search ──────────────────
const INITIAL_LOAD_LIMIT = 50;
const SEARCH_RESULT_LIMIT = 30;

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="video-player-container">
      <div className="video-player-overlay">
        <Loader2 className="video-player-spinner" />
      </div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

interface JobsVideoRow {
  id: string;
  title?: string | null;
  video_url: string;
  img_url?: string | null;
  subtitle_url?: string | null;
  subtitle_file?: string | null;
  subtitle_settings?: SubtitleSettings | null;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Pure utility functions (no state → never cause re-renders)
// ---------------------------------------------------------------------------

function clampRandomCount(value: number, total: number) {
  if (total <= 0) return 1;
  return Math.min(Math.max(value || 1, 1), total);
}

function shuffleVideos(videos: BrowseVideo[]) {
  const shuffled = [...videos];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Video source';
  }
}

function formatDate(value?: string) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

/** Normalises a raw database row into the BrowseVideo shape. */
function normalizeVideoRow(item: Record<string, unknown>): BrowseVideo {
  const row = item as unknown as JobsVideoRow;
  return {
    id: String(row.id),
    name: String(row.title ?? '').trim() || 'Untitled video',
    video_url: String(row.video_url).trim(),
    img_url: row.img_url?.trim() || null,
    subtitle_url: row.subtitle_url?.trim() || null,
    subtitle_file: row.subtitle_file?.trim() || null,
    subtitle_settings: row.subtitle_settings || null,
    created_at: row.created_at || undefined,
  };
}

// ---------------------------------------------------------------------------
// Memoised video list item – prevents re-renders when only selected changes
// ---------------------------------------------------------------------------

interface VideoListItemProps {
  video: BrowseVideo;
  isSelected: boolean;
  onSelect: (video: BrowseVideo) => void;
}

const VideoListItem = memo(function VideoListItem({
  video,
  isSelected,
  onSelect,
}: VideoListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(video)}
      className={cn(
        'flex w-full gap-3 rounded-lg border p-2 text-left transition-all',
        isSelected
          ? 'border-primary/50 bg-primary/12 shadow-soft border-l-2 border-l-primary'
          : 'border-border/60 bg-background/45 hover:border-primary/30 hover:bg-accent/50',
      )}
    >
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-slate-950">
        <VideoThumbnail title={video.name} url={video.video_url} imgUrl={video.img_url} iconClassName="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{video.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{getHostname(video.video_url)}</p>
        <p className="mt-2 text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
      </div>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VideosPage() {
  // Stable Supabase client – never recreated across renders
  const supabase = useMemo(() => createClient(), []);

  // ── Initial-load state (recent videos, shown when search is empty) ─────────
  const [initialVideos, setInitialVideos] = useState<BrowseVideo[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // ── Search input (raw, controlled) ────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');

  // ── Random selection state ────────────────────────────────────────────────
  const [randomCount, setRandomCount] = useState(DEFAULT_RANDOM_COUNT);
  const [randomVideos, setRandomVideos] = useState<BrowseVideo[] | null>(null);

  // ── Player state ──────────────────────────────────────────────────────────
  const [selectedVideo, setSelectedVideo] = useState<BrowseVideo | null>(null);
  const [selectedSubtitleUrl, setSelectedSubtitleUrl] = useState<string | null>(null);
  const [subtitleUrlLoading, setSubtitleUrlLoading] = useState(false);
  const [playRequestId, setPlayRequestId] = useState(0);

  // ── Subtitle controls ─────────────────────────────────────────────────────
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleDelaySeconds, setSubtitleDelaySeconds] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(DEFAULT_SUBTITLE_SETTINGS.fontSize || 30);

  // ── Subtitle URL cache ────────────────────────────────────────────────────
  const subtitleUrlCacheRef = useRef(new Map<string, string>());

  // ── Initial fetch: load recent videos ─────────────────────────────────────
  useEffect(() => {
    let isActive = true;

    const fetchInitial = async () => {
      setInitialLoading(true);
      setInitialError(null);

      const { data, error } = await supabase
        .from('jobs')
        .select(LIST_SELECT_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(INITIAL_LOAD_LIMIT);

      if (!isActive) return;

      if (error) {
        setInitialError(error.message);
        setInitialLoading(false);
        return;
      }

      const rows = ((data as Record<string, unknown>[] | null) ?? []);
      const normalized: BrowseVideo[] = rows
        .filter((item) => item?.id && item?.video_url)
        .map(normalizeVideoRow)
        .filter((item) => item.video_url.length > 0);

      setInitialVideos(normalized);
      setRandomCount(clampRandomCount(DEFAULT_RANDOM_COUNT, normalized.length));
      setRandomVideos(null);
      setSelectedVideo(normalized[0] ?? null);
      setSelectedSubtitleUrl(null);
      setInitialLoading(false);
    };

    fetchInitial();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  // ── Server-side search via useOptimizedSearch ─────────────────────────────
  //
  // Why server-side instead of client-side Array.filter():
  // - Works for any dataset size (thousands of records)
  // - Uses PostgreSQL ILIKE for native case-insensitive partial matching
  // - Only transfers matching rows, not the entire dataset
  // - Results are limited to SEARCH_RESULT_LIMIT rows
  // - Debounced at 300ms, with AbortController cancellation and LRU caching
  //
  const searchState = useOptimizedSearch<BrowseVideo>(searchInput, {
    supabase,
    table: 'jobs',
    searchColumn: 'title',
    selectColumns: LIST_SELECT_COLUMNS,
    transform: normalizeVideoRow,
    limit: SEARCH_RESULT_LIMIT,
    debounceMs: 300,
    maxCacheEntries: 50,
  });

  // ── Derived: which videos to display ──────────────────────────────────────
  //
  // Priority: randomVideos > searchResults (when query active) > initialVideos
  // useMemo prevents recomputing this on every render.
  //
  const isSearchActive = searchInput.trim().length > 0;

  const displayedVideos = useMemo<BrowseVideo[]>(() => {
    if (randomVideos) return randomVideos;
    if (isSearchActive) return searchState.data;
    return initialVideos;
  }, [randomVideos, isSearchActive, searchState.data, initialVideos]);

  const totalVideos = initialVideos.length;
  const maxRandomCount = Math.max(1, totalVideos);

  // ── Auto-select first result when search results change ───────────────────
  useEffect(() => {
    if (!isSearchActive || searchState.isLoading) return;
    if (searchState.data.length > 0) {
      setSelectedVideo(searchState.data[0]);
    }
  }, [isSearchActive, searchState.data, searchState.isLoading]);

  // ── Subtitle URL resolution with cache ────────────────────────────────────
  useEffect(() => {
    if (!selectedVideo) {
      setSelectedSubtitleUrl(null);
      setSubtitleUrlLoading(false);
      return;
    }

    let cancelled = false;

    const loadSubtitleUrl = async () => {
      setSubtitleUrlLoading(true);
      setSelectedSubtitleUrl(null);

      const directSubtitleUrl = selectedVideo.subtitle_url?.trim();
      const subtitleFilePath = selectedVideo.subtitle_file?.trim();
      const cacheKey = directSubtitleUrl || subtitleFilePath;

      if (cacheKey) {
        const cachedUrl = subtitleUrlCacheRef.current.get(cacheKey);
        if (cachedUrl) {
          setSelectedSubtitleUrl(cachedUrl);
          setSubtitleUrlLoading(false);
          return;
        }
      }

      if (directSubtitleUrl) {
        if (isAbsoluteUrl(directSubtitleUrl)) {
          if (!cancelled) {
            subtitleUrlCacheRef.current.set(directSubtitleUrl, directSubtitleUrl);
            setSelectedSubtitleUrl(directSubtitleUrl);
            setSubtitleUrlLoading(false);
          }
          return;
        }

        const nextUrl = `/api/subtitles/content?path=${encodeURIComponent(directSubtitleUrl)}`;
        subtitleUrlCacheRef.current.set(directSubtitleUrl, nextUrl);
        setSelectedSubtitleUrl(nextUrl);
        setSubtitleUrlLoading(false);
        return;
      }

      if (!subtitleFilePath) {
        if (!cancelled) {
          setSelectedSubtitleUrl(null);
          setSubtitleUrlLoading(false);
        }
        return;
      }

      const nextUrl = `/api/subtitles/content?path=${encodeURIComponent(subtitleFilePath)}`;
      subtitleUrlCacheRef.current.set(subtitleFilePath, nextUrl);
      if (!cancelled) {
        setSelectedSubtitleUrl(nextUrl);
        setSubtitleUrlLoading(false);
      }
    };

    loadSubtitleUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedVideo]);

  // ── Subtitle settings (memoised — only changes when selected video or font size changes) ──
  const subtitleSettings = useMemo<SubtitleSettings>(() => {
    const selectedOverrides = selectedVideo?.subtitle_settings || {};
    return {
      ...DEFAULT_SUBTITLE_SETTINGS,
      ...selectedOverrides,
      position: 'bottom',
      alignment: 'center',
      background: false,
      fontSize: subtitleFontSize,
      fontColor: '#FFFFFF',
    };
  }, [selectedVideo, subtitleFontSize]);

  // ── Event handlers (useCallback — stable references across renders) ────────

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    // Clear random selection when user starts a new search
    setRandomVideos(null);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setRandomVideos(null);
  }, []);

  const handleSearchKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    // Pressing Escape clears the search
    if (event.key === 'Escape') {
      event.preventDefault();
      setSearchInput('');
      setRandomVideos(null);
    }
  }, []);

  const handleRandomCountChange = useCallback((value: number) => {
    setRandomCount(clampRandomCount(value, maxRandomCount));
  }, [maxRandomCount]);

  const handleRandomize = useCallback(() => {
    if (!initialVideos.length) return;
    const count = clampRandomCount(randomCount, initialVideos.length);
    const nextSelection = shuffleVideos(initialVideos).slice(0, count);
    setRandomVideos(nextSelection);
    setSearchInput('');
    setSelectedVideo(nextSelection[0] ?? null);
    setPlayRequestId((prev) => prev + 1);
  }, [randomCount, initialVideos]);

  const handleBackToAll = useCallback(() => {
    setRandomVideos(null);
  }, []);

  const handleSelectVideo = useCallback((video: BrowseVideo) => {
    setSelectedVideo(video);
    setPlayRequestId((prev) => prev + 1);
  }, []);

  // ── Derived loading / error state for the list area ───────────────────────
  const showInitialLoader = initialLoading;
  const showSearchLoader = isSearchActive && searchState.isLoading;
  const showError = !initialLoading && (initialError || (!isSearchActive ? false : searchState.error));
  const errorMessage = initialError || searchState.error;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-page">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Playback library</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Browse every captioned video.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Search the library, randomize a review set, and adjust subtitle playback without leaving the player.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Badge variant="outline" className="justify-center border-primary/25 bg-primary/10 px-3 py-1 text-primary font-semibold">
            {displayedVideos.length} shown
          </Badge>
          <Badge variant="outline" className="justify-center px-3 py-1 text-muted-foreground">
            {totalVideos} total
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* ── Sidebar: search + video list ──────────────────────────────── */}
        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>Video Library</CardTitle>
            <CardDescription>Find a video by name or sample a random set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                {/* Loading spinner replaces the search icon while a request is in-flight */}
                {showSearchLoader ? (
                  <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                ) : (
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  id="video-browse-search"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search video name"
                  className="pl-9 pr-9"
                  aria-label="Search videos by name"
                  aria-busy={showSearchLoader}
                />
                {/* Clear button — only shown while there is text in the input */}
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Random controls */}
            <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-2">
              <Input
                type="number"
                min={1}
                max={maxRandomCount}
                value={randomCount}
                onChange={(event) => handleRandomCountChange(Number.parseInt(event.target.value, 10) || 1)}
                className="text-center"
                aria-label="Number of random videos"
              />
              <Button type="button" variant="outline" onClick={handleRandomize} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Random
              </Button>
              {randomVideos && (
                <Button type="button" variant="ghost" size="icon" onClick={handleBackToAll} aria-label="Back to all">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Video list */}
            {showInitialLoader ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : showError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {errorMessage}
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background/45 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  {isSearchActive ? 'No videos match your search' : 'No videos found'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isSearchActive ? 'Try a broader search term.' : 'Upload a video to get started.'}
                </p>
                {isSearchActive && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="mt-3 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1" role="listbox" aria-label="Video list">
                {displayedVideos.map((video) => (
                  <VideoListItem
                    key={video.id}
                    video={video}
                    isSelected={selectedVideo?.id === video.id}
                    onSelect={handleSelectVideo}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Main area: player + controls ──────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{selectedVideo ? selectedVideo.name : 'Select a video'}</CardTitle>
                  <CardDescription className="mt-1 truncate">
                    {selectedVideo ? selectedVideo.video_url : 'Choose a video from the library to begin playback.'}
                  </CardDescription>
                </div>
                {selectedVideo && (
                  <Badge variant="outline" className="w-fit gap-1 border-success/25 bg-success/10 text-success">
                    <PlayCircle className="h-3 w-3" />
                    Ready
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedVideo ? (
                <div className="rounded-lg border border-dashed border-border bg-background/45 p-8 text-center">
                  <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">No video selected</p>
                  <p className="mt-1 text-xs text-muted-foreground">Pick a library item to start playback.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subtitleUrlLoading && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading subtitle track...
                    </p>
                  )}

                  {!selectedSubtitleUrl && !subtitleUrlLoading && (
                    <p className="rounded-lg border border-warning/25 bg-warning/8 p-3 text-xs text-warning flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                      No subtitle file is available for this video.
                    </p>
                  )}

                  <VideoPlayer
                    key={`videos-page-player-${selectedVideo.id}-${selectedVideo.video_url}`}
                    src={selectedVideo.video_url}
                    posterUrl={selectedVideo.img_url}
                    playRequestId={playRequestId}
                    subtitleUrl={subtitlesEnabled ? selectedSubtitleUrl : null}
                    subtitleDelaySeconds={subtitleDelaySeconds}
                    subtitleSettings={subtitleSettings}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Playback Controls
              </CardTitle>
              <CardDescription>Fine-tune subtitle visibility, delay, and size for review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-4 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Subtitles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Subtitles</p>
                    <p className="text-xs text-muted-foreground">{subtitlesEnabled ? 'Visible' : 'Hidden'}</p>
                  </div>
                </div>
                <Switch checked={subtitlesEnabled} onCheckedChange={setSubtitlesEnabled} />
              </div>

              <div className="rounded-lg border border-border/60 bg-card/60 p-4 transition-colors hover:bg-accent/30">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    Delay
                  </div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-muted-foreground">
                    {subtitleDelaySeconds.toFixed(1)}s
                  </span>
                </div>
                <Slider
                  value={[subtitleDelaySeconds]}
                  min={-5}
                  max={5}
                  step={0.1}
                  onValueChange={([value]) => setSubtitleDelaySeconds(value)}
                />
              </div>

              <div className="rounded-lg border border-border/60 bg-card/60 p-4 transition-colors hover:bg-accent/30">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Subtitles className="h-4 w-4" />
                    </div>
                    Font Size
                  </div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-muted-foreground">
                    {subtitleFontSize}px
                  </span>
                </div>
                <Slider
                  value={[subtitleFontSize]}
                  min={16}
                  max={48}
                  step={1}
                  onValueChange={([value]) => setSubtitleFontSize(value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
