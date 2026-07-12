'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Download, Share2, Link as LinkIcon, Loader2, Sparkles, Film } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SubtitleSettings } from '@/lib/types/database';

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center border border-border/40 shadow-soft">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm font-semibold text-foreground">Initializing Media Workstation...</p>
      <p className="text-xs text-muted-foreground font-mono mt-1">Loading audio/video engine</p>
    </div>
  ),
});

interface VideoPlayerSectionProps {
  videoId: string;
  videoUrl: string;
  subtitleUrl: string | null;
  subtitleSettings: SubtitleSettings;
  subtitleDelaySeconds: number;
  subtitlesEnabled: boolean;
}

export function VideoPlayerSection({
  videoId,
  videoUrl,
  subtitleUrl,
  subtitleSettings,
  subtitleDelaySeconds,
  subtitlesEnabled,
}: VideoPlayerSectionProps) {
  const [playRequestId, setPlayRequestId] = useState(0);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Project studio link copied to clipboard');
    } catch {
      toast.error('Failed to copy studio link');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SubSync AI Studio Project',
          url: window.location.href,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to share project');
      }
    }
  };

  const handleDownloadVideo = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadSubtitle = () => {
    if (subtitleUrl) {
      window.open(subtitleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* DAW Player Surface */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-border/60 shadow-elevated">
        <VideoPlayer
          key={`video-detail-${videoId}`}
          src={videoUrl}
          playRequestId={playRequestId}
          subtitleUrl={subtitlesEnabled ? subtitleUrl : null}
          subtitleDelaySeconds={subtitleDelaySeconds}
          subtitleSettings={subtitleSettings}
        />
      </div>

      {/* Workstation Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40">
        <div className="flex flex-wrap items-center gap-2.5">
          {subtitleUrl ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSubtitle}
              className="h-9 gap-2 font-semibold shadow-xs hover:bg-accent"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Export Subtitle (.vtt/.srt)</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled className="h-9 gap-2 opacity-50">
                    <Download className="h-4 w-4" />
                    <span>Export Subtitle</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>No subtitle file attached to this project</TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadVideo}
            className="h-9 gap-2 font-medium bg-background/50 shadow-xs"
          >
            <Film className="h-4 w-4 text-muted-foreground" />
            <span>Open Source Video</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                aria-label="Copy project studio link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Project URL</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                aria-label="Share project"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Workstation</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
