'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient, type QueryFunctionContext } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Search, VideoOff } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Job } from '@/lib/types/database';
import { validateImageUrl, validateVideoUrl } from '@/lib/utils/subtitle-converter';
import { escapeIlike } from '@/lib/utils/escape-ilike';

import { VideoFilters, AvailabilityFilter } from './video-filters';
import { VideoListItem } from './video-list-item';
import { VideoPlaybackCard } from './video-playback-card';

const ITEMS_PER_PAGE = 10;

function isValidJob(job: unknown): job is Job {
  if (!job || typeof job !== 'object') return false;
  const candidate = job as Partial<Job>;
  if (!candidate.id || !candidate.user_id || !candidate.video_url) return false;
  if (!validateVideoUrl(candidate.video_url).valid) return false;
  return true;
}

interface MyVideosClientProps {
  initialAvailableCount: number;
  initialUnavailableCount: number;
}

export function MyVideosClient({ initialAvailableCount, initialUnavailableCount }: MyVideosClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // Cache the resolved user ID so auth.getUser() is not called on every
  // paginated fetch — eliminates a redundant network round-trip per page.
  const cachedUserIdRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('available');

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [playRequestId, setPlayRequestId] = useState(0);
  const [selectedSubtitleUrl, setSelectedSubtitleUrl] = useState<string | null>(null);
  const [subtitleUrlLoading, setSubtitleUrlLoading] = useState(false);
  const subtitleUrlCacheRef = useRef(new Map<string, string>());

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleError, setEditTitleError] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editVideoUrlError, setEditVideoUrlError] = useState<string | null>(null);
  const [editImgUrl, setEditImgUrl] = useState('');
  const [editImgUrlError, setEditImgUrlError] = useState<string | null>(null);
  
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchJobs = async ({ pageParam, signal }: QueryFunctionContext<string[], number>) => {
    // Use cached user ID to avoid a round-trip on every page fetch.
    if (!cachedUserIdRef.current) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');
      cachedUserIdRef.current = user.id;
    }
    const userId = cachedUserIdRef.current;
    const page = pageParam ?? 0;

    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (availabilityFilter === 'available') {
      query = query.is('output_video', null);
    } else {
      query = query.not('output_video', 'is', null);
    }

    const trimmedSearch = debouncedSearch.trim();
    if (trimmedSearch) {
      // Escape ILIKE special characters (%, _, \) so user input like "100%"
      // is treated as a literal string, not a wildcard pattern.
      const escaped = escapeIlike(trimmedSearch).replace(/"/g, '""');
      query = query.or(`title.ilike."%${escaped}%",video_url.ilike."%${escaped}%"`);
    }

    // Forward the React Query AbortSignal to Supabase so that when React Query
    // cancels a stale request (e.g. on query key change), the in-flight HTTP
    // request is also aborted, preventing wasted bandwidth.
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .abortSignal(signal);

    if (error) {
      // AbortError = intentional cancellation by React Query; not a real error.
      if (error.message?.includes('AbortError') || error.message?.includes('aborted')) {
        throw new Error('AbortError');
      }
      throw new Error(error.message);
    }

    const validJobs = (data as Job[]).filter(isValidJob);

    return {
      items: validJobs,
      nextCursor: validJobs.length === ITEMS_PER_PAGE ? page + 1 : null,
      totalCount: count || 0,
    };
  };

  const queryKey = ['jobs', availabilityFilter, debouncedSearch];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchJobs,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const jobs = data?.pages.flatMap(page => page.items) || [];
  const currentTotalCount = data?.pages[0]?.totalCount || (availabilityFilter === 'available' ? initialAvailableCount : initialUnavailableCount);

  // Setup Realtime Sync
  useEffect(() => {
    let mounted = true;
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const channel = supabase
        .channel('jobs-list')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs', filter: `user_id=eq.${user.id}` },
          () => {
            // Invalidate to cleanly refetch the current pages
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    };
    
    const cleanupPromise = setupRealtime();
    return () => {
      mounted = false;
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [supabase, queryClient]);

  const selectedJob = useMemo(() => jobs.find(job => job.id === selectedJobId) || null, [jobs, selectedJobId]);
  const playerUrl = selectedJob?.video_url?.trim() || null;

  useEffect(() => {
    if (!selectedJob || !selectedJob.subtitle_file?.trim()) {
      setSelectedSubtitleUrl(null);
      setSubtitleUrlLoading(false);
      return;
    }

    let cancelled = false;

    const loadSubtitleUrl = async () => {
      const cachedUrl = subtitleUrlCacheRef.current.get(selectedJob.subtitle_file);
      if (cachedUrl) {
        setSelectedSubtitleUrl(cachedUrl);
        setSubtitleUrlLoading(false);
        return;
      }

      setSubtitleUrlLoading(true);
      setSelectedSubtitleUrl(null);

      const subtitleUrl = selectedJob.subtitle_file.startsWith('http')
        ? selectedJob.subtitle_file
        : `/api/subtitles/content?path=${encodeURIComponent(selectedJob.subtitle_file)}`;

      if (cancelled) return;
      subtitleUrlCacheRef.current.set(selectedJob.subtitle_file, subtitleUrl);
      setSelectedSubtitleUrl(subtitleUrl);

      setSubtitleUrlLoading(false);
    };

    loadSubtitleUrl();

    return () => { cancelled = true; };
  }, [selectedJob]);

  const handleSelectForPlayback = (job: Job) => {
    setSelectedSubtitleUrl(null);
    setSelectedJobId(job.id);
    setPlayRequestId(prev => prev + 1);
  };

  const handleStartEdit = (job: Job) => {
    setEditingJobId(job.id);
    setEditTitle(job.title?.trim() || '');
    setEditTitleError(null);
    setEditVideoUrl(job.video_url);
    setEditVideoUrlError(null);
    setEditImgUrl(job.img_url?.trim() || '');
    setEditImgUrlError(null);
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditTitle('');
    setEditTitleError(null);
    setEditVideoUrl('');
    setEditVideoUrlError(null);
    setEditImgUrl('');
    setEditImgUrlError(null);
  };

  const handleEditVideoUrlChange = (value: string) => {
    setEditVideoUrl(value);
    if (!value.trim()) {
      setEditVideoUrlError(null);
      return;
    }
    const result = validateVideoUrl(value.trim());
    setEditVideoUrlError(result.valid ? null : result.error || 'Invalid URL');
  };

  const handleEditImgUrlChange = (value: string) => {
    setEditImgUrl(value);
    if (!value.trim()) {
      setEditImgUrlError(null);
      return;
    }
    const result = validateImageUrl(value.trim());
    setEditImgUrlError(result.valid ? null : result.error || 'Invalid image URL');
  };

  const handleSaveEdit = async () => {
    if (!editingJobId) return;

    const normalizedTitle = editTitle.trim();
    if (!normalizedTitle) {
      setEditTitleError('Video title is required.');
      return;
    }

    const normalizedVideoUrl = editVideoUrl.trim();
    const urlValidation = validateVideoUrl(normalizedVideoUrl);
    if (!urlValidation.valid) {
      setEditVideoUrlError(urlValidation.error || 'Invalid URL');
      return;
    }

    const normalizedImgUrl = editImgUrl.trim();
    if (normalizedImgUrl) {
      const imgValidation = validateImageUrl(normalizedImgUrl);
      if (!imgValidation.valid) {
        setEditImgUrlError(imgValidation.error || 'Invalid image URL');
        return;
      }
    }

    setSavingEdit(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session. Please log in again.');

      const response = await fetch('/api/jobs/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobId: editingJobId,
          title: normalizedTitle,
          videoUrl: normalizedVideoUrl,
          imgUrl: normalizedImgUrl || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to update video.');

      // Optimistic UI update or refetch
      refetch();
      handleCancelEdit();
      toast.success('Video updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update video.';
      toast.error(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const getOutputVideoUrl = (path: string) => {
    const { data } = supabase.storage.from('videos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownload = (path: string) => {
    const url = getOutputVideoUrl(path);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'processed-video.mp4';
    link.click();
  };

  const handleRetry = async (job: Job) => {
    setRetrying(job.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session.');

      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: `${job.title?.trim() || 'Untitled'} retry`,
          videoUrl: job.video_url,
          imgUrl: job.img_url || null,
          subtitleFile: job.subtitle_file,
          subtitleSettings: job.subtitle_settings,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to retry job.');

      refetch();
      if (result.data) setSelectedJobId(result.data.id);
      
      toast.success('Retry job created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry job.';
      toast.error(message);
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (job: Job) => {
    setDeleting(job.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session. Please log in again.');

      const response = await fetch('/api/jobs/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to delete video.');

      // Clear selection if the deleted video was being played
      if (selectedJobId === job.id) {
        setSelectedJobId(null);
        setSelectedSubtitleUrl(null);
      }

      // Invalidate subtitle URL cache for this job
      if (job.subtitle_file) {
        subtitleUrlCacheRef.current.delete(job.subtitle_file);
      }

      refetch();
      toast.success('Video deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete video.';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <VideoFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={availabilityFilter}
        onFilterChange={setAvailabilityFilter}
        availableCount={availabilityFilter === 'available' ? currentTotalCount : initialAvailableCount}
        unavailableCount={availabilityFilter === 'unavailable' ? currentTotalCount : initialUnavailableCount}
        resultCount={jobs.length}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <VideoPlaybackCard
          selectedJob={selectedJob}
          playerUrl={playerUrl}
          subtitleUrlLoading={subtitleUrlLoading}
          selectedSubtitleUrl={selectedSubtitleUrl}
          playRequestId={playRequestId}
        />

        <div className="space-y-4">
          {status === 'pending' ? (
            <div className="surface-panel flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">Loading video projects...</p>
            </div>
          ) : status === 'error' ? (
            <div className="surface-panel flex flex-col items-center justify-center p-8 text-destructive border-destructive/30 bg-destructive/10">
              <p className="font-bold text-sm">Failed to load workspace videos.</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="surface-panel py-16 px-6 text-center">
              {debouncedSearch ? (
                <>
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/60" />
                  <p className="mt-4 font-bold text-base text-foreground">No videos match &quot;{debouncedSearch}&quot;</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try searching with a different keyword or clearing your filter.</p>
                  <Button variant="outline" size="sm" className="mt-5 font-semibold" onClick={() => setSearchQuery('')}>Clear Filter Query</Button>
                </>
              ) : availabilityFilter === 'available' ? (
                <>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-base font-bold text-foreground">No processed videos found</p>
                  <p className="mt-1 text-xs text-muted-foreground">All your video jobs are currently unprocessed or pending. Check the Unprocessed tab.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <VideoOff className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-base font-bold text-foreground">No unprocessed videos found</p>
                  <p className="mt-1 text-xs text-muted-foreground">All your workspace videos have been successfully processed!</p>
                </>
              )}
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <VideoListItem
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  isEditing={editingJobId === job.id}
                  isSaving={savingEdit}
                  isDeleting={deleting === job.id}
                  isRetrying={retrying === job.id}
                  onSelect={() => handleSelectForPlayback(job)}
                  onStartEdit={() => handleStartEdit(job)}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={() => handleDelete(job)}
                  onDownload={() => handleDownload(job.output_video!)}
                  onOpenOutput={() => window.open(getOutputVideoUrl(job.output_video!), '_blank')}
                  onRetry={() => handleRetry(job)}
                  editTitle={editTitle}
                  onEditTitleChange={setEditTitle}
                  editTitleError={editTitleError}
                  editVideoUrl={editVideoUrl}
                  onEditVideoUrlChange={handleEditVideoUrlChange}
                  editVideoUrlError={editVideoUrlError}
                  editImgUrl={editImgUrl}
                  onEditImgUrlChange={handleEditImgUrlChange}
                  editImgUrlError={editImgUrlError}
                />
              ))}

              {hasNextPage && (
                <div className="pt-4 pb-8 flex justify-center">
                  <Button 
                    variant="secondary" 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="min-w-[200px]"
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
          )}
        </div>
      </div>
    </>
  );
}
