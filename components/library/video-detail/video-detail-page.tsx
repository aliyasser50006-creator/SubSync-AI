'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileVideo, Languages, Timer } from 'lucide-react';

import { Job, SubtitleSettings } from '@/lib/types/database';
import { VideoPlayerSection } from './video-player-section';
import { VideoInfoSidebar } from './video-info-sidebar';
import { SubtitlePanel } from './subtitle-panel';
import { AnalyticsSection } from './analytics-section';
import { VideoDetailActions } from './video-detail-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VideoDetailPageProps {
  job: Job;
  returnTo: string;
}

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 30,
  fontColor: '#FFFFFF',
  position: 'bottom',
  alignment: 'center',
  background: false,
  outlineColor: '#000000',
  outlineWidth: 0,
};

function getFileName(url: string) {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : 'Remote video';
  } catch {
    return 'Remote video';
  }
}

export function VideoDetailPage({ job, returnTo }: VideoDetailPageProps) {
  const router = useRouter();
  const mergedSettings = { ...DEFAULT_SUBTITLE_SETTINGS, ...(job.subtitle_settings || {}) };
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleDelaySeconds, setSubtitleDelaySeconds] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(mergedSettings.fontSize || 30);
  const [activeSettings, setActiveSettings] = useState<SubtitleSettings>(mergedSettings);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const subtitleUrl = job.subtitle_file
    ? job.subtitle_file.startsWith('http')
      ? job.subtitle_file
      : `/api/subtitles/content?path=${encodeURIComponent(job.subtitle_file)}`
    : null;
  const title = job.title || 'Untitled Studio Project';
  const uploadDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.created_at));

  const handleFontSizeChange = (fontSize: number) => {
    setSubtitleFontSize(fontSize);
    setActiveSettings((settings) => ({ ...settings, fontSize }));
  };

  const handleSeekTo = (seconds: number) => {
    window.dispatchEvent(new CustomEvent('subsync:seek', { detail: { seconds } }));
    const videoElement = document.getElementsByTagName('video')[0];
    if (videoElement) {
      videoElement.currentTime = seconds;
      videoElement.play().catch(() => {});
    }
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const returnToLibrary = () => {
    router.replace(returnTo, { scroll: false });
  };

  return (
    <div className="app-page pb-24 animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 border-b border-border/40 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={returnToLibrary}
            className="-ml-3 mb-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Library
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 font-mono text-xs text-primary">
              Video Details
            </Badge>
          </div>
        </div>
        <VideoDetailActions
          videoId={job.id}
          title={title}
          hasSubtitles={Boolean(job.subtitle_file)}
          returnTo={returnTo}
        />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-panel flex items-center gap-3 p-4">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0"><p className="text-[11px] uppercase text-muted-foreground">Uploaded</p><p className="truncate text-sm font-semibold">{uploadDate}</p></div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-4">
          <Timer className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0"><p className="text-[11px] uppercase text-muted-foreground">Duration</p><p className="truncate text-sm font-semibold">Shown in player</p></div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-4">
          <Languages className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0"><p className="text-[11px] uppercase text-muted-foreground">Language</p><p className="truncate text-sm font-semibold">Not specified</p></div>
        </div>
        <div className="surface-panel flex items-center gap-3 p-4">
          <FileVideo className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0"><p className="text-[11px] uppercase text-muted-foreground">File</p><p className="truncate text-sm font-semibold" title={getFileName(job.video_url)}>{getFileName(job.video_url)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-8">
          <div ref={playerSectionRef} className="surface-panel p-4 sm:p-6">
            <VideoPlayerSection
              videoId={job.id}
              videoUrl={job.video_url}
              subtitleUrl={subtitleUrl}
              subtitleSettings={activeSettings}
              subtitleDelaySeconds={subtitleDelaySeconds}
              subtitlesEnabled={subtitlesEnabled}
            />
          </div>
          <SubtitlePanel subtitleUrl={subtitleUrl} onSeekTo={handleSeekTo} />
        </div>

        <div className="space-y-6">
          <VideoInfoSidebar
            job={job}
            subtitlesEnabled={subtitlesEnabled}
            onSubtitlesEnabledChange={setSubtitlesEnabled}
            subtitleDelaySeconds={subtitleDelaySeconds}
            onSubtitleDelayChange={setSubtitleDelaySeconds}
            subtitleFontSize={subtitleFontSize}
            onSubtitleFontSizeChange={handleFontSizeChange}
          />
          <AnalyticsSection />
        </div>
      </div>
    </div>
  );
}
