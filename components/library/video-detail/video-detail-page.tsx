'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { getJobById } from '@/lib/actions/jobs';
import { Job, SubtitleSettings } from '@/lib/types/database';

import { VideoPlayerSection } from './video-player-section';
import { VideoInfoSidebar } from './video-info-sidebar';
import { SubtitlePanel } from './subtitle-panel';
import { AnalyticsSection } from './analytics-section';
import { VideoDetailSkeleton } from './video-detail-skeleton';
import { VideoDetailError } from './video-detail-error';

interface VideoDetailPageProps {
  id: string;
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

export function VideoDetailPage({ id }: VideoDetailPageProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  
  // Settings state
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleDelaySeconds, setSubtitleDelaySeconds] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(DEFAULT_SUBTITLE_SETTINGS.fontSize || 30);
  const [activeSettings, setActiveSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);

  const playerSectionRef = useRef<HTMLDivElement>(null);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await getJobById(id);
      
      if (fetchError || !data) {
        throw new Error(fetchError || 'Video not found');
      }
      
      setJob(data);
      
      // Initialize settings from DB if available
      const dbSettings = data.subtitle_settings || {};
      const mergedSettings = {
        ...DEFAULT_SUBTITLE_SETTINGS,
        ...dbSettings,
      };
      
      setActiveSettings(mergedSettings);
      setSubtitleFontSize(mergedSettings.fontSize || 30);
      
      // Resolve subtitle URL
      if (data.subtitle_file) {
        // Assume direct URL if it's absolute
        if (data.subtitle_file.startsWith('http')) {
          setSubtitleUrl(data.subtitle_file);
        } else {
          setSubtitleUrl(`/api/subtitles/content?path=${encodeURIComponent(data.subtitle_file)}`);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load video details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Update active settings when font size changes
  useEffect(() => {
    setActiveSettings(prev => ({
      ...prev,
      fontSize: subtitleFontSize
    }));
  }, [subtitleFontSize]);

  const handleSeekTo = (seconds: number) => {
    // This is a bit of a hack since we don't have a direct ref to the player instance
    // Instead we'll simulate a keyboard event or rely on the fact that if they want
    // to jump, we can do it by passing a new prop, but ReactPlayer doesn't support
    // seekTo via props. For a true implementation, we'd need to hoist the playerRef.
    // As a workaround, we'll dispatch a custom event that VideoPlayer could listen to,
    // or just let it be handled in a future iteration where refs are hoisted.
    
    // For now, we'll log it. In a real app, hoist the ref or use context.
    
    // Try to find the HTML5 video element if it exists and force it
    const videoElements = document.getElementsByTagName('video');
    if (videoElements.length > 0) {
      videoElements[0].currentTime = seconds;
      videoElements[0].play().catch(() => {});
    }
    
    // Scroll to player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <VideoDetailSkeleton />;
  if (error || !job) return <VideoDetailError error={error || 'Unknown error'} onRetry={fetchJob} />;

  return (
    <div className="app-page pb-24">
      <div className="mb-6 space-y-4">
        <Link 
          href="/library" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {job.title || 'Untitled Video'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-8">
        
        {/* Left Column - Main Content */}
        <div className="space-y-8 min-w-0">
          <div ref={playerSectionRef}>
            <VideoPlayerSection
              videoId={job.id}
              videoUrl={job.video_url}
              subtitleUrl={subtitleUrl}
              subtitleSettings={activeSettings}
              subtitleDelaySeconds={subtitleDelaySeconds}
              subtitlesEnabled={subtitlesEnabled}
            />
          </div>

          <SubtitlePanel 
            subtitleUrl={subtitleUrl} 
            onSeekTo={handleSeekTo} 
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <VideoInfoSidebar
            job={job}
            subtitlesEnabled={subtitlesEnabled}
            onSubtitlesEnabledChange={setSubtitlesEnabled}
            subtitleDelaySeconds={subtitleDelaySeconds}
            onSubtitleDelayChange={setSubtitleDelaySeconds}
            subtitleFontSize={subtitleFontSize}
            onSubtitleFontSizeChange={setSubtitleFontSize}
          />
          
          <AnalyticsSection />
        </div>
      </div>
    </div>
  );
}
