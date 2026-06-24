'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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

interface JobsVideoRow {
  id: string;
  name?: string | null;
  title?: string | null;
  video_url: string;
  subtitle_url?: string | null;
  subtitle_file?: string | null;
  subtitle_settings?: SubtitleSettings | null;
  created_at?: string;
}

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

export function VideosPage() {
  const supabase = useMemo(() => createClient(), []);

  const [videos, setVideos] = useState<BrowseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [randomCount, setRandomCount] = useState(DEFAULT_RANDOM_COUNT);
  const [randomVideos, setRandomVideos] = useState<BrowseVideo[] | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<BrowseVideo | null>(null);
  const [selectedSubtitleUrl, setSelectedSubtitleUrl] = useState<string | null>(null);
  const [subtitleUrlLoading, setSubtitleUrlLoading] = useState(false);
  const [playRequestId, setPlayRequestId] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleDelaySeconds, setSubtitleDelaySeconds] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(DEFAULT_SUBTITLE_SETTINGS.fontSize || 30);
  const subtitleUrlCacheRef = useRef(new Map<string, string>());

  const totalVideos = videos.length;
  const maxRandomCount = Math.max(1, totalVideos);

  useEffect(() => {
    let isActive = true;

    const fetchVideos = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isActive) return;

      if (error) {
        setVideos([]);
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = ((data as JobsVideoRow[] | null) || []);

      const normalizedVideos: BrowseVideo[] = rows
        .filter((item) => item?.id && item?.video_url)
        .map((item) => ({
          id: String(item.id),
          name: String(item.name ?? item.title ?? '').trim() || 'Untitled video',
          video_url: String(item.video_url).trim(),
          subtitle_url: item.subtitle_url?.trim() || null,
          subtitle_file: item.subtitle_file?.trim() || null,
          subtitle_settings: item.subtitle_settings || null,
          created_at: item.created_at || undefined,
        }))
        .filter((item) => item.video_url.length > 0);

      setVideos(normalizedVideos);
      setRandomCount(clampRandomCount(DEFAULT_RANDOM_COUNT, normalizedVideos.length));
      setRandomVideos(null);
      setSelectedVideo(normalizedVideos[0] || null);
      setSelectedSubtitleUrl(null);
      setLoading(false);
    };

    fetchVideos();

    return () => {
      isActive = false;
    };
  }, [supabase]);

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

        if (nextUrl) subtitleUrlCacheRef.current.set(directSubtitleUrl, nextUrl);
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

      if (nextUrl) subtitleUrlCacheRef.current.set(subtitleFilePath, nextUrl);
      setSelectedSubtitleUrl(nextUrl);
      setSubtitleUrlLoading(false);
    };

    loadSubtitleUrl();

    return () => {
      cancelled = true;
    };
  }, [selectedVideo, supabase]);

  const filteredVideos = useMemo(() => {
    if (!searchTerm) return videos;
    const normalizedSearch = searchTerm.toLowerCase();
    return videos.filter((video) => video.name.toLowerCase().includes(normalizedSearch));
  }, [searchTerm, videos]);

  const displayedVideos = useMemo(() => randomVideos ?? filteredVideos, [filteredVideos, randomVideos]);

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

  const handleApplySearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
    setRandomVideos(null);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      handleApplySearch();
    },
    [handleApplySearch]
  );

  const handleRandomCountChange = useCallback(
    (value: number) => {
      setRandomCount(clampRandomCount(value, maxRandomCount));
    },
    [maxRandomCount]
  );

  const handleRandomize = useCallback(() => {
    if (!videos.length) return;

    const count = clampRandomCount(randomCount, videos.length);
    const nextSelection = shuffleVideos(videos).slice(0, count);
    setRandomVideos(nextSelection);
    setSearchTerm('');
    setSearchInput('');
    setSelectedVideo(nextSelection[0] || null);
    setPlayRequestId((prev) => prev + 1);
  }, [randomCount, videos]);

  const handleBackToAll = useCallback(() => {
    setRandomVideos(null);
  }, []);

  const handleSelectVideo = useCallback((video: BrowseVideo) => {
    setSelectedVideo(video);
    setPlayRequestId((prev) => prev + 1);
  }, []);

  return (
    <div className="app-page">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Playback library</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Browse every captioned video.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Search the library, randomize a review set, and adjust subtitle playback without leaving the player.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Badge variant="outline" className="justify-center border-primary/25 bg-primary/10 px-3 py-1 text-primary">
            {displayedVideos.length} shown
          </Badge>
          <Badge variant="outline" className="justify-center px-3 py-1 text-muted-foreground">
            {totalVideos} total
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>Video Library</CardTitle>
            <CardDescription>Find a video by name or sample a random set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search video name"
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={handleApplySearch} aria-label="Search videos">
                <Search className="h-4 w-4" />
              </Button>
            </div>

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

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background/45 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No videos found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a broader search term.</p>
              </div>
            ) : (
              <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {displayedVideos.map((video) => {
                  const isSelected = selectedVideo?.id === video.id;

                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleSelectVideo(video)}
                      className={cn(
                        'flex w-full gap-3 rounded-lg border p-2 text-left transition-all',
                        isSelected
                          ? 'border-primary/45 bg-primary/10 shadow-soft'
                          : 'border-border/60 bg-background/45 hover:border-primary/30 hover:bg-accent/50'
                      )}
                    >
                      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-slate-950">
                        <VideoThumbnail title={video.name} url={video.video_url} iconClassName="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium">{video.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{getHostname(video.video_url)}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                <div className="rounded-lg border border-dashed border-border bg-background/45 p-12 text-center">
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
                    <p className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                      No subtitle file is available for this video.
                    </p>
                  )}

                  <VideoPlayer
                    key={`videos-page-player-${selectedVideo.id}-${selectedVideo.video_url}`}
                    src={selectedVideo.video_url}
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
            <CardContent className="grid gap-5 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/45 p-4">
                <div className="flex items-center gap-3">
                  <Subtitles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Subtitles</p>
                    <p className="text-xs text-muted-foreground">{subtitlesEnabled ? 'Visible' : 'Hidden'}</p>
                  </div>
                </div>
                <Switch checked={subtitlesEnabled} onCheckedChange={setSubtitlesEnabled} />
              </div>

              <div className="rounded-lg border border-border/60 bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Delay
                  </div>
                  <span className="text-xs text-muted-foreground">{subtitleDelaySeconds.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[subtitleDelaySeconds]}
                  min={-5}
                  max={5}
                  step={0.1}
                  onValueChange={([value]) => setSubtitleDelaySeconds(value)}
                />
              </div>

              <div className="rounded-lg border border-border/60 bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Subtitles className="h-4 w-4 text-primary" />
                    Font
                  </div>
                  <span className="text-xs text-muted-foreground">{subtitleFontSize}px</span>
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
