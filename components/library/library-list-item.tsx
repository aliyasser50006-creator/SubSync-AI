'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Subtitles, Clock, AlertTriangle, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { Badge } from '@/components/ui/badge';

interface LibraryListItemProps {
  video: BrowseVideo & { status?: Job['status'] };
}

function getStatusBadge(status?: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return (
        <Badge variant="outline" className="border-success/40 bg-success/15 text-success whitespace-nowrap text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider">
          <CheckCircle2 className="mr-1 h-3 w-3 shrink-0" /> Ready
        </Badge>
      );
    case 'processing':
    case 'pending':
      return (
        <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary whitespace-nowrap animate-pulse text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider">
          <Loader2 className="mr-1 h-3 w-3 shrink-0 animate-spin" /> Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="border-destructive/40 bg-destructive/15 text-destructive whitespace-nowrap text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3 mr-1 shrink-0" /> Failed
        </Badge>
      );
    default:
      return null;
  }
}

export function LibraryListItem({ video }: LibraryListItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formattedDate = video.created_at
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(video.created_at))
    : 'Unknown date';

  const hostname = (() => {
    try {
      return new URL(video.video_url).hostname.replace(/^www\./, '');
    } catch {
      return 'Video Source';
    }
  })();

  const hasImgUrl = Boolean(video.img_url?.trim());

  return (
    <button
      onClick={() => startTransition(() => router.push(`/library/${video.id}`))}
      disabled={isPending}
      className="group flex w-full items-center gap-4 rounded-xl border border-border/80 bg-card/80 p-3.5 text-left transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70 disabled:pointer-events-none shadow-xs"
      aria-label={`View video details for ${video.name}`}
    >
      {/* Thumbnail */}
      {hasImgUrl && (
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-border/40">
          <VideoThumbnail title={video.name} url={video.video_url} imgUrl={video.img_url} iconClassName="h-5 w-5" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-4 items-center">
        <div className="min-w-0 pr-4">
          <h3 className="truncate font-bold text-sm text-foreground group-hover:text-primary transition-colors">
            {video.name}
          </h3>
          <p className="truncate text-xs font-mono text-muted-foreground mt-0.5">{hostname}</p>
        </div>

        <div className="hidden md:flex items-center text-xs font-mono font-medium text-muted-foreground">
          <Clock className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          <span className="truncate">{formattedDate}</span>
        </div>

        <div className="hidden md:flex items-center">
          {getStatusBadge(video.status)}
        </div>

        <div className="hidden sm:flex items-center gap-3 justify-end">
          {video.subtitle_file && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20" title="Has subtitle track">
              <Subtitles className="h-3.5 w-3.5" />
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
    </button>
  );
}
