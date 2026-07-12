'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, PlayCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Job, SubtitleSettings } from '@/lib/types/database';
import { readSubtitleFileAsText, srtToVtt, validateImageUrl, validateVideoUrl } from '@/lib/utils/subtitle-converter';

import { SourceVideoCard } from './source-video-card';
import { SubtitleUploadCard } from './subtitle-upload-card';
import { StylingCard } from './styling-card';
import { LivePreviewCard } from './live-preview-card';

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 28,
  fontColor: '#FFFFFF',
  position: 'bottom',
  alignment: 'center',
  background: false,
  outlineColor: '#000000',
  outlineWidth: 2,
};

const statusConfig = {
  pending: {
    label: 'Pending',
    progress: 18,
    className: 'border-warning/25 bg-warning/10 text-warning',
  },
  processing: {
    label: 'Processing',
    progress: 62,
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  ready: {
    label: 'Ready to preview',
    progress: 82,
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  done: {
    label: 'Complete',
    progress: 100,
    className: 'border-success/25 bg-success/10 text-success',
  },
  failed: {
    label: 'Failed',
    progress: 100,
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
  },
} satisfies Record<Job['status'], { label: string; progress: number; className: string }>;

function createJobTitle(baseTitle: string, file: File, totalFiles: number) {
  if (totalFiles <= 1) return baseTitle;
  return `${baseTitle} - ${file.name.replace(/\.srt$/i, '')}`;
}

export function DashboardClient() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [imgUrlError, setImgUrlError] = useState<string | null>(null);
  const [subtitleFiles, setSubtitleFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [queueLabel, setQueueLabel] = useState('');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [subtitlePlaybackUrl, setSubtitlePlaybackUrl] = useState<string | null>(null);
  const [subtitleUrlLoading, setSubtitleUrlLoading] = useState(false);
  const subtitleUrlCacheRef = useRef(new Map<string, string>());

  const [settings, setSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);

  const activeStatus = currentJob ? statusConfig[currentJob.status] : null;
  const displayedProgress = uploading ? uploadProgress : activeStatus?.progress ?? 0;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCurrentJob(payload.new as Job);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;
      const button = document.getElementById('create-job-submit') as HTMLButtonElement | null;
      if (!button || button.disabled) return;
      event.preventDefault();
      button.click();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!currentJob) {
      setSubtitlePlaybackUrl(null);
      setSubtitleUrlLoading(false);
      return;
    }

    if (currentJob.subtitle_settings) {
      setSettings((prev) => ({ ...prev, ...currentJob.subtitle_settings }));
    }

    if (!currentJob.subtitle_file) {
      setSubtitlePlaybackUrl(null);
      setSubtitleUrlLoading(false);
      return;
    }

    const cachedUrl = subtitleUrlCacheRef.current.get(currentJob.subtitle_file);
    const playbackUrl =
      cachedUrl ||
      (currentJob.subtitle_file.startsWith('http')
        ? currentJob.subtitle_file
        : `/api/subtitles/content?path=${encodeURIComponent(currentJob.subtitle_file)}`);

    subtitleUrlCacheRef.current.set(currentJob.subtitle_file, playbackUrl);
    setSubtitlePlaybackUrl(playbackUrl);
    setSubtitleUrlLoading(false);
  }, [currentJob, supabase]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim()) setTitleError(null);
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    if (value.trim()) {
      const result = validateVideoUrl(value.trim());
      setVideoUrlError(result.valid ? null : result.error || 'Invalid URL');
    } else {
      setVideoUrlError(null);
    }
  };

  const handleImgUrlChange = (value: string) => {
    setImgUrl(value);
    if (value.trim()) {
      const result = validateImageUrl(value.trim());
      setImgUrlError(result.valid ? null : result.error || 'Invalid image URL');
    } else {
      setImgUrlError(null);
    }
  };

  const addSubtitleFiles = useCallback((files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    const srtFiles = nextFiles.filter((file) => file.name.toLowerCase().endsWith('.srt'));
    const rejectedCount = nextFiles.length - srtFiles.length;

    if (rejectedCount > 0) {
      toast.warning('Only .srt files can be uploaded.');
    }

    if (!srtFiles.length) return;

    setSubtitleFiles((prev) => {
      const seen = new Set(prev.map((file) => `${file.name}:${file.size}`));
      const unique = srtFiles.filter((file) => !seen.has(`${file.name}:${file.size}`));
      return [...prev, ...unique];
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || uploading) return;

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setTitleError('Video title is required.');
      return;
    }

    const normalizedVideoUrl = videoUrl.trim();
    const urlValidation = validateVideoUrl(normalizedVideoUrl);
    if (!urlValidation.valid) {
      setVideoUrlError(urlValidation.error || 'Invalid URL');
      return;
    }

    const normalizedImgUrl = imgUrl.trim();
    if (normalizedImgUrl) {
      const imgValidation = validateImageUrl(normalizedImgUrl);
      if (!imgValidation.valid) {
        setImgUrlError(imgValidation.error || 'Invalid image URL');
        return;
      }
    }

    if (!subtitleFiles.length) {
      toast.error('Add at least one .srt file to continue.');
      return;
    }

    setUploading(true);
    setUploadProgress(4);
    setQueueLabel(`Uploading ${subtitleFiles.length} files in parallel...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session. Please log in again.');

      let completedTasks = 0;
      const totalTasks = subtitleFiles.length;

      const uploadPromises = subtitleFiles.map(async (subtitleFile, index) => {
        try {
          const srtContent = await readSubtitleFileAsText(subtitleFile);
          const vttContent = srtToVtt(srtContent);
          const vttBlob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
          const vttFileName = subtitleFile.name.replace(/\.srt$/i, '.vtt');
          const fileName = `${user.id}/${Date.now()}_${index}_${vttFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('subtitles')
            .upload(fileName, vttBlob, {
              contentType: 'text/vtt; charset=utf-8',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const response = await fetch('/api/jobs/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              title: createJobTitle(normalizedTitle, subtitleFile, totalTasks),
              videoUrl: normalizedVideoUrl,
              imgUrl: normalizedImgUrl || null,
              subtitleFile: fileName,
              subtitleSettings: settings,
            }),
          });

          const result = await response.json();
          if (!response.ok || result.error) throw new Error(result.error || 'Failed to create job');

          completedTasks++;
          setUploadProgress(Math.min(98, 4 + (completedTasks / totalTasks) * 94));
          
          return result.data as Job;
        } catch (err) {
          console.error(`Failed to process ${subtitleFile.name}:`, err);
          throw err; // Re-throw to be caught by allSettled
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const createdJobs = results
        .filter((r): r is PromiseFulfilledResult<Job> => r.status === 'fulfilled')
        .map(r => r.value);
        
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (createdJobs.length > 0) {
        setCurrentJob(createdJobs[createdJobs.length - 1]);
        setTitle('');
        setTitleError(null);
        setVideoUrl('');
        setVideoUrlError(null);
        setImgUrl('');
        setImgUrlError(null);
        setSubtitleFiles([]);
        setUploadProgress(100);
        setQueueLabel('Ready for preview');
        
        toast.success(
          createdJobs.length > 1
            ? `${createdJobs.length} subtitle jobs were created.`
            : 'Subtitle track is ready to preview.'
        );
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} files. Check console for details.`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit job. Please try again.';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const copySubtitleLink = async (path: string) => {
    try {
      const url = path.startsWith('http')
        ? path
        : `${window.location.origin}/api/subtitles/content?path=${encodeURIComponent(path)}`;
      await navigator.clipboard.writeText(url);
      toast.success('Subtitle link copied to clipboard.');
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const isSubmitDisabled = !title.trim() || !videoUrl.trim() || !subtitleFiles.length || uploading || !!videoUrlError || !!imgUrlError;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(400px,1fr)_minmax(500px,1.4fr)] mt-6">
      <div className="space-y-6">
        <SourceVideoCard
          title={title}
          titleError={titleError}
          videoUrl={videoUrl}
          videoUrlError={videoUrlError}
          imgUrl={imgUrl}
          imgUrlError={imgUrlError}
          onTitleChange={handleTitleChange}
          onVideoUrlChange={handleVideoUrlChange}
          onImgUrlChange={handleImgUrlChange}
        />
        
        <SubtitleUploadCard
          subtitleFiles={subtitleFiles}
          isDragging={isDragging}
          onAddFiles={addSubtitleFiles}
          onRemoveFile={(file) => setSubtitleFiles(p => p.filter(item => `${item.name}-${item.size}` !== `${file.name}-${file.size}`))}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addSubtitleFiles(e.dataTransfer.files); }}
        />
        
        <StylingCard 
          settings={settings}
          onSettingsChange={setSettings}
        />

        <Button
          id="create-job-submit"
          type="submit"
          disabled={isSubmitDisabled}
          isLoading={uploading}
          loadingText="Creating jobs..."
          size="lg"
          className="w-full h-12 text-base font-bold shadow-soft mt-2"
        >
          <PlayCircle className="mr-2 h-5 w-5 shrink-0" />
          Create Subtitle Preview
        </Button>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <LivePreviewCard
          currentJob={currentJob}
          activeStatus={activeStatus}
          uploading={uploading}
          queueLabel={queueLabel}
          displayedProgress={displayedProgress}
          subtitleUrlLoading={subtitleUrlLoading}
          subtitlePlaybackUrl={subtitlePlaybackUrl}
          settings={settings}
          onCopyLink={copySubtitleLink}
        />
      </aside>
    </form>
  );
}
