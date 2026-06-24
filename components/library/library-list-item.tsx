'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Subtitles, Clock, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LibraryListItemProps {
  video: BrowseVideo & { status?: Job['status'] };
}

function getStatusBadge(status?: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return <Badge variant="outline" className="border-success/25 bg-success/10 text-success whitespace-nowrap">Ready</Badge>;
    case 'processing':
    case 'pending':
      return <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary whitespace-nowrap animate-pulse">Processing</Badge>;
    case 'failed':
      return <Badge variant="outline" className="border-destructive/25 bg-destructive/10 text-destructive whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1"/> Failed</Badge>;
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

  return (
    <button
      onClick={() => startTransition(() => router.push(`/library/${video.id}`))}
      disabled={isPending}
      className="group flex w-full items-center gap-4 rounded-xl border border-border/60 bg-card p-3 text-left transition-all interactive-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 disabled:pointer-events-none"
      aria-label={`View video details for ${video.name}`}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-slate-950">
        <VideoThumbnail title={video.name} url={video.video_url} iconClassName="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-4 items-center">
        <div className="min-w-0 pr-4">
          <h3 className="truncate font-medium text-sm group-hover:text-primary transition-colors">{video.name}</h3>
          <p className="truncate text-xs text-muted-foreground mt-1">{hostname}</p>
        </div>

        <div className="hidden md:flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>

        <div className="hidden md:flex items-center">
          {getStatusBadge(video.status)}
        </div>

        <div className="hidden sm:flex items-center gap-3 justify-end">
          {video.subtitle_file && (
            <div className="flex items-center text-xs text-muted-foreground" title="Has subtitle track">
              <Subtitles className="h-4 w-4" />
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
    </button>
  );
}
