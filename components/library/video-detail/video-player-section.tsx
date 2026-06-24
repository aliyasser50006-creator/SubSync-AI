'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Download, Share2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SubtitleSettings } from '@/lib/types/database';

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
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SubSync AI Video',
          url: window.location.href,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to share video');
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
    <div className="flex flex-col gap-4">
      {/* Player Wrapper */}
      <div className="sticky top-0 z-10 lg:static bg-background/80 lg:bg-transparent pb-2 lg:pb-0 backdrop-blur-md lg:backdrop-blur-none">
        <VideoPlayer
          key={`video-detail-${videoId}`}
          src={videoUrl}
          playRequestId={playRequestId}
          subtitleUrl={subtitlesEnabled ? subtitleUrl : null}
          subtitleDelaySeconds={subtitleDelaySeconds}
          subtitleSettings={subtitleSettings}
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
        {subtitleUrl ? (
          <Button variant="outline" onClick={handleDownloadSubtitle} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Subtitle</span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" disabled className="gap-2 opacity-50">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Subtitle</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>No subtitle file available</TooltipContent>
          </Tooltip>
        )}

        <Button variant="outline" onClick={handleDownloadVideo} className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Video</span>
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copy link">
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share video">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
