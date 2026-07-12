'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, Subtitles, Clock, CheckCircle2, AlertTriangle, Loader2, Play, Download } from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';

interface QuickInspectorProps {
  video: (BrowseVideo & { status?: Job['status'] }) | null;
  onClose: () => void;
}

export function QuickInspector({ video, onClose }: QuickInspectorProps) {
  const router = useRouter();

  if (!video) return null;

  const formattedDate = video.created_at
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(video.created_at))
    : 'Unknown date';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-border/60 bg-card/95 p-6 shadow-elevated backdrop-blur-2xl animate-slide-in-right flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-0.5 text-xs font-mono">
              Inspector
            </Badge>
            {video.status === 'ready' || video.status === 'done' ? (
              <Badge variant="outline" className="border-success/25 bg-success/10 text-success text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
              </Badge>
            ) : video.status === 'processing' ? (
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
              </Badge>
            ) : video.status === 'failed' ? (
              <Badge variant="outline" className="border-destructive/25 bg-destructive/10 text-destructive text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" /> Failed
              </Badge>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close inspector">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-6 flex-1">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-border/40 shadow-soft">
            <VideoThumbnail title={video.name} url={video.video_url} imgUrl={video.img_url} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground leading-snug break-words">
              {video.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="h-3.5 w-3.5" />
              Created {formattedDate}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metadata & Assets
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Video Source URL</span>
                <span className="font-mono text-foreground truncate max-w-[200px]" title={video.video_url}>
                  {video.video_url}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Subtitle Track</span>
                <span className="font-medium text-foreground">
                  {video.subtitle_file ? 'Attached (.srt/.vtt)' : 'None'}
                </span>
              </div>
              {video.subtitle_settings && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Font Styling</span>
                  <span className="font-mono text-foreground">
                    {video.subtitle_settings.fontSize || 28}px {video.subtitle_settings.fontColor || '#FFF'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex flex-col gap-2.5">
          <Button
            onClick={() => router.push(`/library/${video.id}`)}
            className="w-full font-semibold shadow-soft"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            Open in Studio Editor
          </Button>
          {video.subtitle_file && (
            <Button
              variant="outline"
              onClick={() => window.open(video.subtitle_file || '', '_blank')}
              className="w-full text-xs"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Download Subtitle File
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
