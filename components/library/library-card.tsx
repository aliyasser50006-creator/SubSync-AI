'use client';

import { MouseEvent, memo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  Play,
  Subtitles,
} from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { Badge } from '@/components/ui/badge';
import { buildLibraryVideoUrl } from '@/lib/utils/library-video-route';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  video: BrowseVideo & { status?: Job['status'] };
  onBeforeOpen: () => boolean;
}

function getStatusConfig(status?: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return {
        label: 'Ready',
        icon: CheckCircle2,
        className: 'border-success/50 bg-success/20 text-success',
      };
    case 'processing':
    case 'pending':
      return {
        label: 'Processing',
        icon: Loader2,
        className: 'border-primary/50 bg-primary/20 text-primary animate-pulse',
        iconClassName: 'animate-spin',
      };
    case 'failed':
      return {
        label: 'Failed',
        icon: AlertTriangle,
        className: 'border-destructive/50 bg-destructive/20 text-destructive',
      };
    default:
      return null;
  }
}

/** Derive 1–2 initials from a video title for the fallback placeholder */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Pick a deterministic gradient hue from the title string */
function getGradientStyle(name: string): { background: string } {
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 55% 12%) 0%, hsl(${(hue + 40) % 360} 50% 8%) 100%)`,
  };
}

export const LibraryCard = memo(function LibraryCard({ video, onBeforeOpen }: LibraryCardProps) {
  const detailsUrl = buildLibraryVideoUrl(video.id) || '#';
  const formattedDate = video.created_at
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(video.created_at)
      )
    : 'Unknown date';

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onBeforeOpen()) event.preventDefault();
  };

  const hasImgUrl = Boolean(video.img_url?.trim());
  const statusConfig = getStatusConfig(video.status);
  const StatusIcon = statusConfig?.icon;
  const initials = getInitials(video.name);
  const gradientStyle = getGradientStyle(video.name);

  return (
    <a
      href={detailsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-xs transition-all duration-250 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Open details for ${video.name} in a new tab`}
    >
      {/* ── Thumbnail / Fallback ── */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30" style={!hasImgUrl ? gradientStyle : undefined}>
        {hasImgUrl ? (
          <VideoThumbnail
            title={video.name}
            url={video.video_url}
            imgUrl={video.img_url}
            iconClassName="h-8 w-8"
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          /* Stylised fallback with gradient + initials */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
              <Film className="h-6 w-6 text-white/30" />
            </div>
            <span
              className="font-mono text-3xl font-black tracking-tight text-white/10"
              aria-hidden="true"
            >
              {initials}
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/90 pl-0.5 shadow-xl ring-4 ring-primary/20 transition-transform duration-250 scale-90 group-hover:scale-100">
            <Play fill="currentColor" className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        {/* Overlay badges — top left / top right */}
        <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between gap-2">
          {statusConfig && StatusIcon && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md',
                statusConfig.className
              )}
            >
              <StatusIcon className={cn('h-2.5 w-2.5 shrink-0', statusConfig.iconClassName)} />
              {statusConfig.label}
            </span>
          )}
          {video.subtitle_file && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur-md">
              <Subtitles className="h-2.5 w-2.5 text-primary shrink-0" />
              CC
            </span>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h3
          className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors duration-150 group-hover:text-primary"
          title={video.name}
        >
          {video.name}
        </h3>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <span className="translate-x-1 text-[10px] font-semibold uppercase tracking-wider text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            Open →
          </span>
        </div>
      </div>
    </a>
  );
});
